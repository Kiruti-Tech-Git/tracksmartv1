import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { supabase } from "@/lib/supabase"; // Make sure this is configured
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

const Login = () => {
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: emailRef.current,
        password: passwordRef.current,
      });

      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }

      // Navigate on success
      router.replace("/(tabs)"); // Or your intended screen
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        Alert.alert("Login Error", error.message);
      } else {
        Alert.alert("Login Error", "Something went wrong.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />
        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={"800"}>
            Hey,
          </Typo>
          <Typo size={30} fontWeight={"800"}>
            Welcome Back!
          </Typo>
        </View>

        <View style={styles.form}>
          <Typo size={16} color={colors.textLighter}>
            Login now to track all your expenses
          </Typo>

          <Input
            onChangeText={(value) => (emailRef.current = value)}
            placeholder="Enter your email"
            icon={<Icons.Envelope size={20} color={colors.neutral300} />}
          />

          <Input
            onChangeText={(value) => (passwordRef.current = value)}
            placeholder="Enter your password"
            secureTextEntry
            icon={<Icons.Lock size={20} color={colors.neutral300} />}
          />

          <Typo size={14} color={colors.text} style={styles.forgotPassword}>
            Forgot Password?
          </Typo>

          <Button loading={isLoading} onPress={handleLogin}>
            <Typo size={21} color={colors.neutral900} fontWeight={"700"}>
              Login
            </Typo>
          </Button>
        </View>

        <View style={styles.footer}>
          <Typo style={styles.footerText}>Don't have an account?</Typo>
          <Pressable onPress={() => router.navigate("/(auth)/register")}>
            <Typo size={15} fontWeight={"700"} color={"#01af5d"}>
              Sign Up
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  form: {
    gap: spacingY._20,
  },
  forgotPassword: {
    textAlign: "right",
    fontWeight: "500",
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    textAlign: "center",
    color: colors.text,
    fontSize: verticalScale(15),
  },
});
