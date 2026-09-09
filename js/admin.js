// ============================================
// ADMIN - COMPLETO CORREGIDO - ROUTE66 MARKET
// ============================================

let productoEditando = null;
let finanzaEditando = null;
let eliminarId = null;
let eliminarTipo = null;

// ============================================
// VARIABLES PARA TICKET
// ============================================
let ticketProductos = [];
let pedidoTicketPrecargado = null;

// Abre una ventana emergente centrada en la pantalla (en vez de la esquina
// superior izquierda, que es donde el navegador la pone por defecto).
function abrirVentanaCentrada(url, width, height) {
  const left = Math.max(0, (window.screen.width - width) / 2);
  const top = Math.max(0, (window.screen.height - height) / 2);
  return window.open(
    url,
    "_blank",
    `width=${width},height=${height},left=${left},top=${top}`,
  );
}

// Notificación tipo "toast" dentro del panel (evita los alert() del navegador).
function notificar(mensaje, tipo) {
  const t = document.getElementById("notificacion");
  if (!t) {
    if (tipo === "error") alert(mensaje);
    return;
  }
  t.textContent = mensaje;
  t.className = "notificacion visible" + (tipo === "error" ? " error" : "");
  clearTimeout(t._tm);
  t._tm = setTimeout(() => {
    t.className = "notificacion";
  }, 4500);
}

// Abre la vista previa del ticket dentro del panel (modal) en vez de un popup.
function abrirTicketPreviewModal(url) {
  const m = document.getElementById("modalTicketPreview");
  const f = document.getElementById("iframeTicketPreview");
  if (!m || !f) {
    if (typeof abrirVentanaCentrada === "function") {
      abrirVentanaCentrada(url, 400, 700);
    }
    return;
  }
  f.src = url;
  m.style.display = "flex";
}

function cerrarTicketPreview() {
  const m = document.getElementById("modalTicketPreview");
  const f = document.getElementById("iframeTicketPreview");
  if (m) m.style.display = "none";
  if (f) f.src = "about:blank";
}
let productosDisponibles = [];

// 🔥 CONFIGURACIÓN DE EMAILJS (GMAIL CONECTADO)
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_zyekllp",
  TEMPLATE_ID: "template_1dcnw6v",
  USER_ID: "Jx00-aXDn9h0eWxnY",
};

if (typeof emailjs !== "undefined") {
  emailjs.init(EMAILJS_CONFIG.USER_ID);
} else {
  console.warn("⚠️ EmailJS SDK no disponible todavía en admin.js");
}

// ============================================
// FUNCIONES PARA REFRESCAR PESTAÑAS
// ============================================

function agregarEventoRefrescar(id, callback, tabId) {
  const btn = document.getElementById(id);
  if (!btn) {
    console.warn(`⚠️ Botón ${id} no encontrado`);
    return;
  }

  btn.addEventListener("click", function () {
    // El botón solo es visible si su pestaña está activa, así que SIEMPRE
    // ejecutamos el refresco. (Antes se omitía si display === "none", lo que
    // dejaba el botón sin efecto en algunos casos.)
    const originalText = this.innerHTML;
    this.disabled = true;
    this.innerHTML = "⏳ Cargando...";

    Promise.resolve()
      .then(() => callback())
      .catch((e) => console.error("Error al refrescar", e))
      .finally(() => {
        this.disabled = false;
        this.innerHTML = originalText;
      });
  });
}

// ============================================
// ESPERAR A QUE SUPABASE ESTÉ LISTO
// ============================================

function esperarSupabase(callback) {
  if (window.supabase && typeof window.supabase.from === "function") {
    callback();
    return;
  }

  document.addEventListener("supabaseReady", function handler() {
    document.removeEventListener("supabaseReady", handler);
    callback();
  });

  const intervalo = setInterval(function () {
    if (window.supabase && typeof window.supabase.from === "function") {
      clearInterval(intervalo);
      callback();
    }
  }, 200);
}

// ============================================
// FUNCIONES DE SEGURIDAD
// ============================================

function addEventListenerSafe(id, event, handler) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(event, handler);
    return true;
  }
  console.warn(`⚠️ Elemento no encontrado: #${id}`);
  return false;
}

function getElement(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`⚠️ Elemento no encontrado: #${id}`);
  return el;
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

// ============================================
// FUNCIONES DE UTILIDAD
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

// ============================================
// PRODUCTOS SIN STOCK
// ============================================

async function verProductosSinStock() {
  try {
    const { data, error } = await window.supabase
      .from("productos")
      .select("id, nombre, stock, precio, categoria")
      .eq("stock", 0)
      .order("nombre");

    if (error) throw error;

    if (!data || data.length === 0) {
      mostrarModalAlerta("✅ Todos los productos tienen stock disponible.");
      return;
    }

    let mensaje = "📦 PRODUCTOS SIN STOCK (0 unidades):\n\n";
    mensaje += `Total: ${data.length} productos\n`;
    mensaje += "═".repeat(30) + "\n\n";

    data.forEach((p, i) => {
      mensaje += `${i + 1}. ${p.nombre}\n`;
      mensaje += `   💰 ${formatearMoneda(p.precio)}\n`;
      mensaje += `   📂 ${p.categoria || "Sin categoría"}\n\n`;
    });

    mostrarModalAlerta(mensaje, "📦 Productos sin stock");
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("❌ Error al cargar productos sin stock");
  }
}

// ============================================
// CARGAR PEDIDOS PENDIENTES PARA ENVÍOS
// ============================================

async function cargarPedidosPendientes() {
  const select = document.getElementById("selectPedidoEnvio");
  if (!select) return;

  try {
    const { data, error } = await window.supabase
      .from("pedidos")
      .select(
        "id, numero_pedido, cliente_nombre, cliente_telefono, cliente_email, productos, total, direccion_entrega, costo_envio, lugar_entrega, metodo_pago, descuento, estado",
      )
      .order("fecha_pedido", { ascending: false });

    if (error) throw error;

    select.innerHTML =
      '<option value="">Selecciona un pedido...</option>';

    if (!data || data.length === 0) {
      select.innerHTML =
        '<option value="">📋 No hay pedidos registrados</option>';
      return;
    }

    data.forEach((p) => {
      const productosText = p.productos
        .map((x) => `${x.nombre} x${x.cantidad}`)
        .join(", ");
      const estadoLabel =
        p.estado === "pendiente"
          ? "📋 Pendiente"
          : p.estado === "confirmado"
            ? "✅ Confirmado"
            : p.estado === "vendido"
              ? "💰 Vendido"
              : p.estado === "entregado"
                ? "📦 Entregado"
                : p.estado === "cancelado"
                  ? "❌ Cancelado"
                  : p.estado === "devuelto"
                    ? "↩️ Devuelto"
                    : (p.estado || "—");
      select.innerHTML += `
                <option value="${p.id}" 
                        data-cliente="${p.cliente_nombre}"
                        data-telefono="${p.cliente_telefono || ""}"
                        data-email="${p.cliente_email || ""}"
                        data-numero="${p.numero_pedido || "N/A"}"
                        data-productos='${JSON.stringify(p.productos)}'
                        data-total="${p.total}"
                        data-direccion="${p.direccion_entrega || ""}"
                        data-costoenvio="${p.costo_envio || 0}"
                        data-lugarentrega="${p.lugar_entrega || ""}"
                        data-descuento="${p.descuento || 0}"
                        data-estado="${p.estado || ""}"
                        data-metodopago="${p.metodo_pago || ""}">
                    ${p.numero_pedido} - ${p.cliente_nombre} · ${estadoLabel} (${productosText})
                </option>
            `;
    });

    select.addEventListener("change", function () {
      const option = this.options[this.selectedIndex];
      if (option && option.value) {
        document.getElementById("correoCliente").value =
          option.dataset.email || "";
        document.getElementById("nombreClienteCorreo").value =
          option.dataset.cliente || "";
        document.getElementById("numeroPedidoCorreo").value =
          option.dataset.numero || "";
        document.getElementById("direccionCorreo").value =
          option.dataset.direccion || "";
        document.getElementById("telefonoCorreo").value =
          option.dataset.telefono || "";

        try {
          const productos = JSON.parse(option.dataset.productos || "[]");
          const productosText = productos
            .map(
              (p) =>
                `${p.nombre} x${p.cantidad} = $${(
                  p.precio * p.cantidad
                ).toFixed(2)}`,
            )
            .join("\n");
          document.getElementById("productosCorreo").value = productosText;
        } catch (e) {
          document.getElementById("productosCorreo").value = "";
        }
const costoEnvio = parseFloat(option.dataset.costoenvio || 0) || 0;
        const lugar = option.dataset.lugarentrega || "";

        // Envío (lugar) + Costo de envío (prellenado con el costo del pedido)
        document.getElementById("envioLugarCorreo").value = lugar
          ? `${lugar} · $${costoEnvio.toFixed(2)}`
          : "";
        document.getElementById("envioCorreo").value =
          costoEnvio > 0 ? costoEnvio : "";

        document.getElementById("lugarEntregaCorreo").value = lugar || "";

        // Subtotal = suma de PRODUCTOS (sin signo negativo, el descuento
        // se resta solo al calcular el total).
        let subtotalProductos = 0;
        try {
          const productos = JSON.parse(option.dataset.productos || "[]");
          subtotalProductos = (productos || []).reduce(
            (s, x) => s + (Number(x.precio) || 0) * (Number(x.cantidad) || 0),
            0,
          );
        } catch (e) {
          subtotalProductos = 0;
        }
        document.getElementById("subtotalCorreo").value =
          `$${subtotalProductos.toFixed(2)}`;
        document.getElementById("descuentoCorreo").value =
          option.dataset.descuento || 0;

        // Total = subtotal + envío − descuento %
        if (typeof recalcularTotalCorreo === "function") {
          recalcularTotalCorreo();
        } else {
          const totalBase = subtotalProductos + costoEnvio;
          const descuentoPct = parseFloat(option.dataset.descuento || 0) || 0;
          const totalFinal =
            totalBase - totalBase * (descuentoPct / 100);
          document.getElementById("totalCorreo").value =
            `$${totalFinal.toFixed(2)}`;
        }

        document.getElementById("metodoPagoCorreo").value =
          option.dataset.metodopago === "transferencia"
            ? "Transferencia"
            : option.dataset.metodopago
              ? option.dataset.metodopago
              : "";

        const msg = document.getElementById("mensajeCorreo");
        if (msg) {
          msg.innerHTML = `<span class="text-success">✅ Pedido ${option.dataset.numero} seleccionado.</span>`;
          msg.className = "mensaje-exito";
        }
      }
    });
  } catch (error) {
    console.error("Error cargando pedidos pendientes:", error);
    select.innerHTML = '<option value="">❌ Error al cargar pedidos</option>';
  }
}

// ============================================
// ABRIR MODAL PARA ENVIAR CORREO DESDE PEDIDOS
// ============================================

function recalcularTotalCorreo() {
  const subtotalEl = document.getElementById("subtotalCorreo");
  const totalEl = document.getElementById("totalCorreo");
  const envioEl = document.getElementById("envioCorreo");
  const descuentoEl = document.getElementById("descuentoCorreo");
  if (!totalEl || !subtotalEl) return;
  const subtotal =
    parseFloat((subtotalEl.value || "$0").replace(/[$,]/g, "")) || 0;
  const envio = envioEl ? parseFloat(envioEl.value || 0) || 0 : 0;
  const descuento = descuentoEl ? parseFloat(descuentoEl.value || 0) || 0 : 0;
  const base = subtotal + envio;
  const total = base - base * (descuento / 100);
  totalEl.value = `$${total.toFixed(2)}`;
}

async function buscarPedidoPorId(id) {
  try {
    const { data, error } = await window.supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error buscando pedido por id:", error);
    return null;
  }
}

// Busca un pedido por su N° de pedido (que es el mismo valor que se imprime
// como CÓDIGO DE PEDIDO en el código de barras del ticket).
async function buscarPedidoPorNumero(codigo) {
  const c = String(codigo || "").trim();
  if (!c) return null;
  try {
    const { data, error } = await window.supabase
      .from("pedidos")
      .select("*")
      .ilike("numero_pedido", c)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error buscando pedido por código:", error);
    return null;
  }
}

// Rellena el modal "Enviar Correo al Cliente" con los datos de un pedido.
function llenarModalCorreoConPedido(pedido) {
  if (!pedido) return;

  const modalPedidoId = document.getElementById("modalCorreoPedidoId");
  const modalCliente = document.getElementById("modalCorreoCliente");
  const modalTelefono = document.getElementById("modalCorreoTelefono");
  const modalEmail = document.getElementById("modalCorreoEmail");
  const modalNumero = document.getElementById("modalCorreoNumero");
  const modalDireccion = document.getElementById("modalCorreoDireccion");
  const modalTotal = document.getElementById("modalCorreoTotal");
  const modalEnvio = document.getElementById("modalCorreoEnvio");
  const modalProductos = document.getElementById("modalCorreoProductos");
  const modalMensaje = document.getElementById("modalCorreoMensaje");

  if (
    !modalPedidoId ||
    !modalCliente ||
    !modalTelefono ||
    !modalEmail ||
    !modalNumero ||
    !modalDireccion ||
    !modalTotal ||
    !modalEnvio ||
    !modalProductos
  ) {
    console.error("❌ Elementos del modal no encontrados");
    mostrarModalAlerta(
      "Error al abrir el modal. Verifica que el modal esté cargado correctamente.",
    );
    return;
  }

  modalPedidoId.value = pedido.id;
  modalCliente.value = pedido.cliente_nombre || "";
  modalTelefono.value = pedido.cliente_telefono || "";
  modalEmail.value = pedido.cliente_email || "";
  modalNumero.value = pedido.numero_pedido || "";
  modalDireccion.value = pedido.direccion_entrega || "";
  modalTotal.value = `$${Number(pedido.total || 0).toFixed(2)}`;
  modalEnvio.value = "";
  modalMensaje.value = "";

  try {
    const productosParsed = Array.isArray(pedido.productos)
      ? pedido.productos
      : [];
    const productosText = productosParsed
      .map(
        (p) =>
          `${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toFixed(2)}`,
      )
      .join("\n");
    modalProductos.value = productosText;
  } catch (e) {
    modalProductos.value = "";
  }

  const mensaje = document.getElementById("mensajeModalCorreo");
  if (mensaje) {
    mensaje.innerHTML = "";
    mensaje.className = "";
  }

  const modalEl = document.getElementById("modalEnvioCorreo");
  if (modalEl) modalEl.style.display = "flex";
}

async function abrirModalCorreo(pedidoId) {
  const pedido = await buscarPedidoPorId(pedidoId);
  if (!pedido) {
    mostrarModalAlerta("❌ No se encontraron datos del pedido");
    return;
  }
  llenarModalCorreoConPedido(pedido);
}

// ============================================
// ENVIAR CORREO DESDE MODAL
// ============================================

async function enviarCorreoDesdeModal() {
  const btn = document.querySelector("#modalEnvioCorreo .btn-warning");
  const mensaje = document.getElementById("mensajeModalCorreo");

  const pedidoId = document.getElementById("modalCorreoPedidoId").value;
  let email = document.getElementById("modalCorreoEmail").value.trim();
  const numeroPedido = document
    .getElementById("modalCorreoNumero")
    .value.trim();
  const nombre = document.getElementById("modalCorreoCliente").value.trim();
  const productosText = document
    .getElementById("modalCorreoProductos")
    .value.trim();
  let total = document.getElementById("modalCorreoTotal").value.trim();
  const direccion = document
    .getElementById("modalCorreoDireccion")
    .value.trim();
  const envio = document.getElementById("modalCorreoEnvio").value.trim();
  const mensajeAdicional = document
    .getElementById("modalCorreoMensaje")
    .value.trim();

  if (!email) {
    email = "theroute66jvmarket@gmail.com";
    console.warn("⚠️ El pedido no tiene correo, usando correo del admin");
  }

  if (envio === "" || isNaN(parseFloat(envio))) {
    mensaje.innerHTML =
      '<span class="text-danger">❌ Ingresa un costo de envío válido (usa 0 si es punto de entrega)</span>';
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = "Enviando...";

    if (typeof emailjs === "undefined") {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      emailjs.init(EMAILJS_CONFIG.USER_ID);
    }

    const lineas = productosText.split("\n").filter((line) => line.trim());
    const items = lineas.map((line) => {
      const match = line.match(/^(.+?)\s*(?:x|×)\s*(\d+)\s*=\s*\$?([\d.]+)/);
      if (match) {
        return {
          nombre: match[1].trim(),
          cantidad: parseInt(match[2]),
          precio: match[3],
        };
      }
      return { nombre: line.trim(), cantidad: 1, precio: "0" };
    });

    total = total.replace(/[$,]/g, "");
    const envioNum = envio.replace(/[$,]/g, "");
    const subtotalModal = items
      .reduce((s, i) => s + (parseFloat(i.precio) || 0), 0)
      .toFixed(2);

    const params = {
      cliente: nombre,
      numero_pedido: numeroPedido,
      fecha: new Date().toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      productos: items,
      subtotal: subtotalModal,
      total: total,
      metodo_pago: "Transferencia / Efectivo",
      direccion: direccion || "No especificada",
      envio: parseFloat(envioNum) > 0 ? envioNum : "",
      politicas:
        "⏳ Los 3 días de cancelación o devolución corren a partir de la recepción del producto. Para una devolución válida, regresa el producto en su empaque original, sin daños y sin uso. En consumibles o productos sellados (alimentos, geles de manos, perfumes...) deben ir sellados como se recibieron; si están abiertos o usados, la devolución o garantía de calidad queda invalidada.",
      mensaje_adicional:
        mensajeAdicional ||
        `El costo de envío es de $${parseFloat(envioNum).toFixed(
          2,
        )}. Confirma tu pedido.`,
      to_email: email,
    };


    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      params,
      {
        subject: `Confirmación de Pedido #${numeroPedido}!`,
      },
    );


    if (pedidoId) {
      await window.supabase
        .from("pedidos")
        .update({ estado: "confirmado" })
        .eq("id", pedidoId);
    }

    mensaje.innerHTML = `<span class="text-success">✅ Correo enviado a ${email}</span>`;
    btn.textContent = "✅ Enviado";

    setTimeout(() => {
      const modalEl = document.getElementById("modalEnvioCorreo");
      if (modalEl) modalEl.style.display = "none";
      const activeFilter = document.querySelector(".filtro-pedido.active");
      cargarPedidos(activeFilter?.dataset?.estado || "todos");
      cargarPedidosPendientes();
      btn.disabled = false;
      btn.textContent = "📧 Enviar Correo";
    }, 1500);
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    mensaje.innerHTML = `<span class="text-danger">❌ Error: ${
      error.message || "El correo no pudo ser enviado"
    }</span>`;
    btn.disabled = false;
    btn.textContent = "📧 Enviar Correo";
  }
}

// ============================================
// ENVÍO DE CORREO MANUAL DESDE PESTAÑA ENVÍOS
// ============================================

async function enviarCorreoManual(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeCorreo");
  const btn = e.target.querySelector('button[type="submit"]');

  const email = document.getElementById("correoCliente").value.trim();
  const numeroPedido = document
    .getElementById("numeroPedidoCorreo")
    .value.trim();
  const nombre = document.getElementById("nombreClienteCorreo").value.trim();
  const productosText = document.getElementById("productosCorreo").value.trim();
  const metodoPago = document.getElementById("metodoPagoCorreo").value.trim();
  const envio = document.getElementById("envioCorreo").value.trim();
  const direccion = document.getElementById("direccionCorreo").value.trim();
  const mensajeAdicional = document
    .getElementById("mensajeAdicionalCorreo")
    .value.trim();
  const lugarEntrega = document
    .getElementById("lugarEntregaCorreo")
    .value.trim();
  const descuento = document.getElementById("descuentoCorreo").value.trim();
  const subtotalStr = document.getElementById("subtotalCorreo").value.trim();
  const totalStr = document.getElementById("totalCorreo").value.trim();
  let total = totalStr;
  const pedidoId = document.getElementById("selectPedidoEnvio")?.value;

  if (!email || !numeroPedido || !nombre || !productosText || !total) {
    return mostrarMensaje(
      msg,
      "❌ Completa los campos obligatorios (*)",
      "error",
    );
  }

  if (envio === "" || isNaN(parseFloat(envio))) {
    return mostrarMensaje(
      msg,
      "❌ Indica el costo de envío (usa 0 si es punto de entrega)",
      "error",
    );
  }

  try {
    btn.disabled = true;
    btn.textContent = "Enviando...";

    if (typeof emailjs === "undefined") {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      emailjs.init(EMAILJS_CONFIG.USER_ID);
    }

    const lineas = productosText.split("\n").filter((line) => line.trim());
    const items = lineas.map((line) => {
      const match = line.match(/^(.+?)\s*(?:x|×)\s*(\d+)\s*=\s*\$?([\d.]+)/);
      if (match) {
        return {
          nombre: match[1].trim(),
          cantidad: parseInt(match[2]),
          precio: match[3],
        };
      }
      return { nombre: line.trim(), cantidad: 1, precio: "0" };
    });

    total = total.replace(/[$,]/g, "");
    const envioNum = envio.replace(/[$,]/g, "");
    const subtotalNum = subtotalStr.replace(/[$,]/g, "");
    const descuentoNum = descuento ? parseFloat(descuento) : 0;

    // Total = subtotal + envío - descuento
    const baseTotal = parseFloat(subtotalNum || 0) + parseFloat(envioNum || 0);
    const descuentoMonto = baseTotal * (descuentoNum / 100);
    const totalFinal = baseTotal - descuentoMonto;
    total = totalFinal.toFixed(2);

    const params = {
      cliente: nombre,
      numero_pedido: numeroPedido,
      fecha: new Date().toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      productos: items,
      total: total,
      subtotal: baseTotal.toFixed(2),
      lugar_entrega: lugarEntrega || "No especificada",
      metodo_pago: metodoPago || "No especificado",
      direccion: direccion || "No especificada",
      envio: envioNum,
      descuento: descuentoNum,
      monto_descuento: descuentoNum > 0 ? descuentoMonto.toFixed(2) : "",
      politicas:
        "⏳ Los 3 días de cancelación o devolución corren a partir de la recepción del producto. Para una devolución válida, regresa el producto en su empaque original, sin daños y sin uso. En consumibles o productos sellados (alimentos, geles de manos, perfumes...) deben ir sellados como se recibieron; si están abiertos o usados, la devolución o garantía de calidad queda invalidada.",
      instruccion_entrega: (() => {
        const PUNTOS_FIJOS = [
          "Apodaca centro (frente a iglesia)",
          "San Nicolas centro (plaza presidencia)",
          "Costco Escobedo",
        ];
        if (!lugarEntrega) return "";
        if (PUNTOS_FIJOS.includes(lugarEntrega)) {
          return `📍 Punto fijo de entrega: acude a "${lugarEntrega}" en el horario asignado. ¡El envío es GRATIS!`;
        }
        return `📍 Punto y horario a convenir. Te contactaremos por WhatsApp para coordinar la entrega en "${lugarEntrega}".`;
      })(),
      mensaje_adicional:
        mensajeAdicional ||
        (lugarEntrega
          ? `El lugar de entrega es ${lugarEntrega} y el costo de envío es de $${parseFloat(
              envioNum,
            ).toFixed(2)}.`
          : `El costo de envío es de $${parseFloat(envioNum).toFixed(2)}.`),
      to_email: email,
    };


    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      params,
      {
        subject: `Confirmación de Pedido #${numeroPedido}!`,
      },
    );

    if (pedidoId) {
      // Solo se "confirma" si el pedido sigue pendiente. Si seleccionaste uno
      // ya confirmado/vendido/etc. se reenvía el correo sin cambiar su estado.
      const estadoActual = document
        .querySelector(`#selectPedidoEnvio option[value="${pedidoId}"]`)
        ?.dataset.estado;
      if (!estadoActual || estadoActual === "pendiente") {
        await window.supabase
          .from("pedidos")
          .update({ estado: "confirmado" })
          .eq("id", pedidoId);
      }
    }

    mostrarMensaje(
      msg,
      `✅ Correo enviado a ${email}${pedidoId ? " (Pedido confirmado)" : ""}`,
      "exito",
    );
    document.getElementById("formEnvioCorreo").reset();
    document.getElementById("envioCorreo").value = "";
    document.getElementById("mensajeAdicionalCorreo").value = "";
    cargarPedidosPendientes();
  } catch (error) {
    console.error("Error:", error);
    mostrarMensaje(msg, "❌ Error al enviar correo: " + error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "📧 Enviar Correo y Confirmar Pedido";
  }
}

// ============================================
// PROCESAR / COMPLETAR PEDIDO
// ============================================

async function procesarPedido(pedidoId, accion) {
  const estados = {
    completar: "vendido",
    procesar: "confirmado",
  };

  const nuevoEstado = estados[accion];
  if (!nuevoEstado) return;

  const mensajeAccion =
    accion === "completar"
      ? "marcar como VENDIDO (esto descuenta el stock y no se puede deshacer aquí; usa 'Devolución' si necesitas regresarlo)"
      : "procesar";
  modalConfirmar(`¿Confirmar ${mensajeAccion} este pedido?`, function () {
    ejecutarProcesarPedido(pedidoId, accion);
  });
}

