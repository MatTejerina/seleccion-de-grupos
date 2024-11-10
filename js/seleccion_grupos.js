import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, update, get, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const database = getDatabase(app);
const auth = getAuth(app);

// Función para actualizar la UI de un grupo
function actualizarUIGrupo(numeroGrupo, cantidadMiembros) {
    const grupoElement = document.querySelector(`.grupo:nth-child(${numeroGrupo})`);
    const button = document.getElementById(`btn-${numeroGrupo}`);
    const contador = document.getElementById(`count-${numeroGrupo}`);
    
    if (grupoElement && button && contador) {
        // Actualizar contador
        contador.textContent = cantidadMiembros;
        
        // Actualizar estado del grupo y botón
        if (cantidadMiembros >= 12) {
            button.disabled = true;
            grupoElement.classList.add('lleno');
            button.textContent = 'Grupo Completo';
        } else {
            button.disabled = false;
            grupoElement.classList.remove('lleno');
            button.textContent = 'Seleccionar';
        }
    }
}

// Monitorear cambios en tiempo real
auth.onAuthStateChanged((user) => {
    if (user) {
        // Verificar si el usuario ya tiene grupo
        const userRef = ref(database, `usuarios/${user.uid}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.grupo) {
                // Deshabilitar todos los botones si el usuario ya tiene grupo
                document.querySelectorAll('.grupo button').forEach(btn => {
                    btn.disabled = true;
                });
                const message = document.getElementById('message');
                message.textContent = `Ya estás asignado al Grupo ${userData.grupo}`;
                message.className = 'success';
            }
        });

        // Monitorear cambios en los grupos
        const gruposRef = ref(database, 'grupos');
        onValue(gruposRef, (snapshot) => {
            const grupos = snapshot.val() || {};
            
            // Actualizar cada grupo
            for (let i = 1; i <= 4; i++) {
                const miembros = grupos[i]?.miembros || {};
                const cantidadMiembros = Object.keys(miembros).length;
                actualizarUIGrupo(i, cantidadMiembros);
            }
        });
    } else {
        window.location.href = "login.html";
    }
});

// Función para seleccionar grupo
window.seleccionarGrupo = async function(numeroGrupo) {
    const user = auth.currentUser;
    if (!user) {
        mostrarMensaje("Por favor, inicia sesión nuevamente.", "error");
        return;
    }

    // Deshabilitar todos los botones mientras se procesa
    document.querySelectorAll('.grupo button').forEach(btn => btn.disabled = true);

    try {
        // Verificar el estado actual del grupo
        const grupoRef = ref(database, `grupos/${numeroGrupo}/miembros`);
        const snapshot = await get(grupoRef);
        const miembros = snapshot.val() || {};
        
        if (Object.keys(miembros).length >= 12) {
            mostrarMensaje("Este grupo ya está completo.", "error");
            // Reactivar botones de grupos no llenos
            document.querySelectorAll('.grupo button').forEach(btn => {
                const grupoNum = btn.id.split('-')[1];
                actualizarUIGrupo(grupoNum, Object.keys(grupos[grupoNum]?.miembros || {}).length);
            });
            return;
        }

        // Realizar la actualización
        const updates = {};
        updates[`grupos/${numeroGrupo}/miembros/${user.uid}`] = true;
        updates[`usuarios/${user.uid}/grupo`] = numeroGrupo;
        updates[`usuarios/${user.uid}/timestamp`] = serverTimestamp();

        await update(ref(database), updates);
        
        mostrarMensaje(`¡Te has unido exitosamente al Grupo ${numeroGrupo}!`, "success");
    } catch (error) {
        console.error("Error:", error);
        mostrarMensaje("Error al seleccionar grupo. Por favor, intenta nuevamente.", "error");
        // Reactivar botones en caso de error
        document.querySelectorAll('.grupo button').forEach(btn => {
            const grupoNum = btn.id.split('-')[1];
            actualizarUIGrupo(grupoNum, Object.keys(grupos[grupoNum]?.miembros || {}).length);
        });
    }
};

// Función para mostrar mensajes
function mostrarMensaje(texto, tipo) {
    const message = document.getElementById('message');
    message.textContent = texto;
    message.className = tipo;
}

// Manejar cierre de sesión
document.getElementById('btnLogout').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}); 