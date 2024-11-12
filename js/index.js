import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'error') {
    // Aquí puedes implementar tu propia lógica de mostrar mensajes
    alert(mensaje);
}

// Función para manejar el inicio de sesión
async function iniciarSesion(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Redirigir a la página de selección de grupos
        window.location.href = 'seleccion_grupos.html';
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        let mensajeError = 'Error al iniciar sesión';
        
        switch (error.code) {
            case 'auth/invalid-email':
                mensajeError = 'El correo electrónico no es válido';
                break;
            case 'auth/user-disabled':
                mensajeError = 'Esta cuenta ha sido deshabilitada';
                break;
            case 'auth/user-not-found':
                mensajeError = 'No existe una cuenta con este correo';
                break;
            case 'auth/wrong-password':
                mensajeError = 'Contraseña incorrecta';
                break;
        }
        
        mostrarMensaje(mensajeError);
    }
}

// Event listener para el formulario de login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
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