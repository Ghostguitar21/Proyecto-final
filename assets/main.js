// ============================================
// FUNCIONES DE AUTENTICACIÓN SIMULADA
// ============================================

// Verificar si el usuario está autenticado
function estaAutenticado() {
    return localStorage.getItem('uao_usuario') !== null;
}

// Obtener datos del usuario
function obtenerUsuario() {
    const usuario = localStorage.getItem('uao_usuario');
    return usuario ? JSON.parse(usuario) : null;
}

// Iniciar sesión
function iniciarSesion(email) {
    // Validar formato de correo UAO
    const regexUAO = /^[a-zA-Z0-9._-]+@uao\.edu\.co$/;
    
    if (!regexUAO.test(email)) {
        return {
            exito: false,
            mensaje: 'Por favor ingresa un correo válido de la UAO (@uao.edu.co)'
        };
    }
    
    // Guardar usuario en localStorage
    const usuario = {
        email: email,
        fechaIngreso: new Date().toISOString()
    };
    
    localStorage.setItem('uao_usuario', JSON.stringify(usuario));
    
    return {
        exito: true,
        mensaje: 'Sesión iniciada correctamente'
    };
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('uao_usuario');
    window.location.href = 'index.html';
}

// ============================================
// FUNCIONES PARA GESTIÓN DE TAREAS
// ============================================

// Obtener todas las tareas
function obtenerTareas() {
    const tareas = localStorage.getItem('uao_tareas');
    return tareas ? JSON.parse(tareas) : [];
}

// Guardar tareas
function guardarTareas(tareas) {
    localStorage.setItem('uao_tareas', JSON.stringify(tareas));
}

// Agregar nueva tarea
function agregarTarea(titulo, descripcion, fechaLimite, prioridad) {
    const tareas = obtenerTareas();
    
    const nuevaTarea = {
        id: Date.now().toString(),
        titulo: titulo,
        descripcion: descripcion,
        fechaLimite: fechaLimite,
        prioridad: prioridad,
        completada: false,
        fechaCreacion: new Date().toISOString()
    };
    
    tareas.push(nuevaTarea);
    guardarTareas(tareas);
    
    return nuevaTarea;
}

// Eliminar tarea
function eliminarTarea(id) {
    let tareas = obtenerTareas();
    tareas = tareas.filter(tarea => tarea.id !== id);
    guardarTareas(tareas);
}

// Marcar tarea como completada/pendiente
function toggleCompletarTarea(id) {
    const tareas = obtenerTareas();
    const tarea = tareas.find(t => t.id === id);
    
    if (tarea) {
        tarea.completada = !tarea.completada;
        guardarTareas(tareas);
    }
}

// Obtener estadísticas de tareas
function obtenerEstadisticas() {
    const tareas = obtenerTareas();
    
    return {
        total: tareas.length,
        completadas: tareas.filter(t => t.completada).length,
        pendientes: tareas.filter(t => !t.completada).length,
        alta: tareas.filter(t => t.prioridad === 'alta' && !t.completada).length,
        media: tareas.filter(t => t.prioridad === 'media' && !t.completada).length,
        baja: tareas.filter(t => t.prioridad === 'baja' && !t.completada).length
    };
}

// ============================================
// INICIALIZACIÓN DE PÁGINA INDEX
// ============================================

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    
    // Si estamos en la página principal
    if (document.getElementById('btnIniciarSesion')) {
        const btnIniciarSesion = document.getElementById('btnIniciarSesion');
        
        // Verificar si ya está autenticado
        if (estaAutenticado()) {
            const usuario = obtenerUsuario();
            btnIniciarSesion.textContent = 'Ir al Gestor';
            btnIniciarSesion.onclick = function() {
                window.location.href = 'calendario.html';
            };
        } else {
            btnIniciarSesion.onclick = function() {
                mostrarModalLogin();
            };
        }
    }
    
    // Si estamos en la página de calendario
    if (document.getElementById('contenedorTareas')) {
        // Verificar autenticación
        if (!estaAutenticado()) {
            alert('Debes iniciar sesión para acceder al gestor de actividades');
            window.location.href = 'index.html';
            return;
        }
        
        inicializarGestorTareas();
    }
});

// Mostrar modal de login
function mostrarModalLogin() {
    const email = prompt('Ingresa tu correo institucional de la UAO:\n(ejemplo: estudiante@uao.edu.co)');
    
    if (email) {
        const resultado = iniciarSesion(email);
        
        if (resultado.exito) {
            alert(resultado.mensaje + '\n¡Bienvenido!');
            window.location.href = 'calendario.html';
        } else {
            alert(resultado.mensaje);
        }
    }
}

// ============================================
// FUNCIONES DEL GESTOR DE TAREAS
// ============================================

