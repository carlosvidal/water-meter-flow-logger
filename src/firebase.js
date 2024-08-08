import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuración de Firebase (reemplaza con tus propias credenciales)
const firebaseConfig = {
  apiKey: "AIzaSyCLFRx1WftIqWsy5KS5uesQJHyVMMNFKfo",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "water-meter-flow-logger",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
  measurementId: "TU_MEASUREMENT_ID",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios de Firebase
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
