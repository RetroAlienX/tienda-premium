// ============================================
// CATÁLOGO - CON ESPERA PARA SUPABASE
// ============================================

const WHATSAPP_NUMERO = "521TU_NUMERO_AQUI"; // ⚠️ CAMBIA ESTO

let productos = [];
let supabaseListo = false;

// ============================================
// ESPERAR A QUE SUPABASE ESTÉ LISTO
// ============================================

function esperarSupabase(callback) {
  // Si supabase ya está listo, ejecutar inmediatamente
  if (window.supabase && typeof window.supabase.from === "function") {
    callback();
    return;
  }

  // Escuchar evento personalizado
  document.addEventListener("supabaseReady", function handler() {
    document.removeEventListener("supabaseReady", handler);
    callback();
  });

  // También verificar cada 200ms por si el evento no se dispara
  const intervalo = setInterval(function () {
    if (window.supabase && typeof window.supabase.from === "function") {
      clearInterval(intervalo);
      callback();
    }
  }, 200);
}

// ============================================
// CARGAR PRODUCTOS
// ============================================

async function cargarProductos() {
  const grid = document.getElementById("productos-grid");
  grid.innerHTML = `
        <div class="text-center text-secondary py-4">
            <div class="spinner-border text-warning" role="status"></div>
            <p>Cargando productos...</p>
        </div>
    `;

  esperarSupabase(async function () {
    try {
      console.log("🔄 Intentando cargar productos...");
      console.log("📦 supabase disponible:", !!window.supabase);
      console.log(
        "📦 supabase.from disponible:",
        typeof window.supabase.from === "function"
      );

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
                    <p>❌ Error al cargar productos</p>
                    <button onclick="cargarProductos()" class="btn btn-warning">Reintentar</button>
                </div>
            `;
    }
  });
}

function mostrarProductos(lista) {
  const grid = document.getElementById("productos-grid");

  if (!lista.length) {
    grid.innerHTML = `<p class="text-center text-secondary py-4">📦 No hay productos</p>`;
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
                    <p class="text-secondary small">${p.descripcion || ""}</p>
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
  )}%0A📌 Cantidad: _[escribe]_%0A📍 Dirección: _[escribe]_%0A💳 Pago: _[Transferencia / Efectivo]_`;

  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${mensaje}`, "_blank");
}

function cargarSelectProductos(lista) {
  const sel = document.getElementById("productoSelect");
  if (!sel) return;

  sel.innerHTML = '<option value="">Selecciona...</option>';
  lista.forEach((p) => {
    sel.innerHTML += `<option value="${p.id}">${p.nombre} - ${formatearMoneda(
      p.precio
    )}</option>`;
  });
}

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

document.addEventListener("DOMContentLoaded", function () {
  console.log("📦 catalog.js cargado, esperando Supabase...");
  cargarProductos();

  document.querySelectorAll(".filtro-btn").forEach((b) => {
    b.addEventListener("click", () => filtrarProductos(b.dataset.filtro));
  });

  const formPedido = document.getElementById("formPedido");
  if (formPedido) {
    formPedido.addEventListener("submit", async (e) => {
      e.preventDefault();

      const mensaje = document.getElementById("mensajePedido");
      const btn = e.target.querySelector('button[type="submit"]');

      const nombre = document.getElementById("nombreCliente").value.trim();
      const telefono = document.getElementById("telefonoCliente").value.trim();
      const email = document.getElementById("emailCliente").value.trim();
      const productoId = document.getElementById("productoSelect").value;
      const cantidad =
        parseInt(document.getElementById("cantidadProducto").value) || 1;
      const metodoPago = document.getElementById("metodoPago").value;
      const direccion = document
        .getElementById("direccionCliente")
        .value.trim();
      const notas = document.getElementById("notasPedido").value.trim();

      if (!nombre || !telefono || !productoId || !metodoPago) {
        return mostrarMensaje(mensaje, "❌ Completa todos los campos", "error");
      }

      const producto = productos.find((p) => p.id === productoId);
      if (!producto) {
        return mostrarMensaje(mensaje, "❌ Producto no encontrado", "error");
      }

      const total = producto.precio * cantidad;

      const pedido = {
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

        const { error } = await window.supabase
          .from("pedidos")
          .insert([pedido]);
        if (error) throw error;

        const fecha = new Date().toLocaleString();
        const waMsg = `🛍️ *NUEVO PEDIDO*%0A%0A📅 ${fecha}%0A👤 ${nombre}%0A📱 ${telefono}%0A${
          email ? `📧 ${email}%0A` : ""
        }%0A📦 *${producto.nombre}* x${cantidad}%0A💰 Total: ${formatearMoneda(
          total
        )}%0A💳 ${
          metodoPago === "transferencia" ? "Transferencia" : "Efectivo"
        }${direccion ? `%0A📍 ${direccion}` : ""}${
          notas ? `%0A📝 ${notas}` : ""
        }`;
        window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${waMsg}`, "_blank");

        mostrarMensaje(mensaje, "✅ ¡Pedido enviado!", "exito");
        formPedido.reset();
        cargarSelectProductos(productos);
      } catch (error) {
        mostrarMensaje(mensaje, "❌ Error: " + error.message, "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "📤 Enviar Pedido";
      }
    });
  }
});
