import { supabase } from "@/lib/supabase";
import { ResponseType, UserDataType } from "@/types";
import { uploadFileToCloudinary } from "./imageService";

export const updateUser = async (
  uid: string,
  updatedData: UserDataType
): Promise<ResponseType> => {
  try {
    const avatar = updatedData.avatar_url;
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, msg: "User not authenticated" };
    }

    const authUid = user.id;

    // console.log("Updating user with uid:", authUid);

    if (!authUid || typeof authUid !== "string") {
      return { success: false, msg: "Invalid or missing user ID" };
    }

    // Prepare data for update (excluding avatar_url initially)
    const dataToUpdate: Partial<UserDataType> = { ...updatedData };
    delete dataToUpdate.avatar_url;

    // Handle avatar upload if present and valid
    if (
      avatar &&
      typeof avatar === "object" &&
      avatar !== null && // Add null check
      "uri" in avatar && // Check if uri property exists
      typeof avatar.uri === "string" // Ensure uri is a string
    ) {
      const uploadRes = await uploadFileToCloudinary(
        { uri: avatar.uri },
        "users"
      );

      if (!uploadRes.success) {
        return {
          success: false,
          msg: uploadRes.msg || "Failed to upload image",
        };
      }

      // Only add avatar_url if upload was successful
      dataToUpdate.avatar_url = uploadRes.data;
    }

    const { error } = await supabase
      .from("user_profiles")
      .update(dataToUpdate)
      .eq("id", authUid);

    if (error) {
      // console.error("Supabase error:", error);
      return { success: false, msg: error.message };
    }

    return { success: true, msg: "Updated successfully" };
  } catch (error: any) {
    // console.error("Error updating user:", error);
    return { success: false, msg: error?.message || "Something went wrong" };
  }
};
