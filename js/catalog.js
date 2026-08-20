// ============================================
// CATÁLOGO + WHATSAPP (SOLO CLIENTES)
// ============================================

// 🔥 CONFIGURACIÓN - NÚMERO DE WHATSAPP
const CONFIG = {
  WHATSAPP: "5218126878080",
};

// 🔥 CONFIGURACIÓN DE EMAILJS - CAMBIA ESTOS VALORES
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_4utb13l", // De EmailJS → service_xxxxx
  TEMPLATE_ID: "template_e454v8w", // De EmailJS → template_xxxxx
  USER_ID: "u-BAOu3SbKHhBY2qk", // De EmailJS → user_xxxxx
};

let productos = [];
let supabaseListo = false;

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
    if (window.supabase && typeof window.supabase.from === "function") {
      callback();
    } else {
      setTimeout(() => esperarSupabase(callback), 200);
    }
  });

  const intervalo = setInterval(function () {
    if (window.supabase && typeof window.supabase.from === "function") {
      clearInterval(intervalo);
      callback();
    }
  }, 200);
}

// ============================================
// GENERAR NÚMERO DE PEDIDO
// ============================================

function generarNumeroPedido() {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().slice(-2);
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  const aleatorio = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `P-${año}${mes}${dia}-${aleatorio}`;
}

// ============================================
// CARGAR PRODUCTOS
// ============================================

async function cargarProductos() {
  const grid = document.getElementById("productos-grid");
  if (!grid) return;

  grid.innerHTML = `
        <div class="text-center text-secondary py-4">
            <div class="spinner-border text-warning" role="status"></div>
            <p>Cargando productos...</p>
        </div>
    `;

  esperarSupabase(async function () {
    try {
      const { data, error } = await window.supabase
        .from("productos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      productos = data || [];
      console.log("✅ Productos cargados:", productos.length);
      mostrarProductos(productos);
      cargarSelectProductos(productos);
    } catch (error) {
      console.error("Error cargando productos:", error);
      grid.innerHTML = `
                <div class="text-center text-danger py-4">
                    <p>❌ Error al cargar productos: ${error.message}</p>
                    <button onclick="cargarProductos()" class="btn btn-warning mt-2">Reintentar</button>
                </div>
            `;
    }
  });
}

// ============================================
// MOSTRAR PRODUCTOS (CON DESCRIPCIÓN DEFAULT)
// ============================================

function mostrarProductos(lista) {
  const grid = document.getElementById("productos-grid");
  if (!grid) return;

  if (!lista || lista.length === 0) {
    grid.innerHTML = `<p class="text-center text-secondary py-4">📦 No hay productos disponibles</p>`;
    return;
  }

  grid.innerHTML = lista
    .map(
      (p) => `
        <div class="col-lg-3 col-md-4 col-sm-6">
            <div class="producto-card">
                ${
                  p.imagen_url
                    ? `<img src="${p.imagen_url}" alt="${p.nombre}" loading="lazy" onerror="this.style.display='none'" style="width:100%;height:200px;object-fit:cover;">`
                    : `<div style="height:200px;display:flex;align-items:center;justify-content:center;background:#1a1a1a;color:#666;font-size:48px;">📦</div>`
                }
                <div class="card-body">
                    <h6 class="text-white">${p.nombre}</h6>
                    <p class="text-secondary small" style="min-height: 40px;">${
                      p.descripcion || "📝 Sin descripción disponible"
                    }</p>
                    <p class="precio">${formatearMoneda(p.precio)}</p>
                    <p class="text-secondary small">📦 ${
                      p.stock > 0 ? `${p.stock} disponibles` : "Bajo pedido"
                    }</p>
                    <button onclick="hacerPedido('${
                      p.id
                    }')" class="btn btn-warning btn-sm w-100">💬 Pedir</button>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// ============================================
// HACER PEDIDO POR WHATSAPP
// ============================================

function hacerPedido(id) {
  const p = productos.find((x) => x.id === id);
  if (!p) {
    alert("❌ Producto no encontrado");
    return;
  }

  const mensaje = `Hola, quiero pedir:%0A%0A📦 *${
    p.nombre
  }*%0A💰 ${formatearMoneda(
    p.precio
  )}%0A📌 Cantidad: _[escribe la cantidad]_%0A📍 Dirección: _[escribe tu dirección]_%0A💳 Pago: _[Transferencia / Efectivo]_%0A%0A¡Gracias!`;

  window.open(`https://wa.me/${CONFIG.WHATSAPP}?text=${mensaje}`, "_blank");
}

// ============================================
// CARGAR SELECT DE PRODUCTOS (CON STOCK)
// ============================================

function cargarSelectProductos(lista) {
  const sel = document.getElementById("productoSelect");
  if (!sel) return;

  sel.innerHTML = '<option value="">Selecciona un producto...</option>';
  lista.forEach((p) => {
    const stockText = p.stock > 0 ? ` (Stock: ${p.stock})` : " ⚠️ Sin stock";
    sel.innerHTML += `<option value="${p.id}">${p.nombre} - ${formatearMoneda(
      p.precio
    )}${stockText}</option>`;
  });
}

// ============================================
// FILTRAR PRODUCTOS
// ============================================

function filtrarProductos(categoria) {
  const filtrados =
    categoria === "todos"
      ? productos
      : productos.filter((p) => p.categoria === categoria);
  mostrarProductos(filtrados);

  document.querySelectorAll(".filtro-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.filtro === categoria);
  });
}

// ============================================
// VALIDAR TELÉFONO
// ============================================

function validarTelefono(telefono) {
  const limpio = telefono.replace(/[\s\-\(\)]/g, "");
  if (limpio.length === 10) {
    return { valido: true, telefono: limpio };
  } else if (limpio.length === 11 && limpio.startsWith("52")) {
    return { valido: true, telefono: limpio };
  } else if (limpio.length === 11 && limpio.startsWith("1")) {
    return { valido: true, telefono: limpio };
  } else {
    return { valido: false, telefono: limpio };
  }
}

// ============================================
// ENVIAR CORREO DE CONFIRMACIÓN (EMAILJS)
// ============================================

async function enviarCorreoConfirmacion(
  pedido,
  producto,
  numeroPedido,
  total,
  metodoPago,
  direccion
) {
  try {
    // Cargar EmailJS
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

    const params = {
      cliente: pedido.cliente_nombre,
      numero_pedido: numeroPedido,
      fecha: new Date().toLocaleString("es-MX"),
      productos: pedido.productos.map((p) => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: formatearMoneda(p.precio * p.cantidad),
      })),
      total: formatearMoneda(total),
      metodo_pago:
        metodoPago === "transferencia"
          ? "Transferencia Bancaria"
          : "Efectivo contra entrega",
      direccion:
        direccion || "No especificada (te contactaremos para coordinar envío)",
      to_email: pedido.cliente_email || "cliente@email.com",
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      params
    );

    console.log("✅ Correo enviado:", response);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    return false;
  }
}

