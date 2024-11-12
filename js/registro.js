import { auth, database } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    ref, 
    set,
    get 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

async function registrarUsuario(nombre, email, password) {
    try {
        // 1. Crear usuario en Authentication
        console.log('Iniciando registro para:', email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Usuario creado en Auth:', user.uid);

        // 2. Crear la referencia a la base de datos
        const userRef = ref(database, `usuarios/${user.uid}`);
        
        // 3. Preparar los datos del usuario
        const userData = {
            nombre: nombre.trim(),
            email: email,
            timestamp: Date.now()
        };
        
        console.log('Intentando guardar datos:', userData);
        
        // 4. Guardar datos en la base de datos
        await set(userRef, userData);
        console.log('Datos guardados exitosamente');

        // 5. Verificar que los datos se guardaron
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            console.log('Verificación: datos guardados:', snapshot.val());
        } else {
            console.error('Los datos no se guardaron correctamente');
        }

        // 6. Redirigir
        window.location.href = 'seleccion_grupos.html';
    } catch (error) {
        console.error('Error en el registro:', error);
        let mensajeError = 'Error al registrar usuario';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                mensajeError = 'Este correo ya está registrado';
                break;
            case 'auth/invalid-email':
                mensajeError = 'El correo electrónico no es válido';
                break;
            case 'auth/operation-not-allowed':
                mensajeError = 'El registro está deshabilitado temporalmente';
                break;
            case 'auth/weak-password':
                mensajeError = 'La contraseña es muy débil';
                break;
            default:
                mensajeError = `Error: ${error.message}`;
        }
        
        alert(mensajeError);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registro-form');
    
    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (!nombre || !email || !password || !confirmPassword) {
                alert('Todos los campos son obligatorios');
                return;
            }

            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }

            await registrarUsuario(nombre, email, password);
        });
    }
}); 