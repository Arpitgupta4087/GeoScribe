import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCNjWTKy6xQMOh4T2r9szPYyZJthuBPxNA",
  authDomain: "geoscribe-f8df3.firebaseapp.com",
  projectId: "geoscribe-f8df3",
  storageBucket: "geoscribe-f8df3.firebasestorage.app",
  messagingSenderId: "466230438481",
  appId: "1:466230438481:web:fc6351a0c7ba902a17e670",
  measurementId: "G-Z19918WJML"
};



const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };