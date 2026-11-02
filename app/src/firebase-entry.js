// Firebase ka sirf zaroori hissa — esbuild se ek file (js/vendor/firebase.js) mein bundle hota hai.
// Build: (app folder mein)  npm run firebase
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore/lite";

window.GZFire = {
  init(config, { native }) {
    const app = initializeApp(config);
    // Android app mein popup/iframe nahi chalta, isliye wahan resolver nahi dete
    const auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      ...(native ? {} : { popupRedirectResolver: browserPopupRedirectResolver }),
    });
    const db = getFirestore(app);
    return { app, auth, db };
  },
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
};