async function ejecutarProcesarPedido(pedidoId, accion) {
  const estados = {
    completar: "vendido",
    procesar: "confirmado",
  };
  const nuevoEstado = estados[accion];
  if (!nuevoEstado) return;

  try {
    const { data: pedido, error: getError } = await window.supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (getError) throw getError;

    if (accion === "completar") {
      for (const item of pedido.productos) {
        const { data: producto, error: prodError } = await window.supabase
          .from("productos")
          .select("id, stock")
          .eq("nombre", item.nombre)
          .maybeSingle();

        if (prodError) {
          console.warn(
            `⚠️ Error buscando producto "${item.nombre}":`,
            prodError,
          );
          continue;
        }

        if (producto) {
          const nuevoStock = Math.max(0, producto.stock - item.cantidad);
          await window.supabase
            .from("productos")
            .update({ stock: nuevoStock })
            .eq("id", producto.id);

          await window.supabase.from("inventario").insert([
            {
              producto_id: producto.id,
              tipo: "salida",
              cantidad: item.cantidad,
              descripcion: `Venta - Pedido ${pedido.numero_pedido || "N/A"}`,
            },
          ]);
        } else {
          console.warn(
            `⚠️ Producto "${item.nombre}" no encontrado en la base de datos`,
          );
        }
      }
    }

    const updateData = { estado: nuevoEstado };
    if (accion === "completar") {
      updateData.fecha_vendido =
        pedido.fecha_vendido || new Date().toISOString();
    }

    const { error: updateError } = await window.supabase
      .from("pedidos")
      .update(updateData)
      .eq("id", pedidoId);

    if (updateError) throw updateError;

    mostrarModalAlerta(
      `✅ Pedido ${
        accion === "completar" ? "marcado como vendido" : "procesado"
      } correctamente`,
    );

    const activeFilter = document.querySelector(".filtro-pedido.active");
    cargarPedidos(activeFilter?.dataset?.estado || "todos");
    cargarPedidosPendientes();
  } catch (error) {
    console.error("❌ Error al procesar pedido:", error);
    mostrarModalAlerta("❌ Error al procesar el pedido: " + error.message);
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener("DOMContentLoaded", function () {

  // No permitir valores negativos en ningún campo numérico (item 21)
  document.addEventListener("input", function (ev) {
    const el = ev.target;
    if (el && el.tagName === "INPUT" && el.type === "number") {
      const min = parseFloat(el.min);
      if (!isNaN(min) && el.value !== "" && parseFloat(el.value) < min) {
        el.value = min;
      }
    }
  });

  function cambiarTab(tabId) {
    document.querySelectorAll(".tab-content").forEach((t) => {
      t.classList.remove("active");
      t.style.display = "none";
    });

    const target = document.getElementById("tab-" + tabId);
    if (target) {
      target.classList.add("active");
      target.style.display = "block";
    }

    document.querySelectorAll("[data-tab]").forEach((b) => {
      b.classList.remove("active");
      if (b.dataset.tab === tabId) {
        b.classList.add("active");
      }
    });

    // Recordar el tab activo para restaurarlo si la página recarga.
    try { sessionStorage.setItem("adminActiveTab", tabId); } catch (_) {}

    if (tabId === "productos") cargarProductos();
    if (tabId === "inventario") cargarInventario();
    if (tabId === "pedidos") cargarPedidos();
    if (tabId === "finanzas") cargarFinanzas();
    if (tabId === "ticket") {
      cargarProductosTicket();
      cargarPedidosParaTicket();
      cargarLugaresTicketAdmin();
    }
    if (tabId === "envios") cargarPedidosPendientes();
    if (tabId === "promociones") {
      cargarCupones();
      cargarNoticias();
      cargarLugaresEntregaAdmin();
      cargarMarcas();
    }
    if (tabId === "lealtad" && typeof cargarLealtad === "function")
      cargarLealtad();
    if (tabId === "pagos" && typeof cargarPagos === "function") cargarPagos();
  }

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const tab = this.dataset.tab;
      cambiarTab(tab);
    });
  });

  // ============================================
  // BOTONES REFRESCAR
  // ============================================
  agregarEventoRefrescar(
    "btnRefrescarProductos",
    cargarProductos,
    "tab-productos",
  );
  agregarEventoRefrescar(
    "btnRefrescarInventario",
    cargarInventario,
    "tab-inventario",
  );
  agregarEventoRefrescar("btnRefrescarPedidos", cargarPedidos, "tab-pedidos");
  agregarEventoRefrescar(
    "btnRefrescarFinanzas",
    cargarFinanzas,
    "tab-finanzas",
  );
  if (document.getElementById("btnRefrescarLealtad")) {
    agregarEventoRefrescar(
      "btnRefrescarLealtad",
      function () {
        if (typeof cargarLealtad === "function") return cargarLealtad();
      },
      "tab-lealtad",
    );
  }

  if (document.getElementById("btnRefrescarPagos")) {
    agregarEventoRefrescar(
      "btnRefrescarPagos",
      function () {
        if (typeof cargarPagos === "function") return cargarPagos();
      },
      "tab-pagos",
    );
  }

  if (document.getElementById("btnRefrescarTicket")) {
    agregarEventoRefrescar(
      "btnRefrescarTicket",
      function () {
        limpiarFormularioTicket();
        const sel = document.getElementById("ticketPedidoSelect");
        if (sel) sel.value = "";
        cargarProductosTicket();
        cargarPedidosParaTicket();
        if (typeof cargarLugaresTicketAdmin === "function")
          cargarLugaresTicketAdmin();
      },
      "tab-ticket",
    );
  }

  if (document.getElementById("btnRefrescarEnvio")) {
    agregarEventoRefrescar("btnRefrescarEnvio", cargarPedidosPendientes, "tab-envios");
  }

  if (document.getElementById("btnRefrescarPromociones")) {
    agregarEventoRefrescar(
      "btnRefrescarPromociones",
      function () {
        if (typeof cargarCupones === "function") cargarCupones();
        if (typeof cargarNoticias === "function") cargarNoticias();
        if (typeof cargarLugaresEntregaAdmin === "function")
          cargarLugaresEntregaAdmin();
        if (typeof cargarMarcas === "function") cargarMarcas();
      },
      "tab-promociones",
    );
  }

  document
    .getElementById("btnAgregarPago")
    ?.addEventListener("click", function () {
      if (typeof abrirModalPago === "function") abrirModalPago();
    });

  // Cargar 2 pagos de ejemplo la primera vez si la tabla está vacía.
  esperarSupabase(function () {
    if (typeof cargarPagosDummySiVacio === "function") {
      cargarPagosDummySiVacio();
    }
  });

  // ============================================
  // ESCÁNER DE CÓDIGO DE BARRAS
  // ============================================
  document
    .getElementById("inputCodigoBarras")
    ?.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        buscarPorCodigoBarras();
      }
    });

  // ============================================
  // ESCÁNER GLOBAL: captura lecturas rápidas del escáner SIN necesidad de
  // enfocar ningún campo. Dependiendo de la pestaña activa:
  //   · Productos → abre la edición si el producto existe (mismo error si no).
  //   · Pedidos   → filtra por el N° de pedido escaneado (código del ticket).
  //   · Ticket    → precarga el pedido para reimprimir su ticket.
  //   · Modal de correo abierto → autocompleta el correo del pedido.
  // ============================================
  let bufferEscaneoGlobal = "";
  let tiempoUltimaTeclaEscaneo = 0;

  function tabVisible(id) {
    const el = document.getElementById(id);
    return !!(el && el.offsetParent !== null);
  }

  function modalCorreoAbierto() {
    const modal = document.getElementById("modalEnvioCorreo");
    return !!(modal && modal.style.display === "flex");
  }

  async function manejarEscaneoGlobal(codigo) {
    try {
      // 1) Modal de correo abierto → buscar el pedido y autocompletar.
      if (modalCorreoAbierto()) {
        const pedido = await buscarPedidoPorNumero(codigo);
        if (!pedido) {
          if (typeof mostrarModalAlerta === "function") {
            mostrarModalAlerta(
              `❌ No se encontró ningún pedido con el código: ${codigo}`,
            );
          }
          return;
        }
        llenarModalCorreoConPedido(pedido);
        const men = document.getElementById("mensajeModalCorreo");
        if (men) {
          men.innerHTML =
            '<span class="text-success">✅ Pedido cargado por escáner del ticket.</span>';
          men.className = "text-success";
        }
        return;
      }

      // 2) Tab Productos → abrir edición / mismo error que el textbox.
      if (tabVisible("tab-productos")) {
        await procesarCodigoLeido(codigo);
        return;
      }

      // 3) Tab Pedidos → filtrar por el código del ticket (N° de pedido).
      if (tabVisible("tab-pedidos")) {
        const pedido = await buscarPedidoPorNumero(codigo);
        const input = document.getElementById("buscarNumeroPedido");
        if (input) input.value = codigo;
        const activeFilter = document.querySelector(".filtro-pedido.active");
        await cargarPedidos(activeFilter?.dataset?.estado || "todos");
        if (!pedido) {
          if (typeof mostrarModalAlerta === "function") {
            mostrarModalAlerta(
              `❌ No se encontró ningún pedido con el código: ${codigo}`,
            );
          }
        }
        return;
      }

      // 4) Tab Ticket → precargar el pedido para reimprimir.
      if (tabVisible("tab-ticket")) {
        const pedido = await buscarPedidoPorNumero(codigo);
        if (!pedido) {
          const msgt = document.getElementById("mensajeTicket");
          if (msgt) {
            mostrarMensaje(
              msgt,
              `❌ No se encontró ningún pedido con el código: ${codigo}`,
              "error",
            );
          }
          return;
        }
        // Si existe en el selector, lo deja seleccionado para que quede claro.
        const sel = document.getElementById("ticketPedidoSelect");
        if (sel) {
          for (let i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === String(pedido.id)) {
              sel.value = String(pedido.id);
              break;
            }
          }
        }
        await precargarPedidoEnTicket(pedido);
        const msgt = document.getElementById("mensajeTicket");
        if (msgt) {
          mostrarMensaje(
            msgt,
            `✅ Pedido ${pedido.numero_pedido} precargado desde el ticket escaneado.`,
            "exito",
          );
        }
        return;
      }
    } catch (error) {
      console.error("Error en manejarEscaneoGlobal:", error);
    }
  }

  document.addEventListener("keydown", function (e) {
    // Nunca interferir mientras se escribe/escanea dentro de un campo.
    const etiqueta =
      (document.activeElement && document.activeElement.tagName) || "";
    const enCampo = ["INPUT", "SELECT", "TEXTAREA"].includes(etiqueta);

    const activo =
      tabVisible("tab-productos") ||
      tabVisible("tab-pedidos") ||
      tabVisible("tab-ticket") ||
      modalCorreoAbierto();
    if (!activo) return;

    if (e.key === "Enter") {
      const codigo = bufferEscaneoGlobal.trim();
      bufferEscaneoGlobal = "";
      if (
        !enCampo &&
        codigo.length >= 3 &&
        Date.now() - tiempoUltimaTeclaEscaneo < 12000
      ) {
        e.preventDefault();
        manejarEscaneoGlobal(codigo);
      }
      tiempoUltimaTeclaEscaneo = 0;
      return;
    }

    if (enCampo || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length === 1) {
      // Patrón típico de los escáneres: una ráfaga rápida (menos de 600 ms por tecla).
      const ahora = Date.now();
      if (
        tiempoUltimaTeclaEscaneo &&
        ahora - tiempoUltimaTeclaEscaneo > 600
      ) {
        bufferEscaneoGlobal = "";
      }
      tiempoUltimaTeclaEscaneo = ahora;
      if (bufferEscaneoGlobal.length < 64) bufferEscaneoGlobal += e.key;
    }
  });

  const btnAgregarLealtad = document.getElementById("btnAgregarLealtad");
  if (btnAgregarLealtad) {
    btnAgregarLealtad.addEventListener("click", function () {
      if (typeof abrirModalLealtad === "function") abrirModalLealtad(null);
    });
  }

  // ============================================
  // VERIFICAR SESIÓN
  // ============================================
  if (typeof verificarSesion === "function") {
    verificarSesion().then((user) => {
      if (user) {
        const emailEl = document.getElementById("adminEmail");
        if (emailEl)
          emailEl.innerHTML =
            '<i class="fas fa-user-circle"></i> ' + user.email;
      }
    });
  }

  // ============================================
  // PRODUCTOS
  // ============================================
  addEventListenerSafe("btnAgregarProducto", "click", () =>
    mostrarFormProducto(),
  );
  const formProducto = document.getElementById("formProducto");
  if (formProducto) formProducto.addEventListener("submit", guardarProducto);

  // ============================================
  // INVENTARIO
  // ============================================
  addEventListenerSafe("btnAgregarMovimiento", "click", () => {
    document.getElementById("movId").value = "";
    const submitBtn = document.querySelector(
      '#formMovimiento button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Registrar";
    mostrarFormMovimiento();
  });
  const formMovimiento = document.getElementById("formMovimiento");
  if (formMovimiento)
    formMovimiento.addEventListener("submit", guardarMovimiento);

  // ============================================
  // FINANZAS
  // ============================================
  addEventListenerSafe("btnAgregarFinanza", "click", () =>
    mostrarFormFinanza(),
  );
  const formFinanza = document.getElementById("formFinanza");
  if (formFinanza) formFinanza.addEventListener("submit", guardarFinanza);

  // ============================================
  // TICKET
  // ============================================
  document
    .getElementById("btnAgregarProductoTicket")
    ?.addEventListener("click", agregarProductoTicket);
  document
    .getElementById("ticketCantidad")
    ?.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        agregarProductoTicket();
      }
    });
  document
    .getElementById("ticketEnvio")
    ?.addEventListener("input", actualizarTotalesTicket);
  document
    .getElementById("ticketDescuento")
    ?.addEventListener("input", actualizarTotalesTicket);
  document
    .getElementById("ticketPedidoSelect")
    ?.addEventListener("change", function () {
      const option = this.options[this.selectedIndex];
      if (!option || !option.value) {
        limpiarFormularioTicket();
        return;
      }
      try {
        const pedido = JSON.parse(option.dataset.pedido);
        precargarPedidoEnTicket(pedido);
      } catch (e) {
        console.error("Error leyendo el pedido seleccionado:", e);
      }
    });
  document
    .getElementById("formTicketVenta")
    ?.addEventListener("submit", generarTicketVenta);
  document
    .getElementById("btnLimpiarTicket")
    ?.addEventListener("click", function () {
      limpiarFormularioTicket();
      const sel = document.getElementById("ticketPedidoSelect");
      if (sel) sel.value = "";
      const msgt = document.getElementById("mensajeTicket");
      if (msgt) {
        msgt.innerHTML = "";
        msgt.className = "";
      }
    });

  document
    .getElementById("btnMostrarLugaresTicket")
    ?.addEventListener("click", abrirModalLugaresEntrega);

  esperarSupabase(function () {
    cargarProductosTicket();
    cargarPedidosParaTicket();
  });

  // ============================================
  // FILTROS PEDIDOS
  // ============================================
  document.querySelectorAll(".filtro-pedido").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".filtro-pedido")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      cargarPedidos(this.dataset.estado);
    });
  });

  let debounceBusquedaPedidos = null;
  ["buscarNumeroPedido", "buscarEmailPedido", "buscarNombrePedido"].forEach(
    function (idEl) {
      document
        .getElementById(idEl)
        ?.addEventListener("input", function () {
          clearTimeout(debounceBusquedaPedidos);
          debounceBusquedaPedidos = setTimeout(() => {
            const activeFilter = document.querySelector(".filtro-pedido.active");
            cargarPedidos(activeFilter?.dataset?.estado || "todos");
          }, 300);
        });
    },
  );

  // ============================================
  // MODAL
  // ============================================
  addEventListenerSafe("modalCancelar", "click", cerrarModal);
  addEventListenerSafe("modalConfirmar", "click", confirmarEliminar);

  addEventListenerSafe("modalAlertaOk", "click", function () {
    const modal = document.getElementById("modalAlerta");
    if (modal) modal.style.display = "none";
  });

  addEventListenerSafe("modalConfirmarAccionCancel", "click", function () {
    cerrarModalConfirmarAccion();
  });
  addEventListenerSafe("modalConfirmarAccionOk", "click", function () {
    const cb = confirmarAccionCallback;
    cerrarModalConfirmarAccion();
    if (cb) cb();
  });

  // EDITAR PEDIDO - recálculo dinámico
  ["editarEnvio", "editarDescuento", "editarProductos"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", recalcularTotalesEditar);
  });

  // ============================================
  // LOGOUT
  // ============================================
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", function () {
      if (typeof cerrarSesion === "function") {
        cerrarSesion();
      } else {
        window.location.href = "login.html";
      }
    });
  }

  // ============================================
  // ENVÍO DE CORREO MANUAL
  // ============================================
  const formEnvioCorreo = document.getElementById("formEnvioCorreo");
  if (formEnvioCorreo) {
    formEnvioCorreo.addEventListener("submit", enviarCorreoManual);
  }

  // La función recalcularTotalCorreo es GLOBAL (se define arriba) para poder
  // usarla también al precargar un pedido desde cargarPedidosPendientes.

  const envioCorreoEl = document.getElementById("envioCorreo");
  const descuentoCorreoEl = document.getElementById("descuentoCorreo");
  if (envioCorreoEl)
    envioCorreoEl.addEventListener("input", recalcularTotalCorreo);
  if (descuentoCorreoEl)
    descuentoCorreoEl.addEventListener("input", recalcularTotalCorreo);

  const btnLimpiarEnvio = document.getElementById("btnLimpiarEnvio");
  if (btnLimpiarEnvio) {
    btnLimpiarEnvio.addEventListener("click", function () {
      if (formEnvioCorreo) formEnvioCorreo.reset();
      const selectSel = document.getElementById("selectPedidoEnvio");
      if (selectSel) selectSel.value = "";
      ["envioCorreo", "mensajeAdicionalCorreo", "lugarEntregaCorreo",
        "envioLugarCorreo", "descuentoCorreo", "subtotalCorreo",
        "totalCorreo", "metodoPagoCorreo"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    });
  }

  // ============================================
  // PROMOCIONES - EVENTOS
  // ============================================
  addEventListenerSafe("btnAgregarCupon", "click", () => mostrarFormCupon());
  addEventListenerSafe("btnAgregarNoticia", "click", () =>
    mostrarFormNoticia(),
  );
  addEventListenerSafe("btnAgregarLugar", "click", () => mostrarFormLugar());

  const formLugar = document.getElementById("formLugar");
  if (formLugar) formLugar.addEventListener("submit", guardarLugar);

  addEventListenerSafe("btnAgregarMarca", "click", () => mostrarFormMarca());

  const formMarca = document.getElementById("formMarca");
  if (formMarca) formMarca.addEventListener("submit", guardarMarca);

  // Envío y Descuento del tab Ticket: solo ingresar números manualmente
  // (sin flechas de incremento/decremento ni negativos).
  ["ticketEnvio", "ticketDescuento"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
        ev.preventDefault();
      }
    });
    el.addEventListener("wheel", function (ev) {
      ev.preventDefault();
    });
    el.addEventListener("input", function (ev) {
      const elv = ev.target;
      if (elv.value !== "" && parseFloat(elv.value) < 0) elv.value = "0";
    });
  });

  const formCupon = document.getElementById("formCupon");
  if (formCupon) formCupon.addEventListener("submit", guardarCupon);

  const formNoticia = document.getElementById("formNoticia");
  if (formNoticia) formNoticia.addEventListener("submit", guardarNoticia);

  const noticiaFechaEsTexto = document.getElementById("noticiaFechaEsTexto");
  if (noticiaFechaEsTexto) {
    noticiaFechaEsTexto.addEventListener("change", actualizarModoFechaNoticia);
  }

  // Se espera a que Supabase esté listo antes de cargar la primera
  // pestaña, para no disparar el reintento de "Supabase no disponible".
  esperarSupabase(function () {
    let tabInicial = "productos";
    try { tabInicial = sessionStorage.getItem("adminActiveTab") || "productos"; } catch (_) {}
    cambiarTab(tabInicial);
  });
});

// ============================================
// 1. PRODUCTOS (CRUD)
// ============================================

function renderFilaProducto(p) {
  return `
                        <tr data-prod-id="${p.id}">
                            <td>
                                ${
                                  p.imagen_url
                                    ? `<img src="${p.imagen_url}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none'">`
                                    : `<span style="font-size:20px;color:var(--text-dim);">📦</span>`
                                }
                            </td>
                            <td><strong>${
                              p.nombre
                            }</strong><br><small class="text-dim">${
                              p.descripcion || ""
                            }</small></td>
                            <td>${p.tienda_origen || "—"}</td>
                            <td>${p.marca || "—"}</td>
                            <td><div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;">${
                              p.codigo_barras
                                ? `<svg data-barcode="${p.codigo_barras}" style="width:110px; height:30px; display:block; margin:0 auto;" title="${p.codigo_barras}"></svg>`
                                : ""
                            }<code style="background:var(--bg-input);padding:2px 8px;border-radius:4px;color:var(--accent);font-size:12px;display:block;min-width:110px;text-align:center;word-break:break-all;">${
                              p.codigo_barras || "Sin código"
                            }</code></div></td>
                            <td>${formatearMoneda(p.precio)}</td>
                            <td><span class="${
                              p.stock === 0 ? "text-danger" : "text-warning"
                            }">${p.stock}</span></td>
                            <td><span class="badge bg-secondary">${
                              p.categoria || "otros"
                            }</span></td>
                            <td>
                                <button onclick="abrirEtiquetaProducto('${
                                  p.id
                                }')" class="btn btn-outline-light btn-sm" title="Ver e imprimir etiqueta">🏷️</button>
                                <button onclick="descargarEtiquetas('${
                                  p.id
                                }')" class="btn btn-outline-light btn-sm" title="Descargar solo la etiqueta de este producto para imprimir en tu impresora">⬇️</button>
                                <button onclick="editarProducto('${
                                  p.id
                                }')" class="btn btn-outline-warning btn-sm">✏️</button>
                                <button onclick="pedirEliminar('${
                                  p.id
                                }','producto')" class="btn btn-outline-danger btn-sm">🗑️</button>
                            </td>
                        </tr>
                    `;
}

// Actualiza solo la fila editada (misma posición), sin reordenar la lista.
async function reemplazarFilaProducto(id) {
  if (!id) return;
  const { data, error } = await window.supabase
    .from("productos")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return;
  const tr = document.querySelector(`#listaProductos tr[data-prod-id="${id}"]`);
  if (tr) {
    tr.outerHTML = renderFilaProducto(data);
    renderBarcodesProductos();
  } else {
    cargarProductos();
  }
}

