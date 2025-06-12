import { colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { ResponseType, TransactionType } from "@/types";
import { getLast12Months, getLast7Days, getYearsRange } from "@/utils/common";
import { scale } from "@/utils/styling";
import { createOrUpdateAccount } from "./accountServices";
import { uploadFileToCloudinary } from "./imageService";

export const fetchAllTransactions = async (
  uid: string
): Promise<ResponseType> => {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("uid", uid)
      .order("date", { ascending: false });

    if (error) throw error;

    return { success: true, data: transactions };
  } catch (error: any) {
    // console.error("Error fetching all transactions:", error);
    return { success: false, msg: error.message };
  }
};

export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
  try {
    const { id, type, accountId, amount, image } = transactionData;

    if (!amount || amount <= 0 || !accountId || !type) {
      return { success: false, msg: "Invalid transaction data!" };
    }

    if (id) {
      // Update existing transaction
      const { data: oldTransaction, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      if (!oldTransaction)
        return { success: false, msg: "Transaction not found!" };

      const shouldRevertOriginal =
        oldTransaction.type != type ||
        oldTransaction.amount != amount ||
        oldTransaction.accountId != accountId;

      if (shouldRevertOriginal) {
        let res = await revertAndUpdateWallets(
          oldTransaction,
          Number(amount),
          type,
          accountId
        );
        if (!res.success) return res;
      }
    } else {
      // Update account for new transaction
      let res = await updateAccountForNewTransaction(
        accountId!,
        Number(amount!),
        type
      );
      if (!res.success) return res;
    }

    // Handle image upload
    if (image) {
      const imageUploadRes = await uploadFileToCloudinary(
        image,
        "transactions"
      );
      if (!imageUploadRes.success) {
        return {
          success: false,
          msg: imageUploadRes.msg || "Failed to upload receipt",
        };
      }
      transactionData.image = imageUploadRes.data;
    } else {
      delete transactionData.image;
    }

    // Upsert transaction
    const { data: transaction, error } = id
      ? await supabase
          .from("transactions")
          .update(transactionData)
          .eq("id", id)
          .select()
          .single()
      : await supabase
          .from("transactions")
          .insert(transactionData)
          .select()
          .single();

    if (error) throw error;

    return {
      success: true,
      data: transaction,
    };
  } catch (error: any) {
    // console.log("error creating or updating the transaction:", error);
    return { success: false, msg: error.message };
  }
};

