// =================================================================
// CÓDIGO FINAL Y COMPLETO PARA VERCEL (script.js)
// =================================================================

// ¡MUY IMPORTANTE! Pega aquí la URL de tu Web App de Google Script.
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbymx-wFLaxfykPviuE8fgB0bs2NuvX5Tzijt7kTiYmOtD4pum14jCrBqKc4OWoliEVZaw/exec";

// =================================================================
// FUNCIONES AUXILIARES (del lado del cliente)
// =================================================================
function parseDateStringHelper(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const match = dateString.match(/(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/);
  if (!match) return null;

  const [, day, month, year] = match.map(Number);
  const dateObj = new Date(year, month - 1, day);

  if (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  ) {
    dateObj.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparaciones
    return dateObj;
  }
  return null;
}

// =================================================================
// LÓGICA PRINCIPAL
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const teacherName = params.get("teacher");

  const accordionContainer = document.getElementById("accordion-container");
  const loadingState = document.getElementById("loading-state");

  if (!teacherName) {
    showError(
      "Error: Nombre del docente no especificado.",
      "Por favor, use un link con el formato: ...?teacher=NOMBRE_DEL_DOCENTE"
    );
    return;
  }

  fetchData(teacherName);

  function fetchData(name) {
    fetch(`${SCRIPT_URL}?teacher=${encodeURIComponent(name)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error de red: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          showError("Error desde la API", data.error);
          return;
        }
        renderDashboard(data);
      })
      .catch((error) => {
        console.error("Error al obtener los datos:", error);
        showError(
          "Error de Conexión",
          "No se pudo comunicar con el servidor de datos. Revisa la URL del script y tu conexión a internet."
        );
      });
  }

  function renderDashboard(data) {
    loadingState.style.display = "none";
    document.title = `Cosmic Dashboard - ${data.teacherName}`;
    document.getElementById("teacher-name").textContent = data.teacherName;
    document.getElementById("teacher-avatar").textContent = data.teacherName
      .charAt(0)
      .toUpperCase();

    if (!data.classes || data.classes.length === 0) {
      showNoClasses();
      return;
    }

    const groupedByProgram = data.classes.reduce((acc, cls) => {
      const programKey = cls.programas || "Programa no especificado";
      if (!acc[programKey]) acc[programKey] = [];
      acc[programKey].push(cls);
      return acc;
    }, {});

    renderStats(
      data.classes,
      Object.keys(groupedByProgram).length,
      data.lastUpdated
    );

    for (const programaNombre in groupedByProgram) {
      const programClasses = groupedByProgram[programaNombre];
      const pod = createProgramPod(programaNombre, programClasses);
      accordionContainer.appendChild(pod);
    }

    setupAccordion();
  }

  function createProgramPod(programaNombre, classes) {
    const pod = document.createElement("div");
    pod.className = "program-pod";
    pod.innerHTML = `
            <div class="pod-header">
                <div class="pod-header-info">
                    <i class="fas fa-satellite-dish icon"></i>
                    <span>${programaNombre}</span>
                    <span class="pod-module-count">${
                      classes.length
                    } Módulo(s)</span>
                </div>
                <i class="fas fa-chevron-down pod-chevron"></i>
            </div>
            <div class="pod-content">
                ${classes.map(createModuleCard).join("")}
            </div>
        `;
    return pod;
  }

  function createModuleCard(clase) {
    return `
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
                  clase.fechasModulo && clase.fechasModulo.length > 0
                    ? createTimeline(clase.fechasModulo)
                    : ""
                }
            </div>
        `;
  }

  function createTimeline(fechas) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const listItems = fechas
      .map((fechaStr) => {
        const claseDate = parseDateStringHelper(fechaStr);
        let liClass = "future-date",
          statusText = "Próxima";

        if (claseDate) {
          if (claseDate.getTime() < hoy.getTime()) {
            liClass = "past-date";
            statusText = "Finalizada";
          } else if (claseDate.getTime() === hoy.getTime()) {
            liClass = "today-date";
            statusText = "Hoy";
          }
        } else {
          statusText = "Revisar";
        }

        return `
                <li class="${liClass}">
                    <span class="date-text">${fechaStr}</span>
                    <span class="status-badge">${statusText}</span>
                </li>
            `;
      })
      .join("");

    return `<div class="timeline-container"><ul class="dates-list">${listItems}</ul></div>`;
  }

  function renderStats(classes, programCount, lastUpdated) {
    const moduleCount = classes.length;
    const summaryContainer = document.getElementById("summary-container");
    summaryContainer.innerHTML = `
            <div class="summary-card">
                <div class="summary-info">
                    <div class="value">${programCount}</div>
                    <div class="label">Programas</div>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-info">
                    <div class="value">${moduleCount}</div>
                    <div class="label">Módulos</div>
                </div>
            </div>
        `;

    const updateDate = new Date(lastUpdated);
    document.getElementById(
      "sidebar-footer"
    ).textContent = `Actualizado: ${updateDate.toLocaleString("es-ES")}`;
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

  function showError(title, message) {
    loadingState.style.display = "none";
    accordionContainer.innerHTML = `
            <div style="text-align:center; padding: 40px; background: var(--bg-glass); border-radius: var(--border-radius); border: 1px solid var(--border-glass);">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--accent-warning); margin-bottom: 20px;"></i>
                <h2 style="font-size: 24px; margin-bottom: 10px;">${title}</h2>
                <p style="color: var(--text-secondary);">${message}</p>
            </div>
        `;
  }

  function showNoClasses() {
    accordionContainer.innerHTML = `
            <div style="text-align:center; padding: 40px; background: var(--bg-glass); border-radius: var(--border-radius); border: 1px solid var(--border-glass);">
                <i class="fas fa-rocket" style="font-size: 48px; color: var(--accent-primary); margin-bottom: 20px;"></i>
                <h2 style="font-size: 24px; margin-bottom: 10px;">¡Todo listo para el despegue!</h2>
                <p style="color: var(--text-secondary);">Actualmente no tienes clases o módulos asignados. <br/>Contacta al administrador para recibir tu próxima misión.</p>
            </div>
        `;
  }
});
