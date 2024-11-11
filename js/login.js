import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Función para mostrar/ocultar el spinner
function toggleSpinner(show, message = 'Cargando...') {
    const spinner = document.getElementById('spinnerOverlay');
    const spinnerText = spinner.querySelector('.spinner-text');
    spinnerText.textContent = message;
    spinner.style.display = show ? 'flex' : 'none';
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = mensaje;
    messageElement.className = tipo;
    messageElement.style.display = 'block';
}

// Manejar el inicio de sesión
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        toggleSpinner(true, 'Iniciando sesión...');
        
        await signInWithEmailAndPassword(auth, email, password);
        
        // Redirigir después de un inicio de sesión exitoso
        window.location.href = 'seleccion_grupos.html';
    } catch (error) {
        console.error("Error de inicio de sesión:", error);
        let mensajeError = 'Error al iniciar sesión';
        
        switch (error.code) {
            case 'auth/invalid-email':
                mensajeError = 'Correo electrónico inválido';
                break;
            case 'auth/user-disabled':
                mensajeError = 'Usuario deshabilitado';
                break;
            case 'auth/user-not-found':
                mensajeError = 'Usuario no encontrado';
                break;
            case 'auth/wrong-password':
                mensajeError = 'Contraseña incorrecta';
                break;
        }
        
        mostrarMensaje(mensajeError, 'error');
    } finally {
        toggleSpinner(false);
    }
});

// Verificar si ya hay una sesión activa
auth.onAuthStateChanged((user) => {
    if (user) {
        window.location.href = 'seleccion_grupos.html';
    }
}); 