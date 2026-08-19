// ============================================
// FUNCIONES UTILITARIAS
// ============================================

function mostrarMensaje(el, msg, tipo) {
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
