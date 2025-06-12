import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ImageUpload from "@/components/ImageUpload";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import {
  createOrUpdateAccount,
  deleteAccount,
} from "@/services/accountServices";
import { AccountType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

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

  const onDelete = async () => {
    if (!oldAccount?.id) return;
    setLoading(true);
    const res = await deleteAccount(oldAccount?.id);
    setLoading(false);
    if (res.success) {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (userData?.user) setUser(userData.user);
      router.back();
      // console.log("Account deleted successfully");
    }
  };

  const showDeleteAlert = () => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to delete this account? \n This action will delete all associated transactions.",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel delete"),
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => onDelete(),
          style: "destructive",
        },
      ]
    );
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
        {oldAccount?.id && !loading && (
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
