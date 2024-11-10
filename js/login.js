import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCaDSh4lgQWum4Nsd1GCHhMV6ekD_iwZP0",
    authDomain: "seleccion-de-grupos.firebaseapp.com",
    projectId: "seleccion-de-grupos",
    storageBucket: "seleccion-de-grupos.appspot.com",
    messagingSenderId: "1031698181043",
    appId: "1:1031698181043:web:ef91094542037e9cd1f9c6",
    databaseURL: "https://seleccion-de-grupos-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        messageElement.style.color = "green";
        messageElement.textContent = "Inicio de sesión exitoso";
        setTimeout(() => {
            window.location.href = "seleccion_grupos.html";
        }, 1000);
    } catch (error) {
        messageElement.style.color = "red";
        switch (error.code) {
            case 'auth/invalid-email':
                messageElement.textContent = "Correo electrónico inválido";
                break;
            case 'auth/user-disabled':
                messageElement.textContent = "Usuario deshabilitado";
                break;
            case 'auth/user-not-found':
                messageElement.textContent = "Usuario no encontrado";
                break;
            case 'auth/wrong-password':
                messageElement.textContent = "Contraseña incorrecta";
                break;
            default:
                messageElement.textContent = "Error: " + error.message;
        }
    }
}); 