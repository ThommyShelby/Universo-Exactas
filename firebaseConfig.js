import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBiKJBguyZRGDrxcP7RHz6Cuza0JQdODr4",
  authDomain: "universo-exactas.firebaseapp.com",
  projectId: "universo-exactas",
  storageBucket: "universo-exactas.firebasestorage.app",
  messagingSenderId: "428300821051",
  appId: "1:428300821051:web:df9287fa0696be0250b21e"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});