// Número de WhatsApp en formato internacional, sin + ni espacios.
const WHATSAPP = "5491166651037";

const PRECIOS = {
  alcohol: { nombre: "Barra completa con alcohol", corto: "barra con alcohol", porPersona: 22900, minimo: 30 },
  sin: { nombre: "Barra completa sin alcohol", corto: "barra sin alcohol", porPersona: 12900 },
  barman: { nombre: "Servicio de barman", corto: "servicio de barman", porBarman: 120000 },
};

const pesos = (n) => "$" + n.toLocaleString("es-AR");

function calcular(servicio, invitados) {
  if (!invitados || invitados < 1) return null;
  const p = PRECIOS[servicio];
  if (servicio === "barman") {
    const barmans = Math.max(1, Math.ceil(invitados / 30));
    return { monto: barmans * p.porBarman, texto: `${barmans} barman${barmans > 1 ? "s" : ""} para ${invitados} invitados, 6 horas` };
  }
  const personas = p.minimo ? Math.max(invitados, p.minimo) : invitados;
  let texto = `${personas} personas × ${pesos(p.porPersona)}`;
  if (p.minimo && invitados < p.minimo) texto += ` (mínimo ${p.minimo})`;
  return { monto: personas * p.porPersona, texto };
}

// Estado compartido entre la calculadora y el formulario
const form = document.getElementById("form-reserva");
const rango = document.getElementById("calc-invitados");
const rangoNum = document.getElementById("calc-invitados-num");
const calcTotal = document.getElementById("calc-total");
const calcDetalle = document.getElementById("calc-detalle");
const radios = document.querySelectorAll('input[name="calc-servicio"]');

const estado = { servicio: "alcohol", invitados: 60 };

function pintar(origen) {
  const { servicio, invitados } = estado;
  if (origen !== "calc") {
    radios.forEach((r) => (r.checked = r.value === servicio));
    const enRango = Math.min(Math.max(invitados || 10, +rango.min), +rango.max);
    rango.value = enRango;
  }
  if (origen !== "form") {
    form.servicio.value = servicio;
    form.invitados.value = invitados;
  }
  rangoNum.textContent = invitados || "—";
  const r = calcular(servicio, invitados);
  calcTotal.textContent = r ? pesos(r.monto) : "—";
  calcDetalle.textContent = r ? r.texto : "Indicá la cantidad de invitados.";
}

radios.forEach((r) => r.addEventListener("change", () => { estado.servicio = r.value; pintar("calc"); }));
rango.addEventListener("input", () => { estado.invitados = +rango.value; pintar("calc"); });
form.addEventListener("input", (e) => {
  if (e.target.name === "servicio") estado.servicio = e.target.value;
  if (e.target.name === "invitados") estado.invitados = parseInt(e.target.value, 10) || 0;
  if (e.target.name === "servicio" || e.target.name === "invitados") pintar("form");
  if (e.target.value.trim()) e.target.removeAttribute("aria-invalid");
});
document.getElementById("calc-reservar").addEventListener("click", () => {
  setTimeout(() => form.fecha.focus({ preventScroll: true }), 600);
});

form.fecha.min = new Date().toISOString().slice(0, 10);
pintar();

// Envío por WhatsApp
const error = document.getElementById("form-error");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const faltan = [...form.querySelectorAll("[required]")].filter((c) => !c.value.trim());
  form.querySelectorAll("[required]").forEach((c) => c.toggleAttribute("aria-invalid", faltan.includes(c)));
  if (faltan.length) {
    error.textContent = "Faltan datos: completá los campos marcados así te armamos la propuesta.";
    error.hidden = false;
    faltan[0].focus();
    return;
  }
  error.hidden = true;

  const fecha = new Date(form.fecha.value + "T12:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const r = calcular(estado.servicio, estado.invitados);
  const mensaje = [
    "¡Hola Barra Móvil ORION! 🍹 Quiero consultar disponibilidad:",
    `📍 Fecha: ${fecha}`,
    `👥 Invitados: ${form.invitados.value}`,
    `🎉 Tipo de evento: ${form.tipo.value}`,
    `📍 Lugar: ${form.lugar.value.trim()}`,
    `🍸 Servicio: ${PRECIOS[estado.servicio].nombre}`,
    r ? `💰 Estimado de la web: ${pesos(r.monto)}` : "",
  ].filter(Boolean).join("\n");

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener");
});

