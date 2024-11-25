// Función para abrir el Sidebar
function openSidebar() {
    document.getElementById("sidebar").style.left = "0";
    document.querySelector(".main-content").classList.add("shifted");
}

// Función para cerrar el Sidebar
function closeSidebar() {
    document.getElementById("sidebar").style.left = "-250px";
    document.querySelector(".main-content").classList.remove("shifted");
}

// Función para alternar la visibilidad de una sección
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = section.style.display === "none" || !section.style.display ? "block" : "none";
    } else {
        console.error(`Sección no encontrada: ${sectionId}`);
    }
}

// Función para actualizar las subcategorías basadas en la categoría seleccionada
function updateSubcategories() {
    const category = document.getElementById("part-category").value;
    const subcategorySelect = document.getElementById("part-subcategory");

    const subcategories = {
        "Motor": ["Motor", "Bomba de Aceite", "Culata", "Alternador"],
        "Transmisión": ["Caja de Cambios", "Embrague", "Frenos de Transmisión"],
        "Suspensión y Dirección": ["Amortiguadores", "Barras Estabilizadoras", "Pivotes"],
        "Sistema de Frenos": ["Disco de Freno", "Pastillas de Freno", "Tambores"],
        "Sistema de Escape": ["Catalizador", "Silenciador", "Tubo de Escape"],
        "Electrónica y Electricidad": ["Alternador", "Motor de Arranque", "Batería", "Faros"],
        "Interior del Vehículo": ["Asientos", "Tablero de Instrumentos", "Volante"],
        "Exterior del Vehículo": ["Espejos", "Puertas", "Faros", "Parachoques"],
        "Neumáticos y Llantas": ["Neumático", "Rim de Llanta"],
        "Sistema de Refrigeración": ["Radiador", "Ventilador", "Bomba de Agua"]
    };

    // Limpiar las subcategorías actuales
    subcategorySelect.innerHTML = "<option value=''>Seleccione una Subcategoría</option>";

    if (subcategories[category]) {
        subcategories[category].forEach(subcategory => {
            const option = document.createElement("option");
            option.value = subcategory;
            option.textContent = subcategory;
            subcategorySelect.appendChild(option);
        });
    }
}

// Función para generar un código único aleatorio de 4 caracteres (solo números y letras mayúsculas)
function generateUniqueCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    document.getElementById("part-unique-code").value = code;
}

// Función para subir imágenes a Cloudinary
async function uploadImagesToCloudinary(imagesInput) {
    const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dbthmtjui/image/upload";
    const uploadPreset = "desguacescanarias";
    const urls = []; // Array para guardar las URLs subidas

    for (const file of imagesInput) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        try {
            const response = await fetch(cloudinaryUrl, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.secure_url) {
                urls.push(data.secure_url); // Añadimos la URL de la imagen subida
            } else {
                throw new Error("Error al subir una imagen a Cloudinary.");
            }
        } catch (error) {
            console.error("Error subiendo a Cloudinary:", error);
            alert("Hubo un error al subir las imágenes.");
        }
    }

    return urls; // Retornamos las URLs subidas
}

// Función para manejar solicitudes a la API de Airtable
async function airtableRequest(endpoint, method = "GET", body = null) {
    const apiKey = localStorage.getItem("airtableApiKey");
    const baseId = localStorage.getItem("airtableBaseId");

    if (!apiKey || !baseId) {
        alert("Configura la API Key y Base ID en la página de Configuración.");
        throw new Error("Faltan credenciales de Airtable.");
    }

    const url = `https://api.airtable.com/v0/${baseId}/${endpoint}`;
    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };

    const options = { method, headers };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || "Error en la solicitud a Airtable.");
    }

    return response.json();
}