async function cargarProductos() {
  const container = document.getElementById("listaProductos");
  if (!container) return;

  const tabProductos = document.getElementById("tab-productos");
  if (tabProductos && tabProductos.style.display === "none") {
    return;
  }

  container.innerHTML =
    '<div class="text-center text-dim py-3">Cargando...</div>';

  try {
    if (!window.supabase || typeof window.supabase.from !== "function") {
      setTimeout(cargarProductos, 500);
      return;
    }

    let queryProductos = window.supabase
      .from("productos")
      .select("*")
      .order("nombre", { ascending: true });

    const busquedaProducto = document
      .getElementById("buscarProducto")
      ?.value.trim();
    if (busquedaProducto)
      queryProductos = queryProductos.ilike("nombre", `%${busquedaProducto}%`);

    const { data, error } = await queryProductos;
    if (error) throw error;

    // Orden alfabético A→Z por nombre (con acentos): los nuevos productos
    // aparecen en su lugar alfabético en cada carga.
    data.sort((a, b) =>
      String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"),
    );

    if (!data || !data.length) {
      container.innerHTML =
        '<p class="text-center text-dim py-3">📦 No hay productos</p>';
      cargarSelectProductosInventario();
      return;
    }

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead><tr><th>Imagen</th><th>Producto</th><th>Origen</th><th>Marca</th><th>Código</th><th>Precio</th><th>Stock</th><th>Categoría</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${data.map(renderFilaProducto).join("")}
                </tbody>
            </table>
        `;
    renderBarcodesProductos();
    cargarSelectProductosInventario();
  } catch (error) {
    console.error("Error cargando productos:", error);
    container.innerHTML = `
            <div class="text-center text-danger py-3">
                <p>❌ Error al cargar productos</p>
                <button onclick="cargarProductos()" class="btn btn-warning btn-sm">Reintentar</button>
            </div>
        `;
  }
}

function mostrarFormProducto(data = null) {
  const container = document.getElementById("formProductoContainer");
  if (!container) return;

  container.style.display = "flex";
  container.scrollIntoView({ behavior: "smooth" });

  if (data) {
    productoEditando = data;
    const titulo = document.getElementById("formProductoTitulo");
    if (titulo) titulo.textContent = "✏️ Editar Producto";
    const submitBtn = document.querySelector(
      '#formProducto button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Actualizar";

    setValue("prodId", data.id);
    setValue("prodNombre", data.nombre);
    setValue("prodMarca", data.marca || "");
    setValue("prodPrecio", data.precio);
    setCategoriaProducto(data.categoria || "Otros");
    setValue("prodStock", data.stock || 0);
    setValue("prodDescripcion", data.descripcion || "");
    setValue("prodImagen", data.imagen_url || "");
    vistaPreviaImagenProducto();
    setValue("prodTienda", data.tienda_origen || "");
    setValue("prodCodigoBarras", data.codigo_barras || "");
  } else {
    productoEditando = null;
    const titulo = document.getElementById("formProductoTitulo");
    if (titulo) titulo.textContent = "➕ Agregar Producto";
    const submitBtn = document.querySelector(
      '#formProducto button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Guardar";

    const form = document.getElementById("formProducto");
    if (form) form.reset();
    vistaPreviaImagenProducto();
    setValue("prodId", "");
    setValue("prodTienda", "McAllen, Texas");
  }
}

// Asigna la categoría al select de productos. Si el valor guardado no está
// en la lista de opciones (la categoría es texto libre en la BD), la agrega
// en automático para que SIEMPRE quede visible al editar.
function setCategoriaProducto(valor) {
  const sel = document.getElementById("prodCategoria");
  if (!sel) return;
  const v = String(valor || "").trim();
  let existe = false;
  for (const o of sel.options) {
    if (o.value === v) {
      existe = true;
      break;
    }
  }
  if (!existe && v) {
    const op = document.createElement("option");
    op.value = v;
    op.textContent = v.replace(/_/g, " ");
    sel.appendChild(op);
  }
  sel.value = v;
}

// Mini vista previa en vivo de la imagen del producto (al escribir el link).
function vistaPreviaImagenProducto() {
  const wrap = document.getElementById("prodImagenPreview");
  if (!wrap) return;
  const url = (document.getElementById("prodImagen")?.value || "").trim();
  const img = document.getElementById("prodImagenMini");
  if (!url) {
    wrap.style.display = "none";
    if (img) img.removeAttribute("src");
    return;
  }
  img.src = url;
  wrap.style.display = "block";
}

// Abre la foto del producto en grande (ventana modal).
function abrirImagenProducto() {
  const url = (document.getElementById("prodImagen")?.value || "").trim();
  if (!url) {
    notificar("⚠️ Primero escribe el enlace de la imagen");
    return;
  }
  const img = document.getElementById("imgVistaPreviaImagen");
  if (!img) return;
  img.src = url;
  document.getElementById("modalVistaPreviaImagen").style.display = "flex";
}

// Cierra la ventana de la foto en grande.
function cerrarImagenProducto() {
  const modal = document.getElementById("modalVistaPreviaImagen");
  if (modal) modal.style.display = "none";
}

// Sube la foto elegida al bucket público "productos" de Supabase Storage,
// SIN redimensionar (calidad y resolución originales), y pone el enlace
// resultante en el campo prodImagen.
async function subirImagenProducto(input) {
  const archivo = input && input.files && input.files[0];
  const mensaje = document.getElementById("prodImagenSubidaMsg");
  const limpiarInput = function () {
    if (input) input.value = "";
  };
  if (!archivo) return;
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(archivo.type)) {
    notificar("❌ Solo se aceptan imágenes PNG, JPG, WEBP o GIF.", "error");
    limpiarInput();
    return;
  }
  const limiteBytes = 10 * 1024 * 1024;
  if (archivo.size > limiteBytes) {
    notificar("❌ La imagen es muy grande (máximo 10 MB).", "error");
    limpiarInput();
    return;
  }
  if (!window.supabase || typeof window.supabase.storage === "undefined") {
    notificar("❌ Supabase no está listo todavía, vuelve a intentar.", "error");
    limpiarInput();
    return;
  }
  const nombreBase = (archivo.name || "imagen").replace(/\.[^.]+$/, "").toLowerCase();
  const nombreLimpio =
    nombreBase.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "imagen";
  const ruta =
    "producto-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 8) +
    "-" +
    nombreLimpio;

  if (mensaje) {
    mensaje.textContent = "⬆️ Subiendo, no cierres la página...";
    mensaje.style.color = "var(--regio-green)";
  }
  try {
    const { error } = await window.supabase.storage
      .from("productos")
      .upload(ruta, archivo, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const URL_BASE = (window.CONFIG && window.CONFIG.SUPABASE_URL) || "";
    const url =
      URL_BASE + "/storage/v1/object/public/productos/" + ruta;
    const campo = document.getElementById("prodImagen");
    if (campo) {
      campo.value = url;
      vistaPreviaImagenProducto();
    }
    if (mensaje) mensaje.textContent = "✅ Foto subida en calidad original";
    notificar("✅ Imagen subida sin compresión.", "ok");
  } catch (err) {
    console.error("Error al subir imagen:", err);
    if (mensaje) {
      mensaje.textContent = "❌ No se pudo subir: " + (err.message || "revisa que el bucket 'productos' exista");
      mensaje.style.color = "var(--regio-red)";
    }
    notificar("❌ Error al subir la imagen: " + (err.message || ""), "error");
  } finally {
    limpiarInput();
  }
}

function ocultarFormProducto() {
  const container = document.getElementById("formProductoContainer");
  if (container) container.style.display = "none";
  productoEditando = null;
}

async function editarProducto(id) {
  try {
    const { data, error } = await window.supabase
      .from("productos")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (data) mostrarFormProducto(data);
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("Error al cargar el producto");
  }
}

async function guardarProducto(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeProducto");
  const btn = e.target.querySelector('button[type="submit"]');

  const productoId = document.getElementById("prodId").value || null;
  const esEdicion = productoId && productoId !== "";

  const datos = {
    nombre: document.getElementById("prodNombre").value.trim(),
    marca: document.getElementById("prodMarca").value.trim(),
    precio: parseFloat(document.getElementById("prodPrecio").value),
    categoria: document.getElementById("prodCategoria").value,
    descripcion: document.getElementById("prodDescripcion").value.trim(),
    imagen_url: document.getElementById("prodImagen").value.trim(),
    tienda_origen: document.getElementById("prodTienda").value.trim(),
    codigo_barras:
      document.getElementById("prodCodigoBarras").value.trim() || null,
  };

  const stockNuevo = parseInt(document.getElementById("prodStock").value) || 0;

  if (!datos.nombre || !datos.precio) {
    if (msg)
      mostrarMensaje(msg, "❌ Nombre y precio son obligatorios", "error");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Guardando...";
    }

    let result;
    let nuevoId = null;

    if (esEdicion) {
      const { data: productoActual, error: getError } = await window.supabase
        .from("productos")
        .select("stock")
        .eq("id", productoId)
        .single();

      if (getError) throw getError;

      const stockAnterior = productoActual?.stock || 0;
      const diferencia = stockNuevo - stockAnterior;

      result = await window.supabase
        .from("productos")
        .update({ ...datos, stock: stockNuevo })
        .eq("id", productoId);

      if (result.error) throw result.error;

      if (diferencia !== 0) {
        const tipo = diferencia > 0 ? "entrada" : "salida";
        await window.supabase.from("inventario").insert([
          {
            producto_id: productoId,
            tipo: tipo,
            cantidad: Math.abs(diferencia),
            descripcion: `📦 Ajuste de stock: ${
              diferencia > 0 ? "+" : ""
            }${diferencia} unidades`,
          },
        ]);
      }
    } else {
      const datosProducto = {
        ...datos,
        stock: stockNuevo,
      };

      result = await window.supabase
        .from("productos")
        .insert([datosProducto])
        .select();

      if (result.error) throw result.error;

      if (result.data && result.data.length > 0) {
        nuevoId = result.data[0].id;
      }

      if (nuevoId) {
        // Siempre registra el movimiento en el tab Inventario (aunque el stock sea 0),
        // para que el producto nuevo aparezca en sus columnas.
        await window.supabase.from("inventario").insert([
          {
            producto_id: nuevoId,
            tipo: "entrada",
            cantidad: stockNuevo,
            descripcion:
              stockNuevo > 0
                ? "📦 Stock inicial al crear producto"
                : "📦 Producto creado sin stock",
          },
        ]);
      }
    }

    if (msg) mostrarMensaje(msg, "✅ Producto guardado correctamente", "exito");
    ocultarFormProducto();
    if (esEdicion) {
      // Edición: actualiza la fila en su mismo lugar (no reordena).
      await reemplazarFilaProducto(productoId);
    } else {
      // Creación: recarga para colocarlo en su lugar alfabético.
      cargarProductos();
    }
    cargarInventario();
  } catch (error) {
    console.error("Error:", error);
    if (msg) mostrarMensaje(msg, "❌ " + error.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = esEdicion ? "💾 Actualizar" : "💾 Guardar";
    }
  }
}

// ============================================
// 2. BÚSQUEDA POR CÓDIGO DE BARRAS
// ============================================

async function buscarPorCodigoBarras() {
  const input = document.getElementById("inputCodigoBarras");
  const resultado = document.getElementById("resultadoBusquedaCodigo");
  if (!input || !resultado) return;

  const codigo = input.value.trim();
  if (!codigo) {
    resultado.innerHTML =
      '<span class="text-dim">📷 Escanea un código de barras</span>';
    return;
  }

  await procesarCodigoLeido(codigo);
}

// Procesa un código leído (ya sea desde el textbox del escáner o desde el
// ESCÁNER GLOBAL sin necesidad de hacer clic en el campo). Abre la edición si
// el producto ya existe y, si no se reconoce, muestra el mismo mensaje que el
// campo del escáner.
async function procesarCodigoLeido(codigo) {
  const input = document.getElementById("inputCodigoBarras");
  const resultado = document.getElementById("resultadoBusquedaCodigo");

  codigo = String(codigo || "").trim();
  if (!codigo) return;

  if (resultado) resultado.innerHTML = '<span class="text-dim">Buscando...</span>';

  try {
    const { data, error } = await window.supabase
      .from("productos")
      .select("*")
      .eq("codigo_barras", codigo)
      .maybeSingle();

    if (data) {
      // AUTO-LLENADO DEL ESCÁNER: el código ya existe, abre SU edición
      // con nombre, marca, código de barras, precio, stock y descripción.
      if (input) input.value = "";
      if (resultado) resultado.innerHTML = "";
      if (typeof editarProducto === "function") {
        editarProducto(data.id);
      } else if (resultado) {
        resultado.innerHTML = `<span class="text-success">✅ ${data.nombre}: ${formatearMoneda(
          data.precio,
        )} · Stock ${data.stock} [${data.codigo_barras}]</span>`;
      }
      return;
    }

    if (error) throw error;

    // CÓDIGO "CREADOR DE PRODUCTO": NOMBRE|MARCA|PRECIO|CATEGORÍA
    // Se genera desde la web recomendada (Code 128) e inserta automáticamente
    // los datos en el formulario: producto, marca, precio y categoría.
    // La imagen y el stock se agregan manualmente antes de guardar.
    const partes = codigo.split("|").map((p) => p.trim());
    if (partes.length >= 4 && partes[0]) {
      const nombre = partes[0];
      const marca = partes[1] || "";
      const precio =
        parseFloat(String(partes[2] || "").replace(/[^0-9.]/g, "")) || 0;
      const catRaw = String(partes[3] || "").toLowerCase();
      const categoria = catRaw.includes("perfume")
        ? "Perfumes"
        : catRaw.includes("cuidado")
          ? "Cuidado Personal"
          : "Otros";

      mostrarFormProducto(null);
      setValue("prodNombre", nombre);
      setValue("prodMarca", marca);
      setValue("prodPrecio", precio || "");
      setCategoriaProducto(categoria);
      setValue("prodCodigoBarras", codigo);
      setValue("prodStock", "0");
      setValue("prodImagen", "");
      setValue("prodTienda", "McAllen, Texas");

      if (input) input.value = "";
      if (resultado)
        resultado.innerHTML = `<span class="text-success">✅ Código leído: <strong>${nombre}</strong> · ${marca} · ${formatearMoneda(
          precio,
        )} · ${categoria}. Agrega imagen y stock y presiona Guardar.</span>`;
      return;
    }

    if (resultado)
      resultado.innerHTML = `<span class="text-danger">❌ Producto no encontrado: ${codigo}</span>`;
    if (input) {
      input.value = "";
      input.focus();
    }
    if (!input && typeof mostrarModalAlerta === "function") {
      mostrarModalAlerta(
        `❌ Producto no encontrado: ${codigo}. Agrega el producto manualmente.`,
      );
    }
  } catch (error) {
    console.error("Error:", error);
    if (resultado)
      resultado.innerHTML = '<span class="text-danger">❌ Error al buscar</span>';
  }
}

// ============================================
// ETIQUETAS IMPRIMIBLES CON CÓDIGO DE BARRAS
// ============================================

// Dibuja los códigos de barras (SVG) de los renglones visibles en Productos.
function renderBarcodesProductos() {
  if (!window.JsBarcode) return;
  document
    .querySelectorAll("#listaProductos svg[data-barcode]")
    .forEach((el) => {
      const codigo = el.getAttribute("data-barcode");
      if (!codigo) return;
      try {
        JsBarcode(el, codigo, {
          format: "CODE128",
          width: 1.6,
          height: 30,
          displayValue: false,
          margin: 0,
          background: "#212529",
          lineColor: "#fff",
        });
      } catch (e) {
        console.warn("No se pudo dibujar el código:", codigo, e);
      }
    });
}

// Dígito verificador EAN-13 (para los 12 primeros dígitos).
function calcularDigitoVerificadorEAN13(digitos12) {
  let suma = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(digitos12.charAt(i), 10);
    if (isNaN(d)) return "";
    suma += i % 2 === 0 ? d : d * 3;
  }
  return String((10 - (suma % 10)) % 10);
}

// Botón ⚙️ del formulario: genera el siguiente código EAN-13 (prefijo 750).
// Si el campo ya trae un código, pide confirmación porque al guardar se
// reemplazaría el existente (las etiquetas impresas usarían el nuevo).
async function generarCodigoBarrasProducto() {
  const input = document.getElementById("prodCodigoBarras");
  if (!input) return;
  const actual = String(input.value || "").trim();
  const continuar = () => _generarCodigoBarrasSiguiente(input);
  if (actual) {
    modalConfirmar(
      "⚠️ Este producto ya tiene el código de barras " +
        actual +
        ". Si generas uno nuevo y guardas el producto, este código será REEMPLAZADO: las etiquetas que imprimas a partir de ahora usarán el código nuevo y el actual quedará sin uso. ¿Continuar?",
      continuar,
    );
  } else {
    continuar();
  }
}

async function _generarCodigoBarrasSiguiente(input) {
  try {
    const { data, error } = await window.supabase
      .from("productos")
      .select("codigo_barras");
    if (error) throw error;
    let maxPre = 749999999999;
    (data || []).forEach((p) => {
      const s = String(p.codigo_barras || "").replace(/\D/g, "");
      if (s.length === 13) {
        const n = parseInt(s.slice(0, 12), 10);
        if (!isNaN(n) && n > maxPre) maxPre = n;
      }
    });
    const base12 = String(maxPre + 1);
    input.value = base12 + calcularDigitoVerificadorEAN13(base12);
    input.focus();
  } catch (e) {
    console.error("Error generando código:", e);
    notificar("❌ No se pudo generar el código de barras", "error");
  }
}

let etiquetaActiva = null;

// Abre el modal con la etiqueta del producto (nombre + código + precio).
function abrirEtiquetaProducto(id) {
  const modal = document.getElementById("modalEtiqueta");
  const contenedor = document.getElementById("contenidoEtiqueta");
  if (!modal || !contenedor) return;

  window.supabase
    .from("productos")
    .select("*")
    .eq("id", id)
    .single()
    .then(({ data, error }) => {
      if (error || !data) {
        notificar("❌ No se pudo cargar el producto", "error");
        return;
      }
      etiquetaActiva = data;
      actualizarCentroUI();
      contenedor.innerHTML = `
        <div class="etiqueta-producto">
          <div class="etiqueta-nombre">${data.nombre || ""}</div>
          ${data.marca ? `<div class="etiqueta-marca">${data.marca}</div>` : ""}
          <div class="etiqueta-precio">${formatearMoneda(data.precio)}</div>
          ${
            data.categoria
              ? `<div class="etiqueta-categoria">${String(data.categoria).replace(/_/g, " ")}</div>`
              : ""
          }
          ${data.codigo_barras ? '<svg id="etiquetaSVG"></svg>' : ""}
          <div class="etiqueta-codigo">${data.codigo_barras || "Sin código"}</div>
        </div>
      `;
      if (data.codigo_barras && window.JsBarcode) {
        try {
          JsBarcode("#etiquetaSVG", data.codigo_barras, {
            format: "CODE128",
            width: 2,
            height: 80,
            displayValue: false,
            margin: 4,
            background: "#ffffff",
            lineColor: "#000000",
          });
        } catch (e) {
          console.warn("Barcode error:", e);
        }
      }
      modal.style.display = "flex";
    });
}

// Imprime solo la etiqueta (el resto de la página queda oculto en la impresión).
function imprimirEtiqueta() {
  document.body.classList.add("imprimiendoEtiqueta");
  window.onafterprint = function () {
    document.body.classList.remove("imprimiendoEtiqueta");
  };
  window.print();
}

function cerrarEtiqueta() {
  const modal = document.getElementById("modalEtiqueta");
  if (modal) modal.style.display = "none";
}

function escapeHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Genera el SVG del código de barras (CODE128) con la librería ya cargada,
// pero lo devuelve como marcado para incrustarlo en el archivo descargado.
function construirSVGCodigo(codigo) {
  if (!codigo || !window.JsBarcode) return "";
  const temporal = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  temporal.setAttribute("viewBox", "0 0 1 1");
  temporal.style.position = "absolute";
  document.body.appendChild(temporal);
  try {
    JsBarcode(temporal, String(codigo), {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: false,
      margin: 4,
      background: "#ffffff",
      lineColor: "#000000",
    });
    return temporal.outerHTML;
  } catch (e) {
    console.warn("Barcode error:", e);
    return "";
  } finally {
    temporal.remove();
  }
}

// Descarga un archivo HTML imprimible con las etiquetas (código de barras,
// nombre, marca, precio y categoría) de TODOS los productos o de uno solo,
// para imprimirlas en una impresora convencional (USB/red) desde el escritorio.
function aBase64UTF8(texto) {
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Rasteriza el código de barras (CODE128) de JsBarcode a una imagen PNG
// (canvas) para poder incrustarlo en el PDF sin depender de fuentes externas.
function codigoBarraDataURL(codigo) {
  return new Promise(function (resolve) {
    try {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 1 1");
      svg.style.position = "absolute";
      document.body.appendChild(svg);
      JsBarcode(svg, String(codigo), {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: false,
        margin: 4,
        background: "#ffffff",
        lineColor: "#000000",
      });
      const fuente = new XMLSerializer().serializeToString(svg);
      svg.remove();
      const url64 = "data:image/svg+xml;base64," + aBase64UTF8(fuente);
      const img = new Image();
      img.onload = function () {
        const escala = 3;
        const canvas = document.createElement("canvas");
        canvas.width = img.width * escala;
        canvas.height = img.height * escala;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          w: img.width,
          h: img.height,
        });
      };
      img.onerror = function () {
        resolve(null);
      };
      img.src = url64;
    } catch (err) {
      console.warn("Barcode raster:", err);
      resolve(null);
    }
  });
}

// Genera el PDF "etiquetas-productos.pdf" con jsPDF: una hoja A4 con las
// etiquetas (código de barras, nombre, marca, precio y categoría) lista
// para imprimir en una impresora normal.
async function generarPDFEtiquetas(productos) {
  if (!window.jspdf || !window.jspdf.jsPDF) return false;
  try {
    const doc = new window.jspdf.jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const margen = 10;
    const cols = 2;
    const filas = 3;
    const gap = 6;
    const anc = (ancho - margen * 2 - (cols - 1) * gap) / cols;
    const alt = (alto - margen * 2 - (filas - 1) * gap) / filas;

    const barras = await Promise.all(
      productos.map(function (p) {
        return codigoBarraDataURL(p.codigo_barras);
      })
    );

    doc.setDrawColor(170);
    doc.setLineWidth(0.3);

    productos.forEach(function (p, idx) {
      const fila = Math.floor(idx / cols);
      const col = idx % cols;
      const pagina = Math.floor(fila / filas);
      if (pagina > 0) doc.addPage();
      const y0 = margen + (fila % filas) * (alt + gap);
      const x0 = margen + col * (anc + gap);
      const cx = x0 + anc / 2;

      doc.roundedRect(x0, y0, anc, alt, 2, 2, "S");

      // Nombre centrado
      let y = y0 + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0);
      const lineasNombre = doc.splitTextToSize(p.nombre || "", anc - 16);
      doc.text(lineasNombre.slice(0, 3), cx, y, { align: "center" });
      y += Math.min(lineasNombre.length, 3) * 4.4 + 3;

      // Marca centrada
      if (p.marca) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(String(p.marca), cx, y, { align: "center" });
        y += 8;
      }

      // Precio centrado y destacado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(formatearMoneda(p.precio), cx, y, { align: "center" });
      y += 10;

      // Categoría centrada
      if (p.categoria) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(85);
        doc.text(String(p.categoria).replace(/_/g, " ").toUpperCase(), cx, y, {
          align: "center",
        });
        doc.setTextColor(0);
        y += 6;
      }

      // Código de barras centrado
      const barra = barras[idx];
      if (barra) {
        let anchoBarra = anc - 20;
        let altoBarra = anchoBarra * (barra.h / barra.w);
        const maxAlto = Math.min(20, y0 + alt - y - 6);
        if (altoBarra > maxAlto) {
          altoBarra = maxAlto;
          anchoBarra = altoBarra * (barra.w / barra.h);
        }
        doc.addImage(
          barra.dataUrl,
          "PNG",
          cx - anchoBarra / 2,
          y,
          anchoBarra,
          altoBarra
        );
        y += altoBarra + 4;
      } else {
        y += 6;
      }

      // Número del código centrado bajo el código de barras
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(String(p.codigo_barras), cx, y, { align: "center" });
    });

    doc.save("etiquetas-productos.pdf");
    notificar("✅ PDF de etiquetas descargado. Imprímelo en tu impresora normal.", "ok");
    return true;
  } catch (err) {
    console.warn("PDF error:", err);
    notificar("⚠️ No se pudo generar el PDF; se descargó el HTML imprimible.", "error");
    return false;
  }
}

// Genera el HTML imprimible de las etiquetas (respaldo si no hay jsPDF).
function descargarEtiquetasHTML(productos) {
  const etiquetas = productos
    .map(function (p) {
      const svg = construirSVGCodigo(p.codigo_barras);
      return `
          <div class="etiqueta">
            <div class="et-nombre">${escapeHtml(p.nombre)}</div>
            ${
              p.marca
                ? `<div class="et-marca">${escapeHtml(p.marca)}</div>`
                : ""
            }
            <div class="et-precio">${formatearMoneda(p.precio)}</div>
            ${
              p.categoria
                ? `<div class="et-categoria">${escapeHtml(String(p.categoria).replace(/_/g, " "))}</div>`
                : ""
            }
            ${svg}
            <div class="et-codigo">${escapeHtml(p.codigo_barras)}</div>
          </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Etiquetas de productos</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; margin: 0; padding: 16px; }
  .cabecera { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 13px; color: #333; }
  .grid { display: flex; flex-wrap: wrap; gap: 10px; }
  .etiqueta {
    width: 170px;
    min-height: 100px;
    border: 1px dashed #999;
    padding: 8px;
    text-align: center;
    page-break-inside: avoid;
    break-inside: avoid;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  .et-nombre { font-size: 12px; font-weight: 700; margin-bottom: 4px; word-break: break-word; }
  .et-marca { font-size: 11px; font-weight: 600; margin-bottom: 3px; }
  .et-precio { font-size: 20px; font-weight: 700; margin: 4px 0; }
  .et-categoria { font-size: 10px; font-weight: 600; color: #444; text-transform: uppercase; letter-spacing: .5px; }
  .etiqueta svg { display: block; width: 100% !important; height: auto !important; margin: 4px auto; }
  .et-codigo { font-size: 10px; letter-spacing: 1px; margin-top: 2px; }
  @media print {
    .cabecera { display: none; }
    body { padding: 0; }
    .grid { gap: 6px !important; }
  }
</style>
</head>
<body onload="window.print()">
  <div class="cabecera"><strong>Etiquetas de productos</strong><span>${productos.length} etiqueta(s)</span></div>
  <div class="grid">${etiquetas}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "etiquetas-productos.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () {
    URL.revokeObjectURL(a.href);
  }, 5000);
  notificar("✅ Archivo de etiquetas descargado. Ábrelo y con Ctrl+P imprímelo en tu impresora.", "ok");
}

// Descarga las etiquetas en PDF (o HTML si jsPDF no está cargado).
async function descargarEtiquetas(id) {
  let consulta = window.supabase
    .from("productos")
    .select("*")
    .order("nombre");
  if (id) consulta = consulta.eq("id", id);
  const { data, error } = await consulta;
  if (error) {
    notificar("❌ No se pudieron cargar los productos", "error");
    return;
  }
  const productos = (Array.isArray(data) ? data : []).filter(
    (p) => p && p.codigo_barras
  );
  if (!productos.length) {
    notificar("⚠️ No hay productos con código de barras.", "error");
    return;
  }
  const pdfOk = await generarPDFEtiquetas(productos);
  if (!pdfOk) descargarEtiquetasHTML(productos);
}

function codificarCp1252(texto) {
  const especiales = new Map([
    [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
    [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
    [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
    [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
    [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
    [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
    [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
  ]);
  const bytes = [];
  for (const ch of String(texto)) {
    const c = ch.codePointAt(0);
    if (c < 0x80) bytes.push(c);
    else if (c >= 0xa0 && c <= 0xff) bytes.push(c);
    else if (especiales.has(c)) bytes.push(especiales.get(c));
    else bytes.push(0x3f);
  }
  return bytes;
}

// Centro horizontal de la etiqueta en puntos. Se calibra a ojo sobre el papel
// con la "Prueba de centrado": así no depende del dpi ni del ancho imprimible
// real de la impresora (el valor se guarda y se reutiliza en todas las etiquetas).
let centroEtiquetaX = parseInt(localStorage.getItem("etiqueta_centro_x") || "", 10);
if (!centroEtiquetaX || centroEtiquetaX < 60 || centroEtiquetaX > 300) centroEtiquetaX = 176;

function actualizarCentroUI() {
  const el = document.getElementById("centroEtiquetaVal");
  if (el) el.textContent = String(centroEtiquetaX);
}

function ajustarCentro(delta) {
  centroEtiquetaX = Math.min(300, Math.max(60, centroEtiquetaX + delta));
  localStorage.setItem("etiqueta_centro_x", String(centroEtiquetaX));
  actualizarCentroUI();
}

// Etiqueta de calibración: línea vertical gruesa en el centro actual con dos
// referencias finas a ±6 pts. Si la línea no queda al centro del papel, ajustar
// con ◂/▸ y volver a imprimir la prueba.
function construirBytesPruebaCentrado(cX) {
  const lineas = [
    "SIZE 50 mm, 60 mm",
    "GAP 2 mm, 0 mm",
    "CLS",
    "LINE " + (cX - 6) + ",16," + (cX - 6) + ",280,1",
    "LINE " + (cX + 6) + ",16," + (cX + 6) + ",280,1",
    "LINE " + cX + ",16," + cX + ",280,3",
    'TEXT ' + cX + ',120,"3",0,1,1,1,"' + cX + '"',
    "PRINT 1,1",
  ];
  return new Uint8Array(codificarCp1252(lineas.join("\r\n") + "\r\n"));
}

// Regla de calibración impresa: marcas cada 16 pts (más largas cada 64) y la
// posición de centro actual marcada con la línea gruesa. Sirve para medir con
// una foto las posiciones reales (texto a la izquierda o derecha, barcode)
// y ajustar el centrado sin adivinar el ancho de cada fuente.
function construirBytesReglaCalibracion() {
  const cX = centroEtiquetaX;
  const lineas = ["SIZE 50 mm, 60 mm", "GAP 2 mm, 0 mm", "CLS"];
  for (let x = 8; x <= 344; x += 16) {
    lineas.push("LINE " + x + ",20," + x + ",32,1");
  }
  for (let x = 64; x <= 320; x += 64) {
    lineas.push("LINE " + x + ",20," + x + ",40,1");
  }
  lineas.push("LINE " + cX + ",20," + cX + ",40,3");
  const etiquetas = [0, 64, 128, 176, 192, 256, 320, 352];
  etiquetas.forEach((v) => {
    if (Math.abs(v - cX) < 8) return;
    lineas.push('TEXT ' + v + ',44,"1",0,1,1,"' + v + '"');
  });
  // Filas para medir el ancho por carácter de cada fuente (empiezan en x=0):
  // leer en qué marca termina cada fila y darla para afinar el centrado.
  lineas.push('TEXT 0,70,"2",0,1,1,"F2-AAAAAAAAAA"');
  lineas.push('TEXT 0,130,"3",0,1,1,"F3-AAAAAAAAAA"');
  lineas.push('TEXT 0,190,"4",0,1,1,"F4-AAAAAAA"');
  lineas.push('TEXT 0,250,"5",0,1,1,"F5-AAAAAA"');
  lineas.push("PRINT 1,1");
  return new Uint8Array(codificarCp1252(lineas.join("\r\n") + "\r\n"));
}

async function imprimirPruebaRegla() {
  if (!navigator.bluetooth) {
    notificar("❌ Este navegador no soporta Web Bluetooth. Usa Chrome o Edge.", "error");
    return;
  }
  const data = construirBytesReglaCalibracion();
  try {
    const { server, target } = await conectarImpresoraBluetooth();
    await escribirEnImpresora(server, target, data);
    notificar("📏 Regla de calibración enviada. Sácale una foto bien iluminada (con todo el papel visible) y envíala para ajustar el centrado.");
  } catch (error) {
    if (error && error.name === "NotFoundError") {
      notificar("❌ No se pudo conectar con la impresora.", "error");
    } else {
      notificar("❌ Error en la regla: " + (error.message || error), "error");
    }
  }
}

function construirBytesEtiqueta(proto, datos, texto) {
  if (proto === "escpos") {
    const out = [];
    const a = (...arrs) => { for (const x of arrs) out.push(...x); };
    const ln = (t) => codificarCp1252(t).concat([0x0a]);
    a([0x1b, 0x40]); // ESC @    inicializa la impresora
    a([0x1b, 0x61, 0x01]); // ESC a 1   centrar
    a(ln(datos.nombre));
    if (datos.marca) a(ln(datos.marca));
    a(ln(datos.precio));
    if (datos.categoria) a(ln(datos.categoria));
    if (datos.codigo) a(ln(datos.codigo));
    a([0x1b, 0x64, 0x06]); // ESC d 6   avance de línea
    a([0x1d, 0x56, 0x42, 0x00]); // GS V B 0   corte parcial
    return new Uint8Array(out);
  }
  if (proto === "tspl") {
    // IMPORTANTE: esta impresora IGNORA el flag de alineación del TEXT (aunque
    // sea "1"): el x indicado es el borde IZQUIERDO de la línea. Por eso cada
    // línea se centra a mano: x = centro − ancho/2 (ancho = caracteres × FONT_W).
    // FONT_W son valores temporales; se afinan con la "Regla de calibración"
    // (filas F2/F3/F4/F5) anotando en qué marca termina cada fila.
    const cX = centroEtiquetaX;
    const ETIQUETA_ANCHO = "50 mm, 60 mm"; // real de la etiqueta (medida con regla)
    const FONT_W = { "1": 12, "2": 13, "3": 24, "4": 30, "5": 28 }; // pts/carácter (afinar con la regla)
    const ANCHO_PTS = 352; // 50 mm reales a 180 dpi
    const tsplTexto = (t) =>
      String(t || "").replace(/"/g, "'").replace(/\s+/g, " ").trim();
    const maxChars = (f) => Math.max(1, Math.floor((ANCHO_PTS - 8) / (FONT_W[f] || 16)));
    const centrarX = (s, f) => cX - Math.round(((FONT_W[f] || 16) * s.length) / 2);
    // Divide el texto en líneas completas (por espacios) que quepan en la fuente,
    // como máximo maxLineas; si se acaba el espacio, recorta la última.
    const envolver = (t, f, maxLineas) => {
      const limpio = tsplTexto(t);
      if (!limpio) return [];
      const m = maxChars(f);
      const lineas = [];
      let linea = "";
      for (const p of limpio.split(" ")) {
        const palabra = p.slice(0, m);
        const candidata = linea ? linea + " " + palabra : palabra;
        if (candidata.length <= m) {
          linea = candidata;
        } else {
          lineas.push(linea);
          linea = palabra;
          if (lineas.length === maxLineas) return lineas;
        }
      }
      if (linea) lineas.push(linea);
      return lineas.slice(0, maxLineas);
    };
    const nombreLineas = envolver(datos.nombre, "3", 2);
    const marcaL = tsplTexto(datos.marca).slice(0, maxChars("2"));
    const catL = tsplTexto(datos.categoria).slice(0, maxChars("2"));
    let precioL = "$" + String(datos.precio || "").replace(/MX\$\s*/gi, "").replace(/^\$\s*/, "");
    const precioFont = precioL.length <= maxChars("5") ? "5" : "3";

    const lineas = ["SIZE " + ETIQUETA_ANCHO, "GAP 2 mm, 0 mm", "CLS"];
    let y = 8;
    const NOMBRE_STEP = 80;
    (nombreLineas.length ? nombreLineas : [""]).forEach((nl, i) => {
      lineas.push('TEXT ' + centrarX(nl, "3") + ',' + (y + i * NOMBRE_STEP) + ',"3",0,1,1,0,"' + nl + '"');
    });
    y += nombreLineas.length * NOMBRE_STEP + 8;
    if (marcaL) {
      lineas.push('TEXT ' + centrarX(marcaL, "2") + ',' + y + ',"2",0,1,1,0,"' + marcaL + '"');
      y += 44;
    }
    lineas.push('TEXT ' + centrarX(precioL, precioFont) + ',' + y + ',"' + precioFont + '",0,1,1,0,"' + precioL + '"');
    y += 56;
    if (catL) {
      lineas.push('TEXT ' + centrarX(catL, "2") + ',' + y + ',"2",0,1,1,0,"' + catL + '"');
      y += 44;
    }
    if (datos.codigo) {
      // CODE128: ~11 módulos por símbolo (inicio+dato+check+fin) a narrow=1
      // (dos veces más angosto: el código cabe siempre y el error de centrado
      // queda en ±1 módulo, imperceptible). x se calcula para centrar en cX.
      const anchoAprox = (String(datos.codigo).length + 3) * 11;
      const xBarra = Math.max(4, cX - Math.round(anchoAprox / 2));
      lineas.push('BARCODE ' + xBarra + ',' + (y + 8) + ',"128",80,1,0,2,1,"' + datos.codigo + '"');
    }
    // Marca temporal de versión: se quita cuando se confirme.
    lineas.push('TEXT 4,392,"1",0,1,1,"C' + cX + ' 50x60"');
    lineas.push("PRINT 1,1");
    return new Uint8Array(codificarCp1252(lineas.join("\r\n") + "\r\n"));
  }
  return new Uint8Array(codificarCp1252(texto));
}

// Envía la etiqueta a una impresora térmica de etiquetas por Web Bluetooth.
// Detecta automáticamente el servicio/característica escribible de la P1_BAB3
// u otra impresora genérica (prefiere Nordic UART si está disponible).
async function enviarEtiquetaBluetooth() {
  if (!navigator.bluetooth) {
    notificar("❌ Este navegador no soporta Web Bluetooth. Usa Chrome o Edge.", "error");
    return;
  }
  if (!etiquetaActiva) {
    notificar("❌ Primero abre la etiqueta de un producto.", "error");
    return;
  }
  const nombre = etiquetaActiva.nombre || "";
  const marca = etiquetaActiva.marca || "";
  const codigo = etiquetaActiva.codigo_barras || "";
  const precio = formatearMoneda(etiquetaActiva.precio);
  const categoria = etiquetaActiva.categoria || "";
  const texto =
    nombre +
    (marca ? "\n" + marca : "") +
    (codigo ? "\n" + codigo : "") +
    "\n" +
    precio +
    "\n\n";
  const proto = (document.getElementById("protoEtiqueta") || { value: "tspl" }).value || "tspl";
  const data = construirBytesEtiqueta(
    proto,
    { nombre: nombre.split("\n")[0], marca: marca, codigo: codigo, precio: precio, categoria: categoria },
    texto
  );

  try {
    const { server, target, diag } = await conectarImpresoraBluetooth();
    await escribirEnImpresora(server, target, data);
    window._bluetoothDiag =
      "SERVICIOS / CARACTERÍSTICAS DE LA IMPRESORA:\n" +
      diag +
      "\n\nPROTOCOLO: " +
      proto +
      "\nENVIANDO A:\n" +
      target.svc +
      " | " +
      target.uuid +
      "\nbytes: " +
      data.length +
      "  hex: " +
      Array.from(data.slice(0, 12))
        .map((x) => x.toString(16).padStart(2, "0"))
        .join(" ") +
      "\ncontenido: " +
      texto.replace(/\n/g, " | ");
    console.log("BLUETOOTH_DIAG\n" + window._bluetoothDiag);
    notificar("✅ Etiqueta enviada a la impresora por Bluetooth (protocolo " + proto + ").");
  } catch (error) {
    if (error && error.name === "NotFoundError") {
      notificar("❌ No se pudo conectar con la impresora.", "error");
    } else {
      notificar("❌ Error al enviar por Bluetooth: " + (error.message || error), "error");
    }
  }
}

// Imprime una etiqueta de calibración de centrado. Si la línea vertical gruesa
// no queda al centro del papel, ajustar con ◂/▸ (cambia y guarda el centro) y
// volver a imprimir la prueba hasta que quede justo en medio.
async function imprimirPruebaCentrado() {
  if (!navigator.bluetooth) {
    notificar("❌ Este navegador no soporta Web Bluetooth. Usa Chrome o Edge.", "error");
    return;
  }
  const data = construirBytesPruebaCentrado(centroEtiquetaX);
  try {
    const { server, target } = await conectarImpresoraBluetooth();
    await escribirEnImpresora(server, target, data);
    notificar("🖨️ Prueba de centrado enviada. Si la línea vertical no queda en medio, usa ◂/▸ y vuelve a imprimir la prueba.");
  } catch (error) {
    if (error && error.name === "NotFoundError") {
      notificar("❌ No se pudo conectar con la impresora.", "error");
    } else {
      notificar("❌ Error en la prueba: " + (error.message || error), "error");
    }
  }
}

// Conecta por Web Bluetooth y localiza la característica escribible de la
// impresora (prefiere Nordic UART, luego los UUID genéricos de térmicas BLE).
async function conectarImpresoraBluetooth() {
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART
      "000018f0-0000-1000-8000-00805f9b34fb",
      "49535343-fe7d-4ae5-8fa9-9fafd205e455", // RedBear BLE
      "0000ff00-0000-1000-8000-00805f9b34fb", // impresoras térmicas genéricas
      "0000ffe0-0000-1000-8000-00805f9b34fb", // impresoras térmicas genéricas
      "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // perfil "FMP" de impresoras BLE
      "0000feb3-0000-1000-8000-00805f9b34fb", // impresoras BLE (varios clones)
    ],
  });
  const server = await device.gatt.connect();

  const PREFER_SVC = [
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    "0000ff00-0000-1000-8000-00805f9b34fb",
    "0000ffe0-0000-1000-8000-00805f9b34fb",
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    "0000feb3-0000-1000-8000-00805f9b34fb",
    "000018f0-0000-1000-8000-00805f9b34fb",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  ];
  const PREFER_CHAR = [
    "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
    "0000ff01-0000-1000-8000-00805f9b34fb",
    "0000ffe1-0000-1000-8000-00805f9b34fb",
    "0000ff02-0000-1000-8000-00805f9b34fb",
    "0000ffe2-0000-1000-8000-00805f9b34fb",
    "0000fff1-0000-1000-8000-00805f9b34fb",
  ];

  // Enumerar TODOS los servicios/características accesibles y guardar el diagnóstico.
  const writables = [];
  for (const suuid of PREFER_SVC) {
    let svc, chars;
    try {
      svc = await server.getPrimaryService(suuid);
      chars = await svc.getCharacteristics();
    } catch (e) {
      continue;
    }
    for (const c of chars) {
      writables.push({ svc: String(suuid).toLowerCase(), uuid: String(c.uuid).toLowerCase(), props: c.properties });
    }
  }
  try {
    const allSvcs = await server.getPrimaryServices();
    for (const s of allSvcs) {
      let chars;
      try {
        chars = await s.getCharacteristics();
      } catch (e) {
        continue;
      }
      for (const c of chars) {
        const u = String(c.uuid).toLowerCase();
        if (!writables.some((w) => w.uuid === u)) {
          writables.push({ svc: String(s.uuid).toLowerCase(), uuid: u, props: c.properties });
        }
      }
    }
  } catch (e) {
    /* opcional */
  }

  const diag = writables
    .map(
      (w) =>
        w.svc +
        " | " +
        w.uuid +
        " | write:" +
        w.props.write +
        " woR:" +
        w.props.writeWithoutResponse +
        " notify:" +
        w.props.notify
    )
    .join("\n");

  // Elegir objetivo: UUID conocido de impresora -> write con respuesta -> write sin respuesta.
  let target = null;
  for (const uuid of PREFER_CHAR) {
    target = writables.find((w) => w.uuid === uuid && (w.props.write || w.props.writeWithoutResponse));
    if (target) break;
  }
  if (!target) target = writables.find((w) => w.props.write) || writables.find((w) => w.props.writeWithoutResponse);
  if (!target) {
    throw new Error("No se encontró una característica escribible en la impresora. Abre F12 y copia BLUETOOTH_DIAG.");
  }
  return { server, target, diag };
}

// Escribe los bytes en la impresora (con respuesta y, si falla, sin respuesta).
async function escribirEnImpresora(server, target, data) {
  const svc = await server.getPrimaryService(target.svc);
  const char = await svc.getCharacteristic(target.uuid);
  try {
    if (target.props.write) {
      await char.writeValue(data);
    } else {
      await char.writeValueWithoutResponse(data);
    }
  } catch (e) {
    if (target.props.write) {
      await char.writeValueWithoutResponse(data);
    } else {
      throw e;
    }
  }
}

// ============================================
// 3. INVENTARIO
// ============================================

async function cargarSelectProductosInventario() {
  const sel = document.getElementById("movProducto");
  if (!sel) return;

  try {
    const { data } = await window.supabase
      .from("productos")
      .select("id, nombre, stock, codigo_barras")
      .order("nombre");
    sel.innerHTML = '<option value="">Selecciona un producto...</option>';
    data?.forEach((p) => {
      const codigo = p.codigo_barras ? ` [${p.codigo_barras}]` : "";
      sel.innerHTML += `<option value="${p.id}">${p.nombre}${codigo} (Stock: ${p.stock})</option>`;
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

function mostrarFormMovimiento() {
  const container = document.getElementById("formMovimientoContainer");
  if (container) {
    container.style.display = "flex";
    container.scrollIntoView({ behavior: "smooth" });
  }
  cargarSelectProductosInventario();
}

function ocultarFormMovimiento() {
  const container = document.getElementById("formMovimientoContainer");
  if (container) container.style.display = "none";
  const form = document.getElementById("formMovimiento");
  if (form) form.reset();
  document.getElementById("movId").value = "";
  const submitBtn = document.querySelector(
    '#formMovimiento button[type="submit"]',
  );
  if (submitBtn) submitBtn.textContent = "💾 Registrar";
}

async function guardarMovimiento(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeMovimiento");
  const btn = e.target.querySelector('button[type="submit"]');

  const productoId = getValue("movProducto");
  const tipo = getValue("movTipo");
  const cantidad = parseInt(getValue("movCantidad"));
  const descripcion = getValue("movDescripcion").trim();

  if (!productoId || !cantidad) {
    if (msg)
      mostrarMensaje(msg, "❌ Producto y cantidad son obligatorios", "error");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Guardando...";
    }

    const { data: productoActual, error: prodError } = await window.supabase
      .from("productos")
      .select("stock")
      .eq("id", productoId)
      .single();

    if (prodError) throw prodError;

    let stockFinal = productoActual.stock;
    if (tipo === "entrada") {
      stockFinal = productoActual.stock + cantidad;
    } else if (tipo === "salida") {
      stockFinal = productoActual.stock - cantidad;
    }
    if (stockFinal < 0) stockFinal = 0;

    const { error: insertError } = await window.supabase
      .from("inventario")
      .insert([
        {
          producto_id: productoId,
          tipo: tipo,
          cantidad: cantidad,
          descripcion: descripcion || null,
        },
      ]);

    if (insertError) throw insertError;

    await window.supabase
      .from("productos")
      .update({ stock: stockFinal })
      .eq("id", productoId);

    if (msg)
      mostrarMensaje(msg, "✅ Movimiento registrado correctamente", "exito");

    ocultarFormMovimiento();
    cargarInventario();
    cargarProductos();
  } catch (error) {
    console.error("Error:", error);
    if (msg) mostrarMensaje(msg, "❌ " + error.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "💾 Registrar";
    }
  }
}

async function cargarInventario() {
  const container = document.getElementById("listaInventario");
  if (!container) return;

  const tabInventario = document.getElementById("tab-inventario");
  if (tabInventario && tabInventario.style.display === "none") {
    return;
  }

  container.innerHTML =
    '<div class="text-center text-dim py-3">Cargando...</div>';

  try {
    const { data, error } = await window.supabase
      .from("inventario")
      .select(`*, productos (id, nombre, precio, codigo_barras, stock)`)
      .order("fecha", { ascending: false });

    if (error) {
      container.innerHTML =
        '<p class="text-danger text-center">❌ Error al cargar</p>';
      console.error("Error cargando inventario:", error);
      return;
    }

    const { data: productos, error: prodError } = await window.supabase
      .from("productos")
      .select("id, nombre, stock");

    if (prodError) {
      console.error("Error cargando productos:", prodError);
    }

    const conStock = productos?.filter((p) => p.stock > 0).length || 0;
    const sinStock = productos?.filter((p) => p.stock === 0).length || 0;

    const totalStock = document.getElementById("totalProductosStock");
    const totalSinStock = document.getElementById("totalSinStock");
    const totalMovimientos = document.getElementById("totalMovimientos");

    if (totalStock) totalStock.textContent = conStock;
    if (totalSinStock) totalSinStock.textContent = sinStock;
    if (totalMovimientos) totalMovimientos.textContent = data?.length || 0;

    cargarSelectProductosInventario();

    // Búsqueda por producto (filtro en memoria sobre el nombre del producto).
    const busquedaInventario = document
      .getElementById("buscarProductoInventario")
      ?.value.trim()
      .toLowerCase();
    const movimientosVisibles = busquedaInventario
      ? data.filter((m) =>
          String(m.productos?.nombre || "")
            .toLowerCase()
            .includes(busquedaInventario),
        )
      : data;

    if (!movimientosVisibles.length) {
      container.innerHTML = busquedaInventario
        ? '<p class="text-center text-dim py-3">🔍 Sin resultados para la búsqueda.</p>'
        : '<p class="text-center text-dim py-3">📊 No hay movimientos</p>';
      return;
    }

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Código</th>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Descripción</th>
                        <th>Stock actual</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${movimientosVisibles
                      .map(
                        (m) => `
                        <tr>
                            <td><small>${formatearFecha(m.fecha)}</small></td>
                            <td><strong>${
                              m.productos?.nombre || "Producto eliminado"
                            }</strong></td>
                            <td>${
                              m.productos?.precio
                                ? formatearMoneda(m.productos.precio)
                                : "-"
                            }</td>
                            <td><code style="background:var(--bg-input);padding:2px 6px;border-radius:4px;font-size:11px;color:var(--accent);">${
                              m.productos?.codigo_barras || "-"
                            }</code></td>
                            <td>
                                <span class="${
                                  m.tipo === "entrada"
                                    ? "text-success"
                                    : "text-danger"
                                }">
                                    ${
                                      m.tipo === "entrada"
                                        ? "📥 Entrada"
                                        : "📤 Salida"
                                    }
                                </span>
                            </td>
                            <td class="${
                              m.tipo === "entrada"
                                ? "text-success"
                                : "text-danger"
                            }">
                                ${m.tipo === "entrada" ? "+" : "-"} ${
                                  m.cantidad
                                }
                            </td>
                            <td><small>${m.descripcion || "-"}</small></td>
                            <td><span class="text-warning">${
                              m.productos?.stock || 0
                            }</span></td>
                            <td>
                                <button onclick="pedirEliminar('${
                                  m.id
                                }','inventario')" class="btn btn-outline-danger btn-sm">🗑️</button>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;
  } catch (error) {
    console.error("Error:", error);
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar inventario</p>';
  }
}

// ============================================
// 4. PEDIDOS
// ============================================

// Cache de lugares de entrega (lugar + horario fijo) para mostrar el
// detalle completo en la columna "Lugar" del tab Pedidos.
let lugaresAdminCache = [];

async function precargarLugaresAdmin() {
  if (lugaresAdminCache.length) return;
  try {
    const { data, error } = await window.supabase
      .from("lugares_entrega")
      .select("lugar, horario_fijo")
      .order("orden", { ascending: true });
    if (!error && data && data.length) {
      lugaresAdminCache = data;
      return;
    }
  } catch (e) {
    /* usa el respaldo local */
  }
  lugaresAdminCache = [
    { lugar: "Apodaca centro (frente a iglesia)", horario_fijo: "08:00-08:30" },
    { lugar: "San Nicolas centro (plaza presidencia)", horario_fijo: "09:00-09:30" },
    { lugar: "Costco Escobedo", horario_fijo: "10:00-10:30" },
    { lugar: "San Pedro (punto y horario a convenir)", horario_fijo: null },
    { lugar: "Monterrey (punto y horario a convenir)", horario_fijo: null },
    { lugar: "Guadalupe (punto y horario a convenir)", horario_fijo: null },
  ];
}

function detallesLugarPedido(p) {
  if (!p.lugar_entrega) return '<small style="color:var(--text-dim);">—</small>';
  const reg = lugaresAdminCache.find((l) => l.lugar === p.lugar_entrega) || null;
  const esPuntoFijo = !!(reg && reg.horario_fijo);
  if (esPuntoFijo) {
    return `<small style="white-space:nowrap; color:var(--text-silver);">📦 ${p.lugar_entrega}</small>
            <div style="color:var(--regio-green); font-size:0.72rem; white-space:nowrap;" title="Horario fijo del punto">🕐 ${reg.horario_fijo}</div>`;
  }
  return `<small style="white-space:nowrap; color:var(--text-silver);">📦 ${p.lugar_entrega}</small>
          <div style="color:#8ab4f8; font-size:0.72rem; white-space:nowrap;" title="Punto exacto acordado con el comprador">📍 ${p.punto_entrega || "Por acordar"}</div>
          <div style="color:#ffd166; font-size:0.72rem; white-space:nowrap;" title="Hora acordada">🕐 ${p.hora_entrega || "Por acordar"}</div>`;
}

function renderFilaPedido(p) {
  const productosLinea = (p.productos || [])
    .map(
      (x) =>
        `<span class="item"><span class="nombre">${
          x.nombre
        }</span> <span class="cant">${Number(x.precio) || 0} × ${
          x.cantidad
        }</span> <span class="precio">${formatearMoneda(
          x.precio * x.cantidad,
        )}</span></span>`,
    )
    .join(" ");

  const envio = Number(p.costo_envio) || 0;
  const descuentoPct = Number(p.descuento) || 0;
  const subtotalProductos = (p.productos || []).reduce(
    (s, x) =>
      s + (Number(x.precio) || 0) * (Number(x.cantidad) || 0),
    0,
  );
  const subtotalConEnvio = subtotalProductos + envio;
  const descuentoMonto = subtotalConEnvio * (descuentoPct / 100);
  const totalCalculado = subtotalConEnvio - descuentoMonto;

  let estadoHtml;
  if (p.estado === "vendido") {
    estadoHtml = `<span class="badge bg-success" style="white-space:nowrap;" title="Venta completada: el stock ya se descontó. Usa el botón de Devolución (↩️) si necesitas regresarlo.">💰 Vendido</span>`;
  } else if (p.estado === "devuelto") {
    estadoHtml = `<span class="badge bg-secondary" style="white-space:nowrap;" title="El stock de este pedido ya fue regresado al inventario.">↩️ Devuelto</span>`;
  } else if (p.estado === "entregado") {
    estadoHtml = `<span class="badge bg-dark" style="white-space:nowrap; border:1px solid var(--accent); color:var(--accent);" title="Producto entregado al cliente.">📦 Entregado</span>`;
  } else {
    estadoHtml = `
                                <select onchange="cambiarEstadoPedido('${
                                  p.id
                                }', this.value)" class="form-select form-select-sm bg-black text-white border-secondary" style="width:auto; min-width:100px; display:inline-block;" title="Cambia el estado manualmente. Esto NO afecta el stock.">
                                    <option value="pendiente" ${
                                      p.estado === "pendiente" ? "selected" : ""
                                    }>📋 Pendiente</option>
                                    <option value="confirmado" ${
                                      p.estado === "confirmado"
                                        ? "selected"
                                        : ""
                                    }>✅ Confirmado</option>
                                    <option value="entregado" ${
                                      p.estado === "entregado" ? "selected" : ""
                                    }>📦 Entregado</option>
                                    <option value="cancelado" ${
                                      p.estado === "cancelado" ? "selected" : ""
                                    }>❌ Cancelado</option>
                                </select>
                            `;
  }

  return `
                        <tr data-pedido-id="${p.id}"
                            data-cliente="${p.cliente_nombre}"
                            data-telefono="${p.cliente_telefono || ""}"
                            data-email="${p.cliente_email || ""}"
                            data-numero="${p.numero_pedido || "N/A"}"
                            data-productos='${JSON.stringify(
                              p.productos,
                            ).replace(/'/g, "&#39;")}'
                            data-total="${p.total}"
                            data-direccion="${p.direccion_entrega || ""}"
data-lugarentrega="${p.lugar_entrega || ""}"
                            data-puntoentrega="${p.punto_entrega || ""}"
                            data-horaentrega="${p.hora_entrega || ""}"
                            data-costoenvio="${p.costo_envio || 0}"
                            data-descuento="${p.descuento || 0}"
                            data-metodopago="${p.metodo_pago || ""}"
                            data-notas="${(p.notas || "").replace(
                              /"/g,
                              "&quot;",
                            )}">
                            <td><span class="pedido-numero">${
                              p.numero_pedido || "N/A"
                            }</span></td>
                            <td><small style="white-space:nowrap;">${formatearFecha(
                              p.fecha_pedido,
                            )}</small></td>
                            <td><small style="white-space:nowrap; color:var(--text-silver);">${
                              p.fecha_vendido
                                ? formatearFecha(p.fecha_vendido)
                                : "—"
                            }</small></td>
                            <td><small style="white-space:nowrap; color:var(--text-silver);">${
                              p.fecha_entregado
                                ? formatearFecha(p.fecha_entregado)
                                : "—"
                            }</small></td>
                            <td>
                                <div style="display:block; margin-bottom:4px; font-weight:600; color:var(--text-main); font-size:0.95rem;">${
                                  p.cliente_nombre
                                }</div>
                                ${
                                  p.cliente_telefono
                                    ? `<div style="display:block; color:var(--text-silver); font-size:0.85rem; margin-bottom:3px;">📱 ${p.cliente_telefono}</div>`
                                    : ""
                                }
                                ${
                                  p.cliente_email
                                    ? `<div style="display:block; color:#8ab4f8; font-size:0.85rem;">📧 ${p.cliente_email}</div>`
                                    : ""
                                }
                                ${
                                  p.cupon
                                    ? `<div style="display:block; color:#ffd166; font-size:0.8rem;">🎟️ ${p.cupon}</div>`
                                    : ""
                                }
                                ${
                                  p.notas
                                    ? `<div style="display:block; color:var(--text-silver); font-size:0.8rem; margin-top:3px;">📝 ${p.notas}</div>`
                                    : ""
                                }
                            </td>
                            <td><div class="productos-lista">${productosLinea}</div></td>
                            <td>
                                ${detallesLugarPedido(p)}
                            </td>
                            <td>
                                ${
                                  envio > 0
                                    ? `<small style="white-space:nowrap; color:var(--text-silver);">${formatearMoneda(
                                        envio,
                                      )}</small>`
                                    : `<small style="color:var(--text-dim);">—</small>`
                                }
                            </td>
                            <td>
                                ${
                                  descuentoMonto > 0
                                    ? `<small style="white-space:nowrap; color:#ffd166;">${descuentoPct}% (−${formatearMoneda(
                                        descuentoMonto,
                                      )})</small>`
                                    : `<small style="color:var(--text-dim);">—</small>`
                                }
                            </td>
                            <td><small style="white-space:nowrap; color:var(--text-silver);">${formatearMoneda(
                              subtotalConEnvio,
                            )}</small></td>
                            <td><strong style="color:var(--accent); font-size:1.1rem; white-space:nowrap;" title="Productos + envío, con el descuento ya aplicado.">${formatearMoneda(
                              totalCalculado,
                            )}</strong></td>
                            <td>${estadoHtml}</td>
                            <td style="white-space: nowrap;">
                                <div class="d-flex gap-1" style="flex-wrap:nowrap;">
                                    <button onclick="abrirModalEditarPedido('${
                                      p.id
                                    }')" class="btn btn-warning btn-sm" title="Editar Pedido (cliente, productos, cantidades, envío, descuento, estado...)">✏️</button>
                                    <button onclick="generarTicketPedido('${
                                      p.id
                                    }')" class="btn btn-outline-warning btn-sm" title="Generar / Reimprimir Ticket (imprime directo con QZ)">🧾</button>
                                    <button onclick="verVistaPreviaPedido('${
                                      p.id
                                    }')" class="btn btn-outline-light btn-sm" title="Ver Vista Previa del Ticket (58mm)">👁️</button>
                                    <button onclick="verDetallePedido('${
                                      p.id
                                    }')" class="btn btn-outline-secondary btn-sm" title="Ver Detalle completo e imprimir">📋</button>
                                    ${
                                      p.estado === "pendiente"
                                        ? `
                                        <button onclick="procesarPedido('${p.id}', 'procesar')" class="btn btn-info-custom btn-sm" title="Procesar Pedido: pasa a Confirmado">✅</button>
                                    `
                                        : ""
                                    }
                                    ${
                                      p.estado === "confirmado"
                                        ? `
                                        <button onclick="procesarPedido('${p.id}', 'completar')" class="btn btn-success btn-sm" title="Marcar como Vendido: descuenta el stock. Es la ÚNICA acción que descuenta stock.">💰</button>
                                        <button onclick="pedirMarcarEntregado('${p.id}')" class="btn btn-outline-success btn-sm" title="Marcar como Entregado (producto entregado al cliente)">📦</button>
                                    `
                                        : ""
                                    }
                                    ${
                                      p.estado === "vendido"
                                        ? `
                                        <button onclick="pedirMarcarEntregado('${p.id}')" class="btn btn-outline-success btn-sm" title="Marcar como Entregado (producto entregado al cliente)">📦</button>
                                        <button onclick="pedirDevolucionPedido('${p.id}')" class="btn btn-outline-warning btn-sm" title="Devolución: regresa el stock de estos productos al inventario">↩️</button>
                                    `
                                        : ""
                                    }
                                    <button onclick="pedirEliminarPedido('${
                                      p.id
                                    }')" class="btn btn-outline-danger btn-sm" title="Eliminar este pedido de la base de datos (permanente)">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `;
}

// Actualiza solo la fila editada (misma posición), sin reordenar la lista.
async function reemplazarFilaPedido(id) {
  if (!id) return;
  const { data, error } = await window.supabase
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return;
  const tr = document.querySelector(
    `#listaPedidos tr[data-pedido-id="${id}"]`,
  );
  if (tr) {
    tr.outerHTML = renderFilaPedido(data);
  } else {
    const activeFilter = document.querySelector(".filtro-pedido.active");
    cargarPedidos(activeFilter?.dataset?.estado || "todos");
  }
}

async function cargarPedidos(estado = "todos") {
  const container = document.getElementById("listaPedidos");
  if (!container) return;

  const tabPedidos = document.getElementById("tab-pedidos");
  if (tabPedidos && tabPedidos.style.display === "none") {
    return;
  }

  container.innerHTML =
    '<div class="text-center text-dim py-3">Cargando...</div>';

  try {
    const { data: todosPedidos, error: countError } = await window.supabase
      .from("pedidos")
      .select("estado");

    if (countError) throw countError;

    const total = todosPedidos?.length || 0;
    const pendientes =
      todosPedidos?.filter((p) => p.estado === "pendiente").length || 0;
    const confirmados =
      todosPedidos?.filter((p) => p.estado === "confirmado").length || 0;
    const vendidos =
      todosPedidos?.filter((p) => p.estado === "vendido").length || 0;
    const entregados =
      todosPedidos?.filter((p) => p.estado === "entregado").length || 0;
    const cancelados =
      todosPedidos?.filter((p) => p.estado === "cancelado").length || 0;
    const devueltos =
      todosPedidos?.filter((p) => p.estado === "devuelto").length || 0;

    document.querySelectorAll(".filtro-pedido").forEach((btn) => {
      const estadoBtn = btn.dataset.estado;
      let count = 0;
      if (estadoBtn === "todos") count = total;
      else if (estadoBtn === "pendiente") count = pendientes;
      else if (estadoBtn === "confirmado") count = confirmados;
      else if (estadoBtn === "vendido") count = vendidos;
      else if (estadoBtn === "entregado") count = entregados;
      else if (estadoBtn === "cancelado") count = cancelados;
      else if (estadoBtn === "devuelto") count = devueltos;

      let badge = btn.querySelector(".badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "badge bg-secondary ms-1";
        btn.appendChild(badge);
      }
      badge.textContent = count;
    });

    let query = window.supabase
      .from("pedidos")
      .select("*")
      .order("cliente_nombre", { ascending: true });
    if (estado !== "todos") query = query.eq("estado", estado);

    const busquedaNumero = document
      .getElementById("buscarNumeroPedido")
      ?.value.trim();
    if (busquedaNumero)
      query = query.ilike("numero_pedido", `%${busquedaNumero}%`);

    const busquedaEmail = document
      .getElementById("buscarEmailPedido")
      ?.value.trim();
    if (busquedaEmail)
      query = query.ilike("cliente_email", `%${busquedaEmail}%`);

    const busquedaNombre = document
      .getElementById("buscarNombrePedido")
      ?.value.trim();
    if (busquedaNombre)
      query = query.ilike("cliente_nombre", `%${busquedaNombre}%`);

    const { data, error } = await query;

    if (error) {
      container.innerHTML =
        '<p class="text-danger text-center">❌ Error al cargar</p>';
      return;
    }

    // Orden alfabético A→Z por cliente (con acentos): los nuevos pedidos
    // aparecen en su lugar alfabético en cada carga.
    data.sort((a, b) =>
      String(a.cliente_nombre || "").localeCompare(
        String(b.cliente_nombre || ""),
        "es",
      ),
    );

    // Cache de lugares de entrega (para el detalle del punto fijo / coordinado).
    await precargarLugaresAdmin();

    const totalPedidos = document.getElementById("totalPedidos");
    if (totalPedidos) totalPedidos.textContent = data?.length || 0;

    if (!data || !data.length) {
      container.innerHTML =
        '<p class="text-center text-dim py-3">📋 No hay pedidos</p>';
      return;
    }

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead>
                    <tr>
                        <th style="white-space:nowrap;">N° Pedido</th>
                        <th style="white-space:nowrap;">Fecha</th>
                        <th style="white-space:nowrap;" title="Fecha/hora en que marcaste el pedido como VENDIDO (botón 💰).">Vendido</th>
                        <th style="white-space:nowrap;" title="Fecha/hora en que marcaste el pedido como ENTREGADO (botón 📦).">Entregado</th>
                        <th style="min-width:180px;">Cliente</th>
                        <th>Productos</th>
                        <th style="white-space:nowrap;" title="Lugar de entrega seleccionado por el cliente.">Lugar</th>
                        <th style="white-space:nowrap;" title="Costo de envío en pesos. Se suma al calcular el total.">Envío</th>
                        <th style="white-space:nowrap;" title="Descuento en PORCENTAJE (%), aplicado sobre productos + envío.">Descuento %</th>
                        <th style="white-space:nowrap;" title="Subtotal: productos + envío (antes de descuento).">Subtotal</th>
                        <th style="white-space:nowrap;">Total</th>
                        <th style="white-space:nowrap;">Estado</th>
                        <th style="white-space:nowrap; min-width:320px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(renderFilaPedido).join("")}
                </tbody>
            </table>
        `;
  } catch (error) {
    console.error("Error:", error);
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar pedidos</p>';
  }
}

async function guardarEnvioDescuentoPedido(id, envioInput, descuentoInput) {
  if (!envioInput || !descuentoInput) return;
  const envio = parseFloat(envioInput.value) || 0;
  let descuentoPct = parseFloat(descuentoInput.value) || 0;
  descuentoPct = Math.min(100, Math.max(0, descuentoPct));
  envioInput.value = envio;
  descuentoInput.value = descuentoPct;

  try {
    const { data: pedido, error: getError } = await window.supabase
      .from("pedidos")
      .select("productos")
      .eq("id", id)
      .single();
    if (getError) throw getError;

    const subtotalProductos = (pedido.productos || []).reduce(
      (s, x) => s + (Number(x.precio) || 0) * (Number(x.cantidad) || 0),
      0,
    );
    const subtotalConEnvio = subtotalProductos + envio;
    const descuentoMonto = subtotalConEnvio * (descuentoPct / 100);
    const total = subtotalConEnvio - descuentoMonto;

    const { error } = await window.supabase
      .from("pedidos")
      .update({ costo_envio: envio, descuento: descuentoPct, total: total })
      .eq("id", id);
    if (error) throw error;

    const activeFilter = document.querySelector(".filtro-pedido.active");
    cargarPedidos(activeFilter?.dataset?.estado || "todos");
  } catch (error) {
    console.error("Error guardando envío/descuento:", error);
    mostrarModalAlerta("❌ Error al guardar envío/descuento: " + error.message);
  }
}

async function cambiarEstadoPedido(id, estado) {
  const updates = { estado };
  const ahora = new Date().toISOString();
  if (estado === "vendido") updates.fecha_vendido = ahora;
  if (estado === "entregado") updates.fecha_entregado = ahora;
  try {
    const { error } = await window.supabase
      .from("pedidos")
      .update(updates)
      .eq("id", id);
    if (!error) {
      const activeFilter = document.querySelector(".filtro-pedido.active");
      cargarPedidos(activeFilter?.dataset?.estado || "todos");
      cargarPedidosPendientes();
    }
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("❌ Error al actualizar estado");
  }
}

function pedirMarcarEntregado(id) {
  modalConfirmar(
    "📦 ¿Deseas marcar este pedido como ENTREGADO? El producto ya fue entregado al cliente.",
    function () {
      cambiarEstadoPedido(id, "entregado");
    },
  );
}

let detallePedidoActual = null;

function mostrarModalAlerta(mensaje, titulo) {
  const modal = document.getElementById("modalAlerta");
  if (!modal) {
    alert(mensaje);
    return;
  }
  const mT = document.getElementById("modalAlertaTitulo");
  const mM = document.getElementById("modalAlertaMensaje");
  if (mT) mT.textContent = titulo || "ℹ️ Aviso";
  if (mM) mM.textContent = mensaje;
  modal.style.display = "flex";
}

let confirmarAccionCallback = null;

function modalConfirmar(mensaje, onOk) {
  const modal = document.getElementById("modalConfirmarAccion");
  if (!modal) {
    if (window.confirm) {
      if (window.confirm(mensaje)) onOk();
    }
    return;
  }
  confirmarAccionCallback = onOk;
  document.getElementById("modalConfirmarAccionMensaje").textContent = mensaje;
  modal.style.display = "flex";
}

function cerrarModalConfirmarAccion() {
  const modal = document.getElementById("modalConfirmarAccion");
  if (modal) modal.style.display = "none";
  confirmarAccionCallback = null;
}

// ============================================
// LIMPIAR BASE DE DATOS DE UNA PESTAÑA
// Borra TODOS los registros de la(s) tabla(s) indicada(s) tras confirmar.
// ============================================
async function limpiarTabla(tablas, descripcion, refrescar) {
  const lista = Array.isArray(tablas) ? tablas : [tablas];
  const nombres = lista
    .map((t) => `<code>${t}</code>`)
    .join(", ");

  if (typeof modalConfirmar === "function") {
    modalConfirmar(
      `⚠️ Esto borrará de forma PERMANENTE todos los registros de las tablas ${nombres}. ${descripcion} Esta acción NO se puede deshacer. ¿Continuar?`,
      async () => {
        try {
          for (const tabla of lista) {
            const { error } = await window.supabase
              .from(tabla)
              .delete()
              .neq("id", "00000000-0000-0000-0000-000000000000");
            if (error) throw error;
          }
          mostrarModalAlerta(
            `✅ Base de datos de ${nombres} limpiada. Los registros fueron eliminados.`,
          );
          if (typeof refrescar === "function") refrescar();
        } catch (error) {
          console.error("Error limpiando tabla:", error);
          mostrarModalAlerta("❌ Error al limpiar: " + error.message);
        }
      },
    );
  }
}

// ============================================
// FINANZAS · BASES DE REINICIO DE CONTADORES
// Los contadores (Ingresos/Gastos/Ganancia) se calculan en vivo desde los
// registros de "finanzas". Para reiniciarlos a $0.00 SIN borrar el historial
// guardamos en la tabla "settings" cuánto sumaban al momento del reinicio;
// así el tab calcula: contador = máx(0, suma_real − base_reinicio).
// ============================================

async function cargarBaseFinanzas() {
  const base = { ingresos: 0, gastos: 0 };
  try {
    const { data, error } = await window.supabase
      .from("settings")
      .select("llave, valor");
    if (error) throw error;
    (data || []).forEach((row) => {
      const v = Number(row.valor) || 0;
      if (row.llave === "fin_ingresos_inicial") base.ingresos = v;
      if (row.llave === "fin_gastos_inicial") base.gastos = v;
    });
  } catch (e) {
    // Si la tabla settings no existe, usamos 0 (no rompe el tab).
    console.warn("⚠️ Sin tabla settings, contadores sin base de reinicio:", e.message);
  }
  return base;
}

async function guardarBaseFinanzas(ingresosBase, gastosBase) {
  const { error } = await window.supabase.from("settings").upsert(
    [
      { llave: "fin_ingresos_inicial", valor: ingresosBase },
      { llave: "fin_gastos_inicial", valor: gastosBase },
    ],
    { onConflict: "llave" },
  );
  if (error) throw error;
}

// Reinicia los contadores financieros a $0.00 conservando el historial de
// movimientos. Solo el botón "Limpiar base de datos" borra los movimientos.
function reiniciarContadoresFinanzas() {
  if (typeof modalConfirmar === "function") {
    modalConfirmar(
      "⚠️ Esto pondrá los contadores de Ingresos, Gastos y Ganancia en $0.00 a partir de ahora. El HISTORIAL de movimientos NO se borra. Esta acción NO se puede deshacer. ¿Continuar?",
      async () => {
        try {
          const { data, error } = await window.supabase
            .from("finanzas")
            .select("tipo, monto");
          if (error) throw error;

          const ingresosBase = (data || [])
            .filter((f) => f.tipo === "ingreso")
            .reduce((s, f) => s + (Number(f.monto) || 0), 0);
          const gastosBase = (data || [])
            .filter((f) => f.tipo === "gasto")
            .reduce((s, f) => s + (Number(f.monto) || 0), 0);

          await guardarBaseFinanzas(ingresosBase, gastosBase);
          mostrarModalAlerta(
            "✅ Contadores reiniciados a $0.00. El historial de movimientos se conserva intacto.",
          );
          if (typeof cargarFinanzas === "function") cargarFinanzas();
        } catch (error) {
          console.error("Error reiniciando contadores:", error);
          mostrarModalAlerta("❌ Error al reiniciar: " + error.message);
        }
      },
    );
  }
}

async function abrirModalEditarPedido(id) {
  const row = document.querySelector(`tr[data-pedido-id="${id}"]`);
  if (!row) {
    mostrarModalAlerta("❌ No se encontraron datos del pedido para editar.");
    return;
  }

  // Asegurar que el select de lugares esté actualizado con los lugares de BD.
  cargarLugaresEditarPedido();

  // Traemos datos frescos desde la base para un llenado preciso.
  let pedido = null;
  try {
    const { data } = await window.supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();
    pedido = data || null;
  } catch (e) {
    pedido = null;
  }

  document.getElementById("editarPedidoId").value = id;
  document.getElementById("editarCliente").value =
    (pedido && pedido.cliente_nombre) || row.dataset.cliente || "";
  document.getElementById("editarTelefono").value =
    (pedido && pedido.cliente_telefono) || row.dataset.telefono || "";
  document.getElementById("editarEmail").value =
    (pedido && pedido.cliente_email) || row.dataset.email || "";
  document.getElementById("editarDireccion").value =
    (pedido && pedido.direccion_entrega) || row.dataset.direccion || "";
  document.getElementById("editarLugarEntrega").value =
    (pedido && pedido.lugar_entrega) || row.dataset.lugarentrega || "";
  document.getElementById("editarPuntoEntrega").value =
    (pedido && pedido.punto_entrega) ||
    (row.dataset.puntoentrega || "").replace(/&quot;/g, '"') ||
    "";
  document.getElementById("editarHoraAcordada").value =
    (pedido && pedido.hora_entrega) || row.dataset.horaentrega || "";
  document.getElementById("editarMetodoPago").value =
    (pedido && pedido.metodo_pago) || row.dataset.metodopago || "efectivo";
  document.getElementById("editarEnvio").value =
    (pedido && pedido.costo_envio != null ? pedido.costo_envio : row.dataset.costoenvio) || "0";
  document.getElementById("editarDescuento").value =
    (pedido && pedido.descuento != null ? pedido.descuento : row.dataset.descuento) || "0";
  document.getElementById("editarEstado").value =
    (pedido && pedido.estado) || "";
  document.getElementById("editarNotas").value =
    (pedido && pedido.notas) || (row.dataset.notas || "").replace(/&quot;/g, '"') || "";

  let productos = "[]";
  try {
    productos = pedido
      ? pedido.productos || []
      : JSON.parse(row.dataset.productos || "[]");
  } catch (e) {
    productos = [];
  }
  document.getElementById("editarProductos").value = productos
    .map((p) => `${p.nombre} | ${p.cantidad} | ${p.precio}`)
    .join("\n");

  const m = document.getElementById("mensajeEditarPedido");
  if (m) {
    m.innerHTML = "";
    m.className = "";
  }

  recalcularTotalesEditar();
  document.getElementById("modalEditarPedido").style.display = "flex";
}

function recalcularTotalesEditar() {
  const textarea = document.getElementById("editarProductos");
  const envio = parseFloat(document.getElementById("editarEnvio").value) || 0;
  let descuentoPct =
    parseFloat(document.getElementById("editarDescuento").value) || 0;
  descuentoPct = Math.min(100, Math.max(0, descuentoPct));

  let subtotalProductos = 0;
  try {
    const lineas = (textarea.value || "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    lineas.forEach((linea) => {
      const partes = linea.split("|").map((p) => p.trim());
      const precio = parseFloat(partes[2] ?? partes[1]) || 0;
      const cantidad = parseFloat(partes[1] ?? 1) || 1;
      subtotalProductos += precio * cantidad;
    });
  } catch (e) {
    subtotalProductos = 0;
  }

  const subtotalConEnvio = subtotalProductos + envio;
  const descuentoMonto = subtotalConEnvio * (descuentoPct / 100);
  const total = subtotalConEnvio - descuentoMonto;

  document.getElementById("editarSubtotal").value =
    formatearMoneda(subtotalConEnvio);
  document.getElementById("editarTotal").value = formatearMoneda(total);
}

async function guardarPedidoEditado() {
  const id = document.getElementById("editarPedidoId").value;
  const msg = document.getElementById("mensajeEditarPedido");
  const btn =
    document.querySelector("#modalEditarPedido button[onclick*='guardarPedidoEditado']");

  const cliente = document.getElementById("editarCliente").value.trim();
  const telefono = document.getElementById("editarTelefono").value.trim();
  const email = document.getElementById("editarEmail").value.trim();
  const direccion = document.getElementById("editarDireccion").value.trim();
  const lugarEntrega = document
    .getElementById("editarLugarEntrega")
    .value.trim();
  const puntoEntrega = document
    .getElementById("editarPuntoEntrega")
    .value.trim();
  const horaAcordada = document.getElementById("editarHoraAcordada").value;
  const metodoPago = document.getElementById("editarMetodoPago").value;
  const envio = parseFloat(document.getElementById("editarEnvio").value) || 0;
  let descuentoPct =
    parseFloat(document.getElementById("editarDescuento").value) || 0;
  descuentoPct = Math.min(100, Math.max(0, descuentoPct));
  const estado = document.getElementById("editarEstado").value;
  const notas = document.getElementById("editarNotas").value.trim();

  if (!cliente || !telefono) {
    return mostrarMensaje(
      msg,
      "❌ Cliente y teléfono son obligatorios",
      "error",
    );
  }

  let productos = [];
  try {
    const lineas = (document.getElementById("editarProductos").value || "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    if (lineas.length === 0) {
      return mostrarMensaje(msg, "❌ Agrega al menos un producto", "error");
    }
    productos = lineas.map((linea) => {
      const partes = linea.split("|").map((p) => p.trim());
      const nombre = partes[0];
      const cantidad = parseInt(partes[1] ?? 1) || 1;
      const precio = parseFloat(partes[2] ?? partes[1]) || 0;
      return { nombre, cantidad, precio };
    });
  } catch (e) {
    return mostrarMensaje(
      msg,
      "❌ Formato de productos inválido. Usa: Nombre | Cantidad | Precio",
      "error",
    );
  }

  const subtotalProductos = productos.reduce(
    (s, p) => s + (Number(p.precio) || 0) * (Number(p.cantidad) || 0),
    0,
  );
  const subtotalConEnvio = subtotalProductos + envio;
  const descuentoMonto = subtotalConEnvio * (descuentoPct / 100);
  const total = subtotalConEnvio - descuentoMonto;

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Guardando...";
    }

    const { error } = await window.supabase
      .from("pedidos")
      .update({
        cliente_nombre: cliente,
        cliente_telefono: telefono,
        cliente_email: email || null,
        direccion_entrega: direccion || null,
        lugar_entrega: lugarEntrega || null,
        punto_entrega: puntoEntrega || null,
        hora_entrega: horaAcordada || null,
        metodo_pago: metodoPago,
        productos: productos,
        costo_envio: envio,
        descuento: descuentoPct,
        total: total,
        estado: estado,
        notas: notas || null,
      })
      .eq("id", id);

    if (error) throw error;

    document.getElementById("modalEditarPedido").style.display = "none";

    // Edición: actualiza la fila en su mismo lugar (no reordena).
    await reemplazarFilaPedido(id);
    cargarPedidosPendientes();
    cargarPedidosParaTicket();

    mostrarModalAlerta("✅ Pedido actualizado correctamente");
  } catch (error) {
    console.error("Error al guardar pedido editado:", error);
    mostrarModalAlerta("❌ Error al guardar: " + error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Guardar Cambios";
    }
  }
}

async function verDetallePedido(id) {
  try {
    const { data, error } = await window.supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!data) return;

    detallePedidoActual = data;

    const envio = Number(data.costo_envio) || 0;
    const descuentoPct = Number(data.descuento) || 0;
    const subtotalProductos = (data.productos || []).reduce(
      (s, x) => s + (Number(x.precio) || 0) * (Number(x.cantidad) || 0),
      0,
    );
    const subtotalConEnvio = subtotalProductos + envio;
    const descuentoMonto = subtotalConEnvio * (descuentoPct / 100);
    const totalDetalle = subtotalConEnvio - descuentoMonto;

    const productosHtml = (data.productos || [])
      .map(
        (x) =>
          `<div style="display:flex; justify-content:space-between; gap:12px;"><span>${x.nombre} — ${formatearMoneda(
            Number(x.precio) || 0,
          )} × ${x.cantidad}</span><span>${formatearMoneda(
            (Number(x.precio) || 0) * (Number(x.cantidad) || 0),
          )}</span></div>`,
      )
      .join("");

    document.getElementById(
      "contenidoDetallePedido",
    ).innerHTML = `
            <div style="display:flex; justify-content:space-between;"><strong>N° Pedido:</strong> <span>${
              data.numero_pedido || "N/A"
            }</span></div>
            <div style="display:flex; justify-content:space-between;"><strong>Cliente:</strong> <span>${
              data.cliente_nombre
            }</span></div>
            <div style="display:flex; justify-content:space-between;"><strong>Teléfono:</strong> <span>${
              data.cliente_telefono || "—"
            }</span></div>
            <div style="display:flex; justify-content:space-between;"><strong>Correo:</strong> <span>${
              data.cliente_email || "—"
            }</span></div>
            ${
              data.direccion_entrega
                ? `<div style="display:flex; justify-content:space-between;"><strong>Dirección:</strong> <span>${data.direccion_entrega}</span></div>`
                : ""
            }
            ${
              data.lugar_entrega
                ? `<div style="display:flex; justify-content:space-between;"><strong>Lugar de entrega:</strong> <span>${data.lugar_entrega}</span></div>`
                : ""
            }
            ${
              data.punto_entrega
                ? `<div style="display:flex; justify-content:space-between;"><strong>Punto acordado:</strong> <span>${data.punto_entrega}</span></div>`
                : ""
            }
            ${
              data.hora_entrega
                ? `<div style="display:flex; justify-content:space-between;"><strong>Hora acordada:</strong> <span>${data.hora_entrega}</span></div>`
                : ""
            }
            ${
              data.fecha_vendido
                ? `<div style="display:flex; justify-content:space-between;"><strong>Vendido:</strong> <span>${formatearFecha(
                    data.fecha_vendido,
                  )}</span></div>`
                : ""
            }
            ${
              data.fecha_entregado
                ? `<div style="display:flex; justify-content:space-between;"><strong>Entregado:</strong> <span>${formatearFecha(
                    data.fecha_entregado,
                  )}</span></div>`
                : ""
            }
            <hr style="border-color:var(--border); margin:12px 0;">
            <div><strong>Productos:</strong></div>
            ${productosHtml}
            <hr style="border-color:var(--border); margin:12px 0;">
            ${
              envio > 0
                ? `<div style="display:flex; justify-content:space-between;"><strong>Envío:</strong> <span>${formatearMoneda(
                    envio,
                  )}</span></div>`
                : ""
            }
            <div style="display:flex; justify-content:space-between;"><strong>Subtotal:</strong> <span>${formatearMoneda(
              subtotalConEnvio,
            )}</span></div>
            ${
              descuentoMonto > 0
                ? `<div style="display:flex; justify-content:space-between;"><strong>Descuento (${descuentoPct}%):</strong> <span style="color:#ffd166;">−${formatearMoneda(
                    descuentoMonto,
                  )}</span></div>`
                : ""
            }
            <div style="display:flex; justify-content:space-between; font-size:1.1rem;"><strong>Total:</strong> <strong style="color:var(--accent);">${formatearMoneda(
              totalDetalle,
            )}</strong></div>
            <div style="display:flex; justify-content:space-between; margin-top:6px;"><strong>Método de pago:</strong> <span>${
              data.metodo_pago === "transferencia"
                ? "Transferencia"
                : data.metodo_pago || "—"
            }</span></div>
            <div style="display:flex; justify-content:space-between;"><strong>Estado:</strong> <span>${(
              data.estado || ""
            ).toUpperCase()}</span></div>
            ${
              data.notas
                ? `<div style="display:flex; justify-content:space-between;"><strong>Notas:</strong> <span>${data.notas}</span></div>`
                : ""
            }
            <div style="display:flex; justify-content:space-between;"><strong>Fecha:</strong> <span>${formatearFecha(
              data.fecha_pedido,
            )}</span></div>
        `;

    document.getElementById("editarPedidoIdHidden").value = id;
    document.getElementById("modalVerDetallePedido").style.display = "flex";
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("❌ Error al cargar detalle: " + error.message);
  }
}

function imprimirDetallePedidoActual() {
  if (!detallePedidoActual) return;
  generarTicketPedido(detallePedidoActual.id);
}

function verVistaPreviaDetallePedidoActual() {
  if (!detallePedidoActual) return;
  verVistaPreviaPedido(detallePedidoActual.id);
}

async function generarTicketPedido(id) {
  try {
    const { data } = await window.supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();
    if (!data) return;

    const envio = Number(data.costo_envio) || 0;
    const descuentoPct = Number(data.descuento) || 0;
    const subtotalProductos = (data.productos || []).reduce(
      (s, x) => s + (Number(x.precio) || 0) * (Number(x.cantidad) || 0),
      0,
    );
    const subtotal = subtotalProductos + envio;
    const descuentoMonto = subtotal * (descuentoPct / 100);
    const total = subtotal - descuentoMonto;

    const datosTicket = {
      cliente: data.cliente_nombre,
      telefono: data.cliente_telefono,
      direccion: data.direccion_entrega || "",
      lugar_entrega: data.lugar_entrega || "",
      metodo_pago:
        data.metodo_pago === "transferencia" ? "Transferencia" : "Efectivo",
      items: data.productos,
      subtotal: subtotal,
      envio: envio,
      descuento: descuentoPct,
      total: total,
      // Fecha del ticket = día que sale el pedido del almacén:
      // fecha_entregado (si ya entregaste) → fecha_vendido (si vendiste) →
      // fecha_pedido → hoy. Sin elegir fechas en un calendario.
      fecha:
        data.fecha_entregado ||
        data.fecha_vendido ||
        data.fecha_pedido ||
        new Date().toISOString(),
      entrega_dia: data.fecha_entregado || data.dia_entrega || "",
      entrega_hora: data.hora_entrega || "",
      punto_entrega: data.punto_entrega || "",
      numero_pedido: data.numero_pedido || "",
      estado: data.estado || "",
    };
    // Imprime directo con QZ Tray (58mm). Si QZ no está disponible,
    // abre la ventana de vista previa/impresión como antes (fallback).
    imprimirTicketAdmin(datosTicket);
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("❌ Error al generar ticket");
  }
}

// Abre la vista previa del ticket (58mm) en un modal del panel, sin imprimir.
// Es la misma info que imprime QZ, pero para verla/revisarla en pantalla.
function verVistaPreviaTicket(datosTicket) {
  abrirTicketPreviewModal(
    "ticket.html?pedido=" + encodeURIComponent(JSON.stringify(datosTicket)),
  );
}

// Vista previa de un pedido ya existente (misma info que el botón 🧾).
async function verVistaPreviaPedido(id) {
  try {
    const { data } = await window.supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();
    if (!data) return;

    const envio = Number(data.costo_envio) || 0;
    const descuentoPct = Number(data.descuento) || 0;
    const subtotalProductos = (data.productos || []).reduce(
      (s, x) => s + (Number(x.precio) || 0) * (Number(x.cantidad) || 0),
      0,
    );
    const subtotal = subtotalProductos + envio;
    const descuentoMonto = subtotal * (descuentoPct / 100);
    const total = subtotal - descuentoMonto;

    const datosTicket = {
      cliente: data.cliente_nombre,
      telefono: data.cliente_telefono,
      direccion: data.direccion_entrega || "",
      lugar_entrega: data.lugar_entrega || "",
      metodo_pago:
        data.metodo_pago === "transferencia" ? "Transferencia" : "Efectivo",
      items: data.productos,
      subtotal: subtotal,
      envio: envio,
      descuento: descuentoPct,
      total: total,
      fecha:
        data.fecha_entregado ||
        data.fecha_vendido ||
        data.fecha_pedido ||
        new Date().toISOString(),
      entrega_dia: data.fecha_entregado || data.dia_entrega || "",
      entrega_hora: data.hora_entrega || "",
      punto_entrega: data.punto_entrega || "",
      numero_pedido: data.numero_pedido || "",
      estado: data.estado || "",
    };
    verVistaPreviaTicket(datosTicket);
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("❌ Error al abrir la vista previa");
  }
}

// ============================================
// 5. FINANZAS
// ============================================

let graficaFinanzasBarras = null;
let graficaFinanzasPastel = null;

function destruirGraficasFinanzas() {
  if (graficaFinanzasBarras) {
    graficaFinanzasBarras.destroy();
    graficaFinanzasBarras = null;
  }
  if (graficaFinanzasPastel) {
    graficaFinanzasPastel.destroy();
    graficaFinanzasPastel = null;
  }
}

// Barras: Ingresos vs Gastos vs Ganancia por mes (últimos 6 meses).
// Pastel: gastos por categoría contable. Usa los MISMO registros que los
// indicadores y la tabla de finanzas.
function renderGraficasFinanzas(registros) {
  if (typeof Chart === "undefined") return;

  const canvasBarras = document.getElementById("graficaFinanzasBarras");
  const canvasPastel = document.getElementById("graficaFinanzasPastel");
  if (!canvasBarras || !canvasPastel) return;

  destruirGraficasFinanzas();

  const etiquetas = [];
  const seriesIngresos = [];
  const seriesGastos = [];
  const seriesGanancia = [];

  const ahora = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    etiquetas.push(
      d.toLocaleDateString("es-MX", { month: "short", year: "2-digit" }),
    );
    const clave =
      d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    let ing = 0;
    let gas = 0;
    registros.forEach((f) => {
      if (String(f.fecha || "").slice(0, 7) !== clave) return;
      if (f.tipo === "ingreso") ing += Number(f.monto) || 0;
      else if (f.tipo === "gasto") gas += Number(f.monto) || 0;
    });
    seriesIngresos.push(ing);
    seriesGastos.push(gas);
    seriesGanancia.push(ing - gas);
  }

  graficaFinanzasBarras = new Chart(canvasBarras, {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: "Ingresos",
          data: seriesIngresos,
          backgroundColor: "rgba(46, 176, 92, 0.85)",
          borderColor: "rgba(46, 176, 92, 1)",
          borderWidth: 1,
        },
        {
          label: "Gastos",
          data: seriesGastos,
          backgroundColor: "rgba(239, 68, 68, 0.85)",
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 1,
        },
        {
          label: "Ganancia",
          data: seriesGanancia,
          backgroundColor: "rgba(167, 139, 250, 0.85)",
          borderColor: "rgba(167, 139, 250, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#fff" } },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${formatearMoneda(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#aaa" },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
        y: {
          ticks: {
            color: "#aaa",
            callback: (v) => formatearMoneda(v),
          },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
      },
    },
  });

  const CATEGORIAS_LABEL = {
    venta: "Venta",
    compra: "Compra",
    envio: "Envío",
    abono: "Abono",
    otros: "Otros",
  };
  const COLORES_PASTEL = [
    "rgba(239, 68, 68, 0.85)",
    "rgba(245, 158, 11, 0.85)",
    "rgba(59, 130, 246, 0.85)",
    "rgba(16, 185, 129, 0.85)",
    "rgba(167, 139, 250, 0.85)",
  ];

  const mapaGastos = {};
  registros.forEach((f) => {
    if (f.tipo !== "gasto") return;
    const cat = f.categoria || "otros";
    mapaGastos[cat] = (mapaGastos[cat] || 0) + (Number(f.monto) || 0);
  });

  const etiquetasPastel = Object.keys(mapaGastos).map(
    (k) => CATEGORIAS_LABEL[k] || k.replace("_", " "),
  );
  const datosPastel = Object.values(mapaGastos);

  if (etiquetasPastel.length === 0) {
    graficaFinanzasPastel = null;
    return;
  }

  graficaFinanzasPastel = new Chart(canvasPastel, {
    type: "doughnut",
    data: {
      labels: etiquetasPastel,
      datasets: [
        {
          data: datosPastel,
          backgroundColor: COLORES_PASTEL,
          borderColor: "#0a0a0a",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#fff", boxWidth: 12 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return `${ctx.label}: ${formatearMoneda(ctx.parsed)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

async function cargarFinanzas() {
  const container = document.getElementById("listaFinanzas");
  if (!container) return;

  const tabFinanzas = document.getElementById("tab-finanzas");
  if (tabFinanzas && tabFinanzas.style.display === "none") {
    return;
  }

  container.innerHTML =
    '<div class="text-center text-dim py-3">Cargando...</div>';

  try {
    const [{ data, error }, base] = await Promise.all([
      window.supabase.from("finanzas").select("*").order("fecha", { ascending: false }),
      cargarBaseFinanzas(),
    ]);
    if (error) {
      container.innerHTML =
        '<p class="text-danger text-center">❌ Error al cargar</p>';
      return;
    }

    const registros = data && data.length ? data : [];
    const ingresosRaw = registros
      .filter((f) => f.tipo === "ingreso")
      .reduce((s, f) => s + (Number(f.monto) || 0), 0);
    const gastosRaw = registros
      .filter((f) => f.tipo === "gasto")
      .reduce((s, f) => s + (Number(f.monto) || 0), 0);
    const ingresos = Math.max(0, ingresosRaw - (base.ingresos || 0));
    const gastos = Math.max(0, gastosRaw - (base.gastos || 0));
    const ganancia = ingresos - gastos;

    if (!registros.length) {
      // No hay movimientos tras reinicio o limpieza → muestro contadores a 0.
      destruirGraficasFinanzas();
      document.getElementById("ingresosHoy").textContent = formatearMoneda(0);
      document.getElementById("gastosHoy").textContent = formatearMoneda(0);
      document.getElementById("gananciaHoy").textContent = formatearMoneda(0);
      document.getElementById("gananciaHoy").className = "dashboard-metric-number text-dim";
      container.innerHTML =
        '<p class="text-center text-dim py-3">💰 No hay movimientos</p>';
      return;
    }

    const totalIngresos = document.getElementById("totalIngresos");
    const totalGastos = document.getElementById("totalGastos");
    const gananciaNeta = document.getElementById("gananciaNeta");

    if (totalIngresos) totalIngresos.textContent = formatearMoneda(ingresos);
    if (totalGastos) totalGastos.textContent = formatearMoneda(gastos);
    if (gananciaNeta) {
      gananciaNeta.textContent = formatearMoneda(ganancia);
      gananciaNeta.style.color =
        ganancia >= 0 ? "var(--regio-green)" : "var(--regio-red)";
    }

    // Filtro por categoría (en memoria; los contadores usan TODOS los movimientos).
    const filtroCategoria =
      document.getElementById("filtroCategoriaFinanzas")?.value || "todas";
    const registrosVisibles =
      filtroCategoria === "todas"
        ? data
        : data.filter(
            (f) => (f.categoria || "otros") === filtroCategoria,
          );

    if (!registrosVisibles.length) {
      container.innerHTML =
        '<p class="text-center text-dim py-3">🔍 Sin resultados para el filtro de categoría.</p>';
      return;
    }

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${registrosVisibles
                      .map(
                        (f) => `
                        <tr>
                            <td><small>${formatearFecha(f.fecha)}</small></td>
                            <td><span class="${
                              f.tipo === "ingreso"
                                ? "text-success"
                                : "text-danger"
                            }">${
                              f.tipo === "ingreso" ? "📈 Ingreso" : "📉 Gasto"
                            }</span></td>
                            <td><small>${
                              f.categoria
                                ? f.categoria.replace("_", " ")
                                : "otros"
                            }</small></td>
                            <td>${f.descripcion}</td>
                            <td class="${
                              f.tipo === "ingreso"
                                ? "text-success"
                                : "text-danger"
                            }">${
                              f.tipo === "ingreso" ? "+" : "-"
                            } ${formatearMoneda(f.monto)}</td>
                            <td><button onclick="pedirEliminar('${
                              f.id
                            }','finanza')" class="btn btn-outline-danger btn-sm">🗑️</button></td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;

    renderGraficasFinanzas(registros);
  } catch (error) {
    console.error("Error:", error);
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar finanzas</p>';
  }
}

function mostrarFormFinanza(data = null) {
  const container = document.getElementById("formFinanzaContainer");
  if (container) {
    container.style.display = "flex";
    container.scrollIntoView({ behavior: "smooth" });
  }

  if (data) {
    finanzaEditando = data;
    setValue("finId", data.id);
    setValue("finTipo", data.tipo);
    setValue("finCategoria", data.categoria || "otros");
    setValue("finDescripcion", data.descripcion);
    setValue("finMonto", data.monto);
    const submitBtn = document.querySelector(
      '#formFinanza button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Actualizar";
  } else {
    finanzaEditando = null;
    const form = document.getElementById("formFinanza");
    if (form) form.reset();
    setValue("finId", "");
    const submitBtn = document.querySelector(
      '#formFinanza button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Guardar";
  }
}

function ocultarFormFinanza() {
  const container = document.getElementById("formFinanzaContainer");
  if (container) container.style.display = "none";
  finanzaEditando = null;
}

async function guardarFinanza(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeFinanza");
  const btn = e.target.querySelector('button[type="submit"]');

  const datos = {
    tipo: getValue("finTipo"),
    categoria: getValue("finCategoria"),
    descripcion: getValue("finDescripcion").trim(),
    monto: parseFloat(getValue("finMonto")),
  };

  if (!datos.descripcion || !datos.monto) {
    if (msg) mostrarMensaje(msg, "❌ Completa todos los campos", "error");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Guardando...";
    }

    const id = getValue("finId");
    let result;
    if (id) {
      result = await window.supabase
        .from("finanzas")
        .update(datos)
        .eq("id", id);
    } else {
      result = await window.supabase.from("finanzas").insert([datos]);
    }
    if (result.error) throw result.error;

    if (msg) mostrarMensaje(msg, "✅ Movimiento registrado", "exito");
    ocultarFormFinanza();
    cargarFinanzas();
  } catch (error) {
    console.error("Error:", error);
    if (msg) mostrarMensaje(msg, "❌ " + error.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = id ? "💾 Actualizar" : "💾 Guardar";
    }
  }
}

// ============================================
// 6. TICKET - FUNCIONES COMPLETAS
// ============================================

// ============================================
// PRECARGAR PEDIDO EXISTENTE EN EL TICKET
// ============================================

async function cargarPedidosParaTicket() {
  const select = document.getElementById("ticketPedidoSelect");
  if (!select) return;

  if (!window.supabase || typeof window.supabase.from !== "function") {
    setTimeout(cargarPedidosParaTicket, 500);
    return;
  }

  try {
    const { data, error } = await window.supabase
      .from("pedidos")
      .select(
        "id, numero_pedido, cliente_nombre, cliente_telefono, direccion_entrega, productos, total, estado, metodo_pago, fecha_pedido, fecha_vendido, fecha_entregado, punto_entrega, costo_envio, descuento, lugar_entrega, dia_entrega, hora_entrega",
      )
      .order("fecha_pedido", { ascending: false })
      .limit(300);

    if (error) throw error;

    select.innerHTML =
      '<option value="">Precarga pedidos existentes para imprimir o reimprimir ticket, o llena manualmente para una venta directa, generar el pedido e imprimir su ticket.</option>';

    (data || []).forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      const productosText = (p.productos || [])
        .map((x) => `${x.nombre} x${x.cantidad}`)
        .join(", ");
      const estadoLabel =
        p.estado === "pendiente"
          ? "📋 Pendiente"
          : p.estado === "confirmado"
            ? "✅ Confirmado"
            : p.estado === "vendido"
              ? "💰 Vendido"
              : p.estado === "entregado"
                ? "📦 Entregado"
                : p.estado === "cancelado"
                  ? "❌ Cancelado"
                  : p.estado === "devuelto"
                    ? "↩️ Devuelto"
                    : (p.estado || "—");
      opt.textContent = `${p.numero_pedido || "S/N"} - ${
        p.cliente_nombre
      } · ${estadoLabel} (${productosText})`;
      opt.dataset.pedido = JSON.stringify(p);
      select.appendChild(opt);
    });
  } catch (error) {
    console.error("Error cargando pedidos para el ticket:", error);
    select.innerHTML = '<option value="">❌ Error al cargar pedidos</option>';
  }
}

function actualizarBotonTicket() {
  const btn = document.querySelector('#formTicketVenta button[type="submit"]');
  if (!btn) return;
  btn.innerHTML = pedidoTicketPrecargado
    ? '<i class="fas fa-print"></i> 🖨️ Reimprimir Ticket (pedido)'
    : '<i class="fas fa-cash-register"></i> 💵 Generar Ticket · Venta Nueva';
}

function limpiarFormularioTicket() {
  pedidoTicketPrecargado = null;
  ticketProductos = [];
  document.getElementById("ticketCliente").value = "";
  document.getElementById("ticketTelefono").value = "";
  document.getElementById("ticketDireccion").value = "";
  document.getElementById("ticketLugarEntrega").value = "";
  document.getElementById("ticketEnvio").value = "";
  document.getElementById("ticketDescuento").value = "";
  // En venta nueva el producto vuelve a ser obligatorio.
  const selProducto = document.getElementById("ticketProductoSelect");
  if (selProducto) selProducto.setAttribute("required", "required");
  actualizarListaTicket();
  actualizarTotalesTicket();
  actualizarBotonTicket();
}

async function precargarPedidoEnTicket(pedido) {
  pedidoTicketPrecargado = pedido;

  document.getElementById("ticketCliente").value = pedido.cliente_nombre || "";
  document.getElementById("ticketTelefono").value =
    pedido.cliente_telefono || "";
  document.getElementById("ticketDireccion").value =
    pedido.direccion_entrega || "";

  // Primero cargar los lugares de entrega para que el select tenga
  // todas las opciones disponibles (evita race condition).
  if (typeof cargarLugaresTicketAdmin === "function") {
    await cargarLugaresTicketAdmin();
  }

  // Si el lugar del pedido no está en la lista actual (p. ej. "Garcia",
  // de una lista vieja), se agrega dinámicamente para que se muestre
  // y quede seleccionado en lugar de quedarse vacío.
  const selLugar = document.getElementById("ticketLugarEntrega");
  const lugarPedido = pedido.lugar_entrega || "";
  if (selLugar && lugarPedido) {
    let existe = false;
    for (let i = 0; i < selLugar.options.length; i++) {
      if (selLugar.options[i].value === lugarPedido) {
        existe = true;
        break;
      }
    }
    if (!existe) {
      const opt = document.createElement("option");
      opt.value = lugarPedido;
      opt.textContent = `${lugarPedido} — ${formatearMoneda(
        Number(pedido.costo_envio) || 0,
      )}`;
      selLugar.appendChild(opt);
    }
  }
  if (selLugar) selLugar.value = lugarPedido;

  document.getElementById("ticketEnvio").value = pedido.costo_envio || 0;
  document.getElementById("ticketDescuento").value = pedido.descuento || 0;

  // Al precargar un pedido NO es obligatorio elegir producto (solo aplica
  // a la venta nueva). El HTML tiene "required" en el select.
  const selProducto = document.getElementById("ticketProductoSelect");
  if (selProducto) selProducto.removeAttribute("required");

  ticketProductos = (pedido.productos || []).map((p) => {
    const match = productosDisponibles.find((d) => d.nombre === p.nombre);
    return {
      id: match ? match.id : null,
      nombre: p.nombre,
      precio: Number(p.precio) || 0,
      cantidad: Number(p.cantidad) || 0,
      stockOriginal: match ? match.stock : 0,
    };
  });

  actualizarListaTicket();
  actualizarTotalesTicket();
  actualizarBotonTicket();

  const msg = document.getElementById("mensajeTicket");
  if (msg) {
    mostrarMensaje(
      msg,
      `✅ Pedido ${pedido.numero_pedido || "S/N"} (${
        pedido.estado
      }) precargado. Solo se generará/reimprimirá el ticket, no se registrará otra venta.`,
      "exito",
    );
  }
}

async function cargarProductosTicket() {
  const select = document.getElementById("ticketProductoSelect");
  if (!select) return;

  if (!window.supabase || typeof window.supabase.from !== "function") {
    setTimeout(cargarProductosTicket, 500);
    return;
  }

  try {

    const { data, error } = await window.supabase
      .from("productos")
      .select("id, nombre, precio, stock")
      .order("nombre");

    if (error) throw error;

    productosDisponibles = data || [];
    select.innerHTML = '<option value="">Selecciona un producto...</option>';

    const productosConStock = data?.filter((p) => p.stock > 0) || [];

    if (productosConStock.length === 0) {
      select.innerHTML =
        '<option value="">⚠️ No hay productos con stock disponible</option>';
      return;
    }

    productosConStock.forEach((p) => {
      const precio = Number(p.precio) || 0;
      select.innerHTML += `<option value="${p.id}" data-stock="${p.stock}" data-precio="${precio}">${p.nombre} - $${precio} (Stock: ${p.stock})</option>`;
    });

  } catch (error) {
    console.error("Error cargando productos para ticket:", error);
    select.innerHTML = '<option value="">❌ Error al cargar productos</option>';
  }
}

function agregarProductoTicket() {
  const select = document.getElementById("ticketProductoSelect");
  const cantidadInput = document.getElementById("ticketCantidad");
  const cantidad = parseInt(cantidadInput.value) || 1;
  const productoId = select.value;

  if (!productoId) {
    mostrarModalAlerta("❌ Selecciona un producto");
    return;
  }

  const option = select.options[select.selectedIndex];
  const precio = Number(option?.dataset?.precio) || 0;

  const producto = productosDisponibles.find((p) => p.id === productoId);
  if (!producto) {
    mostrarModalAlerta("❌ Producto no encontrado");
    return;
  }

  if (cantidad < 1) {
    mostrarModalAlerta("❌ La cantidad debe ser al menos 1");
    return;
  }

  if (cantidad > producto.stock) {
    mostrarModalAlerta(
      `❌ Stock insuficiente. Disponible: ${producto.stock}`,
    );
    return;
  }

  const stockOriginal = producto.stock;

  const existente = ticketProductos.find((p) => p.id === productoId);
  if (existente) {
    const nuevaCantidad = existente.cantidad + cantidad;
    if (nuevaCantidad > stockOriginal) {
      mostrarModalAlerta(
        `❌ Stock insuficiente. Disponible: ${stockOriginal}`,
      );
      return;
    }
    existente.cantidad = nuevaCantidad;
  } else {
    const nuevoProducto = {
      id: producto.id,
      nombre: producto.nombre,
      precio: precio,
      cantidad: cantidad,
      stockOriginal: stockOriginal,
    };
    ticketProductos.push(nuevoProducto);
  }

  producto.stock -= cantidad;

  actualizarListaTicket();
  actualizarTotalesTicket();

  if (option) {
    const nuevoStock = producto.stock;
    option.dataset.stock = nuevoStock;
    option.textContent = `${producto.nombre} - $${precio} (Stock: ${nuevoStock})`;
    if (nuevoStock <= 0) {
      option.disabled = true;
    }
  }

  cantidadInput.value = "1";
}

function actualizarListaTicket() {
  const container = document.getElementById("ticketListaProductos");
  if (!container) return;

  if (ticketProductos.length === 0) {
    container.innerHTML =
      '<p class="text-dim text-center small">No hay productos agregados</p>';
    document.getElementById("ticketSubtotal").value = "$0.00";
    document.getElementById("ticketTotal").value = "$0.00";
    return;
  }

  container.innerHTML = ticketProductos
    .map(
      (p, index) => `
        <div class="d-flex justify-content-between align-items-center bg-secondary bg-opacity-25 p-2 rounded-2 mb-1">
            <div>
                <span class="text-white">${p.nombre}</span>
                <span class="text-dim small"> × ${p.cantidad}</span>
                <span class="text-warning small">$${(
                  p.precio * p.cantidad
                ).toFixed(2)}</span>
            </div>
            <button onclick="eliminarProductoTicket(${index})" class="btn btn-danger btn-sm">✕</button>
        </div>
    `,
    )
    .join("");
}

function eliminarProductoTicket(index) {
  const productoEliminado = ticketProductos[index];
  if (!productoEliminado) return;


  const productoOriginal = productosDisponibles.find(
    (p) => p.id === productoEliminado.id,
  );
  if (productoOriginal) {
    productoOriginal.stock = productoEliminado.stockOriginal;

    const select = document.getElementById("ticketProductoSelect");
    if (select) {
      const option = select.querySelector(
        `option[value="${productoOriginal.id}"]`,
      );
      if (option) {
        const nuevoStock = productoOriginal.stock;
        const precio = Number(productoOriginal.precio) || 0;
        option.dataset.stock = nuevoStock;
        option.textContent = `${productoOriginal.nombre} - $${precio} (Stock: ${nuevoStock})`;
        option.disabled = false;
      }
    }
  }

  ticketProductos.splice(index, 1);

  actualizarListaTicket();
  actualizarTotalesTicket();

  if (ticketProductos.length === 0) {
    document.getElementById("ticketSubtotal").value = "$0.00";
    document.getElementById("ticketTotal").value = "$0.00";
    const envioInput = document.getElementById("ticketEnvio");
    if (envioInput) envioInput.value = "0";
  }
}

function actualizarTotalesTicket() {
  let subtotalProductos = 0;
  for (const p of ticketProductos) {
    const precio = Number(p.precio) || 0;
    const cantidad = Number(p.cantidad) || 0;
    subtotalProductos += precio * cantidad;
  }

  const envioInput = document.getElementById("ticketEnvio");
  const envio = Number(envioInput?.value) || 0;
  const descuentoInput = document.getElementById("ticketDescuento");
  let descuentoPct = Number(descuentoInput?.value) || 0;
  descuentoPct = Math.min(100, Math.max(0, descuentoPct));

  const subtotal = subtotalProductos + envio;
  const descuentoMonto = subtotal * (descuentoPct / 100);
  const total = subtotal - descuentoMonto;

  const subtotalInput = document.getElementById("ticketSubtotal");
  const totalInput = document.getElementById("ticketTotal");

  if (subtotalInput) subtotalInput.value = `$${subtotal.toFixed(2)}`;
  if (totalInput) totalInput.value = `$${total.toFixed(2)}`;
}

async function generarTicketVenta(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeTicket");
  const btn = e.target.querySelector('button[type="submit"]');

  const cliente = document.getElementById("ticketCliente").value.trim();
  const telefono = document.getElementById("ticketTelefono").value.trim();
  const direccion = document.getElementById("ticketDireccion").value.trim();
  const envio = parseFloat(document.getElementById("ticketEnvio").value) || 0;
  let descuentoPct =
    parseFloat(document.getElementById("ticketDescuento").value) || 0;
  descuentoPct = Math.min(100, Math.max(0, descuentoPct));

  if (!cliente || !telefono) {
    return mostrarMensaje(
      msg,
      "❌ Cliente y teléfono son obligatorios",
      "error",
    );
  }

  if (ticketProductos.length === 0) {
    return mostrarMensaje(msg, "❌ Agrega al menos un producto", "error");
  }

  const subtotalProductosActual = ticketProductos.reduce(
    (s, p) => s + (Number(p.precio) || 0) * (Number(p.cantidad) || 0),
    0,
  );
  const subtotalActual = subtotalProductosActual + envio;
  const descuentoMontoActual = subtotalActual * (descuentoPct / 100);
  const totalActual = subtotalActual - descuentoMontoActual;

  // ============================================
  // MODO REIMPRESIÓN: pedido ya existente precargado.
  // Solo se genera/imprime el ticket, sin tocar stock,
  // sin crear otro pedido ni otro movimiento financiero.
  // ============================================
  if (pedidoTicketPrecargado) {
    const datosTicket = {
      cliente: cliente,
      telefono: telefono,
      direccion: direccion || "",
      lugar_entrega: document.getElementById("ticketLugarEntrega").value || "",
      metodo_pago:
        pedidoTicketPrecargado.metodo_pago === "transferencia"
          ? "Transferencia"
          : "Efectivo",
      items: ticketProductos.map((p) => ({
        nombre: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
      })),
      subtotal: subtotalActual,
      envio: envio,
      descuento: descuentoPct,
      total: totalActual,
      fecha:
        pedidoTicketPrecargado.fecha_entregado ||
        pedidoTicketPrecargado.fecha_vendido ||
        pedidoTicketPrecargado.fecha_pedido ||
        new Date().toISOString(),
      entrega_dia:
        pedidoTicketPrecargado?.fecha_entregado ||
        pedidoTicketPrecargado?.dia_entrega ||
        "",
      entrega_hora: pedidoTicketPrecargado?.hora_entrega || "",
      punto_entrega: pedidoTicketPrecargado?.punto_entrega || "",
      ticket_numero: `T-${Date.now().toString(36).toUpperCase()}`,
      numero_pedido: pedidoTicketPrecargado.numero_pedido || "",
      estado: pedidoTicketPrecargado.estado || "",
    };

    imprimirTicketAdmin(datosTicket);

    mostrarMensaje(
      msg,
      "✅ Ticket generado (no se registró otra venta).",
      "exito",
    );
    return;
  }

  // ============================================
  // MODO VENTA NUEVA: comportamiento original,
  // valida stock, crea el pedido, descuenta inventario
  // y registra el ingreso en finanzas.
  // ============================================
  let subtotal = 0;
  const productosValidados = [];

  for (const item of ticketProductos) {
    const { data: productoBD, error: prodError } = await window.supabase
      .from("productos")
      .select("id, nombre, precio, stock")
      .eq("nombre", item.nombre)
      .maybeSingle();

    if (prodError) {
      console.error("Error buscando producto:", prodError);
      return mostrarMensaje(
        msg,
        `❌ Error al verificar producto "${item.nombre}"`,
        "error",
      );
    }

    if (!productoBD) {
      return mostrarMensaje(
        msg,
        `❌ Producto "${item.nombre}" no encontrado en la base de datos.`,
        "error",
      );
    }

    if (item.cantidad > productoBD.stock) {
      return mostrarMensaje(
        msg,
        `❌ Stock insuficiente para "${item.nombre}". Disponible: ${productoBD.stock}`,
        "error",
      );
    }

    productosValidados.push({
      id: productoBD.id,
      nombre: productoBD.nombre,
      precio: productoBD.precio,
      cantidad: item.cantidad,
    });

    subtotal += productoBD.precio * item.cantidad;
  }

  const subtotalConEnvio = subtotal + envio;
  const descuentoMonto = subtotalConEnvio * (descuentoPct / 100);
  const total = subtotalConEnvio - descuentoMonto;
  const numeroPedido = generarNumeroPedido();

  try {
    btn.disabled = true;
    btn.textContent = "Procesando...";

    const pedido = {
      numero_pedido: numeroPedido,
      cliente_nombre: cliente,
      cliente_telefono: telefono,
      direccion_entrega: direccion || null,
      productos: productosValidados.map((p) => ({
        nombre: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
      })),
      total: total,
      costo_envio: envio,
      descuento: descuentoPct,
      lugar_entrega: document.getElementById("ticketLugarEntrega").value || null,
      metodo_pago: "efectivo",
      estado: "vendido",
      fecha_vendido: new Date().toISOString(),
      notas: `Ticket generado desde el panel.`,
    };

    const { data: pedidoData, error: pedidoError } = await window.supabase
      .from("pedidos")
      .insert([pedido])
      .select();

    if (pedidoError) throw pedidoError;

    for (const item of productosValidados) {
      const { error: invError } = await window.supabase
        .from("inventario")
        .insert([
          {
            producto_id: item.id,
            tipo: "salida",
            cantidad: Number(item.cantidad) || 0,
            descripcion: `Venta a ${cliente}`,
          },
        ]);

      if (invError) throw invError;
    }

    for (const item of productosValidados) {
      const { data: prodActual } = await window.supabase
        .from("productos")
        .select("stock")
        .eq("id", item.id)
        .single();

      if (prodActual) {
        const nuevoStock = prodActual.stock - item.cantidad;
        await window.supabase
          .from("productos")
          .update({ stock: nuevoStock })
          .eq("id", item.id);
      }
    }

    const { error: finError } = await window.supabase.from("finanzas").insert([
      {
        tipo: "ingreso",
        categoria: "venta",
        descripcion: `Venta a ${cliente}`,
        monto: total,
      },
    ]);

    if (finError) throw finError;

    const datosTicket = {
      cliente: cliente,
      telefono: telefono,
      direccion: direccion || "",
      lugar_entrega: document.getElementById("ticketLugarEntrega").value || "",
      metodo_pago: "Efectivo",
      items: productosValidados.map((p) => ({
        nombre: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
      })),
      subtotal: subtotalConEnvio,
      envio: envio,
      descuento: descuentoPct,
      total: total,
      fecha: new Date().toISOString(),
      ticket_numero: `T-${Date.now().toString(36).toUpperCase()}`,
      numero_pedido: numeroPedido,
      estado: "vendido",
    };

    imprimirTicketAdmin(datosTicket);

    mostrarMensaje(msg, "✅ ¡Venta registrada! Ticket generado.", "exito");

    limpiarFormularioTicket();

    cargarProductos();
    cargarInventario();
    cargarPedidos();
    cargarFinanzas();
    cargarProductosTicket();
    cargarPedidosParaTicket();
  } catch (error) {
    console.error("Error:", error);
    mostrarMensaje(msg, "❌ Error: " + error.message, "error");
  } finally {
    btn.disabled = false;
    actualizarBotonTicket();
  }
}

// Vista previa del ticket desde el tab Ticket (reimpresión o venta nueva).
// Lee los mismos campos del formulario que generarTicketVenta,
// pero solo abre la vista previa sin imprimir ni guardar.
function verVistaPreviaVenta() {
  const cliente = document.getElementById("ticketCliente").value.trim();
  const telefono = document.getElementById("ticketTelefono").value.trim();
  const direccion = document.getElementById("ticketDireccion").value.trim();
  const envio = parseFloat(document.getElementById("ticketEnvio").value) || 0;
  let descuentoPct =
    parseFloat(document.getElementById("ticketDescuento").value) || 0;
  descuentoPct = Math.min(100, Math.max(0, descuentoPct));

  const msg = document.getElementById("mensajeTicket");
  if (!cliente || !telefono) {
    return mostrarMensaje(msg, "❌ Cliente y teléfono son obligatorios", "error");
  }
  if (ticketProductos.length === 0) {
    return mostrarMensaje(msg, "❌ Agrega al menos un producto", "error");
  }

  const subtotalProductos = ticketProductos.reduce(
    (s, p) => s + (Number(p.precio) || 0) * (Number(p.cantidad) || 0),
    0,
  );
  const subtotal = subtotalProductos + envio;
  const total = subtotal - subtotal * (descuentoPct / 100);

  let metodoPago = "Efectivo";
  let numeroPedido = "";
  let fechaPedido = new Date().toISOString();
  let estado = "vendido";

  if (pedidoTicketPrecargado) {
    metodoPago =
      pedidoTicketPrecargado.metodo_pago === "transferencia"
        ? "Transferencia"
        : "Efectivo";
    numeroPedido = pedidoTicketPrecargado.numero_pedido || "";
    fechaPedido =
      pedidoTicketPrecargado.fecha_entregado ||
      pedidoTicketPrecargado.fecha_vendido ||
      pedidoTicketPrecargado.fecha_pedido ||
      fechaPedido;
    estado = pedidoTicketPrecargado.estado || estado;
  }

  const datosTicket = {
    cliente: cliente,
    telefono: telefono,
    direccion: direccion || "",
    lugar_entrega: document.getElementById("ticketLugarEntrega").value || "",
    metodo_pago: metodoPago,
    items: ticketProductos.map((p) => ({
      nombre: p.nombre,
      precio: p.precio,
      cantidad: p.cantidad,
    })),
    subtotal: subtotal,
    envio: envio,
    descuento: descuentoPct,
    total: total,
    fecha: fechaPedido,
    entrega_dia:
      pedidoTicketPrecargado?.fecha_entregado ||
      pedidoTicketPrecargado?.dia_entrega ||
      "",
    entrega_hora: pedidoTicketPrecargado?.hora_entrega || "",
    punto_entrega: pedidoTicketPrecargado?.punto_entrega || "",
    ticket_numero: `T-${Date.now().toString(36).toUpperCase()}`,
    numero_pedido: numeroPedido,
    estado: estado,
  };

  verVistaPreviaTicket(datosTicket);
}

// ============================================
// 7. ELIMINAR (MODAL)
// ============================================

function pedirEliminar(id, tipo) {
  eliminarId = id;
  eliminarTipo = tipo;
  const mensajes = {
    producto: "¿Eliminar este producto?",
    inventario: "¿Eliminar este movimiento?",
    finanza: "¿Eliminar este registro?",
    pedido:
      "¿Eliminar este pedido de forma PERMANENTE? Esta acción no se puede deshacer.",
    "devolucion-pedido":
      "¿Devolver estos productos al stock? El pedido pasará a estado 'Devuelto'.",
  };
  const modalMensaje = document.getElementById("modalMensaje");
  if (modalMensaje)
    modalMensaje.textContent = mensajes[tipo] || "¿Eliminar este elemento?";

  const modalElement = document.getElementById("modalConfirm");
  if (modalElement) modalElement.style.display = "flex";
}

function pedirEliminarPedido(id) {
  pedirEliminar(id, "pedido");
}

function pedirDevolucionPedido(id) {
  pedirEliminar(id, "devolucion-pedido");
}

async function confirmarEliminar() {
  if (!eliminarId) return;

  try {
    let result;
    if (eliminarTipo === "producto") {
      result = await window.supabase
        .from("productos")
        .delete()
        .eq("id", eliminarId);
    } else if (eliminarTipo === "inventario") {
      const { data: movimiento } = await window.supabase
        .from("inventario")
        .select("*")
        .eq("id", eliminarId)
        .single();

      if (movimiento) {
        let revertirStock = 0;
        if (movimiento.tipo === "entrada") {
          revertirStock = -movimiento.cantidad;
        } else if (movimiento.tipo === "salida") {
          revertirStock = movimiento.cantidad;
        }

        if (revertirStock !== 0) {
          const { data: productoActual } = await window.supabase
            .from("productos")
            .select("stock")
            .eq("id", movimiento.producto_id)
            .single();

          if (productoActual) {
            let nuevoStock = productoActual.stock + revertirStock;
            if (nuevoStock < 0) nuevoStock = 0;
            await window.supabase
              .from("productos")
              .update({ stock: nuevoStock })
              .eq("id", movimiento.producto_id);
          }
        }
      }

      result = await window.supabase
        .from("inventario")
        .delete()
        .eq("id", eliminarId);
    } else if (eliminarTipo === "finanza") {
      result = await window.supabase
        .from("finanzas")
        .delete()
        .eq("id", eliminarId);
    } else if (eliminarTipo === "pedido") {
      result = await window.supabase
        .from("pedidos")
        .delete()
        .eq("id", eliminarId);
    } else if (eliminarTipo === "devolucion-pedido") {
      const { data: pedido, error: getError } = await window.supabase
        .from("pedidos")
        .select("*")
        .eq("id", eliminarId)
        .single();
      if (getError) throw getError;
      if (!pedido) throw new Error("Pedido no encontrado");

      for (const item of pedido.productos || []) {
        const { data: prodActual } = await window.supabase
          .from("productos")
          .select("id, stock")
          .eq("nombre", item.nombre)
          .maybeSingle();

        if (prodActual) {
          const nuevoStock =
            (Number(prodActual.stock) || 0) + (Number(item.cantidad) || 0);
          await window.supabase
            .from("productos")
            .update({ stock: nuevoStock })
            .eq("id", prodActual.id);

          await window.supabase.from("inventario").insert([
            {
              producto_id: prodActual.id,
              tipo: "entrada",
              cantidad: Number(item.cantidad) || 0,
              descripcion: `Devolución - Pedido ${
                pedido.numero_pedido || eliminarId
              }`,
            },
          ]);
        }
      }

      result = await window.supabase
        .from("pedidos")
        .update({ estado: "devuelto" })
        .eq("id", eliminarId);
    }
    if (result.error) throw result.error;

    const modalElement = document.getElementById("modalConfirm");
    if (modalElement) modalElement.style.display = "none";

    if (eliminarTipo === "producto") {
      cargarProductos();
      cargarInventario();
    } else if (eliminarTipo === "inventario") {
      cargarInventario();
      cargarProductos();
    } else if (eliminarTipo === "finanza") {
      cargarFinanzas();
    } else if (
      eliminarTipo === "pedido" ||
      eliminarTipo === "devolucion-pedido"
    ) {
      cargarPedidos();
      cargarProductos();
      cargarInventario();
    }

    const mensajesExito = {
      pedido: "✅ Pedido eliminado",
      "devolucion-pedido":
        "✅ Stock devuelto correctamente. Pedido marcado como Devuelto.",
    };
    mostrarModalAlerta(
      mensajesExito[eliminarTipo] || "✅ Eliminado correctamente",
    );
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("❌ Error: " + error.message);
  }
  eliminarId = null;
  eliminarTipo = null;
}

function cerrarModal() {
  const modalElement = document.getElementById("modalConfirm");
  if (modalElement) modalElement.style.display = "none";
  eliminarId = null;
  eliminarTipo = null;
}

// ============================================
// 8. PROMOCIONES - CUPONES Y NOTICIAS
// ============================================

let cuponEditando = null;
let noticiaEditando = null;
let ultimoTotalCupones = 0;
let ultimoTotalNoticias = 0;

// ============================================
// HELPERS DE FECHA (date picker <-> texto guardado)
// ============================================

const MESES_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const MESES_ES_MAP = {
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dic: 12,
};

// "2026-01-15" -> "📅 15 Ene 2026"
function formatearFechaNoticia(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `📅 ${d} ${MESES_ES[m - 1]} ${y}`;
}

// "📅 15 Ene 2026" -> "2026-01-15" (o "" si no se puede interpretar)
function parsearFechaNoticiaAISO(texto) {
  if (!texto) return "";
  const match = texto.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ]{3,})\s+(\d{4})/);
  if (!match) return "";
  const dia = parseInt(match[1], 10);
  const mes = MESES_ES_MAP[match[2].toLowerCase().substring(0, 3)];
  const anio = parseInt(match[3], 10);
  if (!mes) return "";
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(
    2,
    "0",
  )}`;
}

// "2026-12-31" -> "Válido hasta: 31/12/2026"
function formatearVigenciaCupon(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `Válido hasta: ${String(d).padStart(2, "0")}/${String(m).padStart(
    2,
    "0",
  )}/${y}`;
}

// "Válido hasta: 31/12/2026" -> "2026-12-31" (o "" si no se puede interpretar)
function parsearVigenciaAISO(texto) {
  if (!texto) return "";
  const match = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return "";
  const dia = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const anio = parseInt(match[3], 10);
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(
    2,
    "0",
  )}`;
}

// Alterna entre el date picker y el campo de texto especial de noticias
function actualizarModoFechaNoticia() {
  const esTexto = document.getElementById("noticiaFechaEsTexto")?.checked;
  const picker = document.getElementById("noticiaFechaPicker");
  const texto = document.getElementById("noticiaFechaTexto");
  if (!picker || !texto) return;
  picker.style.display = esTexto ? "none" : "block";
  texto.style.display = esTexto ? "block" : "none";
}

// ============================================
// CARGAR CUPONES
// ============================================

async function cargarCupones() {
  const container = document.getElementById("listaCupones");
  if (!container) return;

  const tabPromociones = document.getElementById("tab-promociones");
  if (tabPromociones && tabPromociones.style.display === "none") {
    return;
  }

  container.innerHTML =
    '<div class="text-center text-dim py-3">Cargando...</div>';

  try {
    const { data, error } = await window.supabase
      .from("cupones")
      .select("*")
      .order("orden", { ascending: true });

    if (error) throw error;

    if (!data || !data.length) {
      ultimoTotalCupones = 0;
      container.innerHTML =
        '<p class="text-center text-dim py-3">🎯 No hay cupones registrados</p>';
      return;
    }
    ultimoTotalCupones = data.length;

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Icono</th>
                        <th>Tag</th>
                        <th>Título</th>
                        <th>Código</th>
                        <th>Descuento</th>
                        <th>Vigencia</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data
                      .map(
                        (c, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td style="font-size:1.5rem;">${
                              c.icono || "🎯"
                            }</td>
                            <td><span class="badge bg-secondary">${
                              c.tag || "Sin tag"
                            }</span></td>
                            <td><strong>${c.titulo}</strong></td>
                            <td><code style="background:var(--bg-input);padding:2px 8px;border-radius:4px;font-size:12px;">${
                              c.codigo
                            }</code></td>
                            <td><span class="badge bg-info" style="color:#0a0a0a;">${
                              c.descuento ?? 0
                            }%</span></td>
                            <td><small>${c.vigencia}</small></td>
                            <td>
                                <span class="badge ${
                                  c.activo ? "bg-success" : "bg-danger"
                                }">
                                    ${c.activo ? "✅ Activo" : "❌ Inactivo"}
                                </span>
                            </td>
                            <td>
                                <button onclick="editarCupon('${
                                  c.id
                                }')" class="btn btn-outline-warning btn-sm">✏️</button>
                                <button onclick="pedirEliminarCupon('${
                                  c.id
                                }')" class="btn btn-outline-danger btn-sm">🗑️</button>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            <div style="margin-top:10px; color:var(--text-dim); font-size:0.75rem;">
                <i class="fas fa-info-circle"></i> Máximo 5 cupones activos recomendados
            </div>
        `;
  } catch (error) {
    console.error("Error cargando cupones:", error);
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar cupones</p>';
  }
}

// ============================================
// CARGAR NOTICIAS
// ============================================

async function cargarNoticias() {
  const container = document.getElementById("listaNoticias");
  if (!container) return;

  const tabPromociones = document.getElementById("tab-promociones");
  if (tabPromociones && tabPromociones.style.display === "none") {
    return;
  }

  container.innerHTML =
    '<div class="text-center text-dim py-3">Cargando...</div>';

  try {
    const { data, error } = await window.supabase
      .from("noticias")
      .select("*")
      .order("orden", { ascending: true });

    if (error) throw error;

    if (!data || !data.length) {
      ultimoTotalNoticias = 0;
      container.innerHTML =
        '<p class="text-center text-dim py-3">📰 No hay noticias registradas</p>';
      return;
    }
    ultimoTotalNoticias = data.length;

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Título</th>
                        <th>Descripción</th>
                        <th>Destacado</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data
                      .map(
                        (n, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td><small>${n.fecha}</small></td>
                            <td><strong>${n.titulo}</strong></td>
                            <td><small>${n.descripcion.substring(0, 60)}${
                              n.descripcion.length > 60 ? "..." : ""
                            }</small></td>
                            <td>
                                ${
                                  n.destacado
                                    ? '<span class="badge bg-warning">⭐ Destacado</span>'
                                    : '<span class="badge bg-secondary">Normal</span>'
                                }
                            </td>
                            <td>
                                <span class="badge ${
                                  n.activo ? "bg-success" : "bg-danger"
                                }">
                                    ${n.activo ? "✅ Activo" : "❌ Inactivo"}
                                </span>
                            </td>
                            <td>
                                <button onclick="editarNoticia('${
                                  n.id
                                }')" class="btn btn-outline-warning btn-sm">✏️</button>
                                <button onclick="pedirEliminarNoticia('${
                                  n.id
                                }')" class="btn btn-outline-danger btn-sm">🗑️</button>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            <div style="margin-top:10px; color:var(--text-dim); font-size:0.75rem;">
                <i class="fas fa-info-circle"></i> Máximo 4 noticias activas recomendadas
            </div>
        `;
  } catch (error) {
    console.error("Error cargando noticias:", error);
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar noticias</p>';
  }
}

// ============================================
// CRUD - CUPONES
// ============================================

function mostrarFormCupon(data = null) {
  const container = document.getElementById("formCuponContainer");
  if (!container) return;

  container.style.display = "flex";
  container.scrollIntoView({ behavior: "smooth" });

  if (data) {
    cuponEditando = data;
    document.getElementById("formCuponTitulo").textContent = "✏️ Editar Cupón";
    const submitBtn = document.querySelector(
      '#formCupon button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Actualizar";

    document.getElementById("cuponId").value = data.id;
    document.getElementById("cuponTitulo").value = data.titulo || "";
    document.getElementById("cuponDescripcion").value = data.descripcion || "";
    document.getElementById("cuponCodigo").value = data.codigo || "";
    document.getElementById("cuponTag").value = data.tag || "";
    document.getElementById("cuponIcono").value = data.icono || "";
    document.getElementById("cuponVigenciaPicker").value = parsearVigenciaAISO(
      data.vigencia,
    );
    document.getElementById("cuponDescuento").value = data.descuento ?? 10;
    document.getElementById("cuponOrden").value = data.orden ?? 1;
    document.getElementById("cuponActivo").value = data.activo
      ? "true"
      : "false";
  } else {
    cuponEditando = null;
    document.getElementById("formCuponTitulo").textContent = "➕ Agregar Cupón";
    const submitBtn = document.querySelector(
      '#formCupon button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Guardar";

    document.getElementById("formCupon").reset();
    document.getElementById("cuponId").value = "";
    document.getElementById("cuponActivo").value = "true";
    document.getElementById("cuponDescuento").value = 10;
    // Sugerimos el siguiente número de orden disponible; se puede cambiar.
    document.getElementById("cuponOrden").value = ultimoTotalCupones + 1;
  }
}

function ocultarFormCupon() {
  const container = document.getElementById("formCuponContainer");
  if (container) container.style.display = "none";
  cuponEditando = null;
}

async function editarCupon(id) {
  try {
    const { data, error } = await window.supabase
      .from("cupones")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (data) mostrarFormCupon(data);
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("Error al cargar el cupón");
  }
}

async function guardarCupon(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeCupon");
  const btn = e.target.querySelector('button[type="submit"]');

  const id = document.getElementById("cuponId").value || null;
  const esEdicion = id && id !== "";

  const vigenciaISO = document.getElementById("cuponVigenciaPicker").value;

  const datos = {
    titulo: document.getElementById("cuponTitulo").value.trim(),
    descripcion: document.getElementById("cuponDescripcion").value.trim(),
    codigo: document.getElementById("cuponCodigo").value.trim(),
    descuento: parseInt(document.getElementById("cuponDescuento").value) || 0,
    tag: document.getElementById("cuponTag").value.trim(),
    icono: document.getElementById("cuponIcono").value.trim(),
    vigencia: formatearVigenciaCupon(vigenciaISO),
    orden: (() => {
      const o = parseInt(document.getElementById("cuponOrden").value, 10);
      return isNaN(o) ? ultimoTotalCupones + 1 : o;
    })(),
    activo: document.getElementById("cuponActivo").value === "true",
  };

  if (
    !datos.titulo ||
    !datos.descripcion ||
    !datos.codigo ||
    !datos.tag ||
    !datos.icono ||
    !vigenciaISO
  ) {
    if (msg) mostrarMensaje(msg, "❌ Completa todos los campos", "error");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Guardando...";
    }

    let result;
    if (esEdicion) {
      result = await window.supabase
        .from("cupones")
        .update({ ...datos, updated_at: new Date().toISOString() })
        .eq("id", id);
    } else {
      result = await window.supabase.from("cupones").insert([{ ...datos }]);
    }

    if (result.error) throw result.error;

    if (msg) mostrarMensaje(msg, "✅ Cupón guardado correctamente", "exito");
    ocultarFormCupon();
    cargarCupones();
  } catch (error) {
    console.error("Error:", error);
    if (msg) mostrarMensaje(msg, "❌ " + error.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = esEdicion ? "💾 Actualizar" : "💾 Guardar";
    }
  }
}

async function pedirEliminarCupon(id) {
  modalConfirmar("¿Eliminar este cupón permanentemente?", async function () {
    try {
      const { error } = await window.supabase
        .from("cupones")
        .delete()
        .eq("id", id);
      if (error) throw error;
      mostrarModalAlerta("✅ Cupón eliminado");
      cargarCupones();
    } catch (error) {
      console.error("Error:", error);
      mostrarModalAlerta("❌ Error al eliminar: " + error.message);
    }
  });
}

// ============================================
// CRUD - NOTICIAS
// ============================================

function mostrarFormNoticia(data = null) {
  const container = document.getElementById("formNoticiaContainer");
  if (!container) return;

  container.style.display = "flex";
  container.scrollIntoView({ behavior: "smooth" });

  if (data) {
    noticiaEditando = data;
    document.getElementById("formNoticiaTitulo").textContent =
      "✏️ Editar Noticia";
    const submitBtn = document.querySelector(
      '#formNoticia button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Actualizar";

    document.getElementById("noticiaId").value = data.id;
    document.getElementById("noticiaTitulo").value = data.titulo || "";
    document.getElementById("noticiaDescripcion").value =
      data.descripcion || "";
    document.getElementById("noticiaDestacado").value = data.destacado
      ? "true"
      : "false";
    document.getElementById("noticiaOrden").value = data.orden ?? 1;
    document.getElementById("noticiaActivo").value = data.activo
      ? "true"
      : "false";

    // Intentamos interpretar la fecha guardada como una fecha real.
    // Si no se puede (ej. "⚡ ¡ÚLTIMO MOMENTO!"), se activa el modo texto.
    const fechaISO = parsearFechaNoticiaAISO(data.fecha);
    const checkboxTexto = document.getElementById("noticiaFechaEsTexto");
    if (fechaISO) {
      checkboxTexto.checked = false;
      document.getElementById("noticiaFechaPicker").value = fechaISO;
      document.getElementById("noticiaFechaTexto").value = "";
    } else {
      checkboxTexto.checked = true;
      document.getElementById("noticiaFechaTexto").value = data.fecha || "";
      document.getElementById("noticiaFechaPicker").value = "";
    }
    actualizarModoFechaNoticia();
  } else {
    noticiaEditando = null;
    document.getElementById("formNoticiaTitulo").textContent =
      "➕ Agregar Noticia";
    const submitBtn = document.querySelector(
      '#formNoticia button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Guardar";

    document.getElementById("formNoticia").reset();
    document.getElementById("noticiaId").value = "";
    document.getElementById("noticiaDestacado").value = "false";
    document.getElementById("noticiaActivo").value = "true";
    // Sugerimos el siguiente número de orden disponible; se puede cambiar.
    document.getElementById("noticiaOrden").value = ultimoTotalNoticias + 1;
    document.getElementById("noticiaFechaEsTexto").checked = false;
    document.getElementById("noticiaFechaTexto").value = "";
    actualizarModoFechaNoticia();
  }
}

function ocultarFormNoticia() {
  const container = document.getElementById("formNoticiaContainer");
  if (container) container.style.display = "none";
  noticiaEditando = null;
}

async function editarNoticia(id) {
  try {
    const { data, error } = await window.supabase
      .from("noticias")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (data) mostrarFormNoticia(data);
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("Error al cargar la noticia");
  }
}

async function guardarNoticia(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeNoticia");
  const btn = e.target.querySelector('button[type="submit"]');

  const id = document.getElementById("noticiaId").value || null;
  const esEdicion = id && id !== "";

  const esTexto = document.getElementById("noticiaFechaEsTexto").checked;
  const fechaISO = document.getElementById("noticiaFechaPicker").value;
  const fechaTexto = document.getElementById("noticiaFechaTexto").value.trim();
  const fechaFinal = esTexto ? fechaTexto : formatearFechaNoticia(fechaISO);

  const datos = {
    titulo: document.getElementById("noticiaTitulo").value.trim(),
    descripcion: document.getElementById("noticiaDescripcion").value.trim(),
    fecha: fechaFinal,
    destacado: document.getElementById("noticiaDestacado").value === "true",
    orden: (() => {
      const o = parseInt(document.getElementById("noticiaOrden").value, 10);
      return isNaN(o) ? ultimoTotalNoticias + 1 : o;
    })(),
    activo: document.getElementById("noticiaActivo").value === "true",
  };

  if (!datos.titulo || !datos.descripcion || !datos.fecha) {
    if (msg) mostrarMensaje(msg, "❌ Completa todos los campos", "error");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Guardando...";
    }

    let result;
    if (esEdicion) {
      result = await window.supabase
        .from("noticias")
        .update({ ...datos, updated_at: new Date().toISOString() })
        .eq("id", id);
    } else {
      result = await window.supabase.from("noticias").insert([{ ...datos }]);
    }

    if (result.error) throw result.error;

    if (msg) mostrarMensaje(msg, "✅ Noticia guardada correctamente", "exito");
    ocultarFormNoticia();
    cargarNoticias();
  } catch (error) {
    console.error("Error:", error);
    if (msg) mostrarMensaje(msg, "❌ " + error.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = esEdicion ? "💾 Actualizar" : "💾 Guardar";
    }
  }
}

async function pedirEliminarNoticia(id) {
  modalConfirmar("¿Eliminar esta noticia permanentemente?", async function () {
    try {
      const { error } = await window.supabase
        .from("noticias")
        .delete()
        .eq("id", id);
      if (error) throw error;
      mostrarModalAlerta("✅ Noticia eliminada");
      cargarNoticias();
    } catch (error) {
      console.error("Error:", error);
      mostrarModalAlerta("❌ Error al eliminar: " + error.message);
    }
  });
}

// ============================================
// CRUD - LUGARES DE ENTREGA / COSTOS DE ENVÍO
// ============================================

let ultimoTotalLugares = 0;
let lugarEditando = null;

async function cargarLugaresEntregaAdmin() {
  const container = document.getElementById("listaLugares");
  if (!container) return;

  const tabPromociones = document.getElementById("tab-promociones");
  if (tabPromociones && tabPromociones.style.display === "none") return;

  container.innerHTML =
    '<div class="text-center text-dim py-3">Cargando...</div>';

  try {
    const { data, error } = await window.supabase
      .from("lugares_entrega")
      .select("*")
      .order("orden", { ascending: true });
    if (error) throw error;

    if (!data || !data.length) {
      ultimoTotalLugares = 0;
      container.innerHTML =
        '<p class="text-center text-dim py-3">🚚 No hay lugares de entrega registrados</p>';
      return;
    }
    ultimoTotalLugares = data.length;

    container.innerHTML = `
        <table class="table table-dark table-hover table-sm">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Lugar</th>
                    <th style="text-align:center;">Costo de envío</th>
                    <th style="text-align:center;">Horario fijo</th>
                    <th style="text-align:center;">Orden</th>
                    <th style="text-align:center;">Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (l, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td><strong>${l.lugar}</strong></td>
                        <td style="text-align:center;"><span style="color:var(--accent); font-weight:600; white-space:nowrap;">${formatearMoneda(
                          Number(l.costo) || 0,
                        )}</span></td>
                        <td style="text-align:center;">${
                          l.horario_fijo
                            ? `<span style="color:var(--regio-green); white-space:nowrap;">${l.horario_fijo}</span>`
                            : `<span style="color:var(--text-dim);">Coordinado</span>`
                        }</td>
                        <td style="text-align:center;">${l.orden ?? 0}</td>
                        <td style="text-align:center; white-space:nowrap;">
                            <button onclick="editarLugar('${l.id}')" class="btn btn-outline-warning btn-sm">✏️</button>
                            <button onclick="pedirEliminarLugar('${l.id}')" class="btn btn-outline-danger btn-sm">🗑️</button>
                        </td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
        <div style="margin-top:10px; color:var(--text-dim); font-size:0.75rem;">
            <i class="fas fa-info-circle"></i> Estos lugares/costos se usan en el formulario público y en el tab Ticket.
        </div>
    `;
  } catch (error) {
    console.error("Error cargando lugares:", error);
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar lugares</p>';
  }
}

function mostrarFormLugar(data = null) {
  const container = document.getElementById("formLugarContainer");
  if (!container) return;
  container.style.display = "flex";
  container.scrollIntoView({ behavior: "smooth" });

  if (data) {
    lugarEditando = data;
    document.getElementById("formLugarTitulo").textContent =
      "✏️ Editar Lugar de Entrega";
    const submitBtn = document.querySelector(
      '#formLugar button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Actualizar";

    document.getElementById("lugarId").value = data.id;
    document.getElementById("lugarNombre").value = data.lugar || "";
    document.getElementById("lugarCosto").value = data.costo ?? 0;
    document.getElementById("lugarOrden").value = data.orden ?? 1;
    document.getElementById("lugarHorarioFijo").value =
      data.horario_fijo || "";
  } else {
    lugarEditando = null;
    document.getElementById("formLugarTitulo").textContent =
      "➕ Agregar Lugar de Entrega";
    const submitBtn = document.querySelector(
      '#formLugar button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Guardar";

    document.getElementById("formLugar").reset();
    document.getElementById("lugarId").value = "";
    document.getElementById("lugarOrden").value = ultimoTotalLugares + 1;
    document.getElementById("lugarHorarioFijo").value = "";
  }
}

function ocultarFormLugar() {
  const container = document.getElementById("formLugarContainer");
  if (container) container.style.display = "none";
  lugarEditando = null;
}

async function editarLugar(id) {
  try {
    const { data, error } = await window.supabase
      .from("lugares_entrega")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (data) mostrarFormLugar(data);
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("Error al cargar el lugar");
  }
}

async function guardarLugar(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeLugar");
  const btn = e.target.querySelector('button[type="submit"]');

  const id = document.getElementById("lugarId").value || null;
  const esEdicion = id && id !== "";

  const datos = {
    lugar: document.getElementById("lugarNombre").value.trim(),
    costo: parseFloat(document.getElementById("lugarCosto").value) || 0,
    horario_fijo:
      (document.getElementById("lugarHorarioFijo").value || "").trim() || null,
    orden: (() => {
      const o = parseInt(document.getElementById("lugarOrden").value, 10);
      return isNaN(o) ? ultimoTotalLugares + 1 : o;
    })(),
  };

  if (!datos.lugar) {
    if (msg) mostrarMensaje(msg, "❌ El nombre del lugar es obligatorio", "error");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Guardando...";
    }

    let result;
    if (esEdicion) {
      result = await window.supabase
        .from("lugares_entrega")
        .update(datos)
        .eq("id", id);
    } else {
      result = await window.supabase.from("lugares_entrega").insert([datos]);
    }

    if (result.error) throw result.error;

    if (msg) mostrarMensaje(msg, "✅ Lugar guardado correctamente", "exito");
    ocultarFormLugar();
    cargarLugaresEntregaAdmin();
    cargarLugaresTicketAdmin();
  } catch (error) {
    console.error("Error:", error);
    if (msg) mostrarMensaje(msg, "❌ " + error.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = esEdicion ? "💾 Actualizar" : "💾 Guardar";
    }
  }
}

// Llena el select de "Editar pedido" (editarLugarEntrega) con los lugares
// de la base de datos, en lugar de tenerlos fijos en el HTML.
async function cargarLugaresEditarPedido() {
  const sel = document.getElementById("editarLugarEntrega");
  if (!sel) return;
  let lugares = [];
  try {
    if (window.supabase && typeof window.supabase.from === "function") {
      const { data, error } = await window.supabase
        .from("lugares_entrega")
        .select("lugar, costo")
        .order("orden", { ascending: true });
      if (!error && data) lugares = data;
    }
  } catch (e) {
    lugares = [];
  }
  const valorActual = sel.value;
  sel.innerHTML =
    '<option value="" selected>Selecciona lugar de entrega...</option>';
  (lugares.length ? lugares : LUGARES_FALLBACK_ADMIN).forEach((l) => {
    const costo = Number(l.costo) || 0;
    sel.innerHTML += `<option value="${l.lugar}">${l.lugar} — ${formatearMoneda(
      costo,
    )}</option>`;
  });
  if (valorActual) sel.value = valorActual;
}

const LUGARES_FALLBACK_ADMIN = [
  { lugar: "Apodaca centro (frente a iglesia)", costo: 0 },
  { lugar: "San Nicolas centro (plaza presidencia)", costo: 0 },
  { lugar: "Costco Escobedo", costo: 0 },
  { lugar: "San Pedro (punto y horario a convenir)", costo: 200 },
  { lugar: "Monterrey (punto y horario a convenir)", costo: 200 },
  { lugar: "Guadalupe (punto y horario a convenir)", costo: 200 },
];

function pedirEliminarLugar(id) {
  modalConfirmar("¿Eliminar este lugar de entrega permanentemente?", async function () {    try {
      const { error } = await window.supabase
        .from("lugares_entrega")
        .delete()
        .eq("id", id);
      if (error) throw error;
      mostrarModalAlerta("✅ Lugar eliminado");
      cargarLugaresEntregaAdmin();
      cargarLugaresTicketAdmin();
    } catch (error) {
      console.error("Error:", error);
      mostrarModalAlerta("❌ Error al eliminar: " + error.message);
    }
  });
}

// Llena el select de lugar de entrega del tab Ticket con lugares + costos
async function cargarLugaresTicketAdmin() {
  const sel = document.getElementById("ticketLugarEntrega");
  if (!sel) return;
  let lugares = [];
  try {
    if (window.supabase && typeof window.supabase.from === "function") {
      const { data, error } = await window.supabase
        .from("lugares_entrega")
        .select("lugar, costo, horario_fijo")
        .order("orden", { ascending: true });
      if (!error && data) lugares = data;
    }
  } catch (e) {
    lugares = [];
  }
  sel.innerHTML =
    '<option value="" selected>Selecciona tu lugar de entrega...</option>';
  if (!lugares.length) {
    lugares = [
      { lugar: "Apodaca centro (frente a iglesia)", costo: 0, horario_fijo: "08:00-08:30" },
      { lugar: "San Nicolas centro (plaza presidencia)", costo: 0, horario_fijo: "09:00-09:30" },
      { lugar: "Costco Escobedo", costo: 0, horario_fijo: "10:00-10:30" },
      { lugar: "San Pedro (punto y horario a convenir)", costo: 200, horario_fijo: null },
      { lugar: "Monterrey (punto y horario a convenir)", costo: 200, horario_fijo: null },
      { lugar: "Guadalupe (punto y horario a convenir)", costo: 200, horario_fijo: null },
    ];
  }
  lugares.forEach((l) => {
    const costo = Number(l.costo) || 0;
    sel.innerHTML += `<option value="${l.lugar}" data-costo="${costo}">${l.lugar} — ${formatearMoneda(
      costo,
    )}</option>`;
  });
}

// Escribe el costo en ticketEnvio al cambiar el lugar en el tab Ticket
function aplicarCostoLugarTicket(sel) {
  const opt = sel.options[sel.selectedIndex];
  const costo = opt ? Number(opt.dataset.costo) || 0 : 0;
  const envio = document.getElementById("ticketEnvio");
  if (envio && opt && opt.value !== "") envio.value = costo;
}

// Abre un modal con los lugares de entrega y su costo de envío (columna #,
// Lugar y Costo de envío) para llenar el ticket manualmente. Al hacer clic en
// una fila se copia el costo al campo de envío del ticket y se cierra.
async function abrirModalLugaresEntrega() {
  const container = document.getElementById("listaModalLugares");
  if (!container) return;
  container.innerHTML =
    '<div style="text-align:center; padding:24px; color:var(--text-silver);">Cargando...</div>';
  document.getElementById("modalLugaresEntrega").style.display = "flex";

  let lugares = [];
  try {
    if (window.supabase && typeof window.supabase.from === "function") {
      const { data, error } = await window.supabase
        .from("lugares_entrega")
        .select("lugar, costo, orden")
        .order("orden", { ascending: true });
      if (!error && data) lugares = data;
    }
  } catch (e) {
    lugares = [];
  }

  if (!lugares.length) {
    lugares = [
      { lugar: "Punto de entrega", costo: 0 },
      { lugar: "San Nicolas", costo: 100 },
      { lugar: "Apodaca", costo: 80 },
      { lugar: "Escobedo", costo: 100 },
      { lugar: "Monterrey", costo: 150 },
      { lugar: "Cienega de Flores", costo: 100 },
      { lugar: "Zuazua", costo: 130 },
      { lugar: "Marin", costo: 130 },
      { lugar: "San Pedro", costo: 150 },
      { lugar: "Garcia", costo: 150 },
    ];
  }

  container.innerHTML = `
    <table class="table table-dark table-hover table-sm" style="margin:0;">
        <thead>
            <tr>
                <th style="width:40px; text-align:center;">#</th>
                <th>Lugar</th>
                <th style="text-align:center;">Costo de envío</th>
            </tr>
        </thead>
        <tbody>
            ${lugares
              .map(
                (l, i) => `
                <tr style="cursor:pointer;" onclick="copiarCostoLugarTicket(${
                  Number(l.costo) || 0
                })" title="Clic para copiar $${Number(l.costo) || 0} al envío del ticket.">
                    <td style="text-align:center;">${i + 1}</td>
                    <td><strong>${l.lugar}</strong></td>
                    <td style="text-align:center;"><span style="color:var(--accent); font-weight:600; white-space:nowrap;">${formatearMoneda(
                      Number(l.costo) || 0,
                    )}</span></td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>
    <div style="margin-top:8px; color:var(--text-dim); font-size:0.7rem;">
        <i class="fas fa-info-circle"></i> Haz clic en una fila para copiar su costo de envío al ticket.
    </div>
  `;
}

// Copia el costo al campo de envío del ticket y cierra el modal.
function copiarCostoLugarTicket(costo) {
  const envio = document.getElementById("ticketEnvio");
  if (envio) envio.value = costo;
  const modal = document.getElementById("modalLugaresEntrega");
  if (modal) modal.style.display = "none";
  const msgt = document.getElementById("mensajeTicket");
  if (msgt) {
    msgt.innerHTML = `<div class="alert alert-success" style="padding:8px 12px; margin:10px 0 0; font-size:0.8rem;">✅ Costo de envío copiado: ${formatearMoneda(
      costo,
    )}</div>`;
    msgt.className = "";
  }
}

// ============================================
// CRUD DE MARCAS (tab Promociones)
// ============================================
let ultimoTotalMarcas = 0;
let marcaEditando = null;

async function cargarMarcas() {
  const container = document.getElementById("listaMarcas");
  if (!container) return;

  const tabPromociones = document.getElementById("tab-promociones");
  if (tabPromociones && tabPromociones.style.display === "none") return;

  container.innerHTML =
    '<div class="text-center text-dim py-3">Cargando...</div>';

  try {
    const { data, error } = await window.supabase
      .from("marcas")
      .select("*")
      .order("orden", { ascending: true });
    if (error) throw error;

    if (!data || !data.length) {
      ultimoTotalMarcas = 0;
      container.innerHTML =
        '<p class="text-center text-dim py-3">🏷️ No hay marcas registradas</p>';
      return;
    }
    ultimoTotalMarcas = data.length;

    container.innerHTML = `
        <table class="table table-dark table-hover table-sm">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Icono</th>
                    <th>Marca</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th style="text-align:center;">Orden</th>
                    <th style="text-align:center;">Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (m, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td style="font-size:1.2rem;">${m.icono || "🏷️"}</td>
                        <td><strong>${m.nombre}</strong></td>
                        <td>${m.categoria || "—"}</td>
                        <td style="max-width:260px;">${m.descripcion || "—"}</td>
                        <td style="text-align:center;">${m.orden ?? 0}</td>
                        <td style="text-align:center; white-space:nowrap;">
                            <button onclick="editarMarca('${m.id}')" class="btn btn-outline-warning btn-sm">✏️</button>
                            <button onclick="pedirEliminarMarca('${m.id}')" class="btn btn-outline-danger btn-sm">🗑️</button>
                        </td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
        <div style="margin-top:10px; color:var(--text-dim); font-size:0.75rem;">
            <i class="fas fa-info-circle"></i> Estas marcas se muestran en la sección "Marcas que manejamos" de la página.
        </div>
    `;
  } catch (error) {
    console.error("Error cargando marcas:", error);
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar marcas. ¿Ejecutaste el SQL para crear la tabla "marcas"?</p>';
  }
}

function mostrarFormMarca(data = null) {
  const container = document.getElementById("formMarcaContainer");
  if (!container) return;
  container.style.display = "flex";
  container.scrollIntoView({ behavior: "smooth" });

  if (data) {
    marcaEditando = data;
    document.getElementById("formMarcasTitulo").textContent =
      "✏️ Editar Marca";
    const submitBtn = document.querySelector(
      '#formMarca button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Actualizar";

    document.getElementById("marcaId").value = data.id;
    document.getElementById("marcaNombre").value = data.nombre || "";
    document.getElementById("marcaIcono").value = data.icono || "🏷️";
    document.getElementById("marcaCategoria").value = data.categoria || "";
    document.getElementById("marcaDescripcion").value = data.descripcion || "";
    document.getElementById("marcaOrden").value = data.orden ?? 1;
  } else {
    marcaEditando = null;
    document.getElementById("formMarcasTitulo").textContent = "➕ Agregar Marca";
    const submitBtn = document.querySelector(
      '#formMarca button[type="submit"]',
    );
    if (submitBtn) submitBtn.textContent = "💾 Guardar";

    document.getElementById("formMarca").reset();
    document.getElementById("marcaId").value = "";
    document.getElementById("marcaIcono").value = "🏷️";
    document.getElementById("marcaOrden").value = ultimoTotalMarcas + 1;
  }
}

function ocultarFormMarca() {
  const container = document.getElementById("formMarcaContainer");
  if (container) container.style.display = "none";
  marcaEditando = null;
}

async function editarMarca(id) {
  try {
    const { data, error } = await window.supabase
      .from("marcas")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (data) mostrarFormMarca(data);
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("Error al cargar la marca");
  }
}

async function guardarMarca(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeMarca");
  const btn = e.target.querySelector('button[type="submit"]');

  const id = document.getElementById("marcaId").value || null;
  const esEdicion = id && id !== "";

  const datos = {
    nombre: document.getElementById("marcaNombre").value.trim(),
    icono: (document.getElementById("marcaIcono").value || "🏷️").trim(),
    categoria: document.getElementById("marcaCategoria").value.trim(),
    descripcion: document.getElementById("marcaDescripcion").value.trim(),
    orden: (() => {
      const o = parseInt(document.getElementById("marcaOrden").value, 10);
      return isNaN(o) ? ultimoTotalMarcas + 1 : o;
    })(),
  };

  if (!datos.nombre) {
    if (msg) mostrarMensaje(msg, "❌ El nombre de la marca es obligatorio", "error");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Guardando...";
    }

    let result;
    if (esEdicion) {
      result = await window.supabase
        .from("marcas")
        .update(datos)
        .eq("id", id);
    } else {
      result = await window.supabase.from("marcas").insert([datos]);
    }

    if (result.error) throw result.error;

    if (msg) mostrarMensaje(msg, "✅ Marca guardada correctamente", "exito");
    ocultarFormMarca();
    cargarMarcas();
  } catch (error) {
    console.error("Error:", error);
    if (msg) mostrarMensaje(msg, "❌ " + error.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = esEdicion ? "💾 Actualizar" : "💾 Guardar";
    }
  }
}

function pedirEliminarMarca(id) {
  modalConfirmar("¿Eliminar esta marca permanentemente?", async function () {
    try {
      const { error } = await window.supabase
        .from("marcas")
        .delete()
        .eq("id", id);
      if (error) throw error;
      mostrarModalAlerta("✅ Marca eliminada");
      cargarMarcas();
    } catch (error) {
      console.error("Error:", error);
      mostrarModalAlerta("❌ Error al eliminar: " + error.message);
    }
  });
}

// ============================================
// 9. EXPONER FUNCIONES AL WINDOW
// ============================================

// Búsqueda de productos (tab Productos): recarga con debounce.
let debounceBuscarProductos = null;
function buscarProductosAdmin() {
  clearTimeout(debounceBuscarProductos);
  debounceBuscarProductos = setTimeout(() => cargarProductos(), 300);
}

// Búsqueda de producto en inventario (tab Inventario): recarga con debounce.
let debounceBuscarInventario = null;
function buscarInventarioAdmin() {
  clearTimeout(debounceBuscarInventario);
  debounceBuscarInventario = setTimeout(() => cargarInventario(), 300);
}

window.eliminarProductoTicket = eliminarProductoTicket;
window.agregarProductoTicket = agregarProductoTicket;
window.cargarProductosTicket = cargarProductosTicket;
window.verProductosSinStock = verProductosSinStock;
window.abrirModalCorreo = abrirModalCorreo;
window.enviarCorreoDesdeModal = enviarCorreoDesdeModal;
window.procesarPedido = procesarPedido;
window.buscarProductosAdmin = buscarProductosAdmin;
window.buscarInventarioAdmin = buscarInventarioAdmin;
window.abrirEtiquetaProducto = abrirEtiquetaProducto;
window.imprimirEtiqueta = imprimirEtiqueta;
window.descargarEtiquetas = descargarEtiquetas;
window.subirImagenProducto = subirImagenProducto;
  window.cerrarEtiqueta = cerrarEtiqueta;
  window.enviarEtiquetaBluetooth = enviarEtiquetaBluetooth;
window.imprimirPruebaCentrado = imprimirPruebaCentrado;
window.imprimirPruebaRegla = imprimirPruebaRegla;
window.ajustarCentro = ajustarCentro;
window.generarCodigoBarrasProducto = generarCodigoBarrasProducto;
window.cargarPedidos = cargarPedidos;
window.cargarPedidosPendientes = cargarPedidosPendientes;
window.cargarProductos = cargarProductos;
window.cargarInventario = cargarInventario;
window.cargarFinanzas = cargarFinanzas;
window.reiniciarContadoresFinanzas = reiniciarContadoresFinanzas;
window.editarProducto = editarProducto;
window.pedirEliminar = pedirEliminar;
window.verDetallePedido = verDetallePedido;
window.generarTicketPedido = generarTicketPedido;
window.verVistaPreviaPedido = verVistaPreviaPedido;
window.verVistaPreviaTicket = verVistaPreviaTicket;
window.verVistaPreviaDetallePedidoActual = verVistaPreviaDetallePedidoActual;
window.verVistaPreviaVenta = verVistaPreviaVenta;
window.cambiarEstadoPedido = cambiarEstadoPedido;
window.buscarPorCodigoBarras = buscarPorCodigoBarras;
window.mostrarFormProducto = mostrarFormProducto;
window.ocultarFormProducto = ocultarFormProducto;
window.mostrarFormFinanza = mostrarFormFinanza;
window.ocultarFormFinanza = ocultarFormFinanza;
window.mostrarFormMovimiento = mostrarFormMovimiento;
window.ocultarFormMovimiento = ocultarFormMovimiento;
window.cerrarModal = cerrarModal;
window.confirmarEliminar = confirmarEliminar;

// Exponer funciones de promociones
window.cargarCupones = cargarCupones;
window.cargarNoticias = cargarNoticias;
window.editarCupon = editarCupon;
window.editarNoticia = editarNoticia;
window.pedirEliminarCupon = pedirEliminarCupon;
window.pedirEliminarNoticia = pedirEliminarNoticia;
window.mostrarFormCupon = mostrarFormCupon;
window.ocultarFormCupon = ocultarFormCupon;
window.mostrarFormNoticia = mostrarFormNoticia;
window.ocultarFormNoticia = ocultarFormNoticia;
window.guardarCupon = guardarCupon;
window.guardarNoticia = guardarNoticia;
window.editarLugar = editarLugar;
window.pedirEliminarLugar = pedirEliminarLugar;
window.mostrarFormLugar = mostrarFormLugar;
window.ocultarFormLugar = ocultarFormLugar;
window.guardarLugar = guardarLugar;
window.cargarLugaresEntregaAdmin = cargarLugaresEntregaAdmin;
window.cargarLugaresTicketAdmin = cargarLugaresTicketAdmin;
window.aplicarCostoLugarTicket = aplicarCostoLugarTicket;
window.abrirModalLugaresEntrega = abrirModalLugaresEntrega;
window.copiarCostoLugarTicket = copiarCostoLugarTicket;
window.cargarMarcas = cargarMarcas;
window.mostrarFormMarca = mostrarFormMarca;
window.ocultarFormMarca = ocultarFormMarca;
window.editarMarca = editarMarca;
window.guardarMarca = guardarMarca;
window.pedirEliminarMarca = pedirEliminarMarca;
window.pedirMarcarEntregado = pedirMarcarEntregado;
