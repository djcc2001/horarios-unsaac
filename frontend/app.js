const API = "";

const DIAS_ORDER = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const HORAS = Array.from({length: 14}, (_, i) => i + 7); // 7:00–20:00

const PALETA = [
  { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", label: "blue"   },
  { color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", label: "purple" },
  { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", label: "green"  },
  { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "orange" },
  { color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8", label: "pink"   },
  { color: "#06b6d4", bg: "#ecfeff", border: "#a5f3fc", label: "cyan"   },
  { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", label: "red"    },
  { color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", label: "indigo" },
  { color: "#14b8a6", bg: "#f0fdfa", border: "#99f6e4", label: "teal"   },
  { color: "#84cc16", bg: "#f7fee7", border: "#d9f99d", label: "lime"   },
];

async function cargarCarreras() {
  try {
    const res = await fetch(`${API}/api/carreras`);
    const data = await res.json();
    const sel = document.getElementById("carrera");
    sel.innerHTML = data.map(c =>
      `<option value="${c.cp}">${c.cp} · ${c.nombre}</option>`
    ).join("");
    const inOpt = [...sel.options].find(o => o.value === "IN");
    if (inOpt) inOpt.selected = true;
  } catch {
    document.getElementById("carrera").innerHTML = '<option value="IN">IN · INFORMÁTICA</option>';
  }
}

async function cargarSemestre() {
  try {
    const res = await fetch(`${API}/api/semestre`);
    const data = await res.json();
    document.getElementById("semestre-text").textContent = data.semestre;
    document.getElementById("footer-sem").textContent = data.semestre;
  } catch {}
}

async function buscar() {
  const codigo  = document.getElementById("codigo").value.trim();
  const carrera = document.getElementById("carrera").value.trim();
  const semestre = document.getElementById("semestre").value.trim();

  const errEl = document.getElementById("error-msg");
  errEl.classList.add("hidden");

  if (!codigo)  { mostrarError("Ingresa un código de alumno."); return; }
  if (!carrera) { mostrarError("Selecciona una carrera."); return; }

  document.getElementById("resultados").classList.add("hidden");
  document.getElementById("loader").classList.remove("hidden");
  document.getElementById("btn-buscar").disabled = true;

  let count = 0;
  const cEl = document.getElementById("loader-count");
  const iv = setInterval(() => { count += Math.floor(Math.random()*7)+2; cEl.textContent = count; }, 100);

  try {
    const url = semestre
      ? `${API}/api/buscar/${codigo}/${carrera}?semestre=${semestre}`
      : `${API}/api/buscar/${codigo}/${carrera}`;
    const res = await fetch(url);
    clearInterval(iv);

    if (res.status === 404) { mostrarError("Alumno no encontrado."); return; }
    if (!res.ok) { const e = await res.json(); mostrarError(e.detail || "Error."); return; }

    const data = await res.json();
    renderResultados(data, codigo);
  } catch {
    clearInterval(iv);
    mostrarError("No se pudo conectar al servidor.");
  } finally {
    document.getElementById("loader").classList.add("hidden");
    document.getElementById("btn-buscar").disabled = false;
  }
}

function mostrarError(msg) {
  document.getElementById("loader").classList.add("hidden");
  document.getElementById("btn-buscar").disabled = false;
  const el = document.getElementById("error-msg");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function renderResultados(data, codigoAlumno) {
  const { alumno, semestre, cursos } = data;

  // Avatar con iniciales
  const partes = alumno.split("-");
  const iniciales = (partes[0]?.[0] || "") + (partes[2]?.[0] || "");
  document.getElementById("alumno-avatar").textContent = iniciales.toUpperCase();

  document.getElementById("alumno-nombre").textContent = formatNombre(alumno);
  document.getElementById("chip-codigo").textContent = `Código: ${codigoAlumno}`;
  document.getElementById("chip-semestre").textContent = `Semestre: ${semestre}`;
  document.getElementById("chip-ncursos").textContent = `${cursos.length} curso${cursos.length!==1?"s":""}`;

  cursos.forEach((c, i) => { c._p = PALETA[i % PALETA.length]; });

  const { mapa, cruces } = detectarCruces(cursos);

  // Alerta cruces
  const alertEl = document.getElementById("cruce-alert");
  if (cruces.length) {
    alertEl.classList.remove("hidden");
    document.getElementById("cruce-text").innerHTML =
      `<strong>Cruce de horarios detectado:</strong><br>` +
      cruces.map(par => `· ${par[0]} ↔ ${par[1]}`).join("<br>");
  } else {
    alertEl.classList.add("hidden");
  }

  renderHorario(cursos, mapa);
  renderCursos(cursos);

  document.getElementById("resultados").classList.remove("hidden");
  setTimeout(() => {
    document.getElementById("resultados").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

function formatNombre(nombre) {
  return nombre.split("-").map(p =>
    p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
  ).join(" ");
}

function parsearHoras(str) {
  const p = str.split(" - ");
  return [parseInt(p[0]), parseInt(p[1])];
}

function detectarCruces(cursos) {
  const mapa = {};
  const crucesSet = new Set();
  const cruces = [];

  cursos.forEach(curso => {
    curso.horarios.forEach(h => {
      const [hi, hf] = parsearHoras(h.hora);
      for (let hr = hi; hr < hf; hr++) {
        const key = `${h.dia}-${hr}`;
        if (!mapa[key]) mapa[key] = [];
        mapa[key].push({ curso, h });
      }
    });
  });

  Object.values(mapa).forEach(ocupantes => {
    if (ocupantes.length > 1) {
      const cods = [...new Set(ocupantes.map(o => o.curso.cod_asignatura))];
      if (cods.length > 1) {
        const k = cods.sort().join("|");
        if (!crucesSet.has(k)) {
          crucesSet.add(k);
          const nombres = cods.map(cod =>
            ocupantes.find(o => o.curso.cod_asignatura === cod).curso.nombre
          );
          cruces.push(nombres);
        }
      }
    }
  });

  return { mapa, cruces };
}

function renderHorario(cursos, mapa) {
  const tbody = document.getElementById("horario-body");
  tbody.innerHTML = "";

  HORAS.forEach(hora => {
    const tr = document.createElement("tr");

    // hora
    const tdH = document.createElement("td");
    tdH.className = "hora-td";
    tdH.textContent = `${hora}:00`;
    tr.appendChild(tdH);

    DIAS_ORDER.forEach(dia => {
      const td = document.createElement("td");
      const key = `${dia}-${hora}`;
      const ocupantes = mapa[key] || [];

      if (ocupantes.length > 1) {
        td.classList.add("cruce-td");
        ocupantes.forEach(({ curso, h }) => td.appendChild(crearPill(curso, h)));
      } else if (ocupantes.length === 1) {
        const { curso, h } = ocupantes[0];
        td.appendChild(crearPill(curso, h));
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function crearPill(curso, h) {
  const p = curso._p;
  const div = document.createElement("div");
  div.className = "curso-pill";
  div.style.background = p.bg;
  div.style.color = p.color;
  div.style.borderLeft = `2.5px solid ${p.color}`;

  const nombreCorto = curso.nombre.length > 22
    ? curso.nombre.substring(0, 22) + "…"
    : curso.nombre;

  div.innerHTML = `
    <div class="pill-nombre">${nombreCorto}</div>
    <div class="pill-meta">
      <span class="pill-tag">${h.tipo}</span>
      <span>${h.aula}</span>
    </div>
  `;
  div.title = `${curso.nombre}\n${h.tipo} · ${h.aula}\n${h.hora}`;
  return div;
}

function renderCursos(cursos) {
  const grid = document.getElementById("cursos-grid");
  grid.innerHTML = "";

  cursos.forEach((curso, i) => {
    const p = curso._p;
    const card = document.createElement("div");
    card.className = "curso-card";
    card.style.setProperty("--card-color", p.color);
    card.querySelector = () => {};

    // barra top de color
    card.style.cssText = `--c: ${p.color}`;

    const horariosHTML = curso.horarios.map(h => `
      <div class="cc-horario-row">
        <span class="cc-horario-dot" style="background:${p.color}"></span>
        <span>${h.dia} · ${h.hora}</span>
        <span class="cc-horario-tipo" style="background:${p.bg};color:${p.color}">${h.tipo}</span>
        <span style="color:var(--text3)">${h.aula}</span>
      </div>
    `).join("");

    card.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${p.color};border-radius:${getComputedStyle(document.documentElement).getPropertyValue('--radius')} ${getComputedStyle(document.documentElement).getPropertyValue('--radius')} 0 0"></div>
      <div class="cc-top">
        <span class="cc-cod" style="background:${p.bg};color:${p.color};border:1px solid ${p.border}">${curso.cod_asignatura}</span>
      </div>
      <div class="cc-nombre">${curso.nombre}</div>
      <div class="cc-docente">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ${curso.docente || "Docente no asignado"}
      </div>
      <div class="cc-horarios">${horariosHTML}</div>
    `;

    // entrada animada
    card.style.animationDelay = `${i * 0.05}s`;
    card.style.animation = "fadeUp .4s ease both";

    grid.appendChild(card);
  });
}

// Enter para buscar
document.addEventListener("keydown", e => { if (e.key === "Enter") buscar(); });

cargarCarreras();
cargarSemestre();