// ============================================
// ADMIN - COMPLETO CORREGIDO
// ============================================

let productoEditando = null;
let finanzaEditando = null;
let eliminarId = null;
let eliminarTipo = null;

// ============================================
// VARIABLES PARA TICKET
// ============================================
let ticketProductos = [];
let productosDisponibles = [];

// 🔥 CONFIGURACIÓN DE EMAILJS - TUS DATOS CORRECTOS
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_5yxoyt5", // Outlook
  TEMPLATE_ID: "template_1dcnw6v",
  USER_ID: "Jx00-aXDn9h0eWxnY", // Public Key
};

// 🔥 INICIALIZAR EMAILJS (el SDK ya se carga vía <script> en admin.html)
if (typeof emailjs !== "undefined") {
  emailjs.init(EMAILJS_CONFIG.USER_ID);
  console.log("✅ EmailJS inicializado");
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
    const tabContent = document.getElementById(tabId);
    if (!tabContent || tabContent.style.display === "none") {
      console.log(`ℹ️ La pestaña ${tabId} no está activa, omitiendo refresco`);
      return;
    }

    const originalText = this.innerHTML;
    this.disabled = true;
    this.innerHTML = "⏳ Cargando...";

    Promise.resolve(callback()).finally(() => {
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
      alert("✅ Todos los productos tienen stock disponible.");
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

    alert(mensaje);
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Error al cargar productos sin stock");
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
        "id, numero_pedido, cliente_nombre, cliente_telefono, cliente_email, productos, total, direccion_entrega"
      )
      .eq("estado", "pendiente")
      .order("fecha_pedido", { ascending: false });

    if (error) throw error;

    select.innerHTML =
      '<option value="">Selecciona un pedido pendiente...</option>';

    if (!data || data.length === 0) {
      select.innerHTML =
        '<option value="">📋 No hay pedidos pendientes</option>';
      return;
    }

    data.forEach((p) => {
      const productosText = p.productos
        .map((x) => `${x.nombre} x${x.cantidad}`)
        .join(", ");
      select.innerHTML += `
                <option value="${p.id}" 
                        data-cliente="${p.cliente_nombre}"
                        data-telefono="${p.cliente_telefono || ""}"
                        data-email="${p.cliente_email || ""}"
                        data-numero="${p.numero_pedido || "N/A"}"
                        data-productos='${JSON.stringify(p.productos)}'
                        data-total="${p.total}"
                        data-direccion="${p.direccion_entrega || ""}">
                    ${p.numero_pedido} - ${p.cliente_nombre} (${productosText})
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
                ).toFixed(2)}`
            )
            .join("\n");
          document.getElementById("productosCorreo").value = productosText;
        } catch (e) {
          document.getElementById("productosCorreo").value = "";
        }

        document.getElementById("totalCorreo").value = option.dataset.total
          ? `$${parseFloat(option.dataset.total).toFixed(2)}`
          : "";

        const msg = document.getElementById("mensajeCorreo");
        if (msg) {
          msg.innerHTML = `<span class="text-success">✅ Pedido ${option.dataset.numero} seleccionado. Solo agrega el costo de envío.</span>`;
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

function abrirModalCorreo(pedidoId) {
  const row = document.querySelector(`tr[data-pedido-id="${pedidoId}"]`);
  if (!row) {
    alert("❌ No se encontraron datos del pedido");
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
    alert(
      "Error al abrir el modal. Verifica que el modal esté cargado correctamente."
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
          `${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toFixed(2)}`
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

  const modal = new bootstrap.Modal(
    document.getElementById("modalEnvioCorreo")
  );
  modal.show();
}

// ============================================
// ENVIAR CORREO DESDE MODAL - CORREGIDO
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

  if (!envio || parseFloat(envio) <= 0) {
    mensaje.innerHTML =
      '<span class="text-danger">❌ Ingresa un costo de envío válido</span>';
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

    // 🔥 PARSEAR PRODUCTOS - SIN SIGNO $
    const lineas = productosText.split("\n").filter((line) => line.trim());
    const items = lineas.map((line) => {
      const match = line.match(/^(.+?)\s*(?:x|×)\s*(\d+)\s*=\s*\$?([\d.]+)/);
      if (match) {
        return {
          nombre: match[1].trim(),
          cantidad: parseInt(match[2]),
          precio: match[3], // 🔥 SOLO EL NÚMERO
        };
      }
      return { nombre: line.trim(), cantidad: 1, precio: "0" };
    });

    // 🔥 QUITAR SIGNO $ DE TOTAL Y ENVIO
    total = total.replace(/[$,]/g, "");
    const envioNum = envio.replace(/[$,]/g, "");

    // 🔥 PREPARAR PARÁMETROS
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
      productos: items, // ✅ Array de objetos con precio como número
      total: total,
      metodo_pago: "Transferencia / Efectivo",
      direccion: direccion || "No especificada",
      envio: envioNum,
      mensaje_adicional:
        mensajeAdicional ||
        `El costo de envío es de $${parseFloat(envioNum).toFixed(
          2
        )}. Confirma tu pedido.`,
      to_email: email,
    };

    console.log("📧 Enviando correo a:", email);
    console.log("📋 Parámetros:", params);

    // 🔥 ENVIAR CON SUBJECT CORRECTO
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      params,
      {
        subject: `Confirmación de Pedido #${numeroPedido}!`, // ✅ SUBJECT CORRECTO
      }
    );

    console.log("✅ Correo enviado:", response);

    if (pedidoId) {
      await window.supabase
        .from("pedidos")
        .update({ estado: "confirmado" })
        .eq("id", pedidoId);
      console.log("✅ Pedido marcado como confirmado");
    }

    mensaje.innerHTML = `<span class="text-success">✅ Correo enviado a ${email}</span>`;
    btn.textContent = "✅ Enviado";

    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("modalEnvioCorreo")
      );
      if (modal) modal.hide();
      const activeFilter = document.querySelector(".filtro-pedido.active");
      cargarPedidos(activeFilter?.dataset?.estado || "todos");
      cargarPedidosPendientes();
      // 🔥 REACTIVAR BOTÓN para el próximo envío
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
// ENVÍO DE CORREO MANUAL DESDE PESTAÑA ENVÍOS - CORREGIDO
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
  let total = document.getElementById("totalCorreo").value.trim();
  const metodoPago = document.getElementById("metodoPagoCorreo").value.trim();
  const envio = document.getElementById("envioCorreo").value.trim();
  const direccion = document.getElementById("direccionCorreo").value.trim();
  const mensajeAdicional = document
    .getElementById("mensajeAdicionalCorreo")
    .value.trim();
  const pedidoId = document.getElementById("selectPedidoEnvio")?.value;

  if (!email || !numeroPedido || !nombre || !productosText || !total) {
    return mostrarMensaje(
      msg,
      "❌ Completa los campos obligatorios (*)",
      "error"
    );
  }

  if (!envio || parseFloat(envio) <= 0) {
    return mostrarMensaje(
      msg,
      "❌ El costo de envío es obligatorio y debe ser mayor a 0",
      "error"
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

    // 🔥 PARSEAR PRODUCTOS - SIN SIGNO $
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

    // 🔥 QUITAR SIGNO $ DE TOTAL Y ENVIO
    total = total.replace(/[$,]/g, "");
    const envioNum = envio.replace(/[$,]/g, "");

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
      metodo_pago: metodoPago || "No especificado",
      direccion: direccion || "No especificada",
      envio: envioNum,
      mensaje_adicional:
        mensajeAdicional ||
        `El costo de envío es de $${parseFloat(envioNum).toFixed(2)}.`,
      to_email: email,
    };

    console.log("📧 Enviando correo manual a:", email);

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      params,
      {
        subject: `Confirmación de Pedido #${numeroPedido}!`,
      }
    );

    if (pedidoId) {
      await window.supabase
        .from("pedidos")
        .update({ estado: "confirmado" })
        .eq("id", pedidoId);
    }

    mostrarMensaje(
      msg,
      `✅ Correo enviado a ${email}${pedidoId ? " (Pedido confirmado)" : ""}`,
      "exito"
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
    completar: "entregado",
    procesar: "confirmado",
  };

  const nuevoEstado = estados[accion];
  if (!nuevoEstado) return;

  const mensajeAccion =
    accion === "completar" ? "completar (descontar stock)" : "procesar";
  if (!confirm(`¿Confirmar ${mensajeAccion} este pedido?`)) return;

  try {
    const { data: pedido, error: getError } = await window.supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (getError) throw getError;

    if (accion === "completar") {
      console.log("📦 Descontando stock...");
      for (const item of pedido.productos) {
        const { data: producto, error: prodError } = await window.supabase
          .from("productos")
          .select("id, stock")
          .eq("nombre", item.nombre)
          .maybeSingle();

        if (prodError) {
          console.warn(
            `⚠️ Error buscando producto "${item.nombre}":`,
            prodError
          );
          continue;
        }

        if (producto) {
          const nuevoStock = Math.max(0, producto.stock - item.cantidad);
          await window.supabase
            .from("productos")
            .update({ stock: nuevoStock })
            .eq("id", producto.id);
          console.log(
            `✅ Stock de "${item.nombre}" actualizado: ${producto.stock} → ${nuevoStock}`
          );

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
            `⚠️ Producto "${item.nombre}" no encontrado en la base de datos`
          );
        }
      }
    }

    const { error: updateError } = await window.supabase
      .from("pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", pedidoId);

    if (updateError) throw updateError;

    alert(
      `✅ Pedido ${
        accion === "completar" ? "completado" : "procesado"
      } correctamente`
    );

    const activeFilter = document.querySelector(".filtro-pedido.active");
    cargarPedidos(activeFilter?.dataset?.estado || "todos");
    cargarPedidosPendientes();
  } catch (error) {
    console.error("❌ Error al procesar pedido:", error);
    alert("❌ Error al procesar el pedido: " + error.message);
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("📦 Inicializando panel admin...");

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
    if (tabId === "envios") cargarPedidosPendientes();
  }

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const tab = this.dataset.tab;
      console.log("📂 Cambiando a pestaña:", tab);
      cambiarTab(tab);
    });
  });

  // ============================================
  // BOTONES REFRESCAR
  // ============================================
  agregarEventoRefrescar(
    "btnRefrescarProductos",
    cargarProductos,
    "tab-productos"
  );
  agregarEventoRefrescar(
    "btnRefrescarInventario",
    cargarInventario,
    "tab-inventario"
  );
  agregarEventoRefrescar("btnRefrescarPedidos", cargarPedidos, "tab-pedidos");
  agregarEventoRefrescar(
    "btnRefrescarFinanzas",
    cargarFinanzas,
    "tab-finanzas"
  );

  // ============================================
  // VERIFICAR SESIÓN
  // ============================================
  if (typeof verificarSesion === "function") {
    verificarSesion().then((user) => {
      if (user) {
        const emailEl = document.getElementById("adminEmail");
        if (emailEl) emailEl.textContent = "👤 " + user.email;
      }
    });
  }

  // ============================================
  // PRODUCTOS
  // ============================================
  addEventListenerSafe("btnAgregarProducto", "click", () =>
    mostrarFormProducto()
  );
  addEventListenerSafe("btnCancelarProducto", "click", ocultarFormProducto);

  const formProducto = document.getElementById("formProducto");
  if (formProducto) formProducto.addEventListener("submit", guardarProducto);

  // ============================================
  // INVENTARIO
  // ============================================
  addEventListenerSafe("btnAgregarMovimiento", "click", () => {
    document.getElementById("movId").value = "";
    const submitBtn = document.querySelector(
      '#formMovimiento button[type="submit"]'
    );
    if (submitBtn) submitBtn.textContent = "💾 Registrar";
    mostrarFormMovimiento();
  });
  addEventListenerSafe("btnCancelarMovimiento", "click", ocultarFormMovimiento);

  const formMovimiento = document.getElementById("formMovimiento");
  if (formMovimiento)
    formMovimiento.addEventListener("submit", guardarMovimiento);

  // ============================================
  // FINANZAS
  // ============================================
  addEventListenerSafe("btnAgregarFinanza", "click", () =>
    mostrarFormFinanza()
  );
  addEventListenerSafe("btnCancelarFinanza", "click", ocultarFormFinanza);

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
    .getElementById("formTicketVenta")
    ?.addEventListener("submit", generarTicketVenta);

  esperarSupabase(function () {
    cargarProductosTicket();
  });

  // ============================================
  // CÓDIGO DE BARRAS
  // ============================================
  addEventListenerSafe("btnBuscarCodigo", "click", buscarPorCodigoBarras);

  const inputCodigo = document.getElementById("inputCodigoBarras");
  if (inputCodigo) {
    inputCodigo.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        buscarPorCodigoBarras();
      }
    });
  }

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

  // ============================================
  // MODAL
  // ============================================
  addEventListenerSafe("modalCancelar", "click", cerrarModal);
  addEventListenerSafe("modalConfirmar", "click", confirmarEliminar);

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

  // ============================================
  // BOTÓN CERRAR MODAL
  // ============================================
  document
    .getElementById("btnCerrarModalCorreo")
    ?.addEventListener("click", function () {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("modalEnvioCorreo")
      );
      if (modal) modal.hide();
    });

  cambiarTab("productos");
  console.log("✅ Panel admin inicializado");
});

