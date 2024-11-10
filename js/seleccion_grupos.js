import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
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

// Verificar autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        // Mostrar email del usuario
        const userRef = ref(database, `usuarios/${user.uid}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                document.getElementById('userName').textContent = 
                    userData.nombre || user.email;
                
                // Si el usuario ya tiene grupo, deshabilitar todos los botones
                if (userData.grupo) {
                    document.querySelectorAll('.grupo button').forEach(btn => {
                        btn.disabled = true;
                    });
                    const message = document.getElementById('message');
                    message.textContent = `Ya estás asignado al Grupo ${userData.grupo}`;
                    message.className = 'success';
                }
            }
        });

        // Monitorear cambios en los grupos
        const gruposRef = ref(database, 'grupos');
        onValue(gruposRef, (snapshot) => {
            const grupos = snapshot.val() || {};
            
            for (let i = 1; i <= 4; i++) {
                const miembros = grupos[i] ? Object.keys(grupos[i]).length : 0;
                document.getElementById(`count-${i}`).textContent = miembros;
                
                const grupoElement = document.querySelector(`.grupo:nth-child(${i})`);
                const button = document.getElementById(`btn-${i}`);
                
                if (miembros >= 12) {
                    button.disabled = true;
                    grupoElement.classList.add('lleno');
                } else {
                    grupoElement.classList.remove('lleno');
                }
            }
        });
    } else {
        window.location.href = "index.html";
    }
});

// Función para seleccionar grupo
window.seleccionarGrupo = async function(numeroGrupo) {
    const user = auth.currentUser;
    if (!user) {
        const message = document.getElementById('message');
        message.textContent = "Por favor, inicia sesión nuevamente.";
        message.className = 'error';
        return;
    }

    const grupoRef = ref(database, `grupos/${numeroGrupo}`);
    const snapshot = await get(grupoRef);
    const miembros = snapshot.val() || {};
    
    if (Object.keys(miembros).length >= 12) {
        const message = document.getElementById('message');
        message.textContent = "Este grupo ya está completo.";
        message.className = 'error';
        return;
    }

    const updates = {};
    updates[`grupos/${numeroGrupo}/${user.uid}`] = true;
    updates[`usuarios/${user.uid}/grupo`] = numeroGrupo;

    try {
        await update(ref(database), updates);
        const message = document.getElementById('message');
        message.textContent = `¡Te has unido exitosamente al Grupo ${numeroGrupo}!`;
        message.className = 'success';
        
        // Deshabilitar todos los botones
        document.querySelectorAll('.grupo button').forEach(btn => {
            btn.disabled = true;
        });
    } catch (error) {
        const message = document.getElementById('message');
        message.textContent = "Error al seleccionar el grupo: " + error.message;
        message.className = 'error';
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
    }
}); 