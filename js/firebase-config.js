import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCaDSh4lgQWum4Nsd1GCHhMV6ekD_iwZP0",
    authDomain: "seleccion-de-grupos.firebaseapp.com",
    projectId: "seleccion-de-grupos",
    databaseURL: "https://seleccion-de-grupos-default-rtdb.firebaseio.com",
    storageBucket: "seleccion-de-grupos.appspot.com",
    messagingSenderId: "1031698181043",
    appId: "1:1031698181043:web:ef91094542037e9cd1f9c6"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Manejo de estado del usuario
function handleUserStatus(userId) {
    if (!userId) return;

    const userStatusRef = ref(database, `usuarios/${userId}/status`);
    const connectedRef = ref(database, '.info/connected');

    onValue(connectedRef, async (snapshot) => {
        if (snapshot.val() === true) {
            try {
                await set(userStatusRef, {
                    state: 'online',
                    lastChanged: serverTimestamp()
                });
            } catch (error) {
                console.error('Error actualizando estado:', error);
            }
        }
    });
}

// Observador de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        handleUserStatus(user.uid);
    }
});

export { database, auth }; 