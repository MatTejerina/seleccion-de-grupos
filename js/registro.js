import { auth } from './firebase-config.js';
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

function toggleSpinner(show, message = 'Cargando...') {
    const spinner = document.getElementById('spinnerOverlay');
    const spinnerText = spinner.querySelector('.spinner-text');
    spinnerText.textContent = message;
    spinner.style.display = show ? 'flex' : 'none';
}

function mostrarMensaje(mensaje, tipo) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = mensaje;
    messageElement.className = tipo;
    messageElement.style.display = 'block';
}

document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const nombre = document.getElementById('nombre').value;

    // Validación de contraseña
    if (password.length < 6) {
        mostrarMensaje("La contraseña debe tener al menos 6 caracteres", "error");
        return;
    }

    try {
        toggleSpinner(true, 'Creando cuenta...');
        
        // Crear usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Actualizar perfil con nombre
        await updateProfile(user, {
            displayName: nombre
        });

        // Guardar información adicional en la base de datos
        const db = getDatabase();
        await set(ref(db, 'usuarios/' + user.uid), {
            nombre: nombre,
            email: email,
            timestamp: Date.now()
        });

        mostrarMensaje("Cuenta creada exitosamente", "success");
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = 'seleccion_grupos.html';
        }, 1500);

    } catch (error) {
        console.error("Error:", error);
        let mensajeError = 'Error al crear la cuenta';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                mensajeError = 'Este correo electrónico ya está registrado';
                break;
            case 'auth/invalid-email':
                mensajeError = 'Correo electrónico inválido';
                break;
            case 'auth/operation-not-allowed':
                mensajeError = 'El registro de usuarios está deshabilitado';
                break;
            case 'auth/weak-password':
                mensajeError = 'La contraseña debe tener al menos 6 caracteres';
                break;
            case 'auth/network-request-failed':
                mensajeError = 'Error de conexión. Verifica tu internet';
                break;
            default:
                mensajeError = `Error: ${error.message}`;
        }
        
        mostrarMensaje(mensajeError, "error");
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