// ============================================
// CANCELAR PEDIDO (CLIENTE)
// ============================================

async function cancelarPedidoCliente() {
  const numeroPedido = document
    .getElementById("numeroPedidoCancelar")
    .value.trim();
  const mensaje = document.getElementById("mensajeCancelacion");

  if (!numeroPedido) {
    mensaje.innerHTML =
      '<span class="text-danger">❌ Ingresa el número de pedido</span>';
    return;
  }

  try {
    const { data, error } = await window.supabase
      .from("pedidos")
      .select("id, estado, cliente_nombre")
      .eq("numero_pedido", numeroPedido)
      .single();

    if (error || !data) {
      mensaje.innerHTML =
        '<span class="text-danger">❌ Pedido no encontrado. Verifica el número.</span>';
      return;
    }

    if (data.estado === "cancelado") {
      mensaje.innerHTML =
        '<span class="text-warning">⚠️ Este pedido ya fue cancelado.</span>';
      return;
    }

    if (data.estado === "entregado") {
      mensaje.innerHTML =
        '<span class="text-warning">⚠️ Este pedido ya fue entregado, no se puede cancelar.</span>';
      return;
    }

    if (
      !confirm(`¿Cancelar el pedido ${numeroPedido} de ${data.cliente_nombre}?`)
    ) {
      return;
    }

    const { error: updateError } = await window.supabase
      .from("pedidos")
      .update({ estado: "cancelado" })
      .eq("id", data.id);

    if (updateError) throw updateError;

    mensaje.innerHTML = `<span class="text-success">✅ Pedido ${numeroPedido} cancelado correctamente.</span>`;
    document.getElementById("numeroPedidoCancelar").value = "";
  } catch (error) {
    console.error("Error:", error);
    mensaje.innerHTML = `<span class="text-danger">❌ Error al cancelar: ${error.message}</span>`;
  }
}

