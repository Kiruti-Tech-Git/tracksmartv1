import { ResponseType, UserDataType } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";
const firestore = getFirestore();


export const updateUser = async (
    uid: string,
    updatedData: UserDataType
): Promise<ResponseType> => {
    try{

        if(updatedData?.image && updatedData?.image?.uri){
            //upload the image to cloudinary
            const imageUploadRes = await uploadFileToCloudinary(updatedData.image, "users")
            if(!imageUploadRes.success){
                return {success: false, msg: imageUploadRes.msg || "Failed to upload image"}
            }
            updatedData.image = imageUploadRes.data
        }


        const userRef = doc(firestore, "users", uid)
        await updateDoc(userRef, updatedData)

        //fetch the user data & update the user state
        return {success: true, msg: "Updated successfully"}
    }catch(error: any){
        console.log("error updating user:", error)
        return {success: false, msg: error?.message}
    }
}