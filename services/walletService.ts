import { ResponseType, WalletType } from "@/types";
import { uploadFileToCloudinary } from "./imageService";
import { doc, collection, getFirestore, setDoc, deleteDoc, where, limit, query, getDocs, writeBatch } from "firebase/firestore";
const firestore = getFirestore();

export const createOrUpdateWallet = async (
    walletData: Partial<WalletType>
): Promise<ResponseType> => {
    try{
        let walletToSave = {...walletData}

        if(walletData?.image ){
                    //upload the image to cloudinary
                    const imageUploadRes = await uploadFileToCloudinary(walletData.image, "walltes")
                    if(!imageUploadRes.success){
                        return {success: false, msg: imageUploadRes.msg || "Failed to upload wallet icon"}
                    }
                    walletToSave.image = imageUploadRes.data
                }
                if(!walletData?.id){
                    //create new wallet
                    walletToSave.amount = 0;
                    walletToSave.totalIncome = 0;
                    walletToSave.totalExpenses = 0;
                    walletToSave.created = new Date();;
                }
                const firestore = getFirestore();
                const walletRef = walletData?.id ? doc(firestore, "wallets", walletData?.id) :
                doc(collection(firestore, "wallets"))

                await setDoc(walletRef, walletToSave, {merge: true}) //updates only the data provided
                return {success: true, data: {...walletToSave, id: walletRef.id}}
    }catch(error: any){
        console.log('error creating or updating wallet:', error)
        return {success: false, msg: error.message}
    }
}

export const deleteWallet = async (walletId: string): Promise<ResponseType> => {
    try{
        const walletRef = doc(firestore, "wallets", walletId)
        await deleteDoc(walletRef)

        // todo: delete all transactions in the wallet
        deleteTransactionsByWalletId(walletId)

        return {success: true, msg: "Wallet deleted successfully"}
    }catch(error: any){
        console.log('error deleting wallet:', error)
        return {success: false, msg: error.message}
    }
}

export const deleteTransactionsByWalletId = async (walletId: string): Promise<ResponseType> => {
  try {
      let hasMoreTransactions = true;
      
      while (hasMoreTransactions) { 
          const transactionsQuery = query(
              collection(firestore, "transactions"),
              where("walletId", "==", walletId),
          )
          const transactionsSnapshot = await getDocs(transactionsQuery)
          if (transactionsSnapshot.size == 0) {
              hasMoreTransactions = false;
              break
          }

          const batch = writeBatch(firestore)
          
          transactionsSnapshot.forEach((transactionDoc) => {
              batch.delete(transactionDoc.ref)
          })

          await batch.commit()

          console.log(`${transactionsSnapshot.size} transactions deleted in this batch`)
      }

      return { success: true, msg: "Transactions deleted successfully" };
    // todo: delete all transactions in the wallet

    return { success: true, msg: "Wallet deleted successfully" };
  } catch (error: any) {
    console.log("error deleting wallet:", error);
    return { success: false, msg: error.message };
  }
};