// Función para registrar un coche nuevo
async function registerVehicle() {
    const imagesInput = document.getElementById("vehicle-images").files;
    const brand = document.getElementById("vehicle-make").value.trim();
    const model = document.getElementById("vehicle-model").value.trim();
    const year = document.getElementById("vehicle-year").value.trim();
    const mileage = document.getElementById("vehicle-mileage").value.trim();

    

    // Validaciones
    if (!brand || !model || !year) {
        alert("Por favor, completa todos los campos obligatorios (Marca, Modelo, Año, Kilometraje).");
        return;
    }
    if (!imagesInput.length) {
        alert("Por favor, sube al menos una imagen del vehículo.");
        return;
    }

    try {
        // Subimos las imágenes a Cloudinary
        const uploadedImages = await uploadImagesToCloudinary(imagesInput);

        if (uploadedImages.length === 0) {
            alert("No se pudo subir ninguna imagen. Por favor, inténtalo de nuevo.");
            return;
        }

        // Preparar los datos para Airtable
        const vehicleData = {
            fields: {
                Marca: brand,
                Modelo: model,
                Año: parseInt(year, 10),
                Kilometraje: parseInt(mileage, 10),
                Imágenes: uploadedImages.map(url => ({ url })), // Formato correcto para Airtable
            },
        };

        // Enviar los datos a Airtable
        const response = await airtableRequest("Vehículos", "POST", vehicleData);

        // Verificar la respuesta
        if (response.id) {
            alert("Vehículo registrado con éxito.");
            console.log("Vehículo registrado:", response);
            // Limpiar el formulario
            document.getElementById("vehicle-form").reset(); // Asegúrate de usar el id correcto aquí
        } else {
            console.error("Error inesperado al registrar el vehículo:", response);
            alert("Hubo un problema al registrar el vehículo. Revisa los datos y vuelve a intentarlo.");
        }
    } catch (error) {
        console.error("Error al registrar el vehículo:", error);
        alert("Ocurrió un error al registrar el vehículo. Por favor, verifica los datos e inténtalo de nuevo.");
    }
}

// Función para registrar una pieza
async function sendPartToAirtable() {
    const imagesInput = document.getElementById("part-images").files;
    const vehicleId = document.getElementById("vehicle-select").value;

    if (!vehicleId) {
        alert("Selecciona un vehículo.");
        return;
    }

    try {
        // Subimos las imágenes a Cloudinary
        const uploadedImages = await uploadImagesToCloudinary(imagesInput);

        // Preparamos los datos para Airtable
        const partData = {
            fields: {
                Vehículo: [vehicleId],
                Categoría: document.getElementById("part-category").value,
                Subcategoría: document.getElementById("part-subcategory").value,
                Código: document.getElementById("part-unique-code").value,
                Precio: parseFloat(document.getElementById("part-price").value),
                Descripción: document.getElementById("part-description").value,
                Referencia: document.getElementById("part-reference").value,
                Imágenes: uploadedImages.map(url => ({ url })), // Formato de Airtable para imágenes
            }
        };

        // Enviamos los datos a Airtable
        const response = await airtableRequest("Piezas", "POST", partData);

        if (response.id) {
            alert("Pieza registrada con éxito.");
            console.log("Pieza añadida:", response);
        } else {
            alert("Hubo un problema al registrar la pieza.");
        }
    } catch (error) {
        console.error("Error al registrar la pieza:", error);
        alert("Ocurrió un error. Revisa los datos y vuelve a intentarlo.");
    }
}

// Cargar los vehículos desde Airtable
function loadVehicles() {
    airtableRequest("Vehículos")
        .then(data => {
            const vehicleSelect = document.getElementById("vehicle-select");
            vehicleSelect.innerHTML = "<option value=''>Seleccione un Vehículo</option>";

            data.records.forEach(record => {
                const option = document.createElement("option");
                option.value = record.id;
                option.textContent = `${record.fields.Marca} ${record.fields.Modelo} (${record.fields.Año})`;
                vehicleSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error al cargar vehículos:", error);
            alert("No se pudo cargar la lista de vehículos.");
        });
}


// Inicializar al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    loadVehicles();
});
