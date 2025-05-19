import { ResponseType, TransactionType, WalletType } from "@/types";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";
import { createOrUpdateWallet } from "./walletService";
import { getLast12Months, getLast7Days, getYearsRange } from "@/utils/common";
import { scale } from "@/utils/styling";
import { colors } from "@/constants/theme";

const firestore = getFirestore();

export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
  try {
    const { id, type, walletId, amount, image } = transactionData;
    if (!amount || amount <= 0 || !walletId || !type) {
      return { success: false, msg: "Invalid transaction data!" };
    }

    if (id) {
      // todo: update the transaction
      const oldTransactionSnapshot = await getDoc(
        doc(firestore, "transactions", id)
      );
      const oldTransaction = oldTransactionSnapshot.data() as TransactionType;
      const shouldRevertOriginal =
        oldTransaction.type != type ||
        oldTransaction.amount != amount ||
        oldTransaction.walletId != walletId;
      if (shouldRevertOriginal) {
        let res = await revertAndUpdateWalltes(
          oldTransaction,
          Number(amount),
          type,
          walletId
        );
        if (!res.success) return res;
      }
    } else {
      // update wallet for new transaction
      let res = await updateWalletForNewTransaction(
        walletId!,
        Number(amount!),
        type
      );
      if (!res.success) return res;
    }

    if (image) {
      //upload the image to cloudinary
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

    const transactionRef = id
      ? doc(firestore, "transactions", id)
      : doc(collection(firestore, "transactions"));

    await setDoc(transactionRef, transactionData, { merge: true });
    return {
      success: true,
      data: { ...transactionData, id: transactionRef.id },
    };
  } catch (error: any) {
    console.log("error creating or updating the transaction:", error);
    return { success: false, msg: error.message };
  }
};

const updateWalletForNewTransaction = async (
  walletId: string,
  amount: number,
  type: string
) => {
  try {
    const walletRef = doc(firestore, "wallets", walletId);
    const walletSnapshot = await getDoc(walletRef);
    if (!walletSnapshot.exists()) {
      console.log("error updating the wallet for new transaction:");
      return { success: false, msg: "Wallet not found!" };
    }
    const walletData = walletSnapshot.data() as WalletType;
    if (type == "expenses" && walletData.amount! - amount < 0) {
      return { success: false, msg: "Insufficient funds in Wallet!" };
    }

    const updateType = type == "income" ? "totalIncome" : "totalExpenses";
    const updatedWalletAmount =
      type == "income"
        ? Number(walletData.amount) + amount
        : Number(walletData.amount) - amount;

    const updatedTotals =
      type == "income"
        ? Number(walletData.totalIncome) + amount
        : Number(walletData.totalExpenses) + amount;

    await updateDoc(walletRef, {
      amount: updatedWalletAmount,
      [updateType]: updatedTotals,
    });
    return { success: true };

    return { success: true };
  } catch (error: any) {
    console.log("error updating the wallet for new transaction:", error);
    return { success: false, msg: error.message };
  }
};

