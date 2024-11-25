document.addEventListener("DOMContentLoaded", () => {
    const airtableAPIKey = "tu-api-key"; // Cambia por tu API Key de Airtable
    const airtableBaseID = "tu-base-id"; // Cambia por tu Base ID
    const tableName = "nombre-de-tu-tabla"; // Cambia por el nombre de tu tabla

    const botonVender = document.getElementById("botonVender");
    const codigoUnicoVenta = document.getElementById("codigoUnicoVenta");

    // Sidebar - Funciones para abrir y cerrar
    window.openSidebar = () => {
        document.getElementById("sidebar").style.width = "250px";
    };

    window.closeSidebar = () => {
        document.getElementById("sidebar").style.width = "0";
    };

    // Manejador del evento de hacer click en "Marcar como Vendido"
    botonVender.addEventListener("click", async () => {
        const codigoUnico = codigoUnicoVenta.value.trim();

        if (!codigoUnico) {
            alert("Por favor, ingresa un código único.");
            return;
        }

        try {
            // Realiza la búsqueda de la pieza por su código único
            const response = await fetch(
                `https://api.airtable.com/v0/${airtableBaseID}/${tableName}?filterByFormula={Unique Code}="${codigoUnico}"`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${airtableAPIKey}`,
                    },
                }
            );

            const data = await response.json();
            const recordId = data.records[0]?.id;

            if (recordId) {
                // Actualiza el artículo con el código único encontrado
                const updateResponse = await fetch(
                    `https://api.airtable.com/v0/${airtableBaseID}/${tableName}/${recordId}`,
                    {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${airtableAPIKey}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            fields: {
                                "Estado": "Vendido", // Asume que "Estado" es el nombre del campo en Airtable
                            },
                        }),
                    }
                );

                if (updateResponse.ok) {
                    alert("Artículo marcado como vendido exitosamente.");
                    codigoUnicoVenta.value = ""; // Limpiar campo de entrada
                } else {
                    alert("Hubo un error al actualizar el artículo.");
                }
            } else {
                alert("Artículo no encontrado con ese código único.");
            }
        } catch (error) {
            console.error("Error al marcar como vendido:", error);
            alert("Hubo un error al conectar con Airtable.");
        }
    });
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
function markAsSold() {
    const partCode = document.getElementById('sold-part-code').value;

    airtableRequest(`Piezas?filterByFormula={Código}="${partCode}"`)
        .then(data => {
            if (data.records.length === 0) {
                alert('No se encontró la pieza con este código.');
                return;
            }

            const recordId = data.records[0].id;
            const updatedData = {
                fields: {
                    Estado: 'Vendido',
                },
            };

            airtableRequest(`Piezas/${recordId}`, 'PATCH', updatedData)
                .then(response => {
                    alert('Pieza marcada como vendida.');
                    console.log(response);
                });
        });
}
