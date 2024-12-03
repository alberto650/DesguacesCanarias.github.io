document.addEventListener("DOMContentLoaded", () => {
    // Sidebar - Funciones para abrir y cerrar
    window.openSidebar = () => {
        document.getElementById("sidebar").style.width = "250px";
    };

    window.closeSidebar = () => {
        document.getElementById("sidebar").style.width = "0";
    };

    const botonVender = document.getElementById("botonVender");
    const codigoUnicoVenta = document.getElementById("codigoUnicoVenta");

    // Manejador para marcar como vendido
    botonVender.addEventListener("click", async () => {
        const codigoUnico = codigoUnicoVenta.value.trim();

        if (!codigoUnico) {
            alert("Por favor, ingresa un código único.");
            return;
        }

        try {
            await markAsSold(codigoUnico);
            alert("Artículo marcado como vendido exitosamente.");
            codigoUnicoVenta.value = ""; // Limpiar el campo de entrada
        } catch (error) {
            console.error("Error al marcar como vendido:", error);
            alert("Ocurrió un error al marcar el artículo como vendido. Verifica la consola para más detalles.");
        }
    });
});

// Función genérica para realizar solicitudes a Airtable
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

// Función para marcar un artículo como vendido
async function markAsSold(partCode) {
    // Buscar el artículo por su código único
    const response = await airtableRequest(`Piezas?filterByFormula={Código}="${partCode}"`);

    if (!response.records || response.records.length === 0) {
        throw new Error("No se encontró ninguna pieza con ese código.");
    }

    const recordId = response.records[0].id;

    // Actualizar el estado de la pieza a "Vendido"
    const updatedData = { fields: { Estado: "Vendido" } };
    const updateResponse = await airtableRequest(`Piezas/${recordId}`, "PATCH", updatedData);

    if (!updateResponse.id) {
        throw new Error("Hubo un problema al actualizar el estado de la pieza.");
    }
}