function inicializarGestorTareas() {
    // Mostrar información del usuario
    const usuario = obtenerUsuario();
    const infoUsuario = document.getElementById('infoUsuario');
    if (infoUsuario && usuario) {
        infoUsuario.textContent = usuario.email;
    }
    
    // Configurar botón de cerrar sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.onclick = cerrarSesion;
    }
    
    // Configurar formulario de nueva tarea
    const formTarea = document.getElementById('formNuevaTarea');
    if (formTarea) {
        formTarea.onsubmit = function(e) {
            e.preventDefault();
            
            const titulo = document.getElementById('tituloTarea').value;
            const descripcion = document.getElementById('descripcionTarea').value;
            const fechaLimite = document.getElementById('fechaLimite').value;
            const prioridad = document.getElementById('prioridad').value;
            
            agregarTarea(titulo, descripcion, fechaLimite, prioridad);
            
            // Limpiar formulario
            formTarea.reset();
            
            // Actualizar vista
            renderizarTareas();
            actualizarEstadisticas();
        };
    }
    
    // Configurar filtros
    const filtros = document.querySelectorAll('.filtro-btn');
    filtros.forEach(btn => {
        btn.onclick = function() {
            // Remover clase activa de todos
            filtros.forEach(b => b.classList.remove('activo'));
            // Agregar clase activa al clickeado
            this.classList.add('activo');
            
            // Renderizar con filtro
            const filtro = this.dataset.filtro;
            renderizarTareas(filtro);
        };
    });
    
    // Renderizar tareas iniciales
    renderizarTareas();
    actualizarEstadisticas();
}

function renderizarTareas(filtro = 'todas') {
    let tareas = obtenerTareas();
    
    // Aplicar filtro
    if (filtro === 'pendientes') {
        tareas = tareas.filter(t => !t.completada);
    } else if (filtro === 'completadas') {
        tareas = tareas.filter(t => t.completada);
    }
    
    // Ordenar por fecha límite
    tareas.sort((a, b) => {
        if (!a.fechaLimite) return 1;
        if (!b.fechaLimite) return -1;
        return new Date(a.fechaLimite) - new Date(b.fechaLimite);
    });
    
    const contenedor = document.getElementById('listaTareas');
    
    if (tareas.length === 0) {
        contenedor.innerHTML = '<p class="mensaje-vacio">No hay tareas para mostrar</p>';
        return;
    }
    
    contenedor.innerHTML = tareas.map(tarea => crearTarjetaTarea(tarea)).join('');
    
    // Agregar event listeners a los botones
    tareas.forEach(tarea => {
        const btnCompletar = document.getElementById(`completar-${tarea.id}`);
        const btnEliminar = document.getElementById(`eliminar-${tarea.id}`);
        
        if (btnCompletar) {
            btnCompletar.onclick = function() {
                toggleCompletarTarea(tarea.id);
                renderizarTareas(filtro);
                actualizarEstadisticas();
            };
        }
        
        if (btnEliminar) {
            btnEliminar.onclick = function() {
                if (confirm('¿Estás seguro de eliminar esta tarea?')) {
                    eliminarTarea(tarea.id);
                    renderizarTareas(filtro);
                    actualizarEstadisticas();
                }
            };
        }
    });
}

function crearTarjetaTarea(tarea) {
    const fechaFormateada = tarea.fechaLimite ? 
        new Date(tarea.fechaLimite + 'T00:00:00').toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Sin fecha límite';
    
    const prioridadClass = `prioridad-${tarea.prioridad}`;
    const completadaClass = tarea.completada ? 'tarea-completada' : '';
    
    return `
        <div class="tarjeta-tarea ${completadaClass} ${prioridadClass}">
            <div class="tarea-header">
                <h3 class="tarea-titulo">${tarea.titulo}</h3>
                <span class="tarea-prioridad">${tarea.prioridad.toUpperCase()}</span>
            </div>
            <p class="tarea-descripcion">${tarea.descripcion}</p>
            <p class="tarea-fecha">
                <i class="far fa-calendar"></i> ${fechaFormateada}
            </p>
            <div class="tarea-acciones">
                <button id="completar-${tarea.id}" class="btn-accion btn-completar">
                    <i class="fas fa-check"></i> ${tarea.completada ? 'Desmarcar' : 'Completar'}
                </button>
                <button id="eliminar-${tarea.id}" class="btn-accion btn-eliminar">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
}

function actualizarEstadisticas() {
    const stats = obtenerEstadisticas();
    
    const elementos = {
        'statTotal': stats.total,
        'statPendientes': stats.pendientes,
        'statCompletadas': stats.completadas
    };
    
    for (const [id, valor] of Object.entries(elementos)) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    }
}
