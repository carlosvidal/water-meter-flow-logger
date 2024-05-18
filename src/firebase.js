import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase (reemplaza con tus propias credenciales)
const firebaseConfig = {
  apiKey: "AIzaSyCLFRx1WftIqWsy5KS5uesQJHyVMMNFKfo",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "water-meter-flow-logger",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios de Firebase
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
