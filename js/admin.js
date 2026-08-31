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

function abrirModalCorreo(pedidoId) {
  const row = document.querySelector(`tr[data-pedido-id="${pedidoId}"]`);
  if (!row) {
    mostrarModalAlerta("❌ No se encontraron datos del pedido");
    return;
  }

  const cliente = row.dataset.cliente || "";
  const telefono = row.dataset.telefono || "";
  const email = row.dataset.email || "";
  const numeroPedido = row.dataset.numero || "";
  const direccion = row.dataset.direccion || "";
  const productos = row.dataset.productos || "[]";
  const total = row.dataset.total || "0";

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

  modalPedidoId.value = pedidoId;
  modalCliente.value = cliente;
  modalTelefono.value = telefono;
  modalEmail.value = email;
  modalNumero.value = numeroPedido;
  modalDireccion.value = direccion;
  modalTotal.value = `$${parseFloat(total).toFixed(2)}`;
  modalEnvio.value = "";
  modalMensaje.value = "";

  try {
    const productosParsed = JSON.parse(productos);
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
          "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
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
          "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
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
      subtotal: parseFloat(subtotalNum || 0).toFixed(2),
      lugar_entrega: lugarEntrega || "No especificada",
      metodo_pago: metodoPago || "No especificado",
      direccion: direccion || "No especificada",
      envio: envioNum,
      descuento: descuentoNum,
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

    const { error: updateError } = await window.supabase
      .from("pedidos")
      .update({ estado: nuevoEstado })
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
  document
    .getElementById("buscarNumeroPedido")
    ?.addEventListener("input", function () {
      clearTimeout(debounceBusquedaPedidos);
      debounceBusquedaPedidos = setTimeout(() => {
        const activeFilter = document.querySelector(".filtro-pedido.active");
        cargarPedidos(activeFilter?.dataset?.estado || "todos");
      }, 300);
    });

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
    cambiarTab("productos");
  });
});