const revertAndUpdateWalltes = async (
  oldTransaction: TransactionType,
  newTransactionAmount: number,
  newTransactionType: string,
  newWalletId: string
) => {
  try {
    const originalWalletSnapshot = await getDoc(
      doc(firestore, "wallets", oldTransaction.walletId)
    );

    const originalWallet = originalWalletSnapshot.data() as WalletType;

    let newWalletSnapshot = await getDoc(
      doc(firestore, "wallets", newWalletId)
    );
    let newWallet = newWalletSnapshot.data() as WalletType;

    const revertType =
      oldTransaction.type == "income" ? "totalIncome" : "totalExpenses";

    const revertIncomeExpense: number =
      oldTransaction.type == "income"
        ? -Number(oldTransaction.amount)
        : Number(oldTransaction.amount);

    const revertedWalletAmount =
      Number(originalWallet.amount) + revertIncomeExpense;

    const revertedIncomeExpenseAmount =
      Number(originalWallet[revertType]) - Number(oldTransaction.amount);

    if (newTransactionType == "expenses") {
      // if user tries to convert an income transaction to expense on same wallet
      // or if user tries to increase the expense amount and doesn't have enough funds
      if (
        oldTransaction.walletId == newWalletId &&
        revertedWalletAmount < newTransactionAmount
      ) {
        return {
          success: false,
          msg: "Insufficient funds in Selected Account!",
        };
      }

      // if user tries to add an expense from a new wallet but the wallet doesn't have enough funds
      if (newWallet.amount! < newTransactionAmount) {
        return {
          success: false,
          msg: "Insufficient funds in Selected Account!",
        };
      }
    }

    await createOrUpdateWallet({
      id: oldTransaction.walletId,
      amount: revertedWalletAmount,
      [revertType]: revertedIncomeExpenseAmount,
    });
    //revert completed

    //////////////////////////////////////////////////////////////////

    // refetch the new wallet data
    newWalletSnapshot = await getDoc(doc(firestore, "wallets", newWalletId));
    newWallet = newWalletSnapshot.data() as WalletType;

    const updateType =
      newTransactionType == "income" ? "totalIncome" : "totalExpenses";
    const updatedTransactionAmount: number =
      newTransactionType == "income"
        ? Number(newTransactionAmount)
        : -Number(newTransactionAmount);

    const newWalletAmount = Number(newWallet.amount) + updatedTransactionAmount;

    const newIncomeExpenseAmount = Number(
      newWallet[updateType]! + Number(newTransactionAmount)
    );

    await createOrUpdateWallet({
      id: newWalletId,
      amount: newWalletAmount,
      [updateType]: newIncomeExpenseAmount,
    });
    return { success: true };
  } catch (error: any) {
    console.log("error updating the wallet for new transaction:", error);
    return { success: false, msg: error.message };
  }
};

export const deleteTransaction = async (
  transactionId: string,
  walletId: string
) => {
  try {

    const transactionRef = doc(firestore, "transactions", transactionId);
    const transactionSnapshot = await getDoc(
      transactionRef
    );

    if (!transactionSnapshot.exists()) {
      return { success: false, msg: "Transaction not found!" };
    }
    const transactionData = transactionSnapshot.data() as TransactionType;

    const transactionType = transactionData.type;
    const transactionAmount = transactionData?.amount;

    // fetch the wallet data
    const walletSnapshot = await getDoc(doc(firestore, "wallets", walletId));
    const walletData = walletSnapshot.data() as WalletType;

    // check fields to update based on transaction type
    const updatetype =
      transactionType == "income" ? "totalIncome" : "totalExpenses";
    const newWalletAmount =
      walletData?.amount! -
      (transactionType == "income" ? transactionAmount : -transactionAmount);
    
    const newIncomeExpenseAmount = walletData[updatetype]! - transactionAmount;

    // if its expense and wallet amount can go below 0
    if (transactionType == "expenses" && newWalletAmount < 0) {
      return { success: false, msg: "You cannot delete this transaction !" };
    }

    await createOrUpdateWallet({
      id: walletId,
      amount: newWalletAmount,
      [updatetype]: newIncomeExpenseAmount,
    })

    await deleteDoc(transactionRef)

    return { success: true };
  } catch (error: any) {
    console.log("error updating the wallet for new transaction:", error);
    return { success: false, msg: error.message };
  }
};


