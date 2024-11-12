import { auth, database } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

async function mostrarNombreUsuario(user) {
    const userNameElement = document.getElementById('user-name');
    if (!userNameElement || !user) return;

    try {
        const userRef = ref(database, `usuarios/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData && userData.nombre) {
                userNameElement.textContent = userData.nombre.trim();
                userNameElement.style.whiteSpace = 'nowrap';
            }
        }
    } catch (error) {
        console.error('Error al obtener el nombre del usuario:', error);
    }
}

function createNavbar() {
    const navbarHTML = `
        <nav class="navbar">
            <div class="nav-container">
                <div class="nav-logo">
                    <a href="index.html">Sistema de Grupos</a>
                </div>
                <div class="nav-links">
                    <a href="seleccion_grupos.html" class="nav-link">Grupos</a>
                    <a href="resultados.html" class="nav-link">Resultados</a>
                </div>
                <div class="nav-user">
                    <span id="user-name">Cargando...</span>
                    <button id="logout-btn" class="btn-logout">Cerrar Sesión</button>
                </div>
            </div>
        </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
}

async function cerrarSesion() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Inicializar navbar
document.addEventListener('DOMContentLoaded', () => {
    createNavbar();
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', cerrarSesion);
    }

    // Escuchar cambios en la autenticación
    auth.onAuthStateChanged(async user => {
        if (user) {
            console.log('Usuario autenticado:', {
                uid: user.uid,
                email: user.email
            });
            await mostrarNombreUsuario(user);
        } else if (window.location.pathname !== '/index.html' && 
                   window.location.pathname !== '/registro.html') {
            window.location.href = 'index.html';
        }
    });
});

// Exportar funciones necesarias
export { createNavbar, mostrarNombreUsuario };