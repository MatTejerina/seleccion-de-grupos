import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

function toggleSpinner(show) {
    const spinner = document.getElementById('buttonSpinner');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (spinner && submitButton) {
        spinner.style.display = show ? 'inline-block' : 'none';
        submitButton.disabled = show;
    }
}

async function iniciarSesion(email, password) {
    try {
        toggleSpinner(true);
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'seleccion_grupos.html';
    } catch (error) {
        console.error('Error de inicio de sesión:', error);
        mostrarMensaje(obtenerMensajeError(error), 'error');
    } finally {
        toggleSpinner(false);
    }
}

function mostrarMensaje(mensaje, tipo) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = mensaje;
        messageElement.className = `message ${tipo}`;
    }
}

// Event Listener para el formulario
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            await iniciarSesion(email, password);
        });
    }
}); 