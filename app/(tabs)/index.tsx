import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import Button from "@/components/Button";
import HomeCard from "@/components/HomeCard";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";

import TransactionList from "@/components/TransactionList";
import useFetchData from "@/hooks/useFetchData";
import { getCurrentUserProfile } from "@/lib/getCurrentUserProfile";
import { useAuth } from "@/providers/AuthProvider";
import { TransactionType, UserDataType } from "@/types";
import { useFocusEffect, useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";

const Home: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserDataType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: recentTransactions, loading: transactionsLoading } =
    useFetchData<TransactionType>("transactions", {
      constraints: user?.id
        ? [{ column: "uid", operator: "eq", value: user.id }]
        : [],
      orderBy: { column: "date", ascending: false },
      limit: 30,
      refreshKey: refreshKey, // ✅ Pass it to trigger fetch
    });

  // console.log("Fetched Transactions:", recentTransactions);

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const data = await getCurrentUserProfile();
        setProfile(data);
      };
      loadProfile();

      // 👇 trigger data re-fetch
      setRefreshKey((prev) => prev + 1);
    }, [])
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <Typo size={16} color={colors.neutral400}>
              Hello
            </Typo>
            <Typo size={20} fontWeight={"500"}>
              {profile?.full_name}
            </Typo>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(modals)/searchModal")}
            style={styles.searchIcon}
          >
            <Icons.MagnifyingGlass
              size={verticalScale(22)}
              color={colors.neutral200}
              weight="bold"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollViewStyle}
          showsVerticalScrollIndicator={false}
        >
          <HomeCard />
          <TransactionList
            data={recentTransactions}
            loading={transactionsLoading}
            emptyListMessage="No Transactions added yet!"
            title="Recent Transactions"
          />
        </ScrollView>

        <Button
          style={styles.floatingButton}
          onPress={() => router.push("/(modals)/transactionModal")}
        >
          <Icons.Plus
            size={verticalScale(24)}
            color={colors.black}
            weight="bold"
          />
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    marginTop: verticalScale(8),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  searchIcon: {
    backgroundColor: colors.neutral700,
    padding: spacingX._10,
    borderRadius: 50,
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(30),
    right: verticalScale(30),
  },
  scrollViewStyle: {
    marginTop: spacingY._10,
    paddingBottom: verticalScale(100),
    gap: spacingY._25,
  },
});
