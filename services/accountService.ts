// import { supabase } from "@/lib/supabase";
// import { AccountType } from "@/types";
// import { uploadFileToCloudinary } from "./imageService";

// export const createAccount = async (
//   userId: string,
//   account: AccountType
// ): Promise<{ success: boolean; msg?: string }> => {
//   try {
//     // Upload image to Cloudinary
//     if (!account.image || !account.image.uri) {
//       return { success: false, msg: "Account image is missing or invalid" };
//     }
//     const uploadRes = await uploadFileToCloudinary(
//       { uri: account.image.uri },
//       "accounts"
//     );

//     if (!uploadRes.success) {
//       return { success: false, msg: "Image upload failed" };
//     }

//     const imageUrl = uploadRes.data;

//     // Insert account data into Supabase
//     const { error } = await supabase.from("accounts").insert({
//       name: account.name,
//       image: imageUrl,
//       user_id: userId, // Ensure this matches your Supabase DB
//       created: new Date(),
//     });

//     if (error) {
//       return { success: false, msg: error.message };
//     }

//     return { success: true };
//   } catch (err: any) {
//     return { success: false, msg: err?.message || "Unknown error occurred" };
//   }
// };
