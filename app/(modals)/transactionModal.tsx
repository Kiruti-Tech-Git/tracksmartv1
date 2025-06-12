import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ImageUpload from "@/components/ImageUpload";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { expenseCategories, transactionTypes } from "@/constants/data";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import useFetchData from "@/hooks/useFetchData";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { deleteTransaction } from "@/services/transactionService";
import { AccountType, TransactionType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

const TransactionModal = () => {
  const { format } = useCurrency();

  const { user } = useAuth();
  const router = useRouter();

  type paramType = {
    id: string;
    type: string;
    amount: string;
    category?: string;
    date: string;
    description?: string;
    image?: string;
    uid?: string;
    accountId: string;
  };

  // Fetch accounts
  const {
    data: accounts,
    error: accountError,
    loading: accountLoading,
  } = useFetchData<AccountType>("accounts", {
    constraints: user?.id
      ? [{ column: "user_id", operator: "eq", value: user.id }]
      : [],
    orderBy: { column: "created", ascending: false },
    limit: 30,
  });

  const [transaction, setTransaction] = useState<TransactionType>({
    type: "expense", // Default to expense
    amount: 0,
    description: "",
    category: "",
    date: new Date(),
    accountId: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const oldTransaction: paramType = useLocalSearchParams();

  // Debugging logs
  // useEffect(() => {
  //   console.log("Current user ID:", user?.id);
  //   console.log("Accounts data:", accounts);
  //   console.log("Account error:", accountError);
  //   console.log("Account loading:", accountLoading);
  // }, [accounts, accountError, accountLoading, user?.id]);

  // Initialize with old transaction data if available
  useEffect(() => {
    if (oldTransaction?.id) {
      setTransaction({
        type: oldTransaction?.type as "income" | "expense",
        amount: Number(oldTransaction?.amount),
        description: oldTransaction?.description || "",
        category: oldTransaction?.category || "",
        date: new Date(oldTransaction?.date),
        accountId: oldTransaction?.accountId || "",
        image: oldTransaction?.image || null,
      });
    }
  }, [oldTransaction.id]);

  // Show loading state while accounts are loading
  if (accountLoading) {
    return (
      <ModalWrapper>
        <View style={styles.container}>
          <Typo>Loading accounts...</Typo>
        </View>
      </ModalWrapper>
    );
  }

  // Show error state if accounts failed to load
  if (accountError) {
    return (
      <ModalWrapper>
        <View style={styles.container}>
          <Typo color={colors.rose}>
            Error loading accounts: {accountError.toString()}
          </Typo>
        </View>
      </ModalWrapper>
    );
  }

  // Show empty state if no accounts exist
  if (!accounts || accounts.length === 0) {
    return (
      <ModalWrapper>
        <View style={styles.container}>
          <Header
            title={
              oldTransaction?.id ? "Update Transaction" : "New Transaction"
            }
            leftIcon={<BackButton />}
          />
          <Typo style={{ marginTop: 20 }}>
            No accounts found. Please create an account first.
          </Typo>
        </View>
      </ModalWrapper>
    );
  }

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    const currentDate = selectedDate || transaction.date;
    setTransaction({ ...transaction, date: currentDate });
    setShowDatePicker(false);
  };

  const onSubmit = async () => {
    const { type, amount, description, category, date, accountId, image } =
      transaction;

    if (!accountId || !date || !amount || (type === "expense" && !category)) {
      Alert.alert("Transaction", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        type,
        amount,
        description: description || null, // Handle empty description
        category: category || null, // Handle empty category
        date: date.toISOString(), // Convert to ISO string
        image: image || null,
        uid: user?.id, // Match your table column
        accountId, // Match your table column (with quotes)
      };

      // console.log("Submitting transaction:", transactionData); // Debug log

      let result;
      if (oldTransaction?.id) {
        // Update existing transaction
        const { data, error } = await supabase
          .from("transactions")
          .update(transactionData)
          .eq("id", oldTransaction.id)
          .select();

        if (error) throw error;
        result = data;
      } else {
        // Create new transaction
        const { data, error } = await supabase
          .from("transactions")
          .insert(transactionData)
          .select();

        if (error) throw error;
        result = data;
      }

      // console.log("Transaction successful:", result);auth
      router.back();
    } catch (error) {
      // console.error("Transaction error:", error);
      Alert.alert(
        "Transaction Failed",
        error instanceof Error
          ? error.message
          : "Please check your data and try again"
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!oldTransaction?.id) return;
    setLoading(true);
    const res = await deleteTransaction(
      oldTransaction.id,
      oldTransaction.accountId ?? ""
    );
    setLoading(false);

    if (res.success) {
      router.back();
    } else {
      Alert.alert("Transaction", res.msg);
    }
  };

  const showDeleteAlert = () => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: onDelete, style: "destructive" },
      ]
    );
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={oldTransaction?.id ? "Update Transaction" : "New Transaction"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Selection */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Account
            </Typo>
            <Dropdown
              style={styles.dropdownContainer}
              placeholder="Select Account"
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              data={accounts.map((account) => ({
                label:
                  account.amount != null
                    ? `${account.name} (${format(account.amount)})`
                    : account.name,
                value: account.id,
              }))}
              value={transaction.accountId}
              onChange={(item) => {
                // console.log("Selected account:", item); // Debug log
                setTransaction({ ...transaction, accountId: item.value });
              }}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropdownItemText}
              containerStyle={styles.dropdownListContainer}
            />
          </View>
          {/* Transaction Type */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Type
            </Typo>
            <Dropdown
              style={styles.dropdownContainer}
              data={transactionTypes}
              value={transaction.type}
              onChange={(item) =>
                setTransaction({ ...transaction, type: item.value as any })
              }
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropdownItemText}
              containerStyle={styles.dropdownListContainer}
            />
          </View>

          {/* Expense Category (only shown for expense) */}
          {transaction.type === "expense" && (
            <View style={styles.inputContainer}>
              <Typo color={colors.neutral200} size={16}>
                Expense Category
              </Typo>
              <Dropdown
                style={styles.dropdownContainer}
                data={Object.values(expenseCategories)}
                value={transaction.category}
                onChange={(item) =>
                  setTransaction({ ...transaction, category: item.value })
                }
                labelField="label"
                valueField="value"
                itemTextStyle={styles.dropdownItemText}
                containerStyle={styles.dropdownListContainer}
                placeholder="Select Category"
              />
            </View>
          )}

          {/* Date Picker */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Date
            </Typo>
            <Pressable
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Typo>{transaction.date.toLocaleDateString()}</Typo>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={transaction.date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          {/* Amount */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Amount
            </Typo>
            <Input
              keyboardType="numeric"
              value={transaction.amount.toString()}
              onChangeText={(text) =>
                setTransaction({
                  ...transaction,
                  amount: Number(text.replace(/[^0-9]/g, "")) || 0,
                })
              }
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Description (optional)
            </Typo>
            <Input
              value={transaction.description}
              onChangeText={(text) =>
                setTransaction({ ...transaction, description: text })
              }
              multiline
            />
          </View>

          {/* Receipt Upload */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Receipt (optional)
            </Typo>
            <ImageUpload
              file={transaction.image}
              onClear={() => setTransaction({ ...transaction, image: null })}
              onSelect={(file) =>
                setTransaction({ ...transaction, image: file })
              }
            />
          </View>
        </ScrollView>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {oldTransaction?.id && (
          <Button
            onPress={showDeleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15,
            }}
          >
            <Icons.Trash
              color={colors.white}
              size={verticalScale(24)}
              weight="bold"
            />
          </Button>
        )}
        <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight={"700"}>
            {oldTransaction?.id ? "Update" : "Submit"}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingY._20,
  },
  form: {
    gap: spacingY._20,
    paddingBottom: spacingY._40,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  dropdownContainer: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._15,
    paddingHorizontal: spacingX._15,
  },
  dropdownListContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    borderColor: colors.neutral500,
    borderWidth: 1,
    marginTop: 5,
    zIndex: 1000,
  },
  dropdownPlaceholder: {
    color: colors.neutral300,
  },
  dropdownSelectedText: {
    color: colors.white,
  },
  dropdownItemText: {
    color: colors.white,
  },
  dateInput: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._15,
    justifyContent: "center",
    paddingHorizontal: spacingX._15,
  },
  footer: {
    flexDirection: "row",
    gap: scale(12),
    padding: spacingX._20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral700,
  },
});

export default TransactionModal;
