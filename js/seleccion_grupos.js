import { 
    ref, 
    onValue, 
    runTransaction,
    serverTimestamp,
    get,
    set
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { database, auth } from './firebase-config.js';

// Definir los líderes permitidos
const LIDERES_PERMITIDOS = {
    'agustin.sal@super.com': 'Agustin Sal',
    'fabian.guerrero@super.com': 'Fabian Guerrero',
    'manuel.sosa@super.com': 'Manuel Sosa',
    'sergio.gomez@super.com': 'Sergio Gomez'
};

// Variables para el límite de integrantes (2 grupos de 12 y 2 de 11)
let limiteGruposDe12 = 12;
let limiteGruposDe11 = 2;
let gruposDe12Completados = 0;
let gruposDe11Completados = 0

// Función para verificar si es líder
function esLider(email) {
    return LIDERES_PERMITIDOS.hasOwnProperty(email);
}

// Función para crear la estructura de grupos
function crearEstructuraGrupos() {
    const gruposContainer = document.querySelector('.grupos-container');
    if (!gruposContainer) return;

    const user = auth.currentUser;
    const esLiderActual = esLider(user?.email);

    let gruposHTML = '';
    for (let i = 1; i <= 4; i++) {
        gruposHTML += `
            <div class="grupo-completo" data-grupo-id="${i}">
                <div class="grupo">
                    <h3 id="titulo-grupo-${i}">Grupo ${i}</h3>
                    <div class="grupo-info">
                        <div class="contador">
                            Integrantes: <span id="count-${i}">0</span>
                        </div>
                        ${esLiderActual ? 
                            `<button class="btn-liderar" data-grupo="${i}">
                                Liderar este grupo
                            </button>` : 
                            `<button id="btn-${i}" class="btn-seleccionar">
                                Seleccionar
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }
    gruposContainer.innerHTML = gruposHTML;

    // Agregar event listeners
    if (esLiderActual) {
        document.querySelectorAll('.btn-liderar').forEach(btn => {
            const grupoId = btn.getAttribute('data-grupo');
            btn.addEventListener('click', () => seleccionarLiderazgo(grupoId));
        });
    } else {
        for (let i = 1; i <= 4; i++) {
            const btn = document.getElementById(`btn-${i}`);
            if (btn) {
                btn.addEventListener('click', () => seleccionarGrupo(i));
            }
        }
    }
}

// Función para verificar si el usuario ya está en algún grupo
async function usuarioYaEstaEnGrupo(userId) {
    try {
        const gruposRef = ref(database, 'grupos');
        const snapshot = await get(gruposRef);
        const grupos = snapshot.val() || {};

        return Object.values(grupos).some(grupo => 
            grupo?.integrantes && grupo.integrantes[userId]
        );
    } catch (error) {
        console.error('Error al verificar grupos del usuario:', error);
        return false;
    }
}

// Función para actualizar la interfaz del grupo con el límite dinámico correcto
function actualizarInterfazGrupo(grupoId) {
    const grupoRef = ref(database, `grupos/${grupoId}`);
    onValue(grupoRef, async (snapshot) => {
        const grupoData = snapshot.val();
        const user = auth.currentUser;
        const esLiderActual = esLider(user?.email);

        const cantidadIntegrantes = grupoData?.integrantes ? 
            Object.keys(grupoData.integrantes).length : 0;

        // Contar cuántos grupos han alcanzado el límite de 12 y 11 integrantes
        const gruposSnapshot = await get(ref(database, 'grupos'));
        const todosLosGrupos = gruposSnapshot.val() || {};

        // Actualizamos las variables de grupos completados
        gruposDe12Completados = Object.values(todosLosGrupos).filter(grupo => 
            grupo.integrantes && Object.keys(grupo.integrantes).length === 12
        ).length;

        gruposDe11Completados = Object.values(todosLosGrupos).filter(grupo => 
            grupo.integrantes && Object.keys(grupo.integrantes).length === 11
        ).length;

        // Determinar el límite de integrantes para el grupo actual
        let limiteIntegrantes;
        if (gruposDe12Completados < limiteGruposDe12) {
            limiteIntegrantes = 12;
        } else if (gruposDe11Completados < limiteGruposDe11) {
            limiteIntegrantes = 11;
        } else {
            limiteIntegrantes = 0; // No más espacios disponibles
        }

        // Actualizar contador en la interfaz
        const contadorElement = document.getElementById(`count-${grupoId}`);
        if (contadorElement) {
            contadorElement.textContent = `${cantidadIntegrantes}/${limiteIntegrantes}`;
        }

        // Verificar si el grupo está lleno y deshabilitar el botón de selección
        const botonSeleccionar = document.getElementById(`btn-${grupoId}`);
        if (botonSeleccionar) {
            const estaLleno = cantidadIntegrantes >= limiteIntegrantes;
            botonSeleccionar.disabled = estaLleno || (await usuarioYaEstaEnGrupo(user.uid));
            botonSeleccionar.textContent = estaLleno ? 'Grupo Completo' : 'Seleccionar';
        }
    });
}

// Activar la actualización en tiempo real de todos los grupos
function activarActualizacionTiempoReal() {
    const gruposRef = ref(database, 'grupos');
    onValue(gruposRef, () => {
        // Actualizar todos los grupos en tiempo real
        for (let i = 1; i <= 4; i++) {
            actualizarInterfazGrupo(i);
        }
    });
}

// Configuración de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        crearEstructuraGrupos(); // Crear la estructura de los grupos al iniciar sesión
        activarActualizacionTiempoReal(); // Escuchar cambios en tiempo real de todos los grupos
    }
});

