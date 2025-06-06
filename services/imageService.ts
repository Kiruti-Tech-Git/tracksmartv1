import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/constants";
import { ResponseType } from "@/types";
import axios from "axios";
import mime from "mime";

// Define Cloudinary upload URL
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Allowable input for upload
type FileType = { uri: string } | string;

/**
 * Uploads a file (image) to Cloudinary.
 * - Accepts a local file object `{ uri }` or a pre-uploaded string URL.
 * - Returns { success, data: uploadedImageUrl } or error message.
 */
export const uploadFileToCloudinary = async (
  file: FileType,
  folderName: string
): Promise<ResponseType> => {
  try {
    if (!file) return { success: true, data: null };

    // Already uploaded (string URL)
    if (typeof file === "string") {
      return { success: true, data: file };
    }

    // New upload (local file with URI)
    if (file && file.uri) {
      const formData = new FormData();
      const mimeType = mime.getType(file.uri) || "image/jpeg";

      formData.append("file", {
        uri: file.uri,
        type: mimeType,
        name: file.uri.split("/").pop() || "file.jpg",
      } as any);

      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", folderName);

      const response = await axios.post(CLOUDINARY_API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return { success: true, data: response.data.secure_url };
    }

    return { success: true, data: null };
  } catch (error: any) {
    const msg =
      error?.response?.data?.error?.message ||
      error.message ||
      "Could not upload file";
    return { success: false, msg };
  }
};

/**
 * Returns the correct profile image:
 * - A valid URL string
 * - A local file URI
 * - Or a fallback default avatar
 */
export const getProfileImage = (file: any) => {
  if (file && typeof file === "string") return file;
  if (file && typeof file === "object") return file.uri;

  return require("../assets/images/defaultAvatar.png");
};

/**
 * Returns a clean file path (string or local URI), or null.
 */
export const getFilePath = (file: any) => {
  if (file && typeof file === "string") return file;
  if (file && typeof file === "object") return file.uri;

  return null;
};
