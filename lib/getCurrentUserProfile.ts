import { supabase } from "@/lib/supabase";
import { UserDataType } from "@/types";

export const getCurrentUserProfile = async (): Promise<UserDataType | null> => {
  // Step 1: Get the auth user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log("Auth error:", authError);
    return null;
  }

  // Step 2: Fetch user user_user_profile from 'users' table
  const { data: user_profile, error: user_profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (user_profileError) {
    console.log("Profile fetch error:", user_profileError);
    return null;
  }
  // Merge user metadata and user_profile table data (fallback logic)
  const mergedProfile = {
    id: user.id,
    email: user.email,
    full_name: user_profile?.full_name || user.user_metadata?.fullname,
    avatar_url:
      user_profile?.avatar_url || user.user_metadata?.avatar_url || null,
    // any other fields you want to merge...
  };

  return mergedProfile as UserDataType;
};

export const updateUserProfile = async (
  userId: string,
  full_name: string,
  avatar_url?: string
) => {
  // Update user_profiles table
  const { error: user_profileError } = await supabase
    .from("user_profiles")
    .update({ full_name, avatar_url })
    .eq("id", userId);

  if (user_profileError)
    return { success: false, msg: user_profileError.message };

  // Update auth user metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { fullname: full_name, avatar_url },
  });

  if (authError) return { success: false, msg: authError.message };

  return { success: true };
};