// Función para seleccionar grupo con límite dinámico
async function seleccionarGrupo(grupoId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            mostrarMensaje('Debes iniciar sesión para seleccionar un grupo', 'error');
            return;
        }

        // Verificar si el usuario ya está en algún grupo
        const estaEnAlgunGrupo = await usuarioYaEstaEnGrupo(user.uid);
        if (estaEnAlgunGrupo) {
            mostrarMensaje('Ya estás asignado a un grupo', 'warning');
            return;
        }

        const grupoRef = ref(database, `grupos/${grupoId}`);
        
        const result = await runTransaction(grupoRef, (grupoActual) => {
            if (!grupoActual) grupoActual = {};

            const cantidadIntegrantes = grupoActual.integrantes ? 
                Object.keys(grupoActual.integrantes).length : 0;

            // Calcula el límite actual basado en los grupos completados
            const limiteIntegrantes = gruposDe12Completados < limiteGruposDe12 ? 12 : 11;

            if (cantidadIntegrantes >= limiteIntegrantes) {
                return undefined; // Grupo lleno, abortar transacción
            }

            grupoActual.integrantes = grupoActual.integrantes || {};
            grupoActual.integrantes[user.uid] = {
                email: user.email,
                timestamp: serverTimestamp()
            };

            return grupoActual;
        });

        if (result.committed) {
            mostrarMensaje(`¡Bienvenido al Grupo ${grupoId}!`, 'success');
        } else {
            mostrarMensaje('No se pudo unir al grupo. El grupo está lleno o ya perteneces a él', 'error');
        }
    } catch (error) {
        console.error('Error al seleccionar grupo:', error);
        mostrarMensaje('Error al seleccionar grupo', 'error');
    }
}

// Función para seleccionar liderazgo
async function seleccionarLiderazgo(grupoId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            mostrarMensaje('Debes iniciar sesión para liderar un grupo', 'error');
            return;
        }

        // Primero verificar si ya es líder de algún grupo
        const gruposRef = ref(database, 'grupos');
        const snapshot = await get(gruposRef);
        const grupos = snapshot.val() || {};
        
        const yaEsLider = Object.values(grupos).some(grupo => 
            grupo?.lider?.email === user.email
        );

        if (yaEsLider) {
            mostrarMensaje('Ya eres líder de otro grupo', 'warning');
            return;
        }

        // Verificar si el grupo ya tiene líder
        const grupoRef = ref(database, `grupos/${grupoId}`);
        const grupoSnapshot = await get(grupoRef);
        const grupoData = grupoSnapshot.val() || {};

        if (grupoData.lider) {
            mostrarMensaje('Este grupo ya tiene un líder asignado', 'warning');
            return;
        }

        // Asignar el liderazgo directamente sin usar transacción
        await set(ref(database, `grupos/${grupoId}/lider`), {
            uid: user.uid,
            email: user.email,
            nombre: LIDERES_PERMITIDOS[user.email],
            timestamp: serverTimestamp()
        });

        mostrarMensaje(`¡Felicitaciones! Ahora eres líder del Grupo ${grupoId}`, 'success');
        deshabilitarBotonesLiderazgo(grupoId);

    } catch (error) {
        console.error('Error al asignar liderazgo:', error);
        mostrarMensaje('Error al asignar liderazgo', 'error');
    }
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'info') {
    // Configuración de iconos según el tipo de mensaje
    const iconos = {
        success: '🎉',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };

    // Configuración de colores según el tipo
    const colores = {
        success: 'linear-gradient(to right, #00b09b, #96c93d)',
        error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
        info: 'linear-gradient(to right, #2193b0, #6dd5ed)',
        warning: 'linear-gradient(to right, #f2994a, #f2c94c)'
    };

    // Usar el objeto Toastify global
    window.Toastify({
        text: `${iconos[tipo] || ''} ${mensaje}`,
        duration: 5000,
        close: true,
        gravity: "bottom",
        position: "right",
        backgroundColor: colores[tipo] || colores.info
    }).showToast();
}

// Configuración de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        crearEstructuraGrupos();
        for (let i = 1; i <= 4; i++) {
            actualizarInterfazGrupo(i);
        }
    }
});