const updateAccountForNewTransaction = async (
  accountId: string,
  amount: number,
  type: string
) => {
  try {
    const { data: account, error: fetchError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (fetchError) throw fetchError;
    if (!account) return { success: false, msg: "Account not found!" };

    if (type == "expense" && account.amount! - amount < 0) {
      return { success: false, msg: "Insufficient funds in Account!" };
    }

    const updateType = type == "income" ? "totalIncome" : "totalexpense";
    const updatedAccountAmount =
      type == "income"
        ? Number(account.amount) + amount
        : Number(account.amount) - amount;

    const updatedTotals =
      type == "income"
        ? Number(account.totalIncome) + amount
        : Number(account.totalexpense) + amount;

    const { error } = await supabase
      .from("accounts")
      .update({
        amount: updatedAccountAmount,
        [updateType]: updatedTotals,
      })
      .eq("id", accountId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    // console.log("error updating the account for new transaction:", error);
    return { success: false, msg: error.message };
  }
};

const revertAndUpdateWallets = async (
  oldTransaction: TransactionType,
  newTransactionAmount: number,
  newTransactionType: string,
  newAccountId: string
) => {
  try {
    // Get original account
    const { data: originalAccount, error: originalAccountError } =
      await supabase
        .from("accounts")
        .select("*")
        .eq("id", oldTransaction.accountId)
        .single();

    if (originalAccountError) throw originalAccountError;
    if (!originalAccount)
      return { success: false, msg: "Original account not found!" };

    // Get new account
    const { data: newAccount, error: newAccountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", newAccountId)
      .single();

    if (newAccountError) throw newAccountError;
    if (!newAccount) return { success: false, msg: "New account not found!" };

    const revertType =
      oldTransaction.type == "income" ? "totalIncome" : "totalexpense";
    const revertIncomeExpense =
      oldTransaction.type == "income"
        ? -Number(oldTransaction.amount)
        : Number(oldTransaction.amount);

    const revertedAccountAmount =
      Number(originalAccount.amount) + revertIncomeExpense;
    const revertedIncomeExpenseAmount =
      Number(originalAccount[revertType]) - Number(oldTransaction.amount);

    if (newTransactionType == "expense") {
      if (
        oldTransaction.accountId == newAccountId &&
        revertedAccountAmount < newTransactionAmount
      ) {
        return {
          success: false,
          msg: "Insufficient funds in Selected Account!",
        };
      }

      if (newAccount.amount! < newTransactionAmount) {
        return {
          success: false,
          msg: "Insufficient funds in Selected Account!",
        };
      }
    }

    // Revert original account
    await createOrUpdateAccount({
      id: oldTransaction.accountId,
      amount: revertedAccountAmount,
      [revertType]: revertedIncomeExpenseAmount,
    });

    // Update new account with new transaction
    const updateType =
      newTransactionType == "income" ? "totalIncome" : "totalexpense";
    const updatedTransactionAmount =
      newTransactionType == "income"
        ? Number(newTransactionAmount)
        : -Number(newTransactionAmount);

    const newAccountAmount =
      Number(newAccount.amount) + updatedTransactionAmount;
    const newIncomeExpenseAmount = Number(
      newAccount[updateType]! + Number(newTransactionAmount)
    );

    await createOrUpdateAccount({
      id: newAccountId,
      amount: newAccountAmount,
      [updateType]: newIncomeExpenseAmount,
    });

    return { success: true };
  } catch (error: any) {
    // console.log("error updating the account for new transaction:", error);
    return { success: false, msg: error.message };
  }
};

export const deleteTransaction = async (
  transactionId: string,
  accountId: string
): Promise<ResponseType> => {
  try {
    // Get transaction data
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError) throw fetchError;
    if (!transaction) return { success: false, msg: "Transaction not found!" };

    const transactionType = transaction.type;
    const transactionAmount = transaction.amount;

    // Get account data
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (accountError) throw accountError;
    if (!account) return { success: false, msg: "Account not found!" };

    // Calculate new values
    const updateType =
      transactionType == "income" ? "totalIncome" : "totalexpense";
    const newAccountAmount =
      account.amount! -
      (transactionType == "income" ? transactionAmount : -transactionAmount);
    const newIncomeExpenseAmount = account[updateType]! - transactionAmount;

    if (transactionType == "expense" && newAccountAmount < 0) {
      return { success: false, msg: "You cannot delete this transaction!" };
    }

    // Update account
    await createOrUpdateAccount({
      id: accountId,
      amount: newAccountAmount,
      [updateType]: newIncomeExpenseAmount,
    });

    // Delete transaction
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error: any) {
    // console.log("error deleting transaction:", error);
    return { success: false, msg: error.message };
  }
};

export const fetchWeeklyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", sevenDaysAgo.toISOString())
      .lte("date", today.toISOString())
      .order("date", { ascending: false })
      .eq("uid", uid);

    if (error) throw error;

    const weeklyData = getLast7Days();
    const mappedTransactions: TransactionType[] = [];

    transactions?.forEach((transaction) => {
      mappedTransactions.push(transaction);

      const transactionDate = new Date(transaction.date)
        .toISOString()
        .split("T")[0];
      const dayData = weeklyData.find((day) => day.date == transactionDate);

      if (dayData) {
        if (transaction.type == "income") {
          dayData.income += transaction.amount;
        } else if (transaction.type == "expense") {
          dayData.expense += transaction.amount;
        }
      }
    });

    const stats = weeklyData.flatMap((day) => [
      {
        value: day.income,
        label: day.day,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: "#01af5d",
      },
      {
        value: day.expense,
        frontColor: colors.rose,
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions: mappedTransactions,
      },
    };
  } catch (error) {
    // console.log("error fetching weekly transactions:", error);
    return { success: false, msg: "Failed to fetch weekly transactions" };
  }
};

export const fetchMonthlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 12);

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", twelveMonthsAgo.toISOString())
      .lte("date", today.toISOString())
      .order("date", { ascending: false })
      .eq("uid", uid);

    if (error) throw error;

    const monthlyData = getLast12Months();
    const mappedTransactions: TransactionType[] = [];

    transactions?.forEach((transaction) => {
      mappedTransactions.push(transaction);

      const transactionDate = new Date(transaction.date);
      const monthName = transactionDate.toLocaleString("default", {
        month: "short",
      });
      const shortYear = transactionDate.getFullYear().toString().slice(-2);
      const monthData = monthlyData.find(
        (month) => month.month === `${monthName} ${shortYear}`
      );

      if (monthData) {
        if (transaction.type == "income") {
          monthData.income += transaction.amount;
        } else if (transaction.type == "expense") {
          monthData.expense += transaction.amount;
        }
      }
    });

    const stats = monthlyData.flatMap((month) => [
      {
        value: month.income,
        label: month.month,
        spacing: scale(4),
        labelWidth: scale(38),
        frontColor: "#01af5d",
      },
      {
        value: month.expense,
        frontColor: colors.rose,
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions: mappedTransactions,
      },
    };
  } catch (error) {
    // console.log("error fetching monthly transactions:", error);
    return { success: false, msg: "Failed to fetch monthly transactions" };
  }
};

export const fetchYearlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    // Get all transactions to determine date range
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .eq("uid", uid);

    if (error) throw error;
    if (!transactions || transactions.length === 0) {
      return { success: true, data: { stats: [], transactions: [] } };
    }

    // Find earliest transaction date
    const firstTransactionDate = transactions.reduce(
      (earliest, transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate < earliest ? transactionDate : earliest;
      },
      new Date()
    );

    const firstYear = firstTransactionDate.getFullYear();
    const currentYear = new Date().getFullYear();
    const yearlyData = getYearsRange(firstYear, currentYear);

    // Map transactions to yearly data
    transactions.forEach((transaction) => {
      const transactionYear = new Date(transaction.date).getFullYear();
      const yearData = yearlyData.find(
        (item: any) => item.year === transactionYear.toString()
      );

      if (yearData) {
        if (transaction.type == "income") {
          yearData.income += transaction.amount;
        } else if (transaction.type == "expense") {
          yearData.expense += transaction.amount;
        }
      }
    });

    const stats = yearlyData.flatMap((year: any) => [
      {
        value: year.income,
        label: year.year,
        spacing: scale(4),
        labelWidth: scale(35),
        frontColor: "#01af5d",
      },
      {
        value: year.expense,
        frontColor: colors.rose,
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions,
      },
    };
  } catch (error) {
    // console.log("error fetching yearly transactions:", error);
    return { success: false, msg: "Failed to fetch yearly transactions" };
  }
};
