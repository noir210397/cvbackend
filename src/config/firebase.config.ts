import admin from "firebase-admin";
import { App, getApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";


const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(new RegExp("\\\\n", "g"), "\n")
}

const app = getApps().length
    ? getApp()
    : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
// console.log(app);



//auth
export const auth = getAuth()
//firestore
export const db = getFirestore()