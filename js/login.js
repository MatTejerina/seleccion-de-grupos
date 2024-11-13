import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCaDSh4lgQWum4Nsd1GCHhMV6ekD_iwZP0",
  authDomain: "seleccion-de-grupos.firebaseapp.com",
  databaseURL: "https://seleccion-de-grupos-default-rtdb.firebaseio.com",
  projectId: "seleccion-de-grupos",
  storageBucket: "seleccion-de-grupos.firebasestorage.app",
  messagingSenderId: "1031698181043",
  appId: "1:1031698181043:web:ef91094542037e9cd1f9c6",
  measurementId: "G-ECYPX03GK6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'error') {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = mensaje;
        messageElement.className = `message ${tipo}`;
    }
}

// Función para manejar el inicio de sesión
async function iniciarSesion(email, password) {
    try {
        toggleSpinner(true);
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'seleccion_grupos.html';
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        let mensajeError = obtenerMensajeError(error);
        mostrarMensaje(mensajeError);
    } finally {
        toggleSpinner(false);
    }
}

// Función para obtener el mensaje de error
function obtenerMensajeError(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'El correo electrónico no es válido';
        case 'auth/user-disabled':
            return 'Esta cuenta ha sido deshabilitada';
        case 'auth/user-not-found':
            return 'No existe una cuenta con este correo';
        case 'auth/wrong-password':
            return 'Contraseña incorrecta';
        default:
            return 'Error desconocido, por favor intente nuevamente';
    }
}

// Función para mostrar u ocultar el spinner
function toggleSpinner(show) {
    const spinner = document.getElementById('buttonSpinner');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (spinner && submitButton) {
        spinner.style.display = show ? 'inline-block' : 'none';
        submitButton.disabled = show;
    }
}

// Event listener para el formulario
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                mostrarMensaje('Por favor, complete todos los campos');
                return;
            }
            
            await iniciarSesion(email, password);
        });
    }

    // Verificar si ya hay una sesión activa
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'seleccion_grupos.html';
        }
    });
});
