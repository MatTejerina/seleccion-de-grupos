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
                            Integrantes: <span id="count-${i}">0</span>/4
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

// Función para actualizar la interfaz de grupo
function actualizarInterfazGrupo(grupoId) {
    const grupoRef = ref(database, `grupos/${grupoId}`);
    onValue(grupoRef, async (snapshot) => {
        const grupoData = snapshot.val();
        const user = auth.currentUser;
        const esLiderActual = esLider(user?.email);
        
        // Actualizar título y contador
        const tituloElement = document.getElementById(`titulo-grupo-${grupoId}`);
        if (tituloElement) {
            tituloElement.textContent = grupoData?.lider?.nombre || `Grupo ${grupoId}`;
        }

        const contadorElement = document.getElementById(`count-${grupoId}`);
        if (contadorElement) {
            const cantidadIntegrantes = grupoData?.integrantes ? 
                Object.keys(grupoData.integrantes).length : 0;
            contadorElement.textContent = `${cantidadIntegrantes}`;  // Cambiar 1 por 4
        }

        // Verificar si el usuario ya está en algún grupo
        const estaEnAlgunGrupo = await usuarioYaEstaEnGrupo(user.uid);

        if (esLiderActual) {
            const botonLiderar = document.querySelector(`[data-grupo="${grupoId}"]`);
            if (botonLiderar) {
                const tieneOtroLider = grupoData?.lider !== undefined;
                const esLiderDeEsteGrupo = grupoData?.lider?.uid === user.uid;
                
                botonLiderar.disabled = tieneOtroLider || estaEnAlgunGrupo;
                
                if (esLiderDeEsteGrupo) {
                    botonLiderar.textContent = 'Tu grupo asignado';
                } else if (tieneOtroLider) {
                    botonLiderar.textContent = 'Grupo asignado';
                } else if (estaEnAlgunGrupo) {
                    botonLiderar.textContent = 'Ya estás en otro grupo';
                } else {
                    botonLiderar.textContent = 'Liderar este grupo';
                }
            }
        } else {
            const botonSeleccionar = document.getElementById(`btn-${grupoId}`);
            if (botonSeleccionar) {
                const estaLleno = grupoData?.integrantes && 
                    Object.keys(grupoData.integrantes).length >= 4;  // Cambiar 1 por 4
                const estaEnEsteGrupo = grupoData?.integrantes && 
                    grupoData.integrantes[user.uid];
                
                botonSeleccionar.disabled = estaLleno || estaEnAlgunGrupo;
                
                if (estaEnEsteGrupo) {
                    botonSeleccionar.textContent = 'Tu grupo';
                } else if (estaLleno) {
                    botonSeleccionar.textContent = 'Grupo Completo';
                } else if (estaEnAlgunGrupo) {
                    botonSeleccionar.textContent = 'Ya estás en otro grupo';
                } else {
                    botonSeleccionar.textContent = 'Seleccionar';
                }
            }
        }
    });
}

// Función para seleccionar grupo
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
            
            if (cantidadIntegrantes >= 4) {  // Cambiar 1 por 4
                return undefined;
            }

            const integrantes = grupoActual.integrantes || {};
            integrantes[user.uid] = {
                email: user.email,
                timestamp: serverTimestamp()
            };

            return {
                ...grupoActual,
                integrantes: integrantes
            };
        });

        if (result.committed) {
            mostrarMensaje(`¡Bienvenido al Grupo ${grupoId}! Te has unido exitosamente`, 'success');
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

// Función para mostrar mensajes en la interfaz
function mostrarMensaje(mensaje, tipo) {
    const mensajeContainer = document.querySelector('.mensaje-container');
    if (mensajeContainer) {
        mensajeContainer.innerHTML = `
            <div class="mensaje ${tipo}">${mensaje}</div>
        `;
        setTimeout(() => {
            mensajeContainer.innerHTML = '';
        }, 3000);
    }
}

// Deshabilitar botones de liderazgo una vez asignado
function deshabilitarBotonesLiderazgo(grupoId) {
    const botonLiderar = document.querySelector(`[data-grupo="${grupoId}"]`);
    if (botonLiderar) {
        botonLiderar.disabled = true;
    }
}

// Iniciar la estructura de grupos y la interfaz al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            crearEstructuraGrupos();
            for (let i = 1; i <= 4; i++) {
                actualizarInterfazGrupo(i);
            }
        } else {
            console.log('Usuario no autenticado');
        }
    });
});
