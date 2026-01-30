import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDGj4fZsXO4Oo_6aahUKffJfJi0RPUWI74",
  authDomain: "projeto-pap-284ca.firebaseapp.com",
  projectId: "projeto-pap-284ca",
  storageBucket: "projeto-pap-284ca.appspot.com",
  messagingSenderId: "232143822949",
  appId: "1:232143822949:web:e5ed740f3caf499b05268c",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
