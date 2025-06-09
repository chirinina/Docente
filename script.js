// -------------------------------------------------------------------
// CONFIGURACIÓN PRINCIPAL - ¡EDITA ESTA LÍNEA!
// -------------------------------------------------------------------
// Pega aquí la URL de la aplicación web que copiaste de Google Apps Script.
const API_URL =
  "https://script.google.com/macros/s/AKfycbzg-dTwEM8rVzTKmYwL48lfPu0ywn9IvQ88uwXybwdPn-0QNpPOJLnOv5wOwddGuIPndA/exec";
// -------------------------------------------------------------------

// --- FUNCIONES AUXILIARES ---
function parseDateStringHelper(dateStringWithPossibleText) {
  if (
    !dateStringWithPossibleText ||
    typeof dateStringWithPossibleText !== "string"
  )
    return null;
  const match = dateStringWithPossibleText.match(
    /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/
  );
  if (match) {
    const dia = match[1].padStart(2, "0");
    const mes = match[2].padStart(2, "0");
    let anio = match[3];
    if (anio.length === 2) anio = "20" + anio;
    const parts = `${dia}/${mes}/${anio}`.split("/");
    const dateObj = new Date(
      parseInt(parts[2], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[0], 10)
    );
    dateObj.setHours(0, 0, 0, 0); // Normalizar a medianoche
    return dateObj;
  }
  return null;
}

// --- LÓGICA DE LA APLICACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Obtener el nombre del docente de la URL
  const params = new URLSearchParams(window.location.search);
  const teacherName = params.get("teacher");

  if (!teacherName) {
    displayError(
      "No se especificó un nombre de docente en la URL.",
      "Asegúrate de que el link contenga `?teacher=NOMBRE`."
    );
    return;
  }

  // 2. Llamar a la API para obtener los datos
  fetchData(teacherName);
});