// ============================================
// 1. PRODUCTOS (CRUD)
// ============================================

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

    const { data, error } = await window.supabase
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    if (!data || !data.length) {
      container.innerHTML =
        '<p class="text-center text-dim py-3">📦 No hay productos</p>';
      cargarSelectProductosInventario();
      return;
    }

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead><tr><th>Imagen</th><th>Producto</th><th>Código</th><th>Precio</th><th>Stock</th><th>Categoría</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${data
                      .map(
                        (p) => `
                        <tr>
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
                            <td><code style="background:var(--bg-input);padding:2px 8px;border-radius:4px;color:var(--accent);font-size:12px;">${
                              p.codigo_barras || "Sin código"
                            }</code></td>
                            <td>${formatearMoneda(p.precio)}</td>
                            <td><span class="${
                              p.stock === 0 ? "text-danger" : "text-warning"
                            }">${p.stock}</span></td>
                            <td><span class="badge bg-secondary">${
                              p.categoria || "otros"
                            }</span></td>
                            <td>
                                <button onclick="editarProducto('${
                                  p.id
                                }')" class="btn btn-outline-warning btn-sm">✏️</button>
                                <button onclick="pedirEliminar('${
                                  p.id
                                }','producto')" class="btn btn-outline-danger btn-sm">🗑️</button>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;
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
    setValue("prodPrecio", data.precio);
    setValue("prodCategoria", data.categoria || "otros");
    setValue("prodStock", data.stock || 0);
    setValue("prodDescripcion", data.descripcion || "");
    setValue("prodImagen", data.imagen_url || "");
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
    setValue("prodId", "");
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

      if (stockNuevo > 0 && nuevoId) {
        await window.supabase.from("inventario").insert([
          {
            producto_id: nuevoId,
            tipo: "entrada",
            cantidad: stockNuevo,
            descripcion: "📦 Stock inicial al crear producto",
          },
        ]);
      }
    }

    if (msg) mostrarMensaje(msg, "✅ Producto guardado correctamente", "exito");
    ocultarFormProducto();
    cargarProductos();
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

  resultado.innerHTML = '<span class="text-dim">Buscando...</span>';

  try {
    const { data, error } = await window.supabase
      .from("productos")
      .select("*")
      .eq("codigo_barras", codigo)
      .maybeSingle();

    if (error || !data) {
      resultado.innerHTML = `<span class="text-danger">❌ Producto no encontrado: ${codigo}</span>`;
      input.value = "";
      input.focus();
      return;
    }

    // AUTO-LLENADO DEL ESCÁNER: abre directamente la edición del producto
    // con nombre, código de barras, precio, stock y descripción ya cargados.
    input.value = "";
    resultado.innerHTML = "";
    if (typeof editarProducto === "function") {
      editarProducto(data.id);
    } else {
      resultado.innerHTML = `<span class="text-success">✅ ${data.nombre}: ${formatearMoneda(
        data.precio,
      )} · Stock ${data.stock} [${data.codigo_barras}]</span>`;
    }
  } catch (error) {
    console.error("Error:", error);
    resultado.innerHTML = '<span class="text-danger">❌ Error al buscar</span>';
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

    if (!data || !data.length) {
      container.innerHTML =
        '<p class="text-center text-dim py-3">📊 No hay movimientos</p>';
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
                    ${data
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
      .order("fecha_pedido", { ascending: false });
    if (estado !== "todos") query = query.eq("estado", estado);

    const busquedaNumero = document
      .getElementById("buscarNumeroPedido")
      ?.value.trim();
    if (busquedaNumero)
      query = query.ilike("numero_pedido", `%${busquedaNumero}%`);

    const { data, error } = await query;

    if (error) {
      container.innerHTML =
        '<p class="text-danger text-center">❌ Error al cargar</p>';
      return;
    }

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
                    ${data
                      .map((p) => {
                        const productosLinea = p.productos
                          .map(
                            (x) =>
                              `<span class="item"><span class="nombre">${
                                x.nombre
                              }</span> <span class="cant">${
                                Number(x.precio) || 0
                              } × ${
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
                            s +
                            (Number(x.precio) || 0) * (Number(x.cantidad) || 0),
                          0,
                        );
                        const subtotalConEnvio = subtotalProductos + envio;
                        const descuentoMonto =
                          subtotalConEnvio * (descuentoPct / 100);
                        const totalCalculado =
                          subtotalConEnvio - descuentoMonto;

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
                                ${
                                  p.lugar_entrega
                                    ? `<small style="white-space:nowrap; color:var(--text-silver);">📦 ${p.lugar_entrega}</small>`
                                    : `<small style="color:var(--text-dim);">—</small>`
                                }
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
                                    }')" class="btn btn-outline-warning btn-sm" title="Generar / Reimprimir Ticket (no afecta el stock)">🧾</button>
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
                      })
                      .join("")}
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
  try {
    const { error } = await window.supabase
      .from("pedidos")
      .update({ estado })
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

async function abrirModalEditarPedido(id) {
  const row = document.querySelector(`tr[data-pedido-id="${id}"]`);
  if (!row) {
    mostrarModalAlerta("❌ No se encontraron datos del pedido para editar.");
    return;
  }

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

    const activeFilter = document.querySelector(".filtro-pedido.active");
    await cargarPedidos(activeFilter?.dataset?.estado || "todos");
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
      fecha: data.fecha_pedido,
      numero_pedido: data.numero_pedido || "",
      estado: data.estado || "",
    };
    abrirVentanaCentrada(
      `ticket.html?pedido=${encodeURIComponent(JSON.stringify(datosTicket))}`,
      400,
      700,
    );
  } catch (error) {
    console.error("Error:", error);
    mostrarModalAlerta("❌ Error al generar ticket");
  }
}

