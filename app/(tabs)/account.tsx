import AccountListItem from "@/components/accountListItem";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import useFetchData from "@/hooks/useFetchData";
import { AccountType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

const Account = () => {
  const router = useRouter();

  const getTotalBalance = () =>
    // This function can be implemented to calculate the total balance
    accounts.reduce((total, item) => {
      total = total + (item.amount || 0);
      return total;
    }, 0);

  const {
    data: accounts,
    error,
    loading,
  } = useFetchData<AccountType>("accounts", []);

  return (
    <ScreenWrapper style={{ backgroundColor: colors.black }}>
      <View style={styles.container}>
        {/* Balance View */}
        <View style={styles.balanceView}>
          <View style={{ alignItems: "center" }}>
            <Typo size={45} fontWeight={"500"}>
              {/* {format(getTotalBalance(), currency)} */}KES{" "}
              {getTotalBalance().toFixed(2)}
            </Typo>
            <Typo size={16} color={colors.neutral300}>
              Total Balance
            </Typo>
          </View>
        </View>
        {/* accounts */}
        <View style={styles.accounts}>
          {/* header */}
          <View style={styles.flexRow}>
            <Typo size={20} fontWeight={"500"}>
              My Accounts
            </Typo>
            <TouchableOpacity
              onPress={() => router.push("/(modals)/accountModal")}
            >
              <Icons.PlusCircle
                weight="fill"
                color={"#01af5d"}
                size={verticalScale(33)}
              />
            </TouchableOpacity>
          </View>
          {/* accounts List */}
          {loading && <Loading />}

          <FlatList
            data={accounts}
            renderItem={({ item, index }) => {
              return (
                <AccountListItem item={item} index={index} router={router} />
              );
            }}
            contentContainerStyle={styles.lisStyle}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  balanceView: {
    height: verticalScale(160),
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  accounts: {
    flex: 1,
    backgroundColor: colors.neutral900,
    borderTopRightRadius: radius._30,
    borderTopLeftRadius: radius._30,
    padding: spacingX._20,
    paddingTop: spacingX._25,
  },
  lisStyle: {
    paddingVertical: spacingY._25,
    paddingTop: spacingY._15,
  },
});
