document.addEventListener("DOMContentLoaded", () => {
    const airtableAPIKey = "tu-api-key"; // Cambia por tu API Key
    const airtableBaseID = "tu-base-id"; // Cambia por tu Base ID
    const tableName = "nombre-de-tu-tabla"; // Cambia por el nombre de la tabla

    const inventoryContainer = document.getElementById("sales-inventory");

    // Sidebar - Funciones para abrir y cerrar
    window.openSidebar = () => {
        document.getElementById("sidebar").style.width = "250px";
    };

    window.closeSidebar = () => {
        document.getElementById("sidebar").style.width = "0";
    };

    // Función para obtener los pedidos vendidos de Airtable
    let previousItemCount = 0; // Para rastrear la cantidad previa de artículos

const fetchSoldItems = async () => {
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${airtableBaseID}/${tableName}?filterByFormula={Estado}="Vendido"`,
            {
                headers: {
                    Authorization: `Bearer ${airtableAPIKey}`,
                },
            }
        );
        const data = await response.json();

        // Verificar si hay nuevos artículos
        const newItemCount = data.records.length;
        if (newItemCount > previousItemCount) {
            // Reproducir sonido si hay nuevos artículos
            const notificationSound = document.getElementById("notificationSound");
            notificationSound.play();
        }

        // Actualizar el contador previo
        previousItemCount = newItemCount;

        // Mostrar los artículos en el DOM
        displaySoldItems(data.records);
    } catch (error) {
        console.error("Error fetching sold items:", error);
    }
};


    // Función para mostrar los pedidos vendidos en el DOM
    const displaySoldItems = (items) => {
        inventoryContainer.innerHTML = ""; // Limpia el contenedor antes de mostrar los datos

        items.forEach((item) => {
            const { fields } = item;
            const inventoryItem = document.createElement("div");
            inventoryItem.className = "inventory-item";

            inventoryItem.innerHTML = `
                <img src="${fields.Foto[0].url}" alt="Imagen de la pieza">
                <div class="item-description">${fields.Descripción}</div>
                <div class="item-price">€${fields.Precio}</div>
                <div class="item-code">Código único: ${fields["Código Único"]}</div>
                <button class="notify-button" data-id="${item.id}">Llamar al Repartidor</button>
            `;

            inventoryContainer.appendChild(inventoryItem);
        });

        // Agregar eventos a los botones
        const notifyButtons = document.querySelectorAll(".notify-button");
        notifyButtons.forEach((button) => {
            button.addEventListener("click", () => notifyCourier(button.dataset.id));
        });
    };

    // Función para marcar como listo para el repartidor
    const notifyCourier = async (recordId) => {
        try {
            const response = await fetch(
                `https://api.airtable.com/v0/${airtableBaseID}/${tableName}/${recordId}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${airtableAPIKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fields: {
                            "Estado": "Listo para Repartidor",
                        },
                    }),
                }
            );

            if (response.ok) {
                alert("El repartidor ha sido notificado.");
                fetchSoldItems(); // Refrescar la lista
            } else {
                alert("Error al notificar al repartidor.");
            }
        } catch (error) {
            console.error("Error notificando al repartidor:", error);
        }
    };

    // Inicializa la carga de los pedidos vendidos
    fetchSoldItems();
});
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
function loadSoldParts() {
    airtableRequest(`Piezas?filterByFormula={Estado}="Vendido"`)
        .then(data => {
            const table = document.getElementById('sold-parts-table');
            table.innerHTML = ''; // Limpiamos la tabla

            data.records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.fields.Código}</td>
                    <td>${record.fields.Descripción}</td>
                    <td>${record.fields.Precio}</td>
                    <td>${record.fields.Vehículo ? record.fields.Vehículo[0] : ''}</td>
                `;
                table.appendChild(row);
            });
        });
}
