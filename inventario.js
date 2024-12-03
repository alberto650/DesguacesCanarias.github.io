document.addEventListener("DOMContentLoaded", () => {
    const inventoryList = document.getElementById("inventory-list");
    const notificationSound = document.getElementById("notificationSound");

    let previousItemCount = 0;

    // Sidebar - Funciones para abrir y cerrar
    window.openSidebar = () => {
        document.getElementById("sidebar").style.width = "250px";
    };

    window.closeSidebar = () => {
        document.getElementById("sidebar").style.width = "0";
    };

    // Función para obtener las piezas vendidas o reservadas
    const fetchSoldOrReservedItems = async () => {
        try {
            const response = await airtableRequest(
                `Piezas?filterByFormula=OR({Estado}="Vendido", {Estado}="Reservado")`
            );

            const items = response.records || [];
            
            // Reproducir notificación si hay más piezas que antes
            if (items.length > previousItemCount) {
                notificationSound.play();
            }

            previousItemCount = items.length;
            displayInventoryItems(items);
        } catch (error) {
            console.error("Error al obtener piezas:", error);
        }
    };

    // Función para mostrar las piezas en formato lista
    const displayInventoryItems = (items) => {
        inventoryList.innerHTML = ""; // Limpiar contenedor

        items.forEach((item) => {
            const { fields } = item;

            const inventoryItem = document.createElement("div");
            inventoryItem.className = "inventory-item";

            inventoryItem.innerHTML = `
                <div class="item-header">
                    <h2>${fields.Título || "Sin nombre"}</h2>
                </div>
                <div class="item-body">
                    <p><strong>Descripción:</strong> ${fields.Descripción || "Sin descripción"}</p>
                    <p><strong>Precio:</strong> €${fields.Precio || "0.00"}</p>
                    <p><strong>Código único:</strong> ${fields.Código || "Sin código"}</p>
                    <div class="item-images">
                        ${fields.Imágenes
                            ?.map((img) => `<img src="${img.url}" alt="Imagen de la pieza">`)
                            .join("") || "Sin imágenes"}
                    </div>
                </div>
                <button class="courier-button" data-id="${item.id}">Repartidor</button>
            `;

            inventoryList.appendChild(inventoryItem);
        });

        // Vincular funcionalidad de notificar repartidor
        const courierButtons = document.querySelectorAll(".courier-button");
        courierButtons.forEach((button) => {
            button.addEventListener("click", () => notifyCourier(button.dataset.id));
        });
    };

    // Función para notificar al repartidor
    const notifyCourier = async (recordId) => {
        try {
            const courierApiUrl = "https://api.correos.es/notify"; // URL de la API de Correos
            const payload = {
                recordId, // Identificador de la pieza
                message: "Nueva pieza lista para envío.",
            };

            const response = await fetch(courierApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("Notificación enviada al repartidor.");
            } else {
                alert("Error al notificar al repartidor.");
            }
        } catch (error) {
            console.error("Error al conectar con Correos:", error);
            alert("Hubo un problema al notificar al repartidor.");
        }
    };

    // Función para solicitudes a Airtable
    async function airtableRequest(endpoint, method = "GET", body = null) {
        const apiKey = localStorage.getItem("airtableApiKey");
        const baseId = localStorage.getItem("airtableBaseId");

        if (!apiKey || !baseId) {
            alert("Configura la API Key y Base ID en la página de Configuración.");
            throw new Error("Faltan credenciales de Airtable.");
        }

        const url = `https://api.airtable.com/v0/${baseId}/${endpoint}`;
        const headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        };

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error.message || "Error en la solicitud a Airtable.");
        }

        return response.json();
    }

    // Inicializar la carga de los artículos
    fetchSoldOrReservedItems();
    setInterval(fetchSoldOrReservedItems, 30000); // Actualización automática cada 30 segundos
});
