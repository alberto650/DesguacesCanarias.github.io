// Función para abrir el modal de configuración
function abrirModal() {
    document.getElementById("modalConfiguracion").style.display = "block";
}

// Función para cerrar el modal de configuración
function cerrarModal() {
    document.getElementById("modalConfiguracion").style.display = "none";
}

// Cerrar el modal si el usuario hace clic fuera de él
window.onclick = function (event) {
    const modal = document.getElementById("modalConfiguracion");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// Función para guardar la configuración de API Key y Base ID en el almacenamiento local
function guardarConfiguracion() {
    const apiKey = document.getElementById("apiKey").value;
    const baseId = document.getElementById("baseId").value;

    if (apiKey && baseId) {
        localStorage.setItem("airtableApiKey", apiKey);
        localStorage.setItem("airtableBaseId", baseId);
        alert("Configuración guardada exitosamente.");
        cerrarModal(); // Cerrar el modal después de guardar
    } else {
        alert("Por favor, ingresa la API Key y el Base ID.");
    }
}

// Función para cargar la configuración desde el almacenamiento local
function cargarConfiguracion() {
    const apiKey = localStorage.getItem("airtableApiKey");
    const baseId = localStorage.getItem("airtableBaseId");

    if (apiKey && baseId) {
        document.getElementById("apiKey").value = apiKey;
        document.getElementById("baseId").value = baseId;
        return { apiKey, baseId };
    } else {
        return null;
    }
}

// Función para inicializar la configuración al cargar la página
function inicializar() {
    const configuracion = cargarConfiguracion();
    if (!configuracion) {
        abrirModal(); // Mostrar el modal si no está configurada la API Key y Base ID
    }
}

// Inicializar al cargar la página
window.onload = inicializar;

// Función para generar un código único
async function generarCodigoUnico() {
    const configuracion = cargarConfiguracion();
    if (!configuracion) return;

    const apiKey = configuracion.apiKey;
    const baseId = configuracion.baseId;
    const url = `https://api.airtable.com/v0/${baseId}/Inventario%20de%20piezas`;
    const headers = {
        Authorization: `Bearer ${apiKey}`
    };

    let codigoUnico;
    let codigoValido = false;

    // Intentar hasta encontrar un código único
    while (!codigoValido) {
        codigoUnico = "Q" + Math.floor(1000 + Math.random() * 9000); // Generar código único aleatorio
        const response = await fetch(`${url}?filterByFormula={Código Único}='${codigoUnico}'`, { headers });
        const data = await response.json();

        // Si el código no existe en Airtable, es válido
        if (data.records.length === 0) {
            codigoValido = true;
        }
    }

    document.getElementById("codigoUnico").value = codigoUnico; // Mostrar el código en el campo
}

// Manejo de subcategorías dinámicas
document.getElementById("categoria").addEventListener("change", function () {
    const categorias = {
        
            "Motor": ["Motores completos", "Culatas", "Turbos", "Inyectores", "Bujías y calentadores"],
            "Sistema de Transmisión": ["Cajas de cambio", "Embragues", "Ejes y transmisiones"],
            "Suspensión y Dirección": ["Amortiguadores", "Barras estabilizadoras", "Manguetas", "Cremalleras de dirección"],
            "Sistema de Frenos": ["Pastillas y discos", "Pinzas de freno", "Bombas de freno", "ABS y sensores"],
            "Sistema de Escape": ["Catalizadores", "Filtros de partículas (FAP)", "Silenciadores"],
            "Electrónica y Electricidad": ["Alternadores", "Motores de arranque", "Baterías", "Sensores (velocidad, temperatura, etc.)"],
            "Interior del Vehículo": ["Volantes", "Asientos", "Consolas centrales", "Paneles de puertas"],
            "Exterior del Vehículo": ["Paragolpes", "Faros y pilotos", "Retrovisores", "Puertas y capós"],
            "Neumáticos y Llantas": ["Neumáticos", "Llantas"],
            "Sistema de Refrigeración": ["Radiadores", "Ventiladores", "Bombas de agua"]
        
        
    };
    const subcategoria = document.getElementById("subcategoria");
    const selectedCategoria = this.value;

    subcategoria.innerHTML = "<option value=''>Seleccionar Subcategoría</option>";
    subcategoria.disabled = true;

    if (categorias[selectedCategoria]) {
        categorias[selectedCategoria].forEach(subcat => {
            const option = document.createElement("option");
            option.value = subcat;
            option.textContent = subcat;
            subcategoria.appendChild(option);
        });
        subcategoria.disabled = false;
    }
});

// Función para subir un artículo nuevo con fotos, precio y detalles a Airtable
document.getElementById("botonSubir").addEventListener("click", async () => {
    const configuracion = cargarConfiguracion();
    if (!configuracion) return;

    const apiKey = configuracion.apiKey;
    const baseId = configuracion.baseId;
    const url = `https://api.airtable.com/v0/${baseId}/Inventario%20de%20piezas`;
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    };

    const imagenesInput = document.getElementById("imagenes").files;
    const precio = parseFloat(document.getElementById("precio").value);
    const categoria = document.getElementById("categoria").value;
    const subcategoria = document.getElementById("subcategoria").value;
    const codigoUnico = document.getElementById("codigoUnico").value;
    const referencia = document.getElementById("referencia").value || "";
    const descripcion = document.getElementById("descripcion").value;
    const estado = "Disponible";

    // Validar Categoría y Subcategoría
    if (!categoria) {
        alert("Por favor, selecciona una categoría.");
        return;
    }
    if (!subcategoria) {
        alert("Por favor, selecciona una subcategoría.");
        return;
    }

    try {
        const imagenesUrls = [];
        for (const imagen of imagenesInput) {
            const formData = new FormData();
            formData.append("file", imagen);
            formData.append("upload_preset", "desguacescanarias"); // Configura tu preset en Cloudinary

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

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                fields: {
                    Fotos: imagenesUrls,
                    Precio: precio,
                    Categoría: categoria, // Enviar Categoría
                    Subcategoría: subcategoria, // Enviar Subcategoría
                    "Código Único": codigoUnico,
                    Referencia: referencia,
                    Descripción: descripcion,
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

// Función para marcar un artículo como vendido
document.getElementById("botonVender").addEventListener("click", async () => {
    const configuracion = cargarConfiguracion();
    if (!configuracion) return;

    const apiKey = configuracion.apiKey;
    const baseId = configuracion.baseId;
    const url = `https://api.airtable.com/v0/${baseId}/Inventario%20de%20piezas`;

    const codigoUnico = document.getElementById("codigoUnicoVenta").value;
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    };

    try {
        const response = await fetch(`${url}?filterByFormula={Código Único}='${codigoUnico}'`, { headers });
        const data = await response.json();
        if (data.records && data.records.length > 0) {
            const recordId = data.records[0].id;

            const updateResponse = await fetch(`${url}/${recordId}`, {
                method: "PATCH",
                headers: headers,
                body: JSON.stringify({ fields: { Estado: "Vendido" } })
            });

            if (updateResponse.ok) {
                document.getElementById("mensaje").innerText = "La pieza se ha marcado como vendida.";
            } else {
                throw new Error("Error al actualizar el estado de la pieza.");
            }
        } else {
            throw new Error("Pieza no encontrada con el código único proporcionado.");
        }
    } catch (error) {
        console.error("Error al marcar la pieza como vendida:", error);
        document.getElementById("mensaje").innerText = `Error: ${error.message}`;
    }
});
