import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { AccountType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import ImageUpload from "@/components/ImageUpload";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { createOrUpdateAccount } from "@/services/accountServices";
import { useLocalSearchParams, useRouter } from "expo-router";

type AccountParams = {
  id?: string;
  name?: string;
  image?: string;
};

const AccountModal = () => {
  const { user, setUser } = useAuth();
  const [account, setAccount] = useState<AccountType>({
    name: "",
    image: undefined,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const oldAccount = useLocalSearchParams<AccountParams>();

  useEffect(() => {
    if (oldAccount?.id) {
      setAccount({
        id: oldAccount.id, // Include the ID in the account state
        name: oldAccount?.name || "",
        image: oldAccount?.image ? { uri: oldAccount.image } : undefined,
      });
    }
  }, [oldAccount?.id]); // Add proper dependencies

  const onSubmit = async () => {
    if (!account.name.trim()) {
      Alert.alert("Account", "Please enter an account name");
      return;
    }

    if (!account.image) {
      Alert.alert("Account", "Please select an image");
      return;
    }

    try {
      setLoading(true);

      // Include the ID from account state if it exists
      const res = await createOrUpdateAccount(account);

      if (res.success) {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (userData?.user) setUser(userData.user);

        router.back();
      } else {
        console.error(res.msg);
        Alert.alert("Error", res.msg);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={oldAccount?.id ? "Update Account" : "New Account"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Account Name</Typo>
            <Input
              placeholder="Business Account"
              value={account.name}
              onChangeText={(value) => setAccount({ ...account, name: value })}
            />
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Account Icon</Typo>
            <ImageUpload
              file={account.image}
              onSelect={(file) => setAccount({ ...account, image: file })}
              onClear={() => setAccount({ ...account, image: undefined })}
              placeholder="Upload Icon"
            />
          </View>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight={"700"}>
            {oldAccount?.id ? "Update Account" : "Add Account"}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

// Keep your existing styles...
export default AccountModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
    // paddingVertical: spacingY._30,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500,
    //overflow: 'hidden',
    //position: 'relative',
  },
  editIcon: {
    position: "absolute",
    right: spacingY._7,
    bottom: spacingY._5,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
