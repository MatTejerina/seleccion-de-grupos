import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    browserLocalPersistence, 
    setPersistence 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCaDSh4lgQWum4Nsd1GCHhMV6ekD_iwZP0",
    authDomain: "seleccion-de-grupos.firebaseapp.com",
    databaseURL: "https://seleccion-de-grupos-default-rtdb.firebaseio.com",
    projectId: "seleccion-de-grupos",
    storageBucket: "seleccion-de-grupos.appspot.com",
    messagingSenderId: "1031698181043",
    appId: "1:1031698181043:web:ef91094542037e9cd1f9c6",
    cookieOptions: {
        sameSite: 'strict',
        secure: true
    }
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configurar persistencia local
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });

const database = getDatabase(app);

export { auth, database }; 