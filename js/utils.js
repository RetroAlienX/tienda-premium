// ============================================
// FUNCIONES UTILITARIAS
// ============================================

function mostrarMensaje(el, msg, tipo) {
  if (!el) return;
  el.textContent = msg;
  el.className = "mensaje-" + tipo;
  if (tipo === "exito") {
    setTimeout(() => {
      el.textContent = "";
      el.className = "";
    }, 5000);
  }
}

function formatearMoneda(cantidad) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(cantidad);
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const NOMBRES_MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatearDiaEntrega(diaStr) {
  if (!diaStr) return "Por confirmar";
  const d = new Date(diaStr + "T00:00:00");
  if (isNaN(d.getTime())) return diaStr;
  return `${String(d.getDate()).padStart(2, "0")}/${
    NOMBRES_MESES[d.getMonth()]
  }/${d.getFullYear()}`;
}

function formatearHoraEntrega(horaStr) {
  if (!horaStr) return "Por confirmar";
  const partes = String(horaStr).split(":");
  const h = parseInt(partes[0], 10);
  const m = parseInt(partes[1], 10);
  if (isNaN(h)) return horaStr;
  const sufijo = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const min = isNaN(m) ? "00" : String(m).padStart(2, "0");
  return `${h12}:${min} ${sufijo}`;
}

function generarNumeroPedido() {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().slice(-2);
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  const aleatorio = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `P-${año}${mes}${dia}-${aleatorio}`;
}

function validarTelefono(telefono) {
  const limpio = telefono.replace(/[\s\-\(\)]/g, "");
  if (limpio.length === 10) {
    return { valido: true, telefono: limpio };
  } else if (limpio.length === 11 && limpio.startsWith("52")) {
    return { valido: true, telefono: limpio };
  } else if (limpio.length === 11 && limpio.startsWith("1")) {
    return { valido: true, telefono: limpio };
  }
  return { valido: false, telefono: limpio };
}

function getElement(id) {
  return document.getElementById(id);
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}
