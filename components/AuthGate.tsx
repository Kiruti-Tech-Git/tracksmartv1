// components/RedirectGate.tsx
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RedirectGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user || !user.id) {
      router.replace("/(auth)/login");
      return;
    }

    const checkProfile = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (!error && !data?.full_name) {
        router.replace("/(tabs)");
      }
    };

    checkProfile();
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
