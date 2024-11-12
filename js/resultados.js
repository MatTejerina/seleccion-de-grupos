import { database, auth } from './firebase-config.js';
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

async function obtenerNombreUsuario(uid) {
    try {
        const userRef = ref(database, `usuarios/${uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            return userData.nombre || 'Usuario';
        }
        return 'Usuario';
    } catch (error) {
        console.error('Error al obtener nombre de usuario:', error);
        return 'Usuario';
    }
}

function mostrarResultados() {
    const resultadosContainer = document.querySelector('.resultados-container');
    const gruposRef = ref(database, 'grupos');

    onValue(gruposRef, async (snapshot) => {
        const grupos = snapshot.val() || {};
        let resultadosHTML = '';

        // Procesar cada grupo
        for (let i = 1; i <= 4; i++) {
            const grupo = grupos[i] || {};
            const lider = grupo.lider || {};
            const integrantes = grupo.integrantes || {};

            // Obtener los nombres de los integrantes
            const integrantesPromises = Object.entries(integrantes).map(async ([uid, data]) => {
                const nombre = await obtenerNombreUsuario(uid);
                return `
                    <li class="integrante-item">
                        <div>
                            <div class="integrante-nombre">${nombre}</div>
                        </div>
                    </li>
                `;
            });

            // Esperar a que se resuelvan todas las promesas de nombres
            const integrantesHTML = await Promise.all(integrantesPromises);

            resultadosHTML += `
                <div class="grupo-resultado">
                    <h2>${lider.nombre || `Grupo ${i}`}</h2>
                    <div class="integrantes">
                        <h3>Integrantes</h3>
                        <ul class="integrantes-lista">
                            ${integrantesHTML.join('')}
                            ${Object.keys(integrantes).length === 0 ? 
                                '<li class="integrante-item">No hay integrantes aún</li>' : 
                                ''}
                        </ul>
                    </div>
                </div>
            `;
        }

        resultadosContainer.innerHTML = resultadosHTML;
    });
}

// Inicializar cuando el DOM esté listo y el usuario esté autenticado
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            mostrarResultados();
        } else {
            window.location.href = 'index.html';
        }
    });
}); 