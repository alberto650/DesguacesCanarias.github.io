// Variables globales para Airtable y Cloudinary
const AIRTABLE_TOKEN = 'pat0CqCnz8cVVdx9h.1e033105f5a09e95e3a3bb46386b73dd3c9ecdef770448cb23c88295a32676d7'; // Reemplaza con tu token de Airtable
const BASE_ID = 'app9269ZwW1h6smyM'; // Reemplaza con el ID de tu base de Airtable

// Función para generar un código único de manera incremental
function generarCodigoUnico() {
    const prefix = "Q";
    const randomNumber = Math.floor(Math.random() * 10000); // Número aleatorio de 4 cifras
    document.getElementById("codigoUnico").value = `${prefix}${randomNumber}`;
}

document.getElementById("botonSubir").addEventListener("click", async () => {
    const imagenesInput = document.getElementById("imagenes").files;
    const precio = parseFloat(document.getElementById("precio").value);
    const codigoUnico = document.getElementById("codigoUnico").value;
    const referencia = document.getElementById("referencia").value || ""; // Si está vacío, lo deja como cadena vacía
    const estado = document.getElementById("estado").value;

    // Validación sin el campo de referencia
    if (!imagenesInput.length || isNaN(precio) || !codigoUnico || !estado) {
        document.getElementById("mensaje").innerText = "Por favor completa todos los campos correctamente, excepto Referencia, que es opcional.";
        return;
    }

    try {
        const imagenesUrls = [];
        for (const imagen of imagenesInput) {
            const formData = new FormData();
            formData.append("file", imagen);
            formData.append("upload_preset", "desguacescanarias"); // Reemplaza con tu Upload Preset de Cloudinary

            const cloudinaryResponse = await fetch("https://api.cloudinary.com/v1_1/dbthmtjui/image/upload", {
                method: "POST",
                body: formData
            });

            const cloudinaryData = await cloudinaryResponse.json();
            if (cloudinaryData.secure_url) {
                imagenesUrls.push({ url: cloudinaryData.secure_url });
            } else {
                throw new Error("Error al subir una imagen a Cloudinary.");
            }
        }

        const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Inventario%20de%20piezas`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${AIRTABLE_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fields: {
                    Fotos: imagenesUrls,
                    Precio: precio,
                    "Código Único": codigoUnico,
                    Referencia: referencia, // Enviará la referencia si está rellena o una cadena vacía si no
                    Estado: estado
                }
            })
        });

        const airtableData = await response.json();
        if (response.ok) {
            document.getElementById("mensaje").innerText = "Registro creado exitosamente en Airtable.";
        } else {
            throw new Error(`Error al crear el registro en Airtable: ${JSON.stringify(airtableData)}`);
        }
    } catch (error) {
        console.error("Error al procesar la solicitud:", error);
        document.getElementById("mensaje").innerText = `Error: ${error.message}`;
    }
});

document.getElementById("botonVender").addEventListener("click", async () => {
    const codigoUnicoVenta = document.getElementById("codigoUnicoVenta").value;

    if (!codigoUnicoVenta) {
        document.getElementById("mensaje").innerText = "Por favor ingresa el código único de la pieza para marcarla como vendida.";
        return;
    }

    try {
        const searchResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Inventario%20de%20piezas?filterByFormula={Código Único}='${codigoUnicoVenta}'`, {
            headers: {
                Authorization: `Bearer ${AIRTABLE_TOKEN}`
            }
        });

        const searchData = await searchResponse.json();
        if (searchData.records.length === 0) {
            document.getElementById("mensaje").innerText = "No se encontró ninguna pieza con ese código único.";
            return;
        }

        const recordId = searchData.records[0].id;

        const updateResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Inventario%20de%20piezas/${recordId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${AIRTABLE_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fields: {
                    Estado: "Vendido"
                }
            })
        });

        const updateData = await updateResponse.json();
        if (updateResponse.ok) {
            document.getElementById("mensaje").innerText = "Pieza marcada como vendida correctamente.";
        } else {
            throw new Error(`Error al actualizar el registro en Airtable: ${JSON.stringify(updateData)}`);
        }
    } catch (error) {
        console.error("Error al procesar la solicitud:", error);
        document.getElementById("mensaje").innerText = `Error: ${error.message}`;
    }
});
