import { supabase } from "@/lib/supabase";
import { AccountType, ResponseType } from "@/types";
import { uploadFileToCloudinary } from "./imageService";

export const createOrUpdateAccount = async (
  account: Partial<AccountType> // Makes all properties optional
): Promise<ResponseType> => {
  try {
    // 1. Get current session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, msg: "Authentication required" };
    }

    // 2. Validate required fields
    if (!account?.name) {
      return { success: false, msg: "Account name is required" };
    }

    // 3. Handle image upload (only if image exists)
    let imageUrl = account.image?.uri || null;
    if (account.image?.uri && !account.image.uri.startsWith("http")) {
      const uploadRes = await uploadFileToCloudinary(
        { uri: account.image.uri },
        "accounts"
      );
      if (!uploadRes.success) {
        return { success: false, msg: uploadRes.msg || "Image upload failed" };
      }
      imageUrl = uploadRes.data;
    }

    // 4. Create or update account
    const accountData = {
      user_id: user.id,
      name: account.name,
      image: imageUrl,
      amount: account.amount || 0,
      totalincome: account.totalIncome || 0,
      totalexpenses: account.totalExpenses || 0,
      balance: account.balance || 0,
    };

    if (account.id) {
      // Update existing account
      const { data, error } = await supabase
        .from("accounts")
        .update(accountData)
        .eq("id", account.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, msg: "Account updated", data };
    } else {
      // Create new account
      const { data, error } = await supabase
        .from("accounts")
        .insert(accountData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, msg: "Account created", data };
    }
  } catch (error: any) {
    console.error("Account error:", error);
    return {
      success: false,
      msg: error.message || "Account operation failed",
    };
  }
};