// ============================================
// 5. FINANZAS
// ============================================

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
    const { data, error } = await window.supabase
      .from("finanzas")
      .select("*")
      .order("fecha", { ascending: false });
    if (error) {
      container.innerHTML =
        '<p class="text-danger text-center">❌ Error al cargar</p>';
      return;
    }

    if (!data || !data.length) {
      container.innerHTML =
        '<p class="text-center text-dim py-3">💰 No hay movimientos</p>';
      return;
    }

    const ingresos = data
      .filter((f) => f.tipo === "ingreso")
      .reduce((s, f) => s + f.monto, 0);
    const gastos = data
      .filter((f) => f.tipo === "gasto")
      .reduce((s, f) => s + f.monto, 0);
    const ganancia = ingresos - gastos;

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

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${data
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
        "id, numero_pedido, cliente_nombre, cliente_telefono, direccion_entrega, productos, total, estado, metodo_pago, fecha_pedido, costo_envio, descuento, lugar_entrega",
      )
      .order("fecha_pedido", { ascending: false })
      .limit(300);

    if (error) throw error;

    select.innerHTML =
      '<option value="">Venta nueva (sin pedido existente)...</option>';

    (data || []).forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.numero_pedido || "S/N"} - ${
        p.cliente_nombre
      } (${p.estado})`;
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
  document.getElementById("ticketEnvio").value = "0";
  document.getElementById("ticketDescuento").value = "0";
  // En venta nueva el producto vuelve a ser obligatorio.
  const selProducto = document.getElementById("ticketProductoSelect");
  if (selProducto) selProducto.setAttribute("required", "required");
  actualizarListaTicket();
  actualizarTotalesTicket();
  actualizarBotonTicket();
}

function precargarPedidoEnTicket(pedido) {
  pedidoTicketPrecargado = pedido;

  document.getElementById("ticketCliente").value = pedido.cliente_nombre || "";
  document.getElementById("ticketTelefono").value =
    pedido.cliente_telefono || "";
  document.getElementById("ticketDireccion").value =
    pedido.direccion_entrega || "";
  document.getElementById("ticketLugarEntrega").value =
    pedido.lugar_entrega || "";
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
      fecha: pedidoTicketPrecargado.fecha_pedido || new Date().toISOString(),
      ticket_numero: `T-${Date.now().toString(36).toUpperCase()}`,
      numero_pedido: pedidoTicketPrecargado.numero_pedido || "",
      estado: pedidoTicketPrecargado.estado || "",
    };

    abrirVentanaCentrada(
      `ticket.html?pedido=${encodeURIComponent(JSON.stringify(datosTicket))}`,
      400,
      700,
    );

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

    abrirVentanaCentrada(
      `ticket.html?pedido=${encodeURIComponent(JSON.stringify(datosTicket))}`,
      400,
      700,
    );

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
    document.getElementById("cuponOrden").value = data.orden || 1;
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
    orden: parseInt(document.getElementById("cuponOrden").value) || 1,
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
    document.getElementById("noticiaOrden").value = data.orden || 1;
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
    orden: parseInt(document.getElementById("noticiaOrden").value) || 1,
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
    orden: parseInt(document.getElementById("lugarOrden").value) || 1,
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

function pedirEliminarLugar(id) {
  modalConfirmar("¿Eliminar este lugar de entrega permanentemente?", async function () {
    try {
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
        .select("lugar, costo")
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

// ============================================
// 9. EXPONER FUNCIONES AL WINDOW
// ============================================window.eliminarProductoTicket = eliminarProductoTicket;
window.agregarProductoTicket = agregarProductoTicket;
window.cargarProductosTicket = cargarProductosTicket;
window.verProductosSinStock = verProductosSinStock;
window.abrirModalCorreo = abrirModalCorreo;
window.enviarCorreoDesdeModal = enviarCorreoDesdeModal;
window.procesarPedido = procesarPedido;
window.cargarPedidos = cargarPedidos;
window.cargarPedidosPendientes = cargarPedidosPendientes;
window.cargarProductos = cargarProductos;
window.cargarInventario = cargarInventario;
window.cargarFinanzas = cargarFinanzas;
window.editarProducto = editarProducto;
window.pedirEliminar = pedirEliminar;
window.verDetallePedido = verDetallePedido;
window.generarTicketPedido = generarTicketPedido;
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
window.pedirMarcarEntregado = pedirMarcarEntregado;