// ============================================
// FORMULARIO DE PEDIDO DIRECTO
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("📦 catalog.js cargado, esperando Supabase...");
  cargarProductos();

  document.querySelectorAll(".filtro-btn").forEach((b) => {
    b.addEventListener("click", () => filtrarProductos(b.dataset.filtro));
  });

  const btnCancelar = document.getElementById("btnCancelarPedido");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", cancelarPedidoCliente);
  }

  const inputCancelar = document.getElementById("numeroPedidoCancelar");
  if (inputCancelar) {
    inputCancelar.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        cancelarPedidoCliente();
      }
    });
  }

  const formPedido = document.getElementById("formPedido");
  if (formPedido) {
    formPedido.addEventListener("submit", async (e) => {
      e.preventDefault();

      const mensaje = document.getElementById("mensajePedido");
      const btn = e.target.querySelector('button[type="submit"]');

      const nombre = document.getElementById("nombreCliente").value.trim();
      let telefonoRaw = document.getElementById("telefonoCliente").value.trim();
      const email = document.getElementById("emailCliente").value.trim();
      const productoId = document.getElementById("productoSelect").value;
      const cantidad =
        parseInt(document.getElementById("cantidadProducto").value) || 1;
      const metodoPago = document.getElementById("metodoPago").value;
      const direccion = document
        .getElementById("direccionCliente")
        .value.trim();
      const notas = document.getElementById("notasPedido").value.trim();

      const telefonoValidado = validarTelefono(telefonoRaw);
      if (!telefonoValidado.valido) {
        return mostrarMensaje(
          mensaje,
          "❌ Teléfono inválido. Debe tener 10 dígitos (ej: 8126878080) o 11 con LADA (ej: 5218126878080)",
          "error"
        );
      }
      const telefono = telefonoValidado.telefono;

      if (!nombre || !telefono || !productoId || !metodoPago) {
        return mostrarMensaje(
          mensaje,
          "❌ Completa todos los campos obligatorios",
          "error"
        );
      }

      const producto = productos.find((p) => p.id === productoId);
      if (!producto) {
        return mostrarMensaje(mensaje, "❌ Producto no encontrado", "error");
      }

      if (cantidad > producto.stock) {
        return mostrarMensaje(
          mensaje,
          `❌ No hay suficiente stock. Solo tenemos ${producto.stock} unidades disponibles de "${producto.nombre}".`,
          "error"
        );
      }

      if (producto.stock === 0) {
        return mostrarMensaje(
          mensaje,
          `❌ El producto "${producto.nombre}" no tiene stock disponible.`,
          "error"
        );
      }

      const total = producto.precio * cantidad;
      const numeroPedido = generarNumeroPedido();

      const pedido = {
        numero_pedido: numeroPedido,
        cliente_nombre: nombre,
        cliente_telefono: telefono,
        cliente_email: email || null,
        productos: [
          {
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad,
          },
        ],
        total: total,
        metodo_pago: metodoPago,
        direccion_entrega: direccion || null,
        notas: notas || null,
        estado: "pendiente",
      };

      try {
        btn.disabled = true;
        btn.textContent = "Enviando...";

        if (!window.supabase || typeof window.supabase.from !== "function") {
          throw new Error("Supabase no está listo. Intenta de nuevo.");
        }

        const { error } = await window.supabase
          .from("pedidos")
          .insert([pedido]);
        if (error) throw error;

        // 🔥 ENVIAR CORREO DE CONFIRMACIÓN AL CLIENTE
        if (email) {
          await enviarCorreoConfirmacion(
            pedido,
            producto,
            numeroPedido,
            total,
            metodoPago,
            direccion
          );
        }

        // ENVIAR NOTIFICACIÓN POR WHATSAPP AL ADMIN
        const fecha = new Date().toLocaleString("es-MX");
        const waMsg =
          `🛍️ *NUEVO PEDIDO DIRECTO*%0A%0A` +
          `📋 *Número: ${numeroPedido}*%0A` +
          `📅 ${fecha}%0A` +
          `👤 ${nombre}%0A` +
          `📱 ${telefono}%0A` +
          `${email ? `📧 ${email}%0A` : ""}` +
          `%0A📦 *${producto.nombre}* x${cantidad}%0A` +
          `💰 Total: ${formatearMoneda(total)}%0A` +
          `💳 ${metodoPago === "transferencia" ? "Transferencia" : "Efectivo"}${
            direccion ? `%0A📍 ${direccion}` : ""
          }${notas ? `%0A📝 ${notas}` : ""}`;

        window.open(`https://wa.me/${CONFIG.WHATSAPP}?text=${waMsg}`, "_blank");

        // MENSAJE DE CONFIRMACIÓN PARA EL CLIENTE
        const mensajeCorreo = email
          ? `\n\n📧 Se ha enviado un correo de confirmación a ${email}.`
          : "\n\n⚠️ No proporcionaste correo, no podremos enviarte confirmación por email.";

        mostrarMensaje(
          mensaje,
          `✅ ¡Pedido confirmado ${nombre}!%0A%0A` +
            `📋 *Número de pedido:* ${numeroPedido}%0A` +
            `📦 *Producto:* ${producto.nombre}%0A` +
            `🔢 *Cantidad:* ${cantidad}%0A` +
            `💰 *Total:* ${formatearMoneda(total)}%0A` +
            `💳 *Pago:* ${
              metodoPago === "transferencia" ? "Transferencia" : "Efectivo"
            }%0A` +
            `${direccion ? `📍 *Dirección:* ${direccion}\n` : ""}` +
            `%0A📦 *Información de envío:*%0A` +
            `El costo de envío puede variar según la distancia.%0A` +
            `Nos pondremos en contacto para coordinar el envío y el costo.%0A` +
            `${mensajeCorreo}%0A%0A` +
            `⚠️ *¡IMPORTANTE! Guarda tu número de pedido.*%0A` +
            `Con él podrás:%0A` +
            `• ❌ Cancelar tu pedido si lo necesitas%0A` +
            `• 📞 Contactarnos para modificaciones%0A` +
            `• 📦 Dar seguimiento a tu pedido`,
          "exito"
        );

        formPedido.reset();
        cargarSelectProductos(productos);
        mensaje.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (error) {
        console.error("Error:", error);
        mostrarMensaje(
          mensaje,
          "❌ Error al enviar el pedido: " + error.message,
          "error"
        );
      } finally {
        btn.disabled = false;
        btn.textContent = "📤 Enviar Pedido";
      }
    });
  }
});