async function fetchData(teacherName) {
  const fullUrl = `${API_URL}?teacher=${encodeURIComponent(
    teacherName
  )}&format=json`;

  try {
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Error en la red: ${response.statusText}`);
    }
    const result = await response.json();

    if (result.status === "success") {
      // 3. Renderizar la página con los datos recibidos
      renderPage(result);
    } else {
      throw new Error(
        result.message || "La API devolvió un error desconocido."
      );
    }
  } catch (error) {
    console.error("Error al obtener los datos:", error);
    displayError(
      "No se pudieron cargar los datos.",
      "Revisa la consola para más detalles o contacta al administrador."
    );
  }
}

function renderPage(apiResponse) {
  const { teacher, data: classes, updated } = apiResponse;

  // Actualizar sidebar
  document.getElementById("teacher-name").textContent = teacher;
  document.getElementById("teacher-initial").textContent = teacher
    .charAt(0)
    .toUpperCase();
  const updateDate = new Date(updated);
  document.getElementById(
    "update-time"
  ).textContent = `Actualizado: ${updateDate.toLocaleString("es-ES")}`;

  const accordionContainer = document.getElementById("accordion-container");
  accordionContainer.innerHTML = ""; // Limpiar estado de "Cargando..."

  if (!classes || classes.length === 0) {
    displayNoClasses();
    return;
  }

  // Agrupar clases por programa
  const groupedByProgram = classes.reduce((acc, cls) => {
    const programKey = cls.programas || "Programa no especificado";
    if (!acc[programKey]) {
      acc[programKey] = [];
    }
    acc[programKey].push(cls);
    return acc;
  }, {});

  // Actualizar KPIs
  document.getElementById("module-count").textContent = classes.length;
  document.getElementById("program-count").textContent =
    Object.keys(groupedByProgram).length;

  // Crear HTML para cada programa
  for (const programaNombre in groupedByProgram) {
    const programPod = document.createElement("div");
    programPod.className = "program-pod";

    const modulos = groupedByProgram[programaNombre];
    let podContentHTML = "";

    modulos.forEach((clase) => {
      let datesListHTML = "";
      if (clase.fechasModulo && clase.fechasModulo.length > 0) {
        const hoyDateNormalizada = new Date();
        hoyDateNormalizada.setHours(0, 0, 0, 0);

        clase.fechasModulo.forEach((fechaStr) => {
          let liClass = "future-date",
            statusText = "Próxima";
          const claseDateNormalizada = parseDateStringHelper(fechaStr);

          if (claseDateNormalizada) {
            if (claseDateNormalizada.getTime() < hoyDateNormalizada.getTime()) {
              liClass = "past-date";
              statusText = "Finalizada";
            } else if (
              claseDateNormalizada.getTime() === hoyDateNormalizada.getTime()
            ) {
              liClass = "today-date";
              statusText = "Hoy";
            }
          } else {
            statusText = "Revisar";
          }
          datesListHTML += `<li class="${liClass}"><span class="date-text">${fechaStr}</span><span class="status-badge">${statusText}</span></li>`;
        });
      }

      podContentHTML += `
                <div class="module-card">
                    <h3 class="module-title"><i class="fas fa-book-open"></i>${
                      clase.modulo
                    } (Módulo ${clase.numeros})</h3>
                    <div class="module-details">
                        <div class="detail-item"><i class="fas fa-calendar-day"></i><strong>Días:</strong> ${
                          clase.dias
                        }</div>
                        <div class="detail-item"><i class="fas fa-clock"></i><strong>Horario:</strong> ${
                          clase.hora
                        }</div>
                        <div class="detail-item"><i class="fas fa-file-alt"></i><strong>Origen:</strong> ${
                          clase.hoja
                        } (F:${clase.filaOriginal})</div>
                    </div>
                    ${
                      datesListHTML
                        ? `<div class="timeline-container"><ul class="dates-list">${datesListHTML}</ul></div>`
                        : ""
                    }
                </div>
            `;
    });

    programPod.innerHTML = `
            <div class="pod-header">
                <div class="pod-header-info">
                    <i class="fas fa-satellite-dish icon"></i>
                    <span>${programaNombre}</span>
                    <span class="pod-module-count">${modulos.length} Módulo(s)</span>
                </div>
                <i class="fas fa-chevron-down pod-chevron"></i>
            </div>
            <div class="pod-content">${podContentHTML}</div>
        `;
    accordionContainer.appendChild(programPod);
  }

  // Activar la funcionalidad del acordeón
  setupAccordion();
}

function setupAccordion() {
  const pods = document.querySelectorAll(".program-pod");
  pods.forEach((pod) => {
    const header = pod.querySelector(".pod-header");
    header.addEventListener("click", () => {
      const content = pod.querySelector(".pod-content");
      const isActive = pod.classList.contains("active");

      pods.forEach((p) => {
        if (p !== pod) {
          p.classList.remove("active");
          p.querySelector(".pod-content").style.maxHeight = null;
        }
      });

      if (!isActive) {
        pod.classList.add("active");
        content.style.maxHeight = content.scrollHeight + "px";
      } else {
        pod.classList.remove("active");
        content.style.maxHeight = null;
      }
    });
  });

  const firstPod = document.querySelector(".program-pod");
  if (firstPod) {
    firstPod.classList.add("active");
    const firstContent = firstPod.querySelector(".pod-content");
    setTimeout(() => {
      firstContent.style.maxHeight = firstContent.scrollHeight + "px";
    }, 100);
  }
}

function displayError(title, message) {
  const container = document.getElementById("accordion-container");
  container.innerHTML = `
        <div class="fade-in-stagger" style="text-align:center; padding: 40px; background: var(--bg-glass); border-radius: var(--border-radius); border: 1px solid var(--border-glass);">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 20px;"></i>
            <h2 style="font-size: 24px; margin-bottom: 10px;">${title}</h2>
            <p style="color: var(--text-secondary);">${message}</p>
        </div>`;
}

function displayNoClasses() {
  const container = document.getElementById("accordion-container");
  container.innerHTML = `
        <div class="fade-in-stagger" style="text-align:center; padding: 40px; background: var(--bg-glass); border-radius: var(--border-radius); border: 1px solid var(--border-glass);">
            <i class="fas fa-rocket" style="font-size: 48px; color: var(--accent-primary); margin-bottom: 20px;"></i>
            <h2 style="font-size: 24px; margin-bottom: 10px;">¡Todo listo para el despegue!</h2>
            <p style="color: var(--text-secondary);">Actualmente no tienes clases o módulos asignados.<br/>Contacta al administrador para recibir tu próxima misión.</p>
        </div>`;
}