// Entradas escalonadas por sección, una sola vez
const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const piezas = document.querySelectorAll(".aparece");
if (quieto || !("IntersectionObserver" in window)) {
  piezas.forEach((el) => el.classList.add("visible"));
} else {
  document.querySelectorAll("section").forEach((sec) => {
    sec.querySelectorAll(".aparece").forEach((el, i) => el.style.setProperty("--retraso", `${Math.min(i, 6) * 75}ms`));
  });
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("visible");
      obs.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  piezas.forEach((el) => obs.observe(el));
}

// Carrusel de la galería: avanza solo, se frena con el mouse, tiene flechas y amplía la foto al tocarla
const galeria = document.querySelector(".galeria");
if (galeria) {
  const carrusel = galeria.querySelector(".carrusel");
  const pista = carrusel.querySelector(".carrusel-pista");
  const visor = document.getElementById("visor");
  const medio = visor.querySelector(".visor-medio");

  const ampliar = (figura) => {
    const fuente = figura.querySelector("img, video");
    let grande;
    if (fuente.tagName === "IMG") {
      grande = document.createElement("img");
      grande.src = fuente.currentSrc || fuente.src;
      grande.alt = fuente.alt;
    } else {
      grande = document.createElement("video");
      grande.src = fuente.querySelector("source").src;
      Object.assign(grande, { muted: true, loop: true, playsInline: true, controls: true, autoplay: true });
    }
    medio.replaceChildren(grande);
    visor.showModal();
  };
  visor.querySelector(".visor-cerrar").addEventListener("click", () => visor.close());
  visor.addEventListener("click", (e) => { if (e.target === visor) visor.close(); });
  visor.addEventListener("close", () => medio.replaceChildren());

  const originales = [...pista.children];
  originales.forEach((f) => {
    const fuente = f.querySelector("img, video");
    f.tabIndex = 0;
    f.setAttribute("role", "button");
    f.setAttribute("aria-label", "Ampliar: " + (fuente.alt || fuente.getAttribute("aria-label")));
  });
  pista.addEventListener("click", (e) => { const f = e.target.closest("figure"); if (f) ampliar(f); });
  pista.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("figure")) { e.preventDefault(); ampliar(e.target); }
  });

  const flechas = galeria.querySelectorAll(".flecha");
  if (quieto) {
    flechas.forEach((b) => b.addEventListener("click", () => {
      carrusel.scrollBy({ left: (b.classList.contains("flecha-izq") ? -1 : 1) * carrusel.clientWidth * 0.7 });
    }));
  } else {
    // Duplica las fotos para que la cinta dé la vuelta sin cortes
    originales.forEach((item) => {
      const copia = item.cloneNode(true);
      copia.setAttribute("aria-hidden", "true");
      copia.tabIndex = -1;
      copia.querySelectorAll("img").forEach((img) => (img.alt = ""));
      pista.appendChild(copia);
    });
    pista.querySelectorAll("video").forEach((v) => { v.muted = true; v.play().catch(() => {}); });
    carrusel.classList.add("anda");

    const VELOCIDAD = 40; // px por segundo
    let vuelta = 0;
    const medir = () => { vuelta = (pista.scrollWidth + parseFloat(getComputedStyle(pista).columnGap)) / 2; };
    medir();
    window.addEventListener("load", medir);
    window.addEventListener("resize", medir);

    let pos = 0, empuje = 0, frenado = false, previo = performance.now();
    carrusel.addEventListener("pointerenter", () => (frenado = true));
    carrusel.addEventListener("pointerleave", () => (frenado = false));
    carrusel.addEventListener("focusin", () => (frenado = true));
    carrusel.addEventListener("focusout", () => (frenado = false));
    flechas.forEach((b) => b.addEventListener("click", () => {
      empuje += (b.classList.contains("flecha-izq") ? -1 : 1) * carrusel.clientWidth * 0.6;
    }));

    const cuadro = (t) => {
      const dt = Math.min(t - previo, 50) / 1000;
      previo = t;
      if (!frenado && !visor.open) pos += VELOCIDAD * dt;
      // Las flechas empujan con una frenada suave en vez de saltar
      if (Math.abs(empuje) > 0.5) { const paso = empuje * Math.min(1, dt * 7); pos += paso; empuje -= paso; }
      if (vuelta) pos = ((pos % vuelta) + vuelta) % vuelta;
      pista.style.transform = `translate3d(${-pos}px, 0, 0)`;
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  }
}
