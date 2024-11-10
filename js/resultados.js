import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
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

function mostrarGrupos(usuarios) {
    const container = document.getElementById('grupos-container');
    container.innerHTML = '';

    const lideres = {
        1: "Agustin Sal",
        2: "Fabian Guerrero",
        3: "Manuel Sosa",
        4: "Sergio Gomez"
    };

    // Organizar usuarios por grupo
    const gruposUsuarios = {1: [], 2: [], 3: [], 4: []};

    Object.entries(usuarios || {}).forEach(([uid, userData]) => {
        if (userData && userData.grupo) {
            gruposUsuarios[userData.grupo].push({
                nombre: userData.nombre || userData.email,
                email: userData.email
            });
        }
    });

    // Crear elementos para cada grupo
    for (let numeroGrupo = 1; numeroGrupo <= 4; numeroGrupo++) {
        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'grupo-resultado';

        const titulo = document.createElement('h2');
        titulo.className = 'grupo-titulo';
        titulo.textContent = lideres[numeroGrupo];

        const liderDiv = document.createElement('div');
        liderDiv.className = 'lider-grupo';
        liderDiv.textContent = `Líder del Grupo ${numeroGrupo}`;

        const lista = document.createElement('ul');
        lista.className = 'miembros-lista';

        const miembros = gruposUsuarios[numeroGrupo];

        if (miembros && miembros.length > 0) {
            miembros.forEach(miembro => {
                const li = document.createElement('li');
                li.className = 'miembro-item';
                li.textContent = miembro.nombre;
                lista.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'miembro-item empty';
            li.textContent = 'No hay integrantes aún';
            lista.appendChild(li);
        }

        const contador = document.createElement('div');
        contador.className = 'contador-grupo';
        contador.textContent = `Total de integrantes: ${miembros ? miembros.length : 0}/12`;

        grupoDiv.appendChild(titulo);
        grupoDiv.appendChild(liderDiv);
        grupoDiv.appendChild(lista);
        grupoDiv.appendChild(contador);
        container.appendChild(grupoDiv);
    }
}

// Verificar autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        // Escuchar cambios en la base de datos
        const usuariosRef = ref(database, 'usuarios');
        onValue(usuariosRef, (snapshot) => {
            const usuarios = snapshot.val();
            mostrarGrupos(usuarios);
        }, (error) => {
            document.getElementById('grupos-container').innerHTML = `
                <div class="error-message">
                    Error al cargar los grupos. Por favor, intenta nuevamente.
                </div>
            `;
        });
    } else {
        window.location.href = "login.html";
    }
});

// Manejar cierre de sesión
document.getElementById('btnLogout').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}); 