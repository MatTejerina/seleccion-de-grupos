import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const database = getDatabase(app);

document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const nombre = document.getElementById('nombre').value;
    const messageElement = document.getElementById('message');

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guardar información adicional del usuario
        await set(ref(database, 'usuarios/' + user.uid), {
            nombre: nombre,
            email: email
        });

        messageElement.style.color = "green";
        messageElement.textContent = "Registro exitoso";
        
        setTimeout(() => {
            window.location.href = "seleccion_grupos.html";
        }, 1500);
    } catch (error) {
        messageElement.style.color = "red";
        switch (error.code) {
            case 'auth/email-already-in-use':
                messageElement.textContent = "Este correo ya está registrado.";
                break;
            case 'auth/invalid-email':
                messageElement.textContent = "Correo electrónico inválido.";
                break;
            case 'auth/weak-password':
                messageElement.textContent = "La contraseña debe tener al menos 6 caracteres.";
                break;
            default:
                messageElement.textContent = "Error: " + error.message;
        }
    }
}); 