export const fetchWeeklyStats = async (
  uid: string,
): Promise<ResponseType> => {
  try {
    const db = firestore
    const today = new Date()
    const sevenDavysAgo = new Date(today)
    sevenDavysAgo.setDate(today.getDate() - 7)

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where("date", ">=", Timestamp.fromDate(sevenDavysAgo)),
      where("date", "<=", Timestamp.fromDate(today)),
      orderBy("date", "desc"),
      where("uid", "==", uid)
    )

    const querySnapshot = await getDocs(transactionsQuery)
    const weeklyData = getLast7Days()
    const transactions: TransactionType[] = []

    // mapping the transactions to the weeklyData
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType
      transaction.id = doc.id
      transactions.push(transaction)

      const transactionDate = (transaction.date as Timestamp).toDate().toISOString().split('T')[0]

      const dayData = weeklyData.find((day) => day.date == transactionDate)

      if (dayData) {
        if(transaction.type == 'income'){
          dayData.income += transaction.amount
        } else if(transaction.type == 'expenses'){
          dayData.expenses += transaction.amount
        }
      }
    })
    // takes each day and creates 2 entries
    const stats = weeklyData.flatMap((day) => [
      {
        value: day.income,
        label: day.day,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: "#01af5d",
      },
      {
        value: day.expenses,
        frontColor: colors.rose,
      },
    ]);
    return {
      success: true,
      data: {
        stats,
        transactions,
      }
    }
  } catch (error) {
   console.log("error fetching weekly transactions:", error);
   return { success: false, msg: "Failed to fetch weekly transactions" };
  }
};

export const fetchWMonthlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 12);

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("date", ">=", Timestamp.fromDate(twelveMonthsAgo)),
      where("date", "<=", Timestamp.fromDate(today)),
      orderBy("date", "desc"),
      where("uid", "==", uid)
    );

    const querySnapshot = await getDocs(transactionsQuery);
    const monthlyData = getLast12Months();
    const transactions: TransactionType[] = [];

    // mapping the transactions to the monthly data
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id;
      transactions.push(transaction);

      const transactionDate = (transaction.date as Timestamp)
        .toDate()
        // .toISOString()
        // .split("T")[0];

      const monthName = transactionDate.toLocaleString("default", {
        month: "short",
      })
      const shortYear = transactionDate.getFullYear().toString().slice(-2);
      const monthData = monthlyData.find(
        (month) => month.month === `${monthName} ${shortYear}`
      )

      if (monthData) {
        if (transaction.type == "income") {
          monthData.income += transaction.amount;
        } else if (transaction.type == "expenses") {
          monthData.expenses += transaction.amount;
        }
      }
    });
    // takes each day and creates 2 entries
    const stats = monthlyData.flatMap((month) => [
      {
        value: month.income,
        label: month.month,
        spacing: scale(4),
        labelWidth: scale(38),
        frontColor: "#01af5d",
      },
      {
        value: month.expenses,
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
    console.log("error fetching monthly transactions:", error);
    return { success: false, msg: "Failed to fetch monthly transactions" };
  }
};

export const fetchYearlyStats = async (
  uid: string
): Promise<ResponseType> => {
  try {
    const db = firestore;
   
    const transactionsQuery = query(
      collection(db, "transactions"),
      orderBy("date", "desc"),
      where("uid", "==", uid)
    );

    const querySnapshot = await getDocs(transactionsQuery);
    const transactions: TransactionType[] = [];

    const firstTransaction = querySnapshot.docs.reduce((earliest, doc) => {
      const transactionDate = doc.data().date.toDate();
      return transactionDate < earliest ? transactionDate: earliest
    }, new Date)

    const firstYear = firstTransaction.getFullYear()
    const currentYear = new Date().getFullYear()

    const yearlyData = getYearsRange(firstYear, currentYear)

    // mapping the transactions to the monthly data
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id;
      transactions.push(transaction);

      const transactionYear = (transaction.date as Timestamp).toDate().getFullYear();
      // .toISOString()
      // .split("T")[0];

      const yearData = yearlyData.find(
        (item: any) => item.year === transactionYear.toString()
      );

      if (yearData) {
        if (transaction.type == "income") {
          yearData.income += transaction.amount;
        } else if (transaction.type == "expenses") {
          yearData.expenses += transaction.amount;
        }
      }
    });
    // takes each day and creates 2 entries
    const stats = yearlyData.flatMap((year: any) => [
      {
        value: year.income,
        label: year.year,
        spacing: scale(4),
        labelWidth: scale(35),
        frontColor: "#01af5d",
      },
      {
        value: year.expenses,
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
    console.log("error fetching yearly transactions:", error);
    return { success: false, msg: 'Failed to fetch yearly transactions' };
  }
};