// ============================================
// 1. PRODUCTOS (CRUD)
// ============================================

async function cargarProductos() {
  const container = document.getElementById("listaProductos");
  if (!container) return;

  const tabProductos = document.getElementById("tab-productos");
  if (tabProductos && tabProductos.style.display === "none") {
    console.log("ℹ️ Pestaña de productos no visible, omitiendo carga");
    return;
  }

  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

  try {
    if (!window.supabase || typeof window.supabase.from !== "function") {
      console.warn("⏳ Supabase no disponible, reintentando...");
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
        '<p class="text-center text-secondary py-3">📦 No hay productos</p>';
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
                                    : `<span style="font-size:20px;color:#666;">📦</span>`
                                }
                            </td>
                            <td><strong>${
                              p.nombre
                            }</strong><br><small class="text-secondary">${
                          p.descripcion || ""
                        }</small></td>
                            <td><code style="background:#1a1a1a;padding:2px 8px;border-radius:4px;color:#c9a84c;font-size:12px;">${
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
                    `
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

  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });

  if (data) {
    productoEditando = data;
    const titulo = document.getElementById("formProductoTitulo");
    if (titulo) titulo.textContent = "✏️ Editar Producto";
    const submitBtn = document.querySelector(
      '#formProducto button[type="submit"]'
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
      '#formProducto button[type="submit"]'
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
    alert("Error al cargar el producto");
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
      '<span class="text-secondary">📷 Escanea un código de barras</span>';
    return;
  }

  resultado.innerHTML = '<span class="text-secondary">Buscando...</span>';

  try {
    const { data, error } = await window.supabase
      .from("productos")
      .select("*")
      .eq("codigo_barras", codigo)
      .single();
    if (error || !data) {
      resultado.innerHTML = `<div class="alert alert-danger alert-sm mt-2">❌ Producto no encontrado: <strong>${codigo}</strong></div>`;
      input.value = "";
      return;
    }
    resultado.innerHTML = `
            <div class="alert alert-success alert-sm mt-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div><strong>✅ Encontrado:</strong> ${
                      data.nombre
                    }<br><small class="text-secondary">Precio: ${formatearMoneda(
      data.precio
    )} | Stock: ${data.stock}</small></div>
                    <button onclick="editarProducto('${
                      data.id
                    }')" class="btn btn-warning btn-sm">✏️</button>
                </div>
            </div>
        `;
    input.value = "";
  } catch (error) {
    console.error("Error:", error);
    resultado.innerHTML = `<div class="alert alert-danger alert-sm mt-2">❌ Error al buscar</div>`;
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
    container.style.display = "block";
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
    '#formMovimiento button[type="submit"]'
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
    console.log("ℹ️ Pestaña de inventario no visible, omitiendo carga");
    return;
  }

  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

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
        '<p class="text-center text-secondary py-3">📊 No hay movimientos</p>';
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
                            <td><code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;font-size:11px;color:#c9a84c;">${
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
                    `
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
    console.log("ℹ️ Pestaña de pedidos no visible, omitiendo carga");
    return;
  }

  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

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
    const entregados =
      todosPedidos?.filter((p) => p.estado === "entregado").length || 0;
    const cancelados =
      todosPedidos?.filter((p) => p.estado === "cancelado").length || 0;

    document.querySelectorAll(".filtro-pedido").forEach((btn) => {
      const estadoBtn = btn.dataset.estado;
      let count = 0;
      if (estadoBtn === "todos") count = total;
      else if (estadoBtn === "pendiente") count = pendientes;
      else if (estadoBtn === "confirmado") count = confirmados;
      else if (estadoBtn === "entregado") count = entregados;
      else if (estadoBtn === "cancelado") count = cancelados;

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
        '<p class="text-center text-secondary py-3">📋 No hay pedidos</p>';
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
                        <th style="white-space:nowrap;">Total</th>
                        <th style="white-space:nowrap;">Estado</th>
                        <th style="white-space:nowrap; min-width:180px;">Acciones</th>
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
                              }</span> <span class="cant">×${
                                x.cantidad
                              }</span> <span class="precio">${formatearMoneda(
                                x.precio * x.cantidad
                              )}</span></span>`
                          )
                          .join(" ");

                        return `
                        <tr data-pedido-id="${p.id}"
                            data-cliente="${p.cliente_nombre}"
                            data-telefono="${p.cliente_telefono || ""}"
                            data-email="${p.cliente_email || ""}"
                            data-numero="${p.numero_pedido || "N/A"}"
                            data-productos='${JSON.stringify(
                              p.productos
                            ).replace(/'/g, "&#39;")}'
                            data-total="${p.total}"
                            data-direccion="${p.direccion_entrega || ""}">
                            <td><span class="pedido-numero">${
                              p.numero_pedido || "N/A"
                            }</span></td>
                            <td><small style="white-space:nowrap;">${formatearFecha(
                              p.fecha_pedido
                            )}</small></td>
                            <td>
                                <div style="display:flex; flex-direction:column; gap:2px;">
                                    <div style="font-weight:600; color:#fff; font-size:1rem;">${
                                      p.cliente_nombre
                                    }</div>
                                    ${
                                      p.cliente_telefono
                                        ? `<div style="color:#c9a84c; font-size:0.85rem;">📱 ${p.cliente_telefono}</div>`
                                        : ""
                                    }
                                    ${
                                      p.cliente_email
                                        ? `<div style="color:#8ab4f8; font-size:0.85rem;">📧 ${p.cliente_email}</div>`
                                        : ""
                                    }
                                </div>
                            </td>
                            <td><div class="productos-lista">${productosLinea}</div></td>
                            <td><strong style="color:#c9a84c; font-size:1.1rem; white-space:nowrap;">${formatearMoneda(
                              p.total
                            )}</strong></td>
                            <td>
                                <select onchange="cambiarEstadoPedido('${
                                  p.id
                                }', this.value)" class="form-select form-select-sm bg-black text-white border-secondary" style="width:auto; min-width:100px; display:inline-block;">
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
                            </td>
                            <td style="white-space: nowrap;">
                                <div class="d-flex gap-1" style="flex-wrap:nowrap;">
                                    <button onclick="generarTicketPedido('${
                                      p.id
                                    }')" class="btn btn-warning btn-sm" title="Generar Ticket">🧾</button>
                                    <button onclick="verDetallePedido('${
                                      p.id
                                    }')" class="btn btn-outline-secondary btn-sm" title="Ver Detalle">📋</button>
                                    ${
                                      p.estado === "pendiente"
                                        ? `
                                        <button onclick="procesarPedido('${p.id}', 'procesar')" class="btn btn-info btn-sm" title="Procesar Pedido" style="background:#17a2b8; color:white; border:none;">✅</button>
                                        <button onclick="abrirModalCorreo('${p.id}')" class="btn btn-primary btn-sm" title="Enviar Correo" style="background:#007bff; color:white; border:none;">📧</button>
                                    `
                                        : ""
                                    }
                                    ${
                                      p.estado === "confirmado"
                                        ? `
                                        <button onclick="procesarPedido('${p.id}', 'completar')" class="btn btn-success btn-sm" title="Completar Pedido" style="background:#28a745; color:white; border:none;">📦</button>
                                    `
                                        : ""
                                    }
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
    alert("❌ Error al actualizar estado");
  }
}

