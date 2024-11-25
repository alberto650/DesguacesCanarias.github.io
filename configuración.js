//función que se encargue de cargar los valores almacenados en LocalStorage
function cargarConfiguracion() {
    const apiKey = localStorage.getItem('airtableApiKey');
    const baseId = localStorage.getItem('airtableBaseId');

    if (apiKey) {
        document.getElementById('api-key').value = apiKey;
    }

    if (baseId) {
        document.getElementById('base-id').value = baseId;
    }
}
//Utiliza el evento DOMContentLoaded para asegurarte de que los valores se carguen una vez que el DOM esté completamente
document.addEventListener('DOMContentLoaded', () => {
    cargarConfiguracion();
});

// Función para abrir el menú lateral
function openSidebar() {
    document.getElementById('sidebar').classList.add('openSidebar');
    document.querySelector('.container').style.marginLeft = '250px';
}

// Función para cerrar el menú lateral
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('openSidebar');
    document.querySelector('.container').style.marginLeft = '0';
}

// Redirección a la página principal
function volver() {
    window.location.href = 'index.html';
}

// Guardar configuración en LocalStorage
function guardarConfiguracion() {
    const apiKey = document.getElementById('api-key').value;
    const baseId = document.getElementById('base-id').value;

    if (!apiKey || !baseId) {
        alert('Por favor, completa ambos campos.');
        return;
    }

    localStorage.setItem('airtableApiKey', apiKey);
    localStorage.setItem('airtableBaseId', baseId);
    alert('Configuración guardada correctamente.');
}

// Cargar configuración desde LocalStorage
function cargarConfiguracion() {
    const apiKey = localStorage.getItem('airtableApiKey');
    const baseId = localStorage.getItem('airtableBaseId');

    if (apiKey) {
        document.getElementById('api-key').value = apiKey;
    }

    if (baseId) {
        document.getElementById('base-id').value = baseId;
    }
}

// Realizar solicitudes a Airtable
function airtableRequest(endpoint, method = 'GET', body = null) {
    const apiKey = localStorage.getItem('airtableApiKey');
    const baseId = localStorage.getItem('airtableBaseId');

    if (!apiKey || !baseId) {
        alert('Configura la API Key y Base ID en la página de Configuración.');
        return Promise.reject('Faltan credenciales de Airtable');
    }

    const url = `https://api.airtable.com/v0/${baseId}/${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };

    return fetch(url, {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : null,
    })
        .then(response => response.json())
        .catch(error => console.error('Error en la conexión con Airtable:', error));
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    cargarConfiguracion();
});
