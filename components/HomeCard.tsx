import { supabase } from "@/lib/supabase"; // Assuming you're fetching from Supabase directly
import { useFocusEffect } from "expo-router"; // or '@react-navigation/native'

import { colors, spacingX, spacingY } from "@/constants/theme";
import { AccountType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import * as Icons from "phosphor-react-native";
import React, { useCallback, useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Typo from "./Typo";

// import { useAuth } from "@/contexts/authContext";
import { useRouter } from "expo-router";
import CurrencyModal from "./CurrencyModal";

import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";

const HomeCard = () => {
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const { format, currency } = useCurrency();
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user } = useAuth();
  const fetchAccounts = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Auth error:", userError.message);
      return;
    }

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user?.id)
      .order("created", { ascending: false });

    if (error) {
      console.error("Fetch error:", error.message);
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAccounts(); // 👈 Refresh when screen regains focus
    }, [])
  );

  const { balance, income, expense } = React.useMemo(() => {
    return accounts.reduce(
      (totals, item) => ({
        balance: totals.balance + Number(item.amount || 0),
        income: totals.income + Number(item.totalincome || 0),
        expense: totals.expense + Number(item.totalexpenses || 0),
      }),
      { balance: 0, income: 0, expense: 0 }
    );
  }, [accounts]);

  interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    amount: number;
    loading: boolean;
    color: string;
  }

  const StatItem: React.FC<StatItemProps> = ({
    icon,
    label,
    amount,
    loading,
    color,
  }) => (
    <View style={{ gap: verticalScale(5) }}>
      <View style={styles.incomeExpenses}>
        <View style={styles.statsIcon}>{icon}</View>
        <Typo color={colors.neutral700} size={16} fontWeight="500">
          {label}
        </Typo>
      </View>
      <View style={{ alignSelf: "center" }}>
        <Typo color={color} size={17} fontWeight="600">
          {loading ? "---" : format(amount)}
        </Typo>
      </View>
    </View>
  );

  return (
    <>
      <ImageBackground
        source={require("../assets/images/card.png")}
        resizeMode="stretch"
        style={styles.bgImage}
      >
        <View style={styles.container}>
          <View>
            {/* Total Balance */}
            <View style={styles.totalBalanceRow}>
              <Typo color={colors.neutral800} size={17} fontWeight={"500"}>
                Total Balance ({currency})
              </Typo>
              <TouchableOpacity
                onPress={() => setShowCurrencyModal(true)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Icons.Swap
                  style={styles.Icon}
                  size={verticalScale(30)}
                  color={colors.black}
                  weight="fill"
                />
              </TouchableOpacity>
            </View>
            <Typo color={colors.black} size={30} fontWeight={"bold"}>
              {loading ? "---" : format(balance).replace(/[^0-9.,-]/g, "")}
            </Typo>
          </View>
          {/* expenses and income */}
          <View style={styles.stats}>
            {/* Income */}
            <StatItem
              icon={
                <Icons.ArrowUp
                  size={verticalScale(15)}
                  color={"#01af5d"}
                  weight="bold"
                />
              }
              label="Income"
              amount={income}
              loading={loading}
              color={colors.green}
            />
            {/* Expense */}
            <StatItem
              icon={
                <Icons.ArrowDown
                  size={verticalScale(15)}
                  color={colors.rose}
                  weight="bold"
                />
              }
              label="Expenses"
              amount={expense}
              loading={loading}
              color={colors.rose}
            />
          </View>
        </View>
      </ImageBackground>

      <CurrencyModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  bgImage: {
    height: scale(200),
    width: "100%",
  },
  container: {
    padding: spacingX._20,
    paddingHorizontal: scale(23),
    height: "87%",
    width: "100%",
    justifyContent: "space-between",
  },
  totalBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._5,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsIcon: {
    backgroundColor: colors.neutral350,
    padding: spacingY._5,
    borderRadius: 50,
  },
  incomeExpenses: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingY._7,
  },
  Icon: {
    backgroundColor: colors.neutral350,
    padding: spacingY._5,
    borderRadius: 50,
  },
});

export default HomeCard;

// function formatSymbol(amount: number): unknown {
//   throw new Error('Function not implemented.')
// }