async function verDetallePedido(id) {
  try {
    const { data } = await window.supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();
    if (!data) return;
    const productos = data.productos
      .map(
        (p) =>
          `• ${p.nombre} × ${p.cantidad} = ${formatearMoneda(
            p.precio * p.cantidad
          )}`
      )
      .join("\n");
    alert(
      `📋 DETALLE\n\n👤 ${data.cliente_nombre}\n📱 ${
        data.cliente_telefono
      }\n📦 Productos:\n${productos}\n💰 Total: ${formatearMoneda(
        data.total
      )}\n💳 ${
        data.metodo_pago === "transferencia" ? "Transferencia" : "Efectivo"
      }\n📌 Estado: ${data.estado.toUpperCase()}`
    );
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Error al cargar detalle");
  }
}

async function generarTicketPedido(id) {
  try {
    const { data } = await window.supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();
    if (!data) return;
    const datosTicket = {
      cliente: data.cliente_nombre,
      telefono: data.cliente_telefono,
      direccion: data.direccion_entrega || "",
      metodo_pago:
        data.metodo_pago === "transferencia" ? "Transferencia" : "Efectivo",
      items: data.productos,
      subtotal: data.total,
      total: data.total,
      envio: 0,
      fecha: data.fecha_pedido,
    };
    window.open(
      `ticket.html?pedido=${encodeURIComponent(JSON.stringify(datosTicket))}`,
      "_blank",
      "width=400,height=700"
    );
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Error al generar ticket");
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
    console.log("ℹ️ Pestaña de finanzas no visible, omitiendo carga");
    return;
  }

  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

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
        '<p class="text-center text-secondary py-3">💰 No hay movimientos</p>';
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
      gananciaNeta.style.color = ganancia >= 0 ? "#28a745" : "#dc3545";
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
                    `
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
    container.style.display = "block";
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
      '#formFinanza button[type="submit"]'
    );
    if (submitBtn) submitBtn.textContent = "💾 Actualizar";
  } else {
    finanzaEditando = null;
    const form = document.getElementById("formFinanza");
    if (form) form.reset();
    setValue("finId", "");
    const submitBtn = document.querySelector(
      '#formFinanza button[type="submit"]'
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

async function cargarProductosTicket() {
  const select = document.getElementById("ticketProductoSelect");
  if (!select) return;

  if (!window.supabase || typeof window.supabase.from !== "function") {
    console.log("⏳ Esperando a Supabase para cargar productos del ticket...");
    setTimeout(cargarProductosTicket, 500);
    return;
  }

  try {
    console.log("🔄 Cargando productos para ticket...");

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

    console.log(
      `✅ Productos para ticket cargados: ${productosConStock.length}`
    );
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
    alert("❌ Selecciona un producto");
    return;
  }

  const option = select.options[select.selectedIndex];
  const precio = Number(option?.dataset?.precio) || 0;

  console.log(
    "🔍 Producto seleccionado - ID:",
    productoId,
    "Precio:",
    precio,
    "Cantidad:",
    cantidad
  );

  const producto = productosDisponibles.find((p) => p.id === productoId);
  if (!producto) {
    alert("❌ Producto no encontrado");
    return;
  }

  if (cantidad < 1) {
    alert("❌ La cantidad debe ser al menos 1");
    return;
  }

  if (cantidad > producto.stock) {
    alert(`❌ Stock insuficiente. Disponible: ${producto.stock}`);
    return;
  }

  const stockOriginal = producto.stock;

  const existente = ticketProductos.find((p) => p.id === productoId);
  if (existente) {
    const nuevaCantidad = existente.cantidad + cantidad;
    if (nuevaCantidad > stockOriginal) {
      alert(`❌ Stock insuficiente. Disponible: ${stockOriginal}`);
      return;
    }
    existente.cantidad = nuevaCantidad;
    console.log("✅ Producto actualizado:", existente);
  } else {
    const nuevoProducto = {
      id: producto.id,
      nombre: producto.nombre,
      precio: precio,
      cantidad: cantidad,
      stockOriginal: stockOriginal,
    };
    ticketProductos.push(nuevoProducto);
    console.log("✅ Producto agregado:", nuevoProducto);
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
      '<p class="text-secondary text-center small">No hay productos agregados</p>';
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
                <span class="text-secondary small"> × ${p.cantidad}</span>
                <span class="text-warning small">$${(
                  p.precio * p.cantidad
                ).toFixed(2)}</span>
            </div>
            <button onclick="eliminarProductoTicket(${index})" class="btn btn-danger btn-sm">✕</button>
        </div>
    `
    )
    .join("");
}

