/* ==========================================
   FRISO DIGITAL
   Navegación horizontal
========================================== */

const intro = document.getElementById("intro");
const frieze = document.getElementById("frieze");
const track = document.getElementById("track");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const homeButton = document.getElementById("homeButton");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

const pageNumber = document.getElementById("pageNumber");
const sectionName = document.getElementById("sectionName");
const progressFill = document.getElementById("progressFill");
const progressDots = document.getElementById("progressDots");
const panels = [...document.querySelectorAll(".panel")];
const totalPanels = panels.length;

let currentIndex = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartScroll = 0;
let dragMoved = false;
let suppressClick = false;
let scrollTimeout;

const sectionNames = [
    "Introducción",
    "Contexto histórico",
    "Evolución",
    "Objetivos",
    "Resultados",
    "Derechos humanos",
    "Cuadro comparativo",
    "Reflexión final"
];

/* ==========================================
   UTILIDADES DE NAVEGACIÓN
========================================== */

function getClosestPanelIndex() {
    if (!panels.length) return 0;

    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    panels.forEach((panel, index) => {
        const rect = panel.getBoundingClientRect();
        const panelCenter = rect.left + rect.width / 2;
        const distance = Math.abs(trackCenter - panelCenter);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });

    return closestIndex;
}

function goToPanel(index, behavior = "smooth") {
    const targetIndex = Math.max(0, Math.min(index, totalPanels - 1));
    const targetPanel = panels[targetIndex];
    if (!targetPanel) return;

    currentIndex = targetIndex;
    const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : behavior;
    track.scrollTo({ left: targetPanel.offsetLeft, behavior: scrollBehavior });
    updateInterface();
}

function nextPanel() {
    if (currentIndex < totalPanels - 1) goToPanel(currentIndex + 1);
}

function previousPanel() {
    if (currentIndex > 0) goToPanel(currentIndex - 1);
}

function startFrieze() {
    intro.classList.add("hidden");
    frieze.classList.add("visible");
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
    track.scrollTo({ left: 0, behavior });
    currentIndex = 0;
    updateInterface();
}

/* ==========================================
   INTERFAZ / PROGRESO
========================================== */

function updateCurrentPanel() {
    currentIndex = getClosestPanelIndex();
    updateInterface();
}

function updateInterface() {
    const currentPage = currentIndex + 1;

    pageNumber.textContent = `${String(currentPage).padStart(2, "0")} / ${String(totalPanels).padStart(2, "0")}`;
    sectionName.textContent = sectionNames[currentIndex] || "Friso digital";
    progressFill.style.width = `${(currentPage / totalPanels) * 100}%`;

    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === totalPanels - 1;

    updateDots();
}

function createDots() {
    progressDots.innerHTML = "";

    panels.forEach((panel, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "progress-dot";
        dot.setAttribute("aria-label", `Ir al panel ${index + 1}: ${sectionNames[index] || "Panel"}`);
        dot.setAttribute("aria-current", index === currentIndex ? "step" : "false");
        dot.addEventListener("click", () => goToPanel(index));
        progressDots.appendChild(dot);
    });
}

function updateDots() {
    const dots = progressDots.querySelectorAll(".progress-dot");

    dots.forEach((dot, index) => {
        const isActive = index === currentIndex;
        dot.classList.toggle("active", isActive);
        dot.setAttribute("aria-current", isActive ? "step" : "false");
    });
}

/* ==========================================
   TECLADO
========================================== */

document.addEventListener("keydown", (event) => {
    if (!frieze.classList.contains("visible")) {
        if (event.key === "Enter") startFrieze();
        return;
    }

    const target = event.target;
    if (target.matches("input, textarea, select") || target.isContentEditable) return;

    switch (event.key) {
        case "ArrowRight":
            event.preventDefault();
            nextPanel();
            break;
        case "ArrowLeft":
            event.preventDefault();
            previousPanel();
            break;
        case "Home":
            event.preventDefault();
            goToPanel(0);
            break;
        case "End":
            event.preventDefault();
            goToPanel(totalPanels - 1);
            break;
    }
});

/* ==========================================
   BOTONES
========================================== */

startButton.addEventListener("click", startFrieze);
prevButton.addEventListener("click", previousPanel);
nextButton.addEventListener("click", nextPanel);

homeButton.addEventListener("click", (event) => {
    event.preventDefault();
    goToPanel(0);
});

restartButton.addEventListener("click", () => goToPanel(0));

/* ==========================================
   SCROLL NATIVO / TRACKPAD
========================================== */

track.addEventListener("scroll", () => {
    window.clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(updateCurrentPanel, 70);
}, { passive: true });

track.addEventListener("wheel", (event) => {
    if (isDragging || !event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();
    track.scrollLeft += event.deltaY;
}, { passive: false });

/* ==========================================
   DRAG-TO-SCROLL CON MOUSE
========================================== */

track.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest("button, a, input, textarea, select, [contenteditable='true']")) return;

    isDragging = true;
    dragMoved = false;
    dragStartX = event.clientX;
    dragStartScroll = track.scrollLeft;

    track.classList.add("dragging", "is-dragging-manual");
});

window.addEventListener("mousemove", (event) => {
    if (!isDragging) return;

    const distance = event.clientX - dragStartX;
    if (Math.abs(distance) > 5) dragMoved = true;

    if (dragMoved) {
        event.preventDefault();
        track.scrollLeft = dragStartScroll - distance;
    }
});

function finishDragging() {
    if (!isDragging) return;

    isDragging = false;
    track.classList.remove("dragging", "is-dragging-manual");

    if (dragMoved) {
        suppressClick = true;
        const closestIndex = getClosestPanelIndex();
        goToPanel(closestIndex, "smooth");

        // El click sintetizado tras mouseup se suprime; limpiar después de ese ciclo.
        window.setTimeout(() => {
            suppressClick = false;
            dragMoved = false;
        }, 0);
    }
}

window.addEventListener("mouseup", finishDragging);
window.addEventListener("blur", finishDragging);

track.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
}, true);

/* ==========================================
   RESIZE: MANTENER PANEL ACTUAL
========================================== */

let resizeTimeout;
window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
        // Recalcular offsetLeft después de que el layout termine de cambiar.
        goToPanel(currentIndex, "auto");
    }, 80);
});

/* ==========================================
   INICIALIZACIÓN
========================================== */

createDots();
updateInterface();
