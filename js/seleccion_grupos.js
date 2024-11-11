import { database, auth } from './firebase-config.js';
import { ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Usar async/await para las operaciones de Firebase
async function inicializarApp() {
    // Verificar autenticación
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Referencia al usuario
                const userRef = ref(database, `usuarios/${user.uid}`);
                
                // Escuchar cambios del usuario
                onValue(userRef, (snapshot) => {
                    const userData = snapshot.val();
                    if (userData) {
                        document.getElementById('userName').textContent = 
                            userData.nombre || user.email;
                        
                        if (userData.grupo) {
                            deshabilitarBotones();
                            mostrarMensaje(`Ya estás asignado al Grupo ${userData.grupo}`, 'success');
                        }
                    }
                });

                // Escuchar cambios en grupos
                const gruposRef = ref(database, 'grupos');
                onValue(gruposRef, (snapshot) => {
                    actualizarContadoresGrupos(snapshot.val());
                });

            } catch (error) {
                console.error('Error al inicializar:', error);
                mostrarMensaje('Error al cargar datos', 'error');
            }
        } else {
            window.location.href = 'login.html';
        }
    });
}

function actualizarContadoresGrupos(grupos) {
    for (let i = 1; i <= 4; i++) {
        const miembros = grupos?.[i] || {};
        const cantidadMiembros = Object.keys(miembros).length;
        const contador = document.getElementById(`count-${i}`);
        const boton = document.getElementById(`btn-${i}`);
        
        if (contador) contador.textContent = cantidadMiembros;
        if (boton) {
            boton.disabled = cantidadMiembros >= 12;
            if (cantidadMiembros >= 12) {
                boton.textContent = 'Grupo Completo';
            }
        }
    }
}

function deshabilitarBotones() {
    document.querySelectorAll('.grupo button').forEach(btn => {
        btn.disabled = true;
    });
}

function mostrarMensaje(texto, tipo) {
    const message = document.getElementById('message');
    if (message) {
        message.textContent = texto;
        message.className = tipo;
        message.style.display = 'block';
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', inicializarApp);

// Función para seleccionar grupo
window.seleccionarGrupo = async function(numeroGrupo) {
    if (!auth.currentUser) {
        mostrarMensaje("Por favor, inicia sesión nuevamente.", "error");
        return;
    }

    const user = auth.currentUser;
    deshabilitarBotones();

    try {
        const grupoRef = ref(database, `grupos/${numeroGrupo}`);
        const snapshot = await get(grupoRef);
        const miembros = snapshot.val() || {};
        
        if (Object.keys(miembros).length >= 12) {
            mostrarMensaje("Este grupo ya está completo.", "error");
            return;
        }

        const updates = {};
        updates[`grupos/${numeroGrupo}/${user.uid}`] = true;
        updates[`usuarios/${user.uid}/grupo`] = numeroGrupo;
        updates[`usuarios/${user.uid}/timestamp`] = Date.now();

        await update(ref(database), updates);
        mostrarMensaje(`¡Te has unido exitosamente al Grupo ${numeroGrupo}!`, "success");
    } catch (error) {
        console.error("Error:", error);
        mostrarMensaje("Error al seleccionar grupo. Por favor, intenta nuevamente.", "error");
    }
}; 

// Manejar cierre de sesión
document.getElementById('btnLogout').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        mostrarMensaje("Error al cerrar sesión", "error");
    }
}); 