function eliminarProductoTicket(index) {
  const productoEliminado = ticketProductos[index];
  if (!productoEliminado) return;

  console.log("🗑️ Eliminando producto:", productoEliminado);

  const productoOriginal = productosDisponibles.find(
    (p) => p.id === productoEliminado.id
  );
  if (productoOriginal) {
    productoOriginal.stock = productoEliminado.stockOriginal;
    console.log(
      `✅ Stock restaurado a ${productoOriginal.nombre}: ${productoOriginal.stock}`
    );

    const select = document.getElementById("ticketProductoSelect");
    if (select) {
      const option = select.querySelector(
        `option[value="${productoOriginal.id}"]`
      );
      if (option) {
        const nuevoStock = productoOriginal.stock;
        const precio = Number(productoOriginal.precio) || 0;
        option.dataset.stock = nuevoStock;
        option.textContent = `${productoOriginal.nombre} - $${precio} (Stock: ${nuevoStock})`;
        option.disabled = false;
        console.log(
          `✅ Select actualizado: ${productoOriginal.nombre} - Stock: ${nuevoStock}`
        );
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
  console.log("🔍 ticketProductos:", JSON.stringify(ticketProductos));

  let subtotal = 0;
  for (const p of ticketProductos) {
    const precio = Number(p.precio) || 0;
    const cantidad = Number(p.cantidad) || 0;
    const totalItem = precio * cantidad;
    subtotal += totalItem;
    console.log(`📦 ${p.nombre}: $${precio} × ${cantidad} = $${totalItem}`);
  }

  const envioInput = document.getElementById("ticketEnvio");
  const envio = Number(envioInput?.value) || 0;
  const total = subtotal + envio;

  const subtotalInput = document.getElementById("ticketSubtotal");
  const totalInput = document.getElementById("ticketTotal");

  if (subtotalInput) subtotalInput.value = `$${subtotal.toFixed(2)}`;
  if (totalInput) totalInput.value = `$${total.toFixed(2)}`;

  console.log("📊 Subtotal:", subtotal, "Envío:", envio, "Total:", total);
}

async function generarTicketVenta(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeTicket");
  const btn = e.target.querySelector('button[type="submit"]');

  const cliente = document.getElementById("ticketCliente").value.trim();
  const telefono = document.getElementById("ticketTelefono").value.trim();
  const direccion = document.getElementById("ticketDireccion").value.trim();
  const envio = parseFloat(document.getElementById("ticketEnvio").value) || 0;

  if (!cliente || !telefono) {
    return mostrarMensaje(
      msg,
      "❌ Cliente y teléfono son obligatorios",
      "error"
    );
  }

  if (ticketProductos.length === 0) {
    return mostrarMensaje(msg, "❌ Agrega al menos un producto", "error");
  }

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
        "error"
      );
    }

    if (!productoBD) {
      return mostrarMensaje(
        msg,
        `❌ Producto "${item.nombre}" no encontrado en la base de datos.`,
        "error"
      );
    }

    if (item.cantidad > productoBD.stock) {
      return mostrarMensaje(
        msg,
        `❌ Stock insuficiente para "${item.nombre}". Disponible: ${productoBD.stock}`,
        "error"
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

  const total = subtotal + envio;

  try {
    btn.disabled = true;
    btn.textContent = "Procesando...";

    const pedido = {
      cliente_nombre: cliente,
      cliente_telefono: telefono,
      direccion_entrega: direccion || null,
      productos: productosValidados.map((p) => ({
        nombre: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
      })),
      total: total,
      metodo_pago: "efectivo",
      estado: "entregado",
      notas: `Ticket generado desde el panel. Envío: $${envio.toFixed(2)}`,
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
      metodo_pago: "Efectivo",
      items: productosValidados.map((p) => ({
        nombre: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
      })),
      subtotal: subtotal,
      envio: envio,
      total: total,
      fecha: new Date().toISOString(),
      ticket_numero: `T-${Date.now().toString(36).toUpperCase()}`,
    };

    window.open(
      `ticket.html?pedido=${encodeURIComponent(JSON.stringify(datosTicket))}`,
      "_blank",
      "width=400,height=700"
    );

    mostrarMensaje(msg, "✅ ¡Venta registrada! Ticket generado.", "exito");

    ticketProductos = [];
    actualizarListaTicket();
    actualizarTotalesTicket();

    document.getElementById("ticketCliente").value = "";
    document.getElementById("ticketTelefono").value = "";
    document.getElementById("ticketDireccion").value = "";
    document.getElementById("ticketEnvio").value = "0";
    document.getElementById("ticketSubtotal").value = "$0.00";
    document.getElementById("ticketTotal").value = "$0.00";

    cargarProductos();
    cargarInventario();
    cargarPedidos();
    cargarFinanzas();
    cargarProductosTicket();
  } catch (error) {
    console.error("Error:", error);
    mostrarMensaje(msg, "❌ Error: " + error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "🖨️ Generar Ticket y Registrar Venta";
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
  };
  const modalMensaje = document.getElementById("modalMensaje");
  if (modalMensaje)
    modalMensaje.textContent = mensajes[tipo] || "¿Eliminar este elemento?";

  const modalElement = document.getElementById("modalConfirm");
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
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
    }
    if (result.error) throw result.error;

    const modalElement = document.getElementById("modalConfirm");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    }

    if (eliminarTipo === "producto") {
      cargarProductos();
      cargarInventario();
    } else if (eliminarTipo === "inventario") {
      cargarInventario();
      cargarProductos();
    } else if (eliminarTipo === "finanza") {
      cargarFinanzas();
    }
    alert("✅ Eliminado correctamente");
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Error: " + error.message);
  }
  eliminarId = null;
  eliminarTipo = null;
}

function cerrarModal() {
  const modalElement = document.getElementById("modalConfirm");
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
  }
  eliminarId = null;
  eliminarTipo = null;
}

// ============================================
// 8. EXPONER FUNCIONES AL WINDOW
// ============================================
window.eliminarProductoTicket = eliminarProductoTicket;
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
