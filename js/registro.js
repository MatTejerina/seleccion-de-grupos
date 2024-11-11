import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { auth, database } from "./firebase-config.js";

async function registrarUsuario(email, password, nombre) {
    try {
        toggleSpinner(true);
        
        // Validación del nombre completo
        if (!nombre || nombre.trim() === '') {
            throw new Error('El nombre completo es requerido');
        }

        // 1. Crear usuario en Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Guardar datos en Realtime Database
        const userRef = ref(database, `usuarios/${user.uid}`);
        const userData = {
            email: email,
            nombre: nombre.trim(),
            fechaRegistro: new Date().toISOString(),
            status: 'online'
        };

        // Guardar en la base de datos
        await set(userRef, userData);
        console.log('Datos guardados:', userData); // Para verificar

        mostrarMensaje('Cuenta creada exitosamente', 'success');
        
        setTimeout(() => {
            window.location.href = 'seleccion_grupos.html';
        }, 1500);

    } catch (error) {
        console.error('Error en registro:', error);
        mostrarMensaje(
            error.message === 'El nombre completo es requerido' 
                ? error.message 
                : obtenerMensajeError(error), 
            'error'
        );
    } finally {
        toggleSpinner(false);
    }
}

// Asegúrate de que el formulario tenga el ID correcto
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registroForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const nombre = document.getElementById('nombre').value.trim();
            
            await registrarUsuario(email, password, nombre);
        });
    }
});

function toggleSpinner(show) {
    const spinner = document.getElementById('buttonSpinner');
    if (spinner) {
        spinner.style.display = show ? 'inline-block' : 'none';
    }
}

function mostrarMensaje(mensaje, tipo) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = mensaje;
        messageElement.className = `message ${tipo}`;
        messageElement.style.display = 'block';
    }
} 