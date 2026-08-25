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
