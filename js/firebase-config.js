// Importa las funciones que necesitas de los SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCaDSh4lgQWum4Nsd1GCHhMV6ekD_iwZP0",
    authDomain: "seleccion-de-grupos.firebaseapp.com",
    projectId: "seleccion-de-grupos",
    storageBucket: "seleccion-de-grupos.appspot.com",
    messagingSenderId: "1031698181043",
    appId: "1:1031698181043:web:ef91094542037e9cd1f9c6",
    databaseURL: "https://seleccion-de-grupos-default-rtdb.firebaseio.com"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Monitorear el estado de conexión
const connectedRef = ref(database, '.info/connected');
onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        // Conexión establecida
        console.debug('Firebase: Conexión establecida');
    } else {
        // Desconexión o intentando conectar
        console.debug('Firebase: Verificando conexión...');
    }
});

// Opcional: Agregar un indicador visual de conexión
function actualizarEstadoConexion(conectado) {
    const mensaje = document.getElementById('message');
    if (mensaje) {
        if (!conectado) {
            mensaje.textContent = 'Verificando conexión...';
            mensaje.className = 'warning';
        } else {
            mensaje.textContent = '';
            mensaje.className = '';
        }
    }
}

// Monitorear desconexiones de red
window.addEventListener('online', () => {
    console.debug('Dispositivo en línea');
    actualizarEstadoConexion(true);
});

window.addEventListener('offline', () => {
    console.debug('Dispositivo fuera de línea');
    actualizarEstadoConexion(false);
});

export { database, auth }; 