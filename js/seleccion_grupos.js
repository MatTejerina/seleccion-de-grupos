import { database, auth } from './firebase-config.js';
import { ref, onValue, get, update, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
                        // Priorizar el nombre guardado, si no existe usar el email
                        const nombreMostrado = userData.nombre || user.email.split('@')[0];
                        document.getElementById('userName').textContent = nombreMostrado;
                        
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
            window.location.href = 'index.html';
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
            boton.disabled = cantidadMiembros >= 1;
            if (cantidadMiembros >= 1) {
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

function toggleSpinner(grupoId, show) {
    const spinner = document.getElementById(`buttonSpinner-${grupoId}`);
    const button = document.getElementById(`btn-${grupoId}`);
    
    if (spinner && button) {
        spinner.style.display = show ? 'inline-block' : 'none';
        button.disabled = show;
    }
}

// Para el botón de cerrar sesión, usa una función separada:
function toggleLogoutSpinner(show) {
    const logoutButton = document.getElementById('btnLogout');
    if (logoutButton) {
        logoutButton.disabled = show;
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', inicializarApp);

const LIMITE_POR_GRUPO = 1; // Constante para el límite

// Función para actualizar la UI de un grupo
function actualizarUIGrupo(numeroGrupo, cantidadMiembros) {
    const grupoElement = document.querySelector(`.grupo:nth-child(${numeroGrupo})`);
    const button = document.getElementById(`btn-${numeroGrupo}`);
    const contador = document.getElementById(`count-${numeroGrupo}`);
    
    if (grupoElement && button && contador) {
        contador.textContent = cantidadMiembros;
        
        if (cantidadMiembros >= LIMITE_POR_GRUPO) {
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

// Función para seleccionar grupo
window.seleccionarGrupo = async function(numeroGrupo) {
    if (!auth.currentUser) {
        mostrarMensaje("Por favor, inicia sesión nuevamente.", "error");
        return;
    }

    const user = auth.currentUser;
    try {
        toggleSpinner(numeroGrupo, true, 'Seleccionando grupo...');
        
        // Verificar el estado actual del grupo
        const grupoRef = ref(database, `grupos/${numeroGrupo}`);
        const snapshot = await get(grupoRef);
        const miembros = snapshot.val() || {};
        
        if (Object.keys(miembros).length >= LIMITE_POR_GRUPO) {
            mostrarMensaje("Este grupo ya está completo.", "error");
            return;
        }

        // Realizar la actualización
        const updates = {};
        updates[`grupos/${numeroGrupo}/${user.uid}`] = true;
        updates[`usuarios/${user.uid}/grupo`] = numeroGrupo;
        updates[`usuarios/${user.uid}/timestamp`] = serverTimestamp();

        await update(ref(database), updates);
        mostrarMensaje(`¡Te has unido exitosamente al Grupo ${numeroGrupo}!`, "success");
        
    } catch (error) {
        console.error("Error:", error);
        mostrarMensaje("Error al seleccionar grupo. Por favor, intenta nuevamente.", "error");
    } finally {
        toggleSpinner(numeroGrupo, false);
    }
};

// Manejar cierre de sesión
document.getElementById('btnLogout').addEventListener('click', async (e) => {
    e.preventDefault();
    toggleLogoutSpinner(true);
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        toggleLogoutSpinner(false);
    }
});

async function seleccionarGrupo(id) {
    try {
        // Mostrar el spinner del botón específico
        document.getElementById(`buttonSpinner-${id}`).style.display = 'inline-block';
        document.getElementById(`btn-${id}`).disabled = true;

        // Tu lógica de selección de grupo aquí
        const resultado = await runTransaction(/* ... */);

        // Ocultar el spinner cuando termine
        document.getElementById(`buttonSpinner-${id}`).style.display = 'none';
        document.getElementById(`btn-${id}`).disabled = false;

        return resultado;
    } catch (error) {
        // En caso de error, también ocultar el spinner
        document.getElementById(`buttonSpinner-${id}`).style.display = 'none';
        document.getElementById(`btn-${id}`).disabled = false;
        console.error('Error:', error);
    }
}

function actualizarContador(grupoId, cantidad) {
    const countElement = document.getElementById(`count-${grupoId}`);
    const button = document.getElementById(`btn-${grupoId}`);
    const grupoContainer = document.getElementById(`grupo-${grupoId}`);
    const ribbon = grupoContainer?.querySelector('.ribbon-completo');
    
    if (countElement && button && grupoContainer && ribbon) {
        countElement.textContent = cantidad;
        
        if (cantidad >= 1) {
            button.disabled = true;
            grupoContainer.classList.add('completo');
            ribbon.style.display = 'block';
        } else {
            button.disabled = false;
            grupoContainer.classList.remove('completo');
            ribbon.style.display = 'none';
        }
    }
}

// Agregar esta función
function cargarDatosUsuario() {
    if (!auth.currentUser) return;
    
    const userRef = ref(database, `usuarios/${auth.currentUser.uid}`);
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.nombreCompleto) {
            document.getElementById('userName').textContent = userData.nombreCompleto;
        }
    });
}

// Agregar esto al inicio o en el DOMContentLoaded
onAuthStateChanged(auth, (user) => {
    if (user) {
        cargarDatosUsuario();
    } else {
        window.location.href = 'index.html';
    }
});