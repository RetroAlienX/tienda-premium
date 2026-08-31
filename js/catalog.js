// ============================================
// CATÁLOGO THE ROUTE66 MARKET - COMPLETO
// ============================================

// CONFIGURACIÓN DE CONTACTO
const CONFIG = {
  WHATSAPP: "528126878080",
  TELEFONO: "+52 8126878080",
};

// CONFIGURACIÓN DE EMAILJS (GMAIL CONECTADO)
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_zyekllp",
  TEMPLATE_ID: "template_1dcnw6v",
  USER_ID: "Jx00-aXDn9h0eWxnY",
};

// IMAGEN POR DEFECTO - ICONO DE CAJA
const IMG_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23080808'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23333' font-family='sans-serif' font-size='40'%3E📦%3C/text%3E%3C/svg%3E";

let productos = [];

// ============================================
// INICIALIZAR EMAILJS
// ============================================

if (typeof emailjs !== "undefined") {
  emailjs.init(EMAILJS_CONFIG.USER_ID);
} else {
  console.warn("⚠️ EmailJS SDK no disponible todavía en catalog.js");
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function formatearMoneda(cantidad) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(cantidad);
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
// CARGAR PRODUCTOS
// ============================================

async function cargarProductos() {
  const grid = document.getElementById("productos-grid");
  if (!grid) return;

  grid.innerHTML = `
        <div class="text-center py-5" style="color:var(--text-silver);">
            <div style="display:inline-block;width:28px;height:28px;border:2px solid var(--text-silver);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
            <p style="margin-top:12px;font-weight:300;">Cargando colección...</p>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;

  esperarSupabase(async function () {
    try {
      const { data, error } = await window.supabase
        .from("productos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      productos = data || [];
      mostrarProductos(productos);
      cargarSelectProductos(productos);
    } catch (error) {
      console.error("Error cargando productos:", error);
      grid.innerHTML = `
                <div class="text-center py-5" style="color:var(--regio-red);">
                    <p>❌ Error al cargar productos: ${error.message}</p>
                    <button onclick="cargarProductos()" style="background:var(--accent);color:var(--bg-black);border:none;padding:8px 24px;font-weight:600;cursor:pointer;margin-top:12px;font-size:0.8rem;">Reintentar</button>
                </div>
            `;
    }
  });
}

// ============================================
// RENDERIZADO DE CARDS CON NEON Y PLACEHOLDER
// ============================================

function mostrarProductos(lista) {
  const grid = document.getElementById("productos-grid");
  if (!grid) return;

  if (!lista || lista.length === 0) {
    grid.innerHTML = `<p class="text-center py-5" style="color:var(--text-silver);font-weight:300;">No hay productos disponibles</p>`;
    return;
  }

  grid.innerHTML = lista
    .map((p) => {
      const agotado = p.stock <= 0;
      const stockText = agotado
        ? "MERCANCÍA AGOTADA"
        : `${p.stock} disponibles`;
      const stockClass = agotado ? "out" : "available";

      const tieneImagen = p.imagen_url && p.imagen_url.trim() !== "";
      const imagenHtml = tieneImagen
        ? `<img src="${p.imagen_url}" alt="${p.nombre}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'placeholder-icon\\'>📦</div>'">`
        : `<div class="placeholder-icon">📦</div>`;

      return `
                <div class="col-lg-3 col-md-4 col-sm-6">
                    <div class="card-premium" style="${
                      agotado ? "opacity:0.5;" : ""
                    }">
                        <div class="img-container">
                            ${
                              agotado
                                ? '<div class="sold-out-overlay">AGOTADO</div>'
                                : ""
                            }
                            ${imagenHtml}
                        </div>
                        <div class="card-info">
                            <span class="usa-tag"><span class="flag-icon">🇺🇸</span> <span class="highlight-text">Importado de USA</span></span>
                            <h3>${p.nombre}</h3>
                            <span class="price">${formatearMoneda(
                              p.precio,
                            )}</span>
                            <span class="stock-status ${stockClass}">${stockText}</span>
                            <button onclick="hacerPedido('${
                              p.id
                            }')" class="btn-card" ${agotado ? "disabled" : ""}>
                                ${agotado ? "SIN STOCK" : "PEDIR AHORA"}
                            </button>
                        </div>
                    </div>
                </div>
            `;
    })
    .join("");
}

// ============================================
// HACER PEDIDO POR WHATSAPP
// ============================================

function hacerPedido(id) {
  const p = productos.find((x) => x.id === id);
  if (!p) {
    mostrarToastCupon("❌ Producto no encontrado");
    return;
  }

  if (p.stock <= 0) {
    mostrarToastCupon("❌ Este producto está agotado");
    return;
  }

  const mensaje = `Hola 👋
🎁 ${p.nombre}
💰 Precio: ${formatearMoneda(p.precio)}
🔢 Cantidad: ¿Cuántas unidades necesitas?
📍 Dirección: ¿A dónde te lo enviamos?
💳 Pago: Solo por transferencia bancaria
📍 Entrega: Los sábados y domingos, horario de 8:00 AM a 3:00 PM
🎟️ Cupón: ¿Tienes algún cupón? Indícanos el código
✅ ¡Gracias!`;

  window.open(
    `https://api.whatsapp.com/send?phone=${
      CONFIG.WHATSAPP
    }&text=${encodeURIComponent(mensaje)}`,
    "_blank",
  );
}

// ============================================
// CARGAR SELECT DE PRODUCTOS
// ============================================

// ============================================
// DROPDOWN PERSONALIZADO DE PRODUCTOS (con imagen)
// ============================================

let productosParaPicker = [];

function cargarSelectProductos(lista) {
  const hidden = document.getElementById("productoSelect");
  const lista_el = document.getElementById("productoPickerList");
  const label = document.getElementById("productoPickerLabel");
  if (!hidden || !lista_el || !label) return;

  productosParaPicker = lista.filter((p) => p.stock > 0);

  hidden.value = "";
  label.textContent = "Selecciona un producto...";
  label.classList.remove("seleccionado");

  if (productosParaPicker.length === 0) {
    lista_el.innerHTML =
      '<div class="producto-picker-vacio">⚠️ No hay productos disponibles</div>';
    return;
  }

  lista_el.innerHTML = productosParaPicker
    .map((p) => {
      const tieneImagen = p.imagen_url && p.imagen_url.trim() !== "";
      const imgHtml = tieneImagen
        ? `<img class="producto-picker-item-img" src="${p.imagen_url}" alt="${p.nombre}" loading="lazy" onerror="this.outerHTML='<div class=\\'producto-picker-item-img placeholder\\'>📦</div>'">`
        : '<div class="producto-picker-item-img placeholder">📦</div>';

      return `
                <div class="producto-picker-item" data-id="${p.id}">
                    ${imgHtml}
                    <div class="producto-picker-item-info">
                        <span class="producto-picker-item-nombre">${
                          p.nombre
                        }</span>
                        <span class="producto-picker-item-detalle">${formatearMoneda(
                          p.precio,
                        )} · ${p.stock} disponibles</span>
                    </div>
                </div>
            `;
    })
    .join("");

  lista_el.querySelectorAll(".producto-picker-item").forEach((item) => {
    item.addEventListener("click", () => {
      aplicarSeleccionProducto(item.dataset.id);
      cerrarProductoPicker();
    });
  });
}

function aplicarSeleccionProducto(id) {
  const hidden = document.getElementById("productoSelect");
  const label = document.getElementById("productoPickerLabel");
  if (!hidden || !label) return;

  const producto = productosParaPicker.find((p) => p.id === id);
  if (!producto) return;

  hidden.value = id;
  label.textContent = `${producto.nombre} - ${formatearMoneda(
    producto.precio,
  )}`;
  label.classList.add("seleccionado");
}

function abrirProductoPicker() {
  document.getElementById("productoPicker")?.classList.add("abierto");
}

function cerrarProductoPicker() {
  document.getElementById("productoPicker")?.classList.remove("abierto");
}

function initProductoPicker() {
  const picker = document.getElementById("productoPicker");
  const btn = document.getElementById("productoPickerBtn");
  if (!picker || !btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (picker.classList.contains("abierto")) {
      cerrarProductoPicker();
    } else {
      abrirProductoPicker();
    }
  });

  document.addEventListener("click", (e) => {
    if (!picker.contains(e.target)) cerrarProductoPicker();
  });
}

document.addEventListener("DOMContentLoaded", initProductoPicker);

// ============================================
// MODAL SECRETO DEL CORAZÓN (5 clics)
// ============================================

let heartClickCount = 0;
let heartClickTimer = null;

function initSecretHeart() {
  const heart = document.getElementById("secretHeart");
  const overlay = document.getElementById("secretHeartModalOverlay");
  const btnAceptar = document.getElementById("btnAceptarSecretHeart");
  if (!heart || !overlay) return;

  heart.addEventListener("click", function () {
    heartClickCount++;
    if (heartClickTimer) clearTimeout(heartClickTimer);
    heartClickTimer = setTimeout(() => {
      heartClickCount = 0;
    }, 2000);

    if (heartClickCount >= 5) {
      heartClickCount = 0;
      overlay.classList.add("abierto");
    }
  });

    if (btnAceptar) {
      btnAceptar.addEventListener("click", function () {
        overlay.classList.remove("abierto");
      });
    }

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.classList.remove("abierto");
    });

    // El mensaje se define en el HTML (index.html) para mantener el estilo.
  }

document.addEventListener("DOMContentLoaded", initSecretHeart);

// Mantenido para compatibilidad: preselecciona un producto por id
// (por ejemplo, desde un botón "Pedir este producto").
function seleccionarProducto(id) {
  aplicarSeleccionProducto(id);
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
// ENVIAR CORREO DE CONFIRMACIÓN
// ============================================

async function enviarCorreoConfirmacion(
  pedido,
  numeroPedido,
  total,
  metodoPago,
  direccion,
) {
  try {
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

    const subtotalProd = (pedido.productos || []).reduce(
      (s, p) => s + (Number(p.precio) || 0) * (Number(p.cantidad) || 0),
      0,
    );
    const envioPedido = Number(pedido.costo_envio) || 0;

    const params = {
      tipo_correo: "confirmacion",
      cliente: pedido.cliente_nombre,
      numero_pedido: numeroPedido,
      fecha: new Date().toLocaleString("es-MX"),
      productos: pedido.productos.map((p) => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio_unitario: formatearMoneda(p.precio),
        precio: formatearMoneda(p.precio * p.cantidad),
      })),
      subtotal_productos: formatearMoneda(subtotalProd),
      subtotal: formatearMoneda(subtotalProd + envioPedido),
      envio: envioPedido > 0 ? formatearMoneda(envioPedido) : "",
      descuento: pedido.descuento ? Number(pedido.descuento) : 0,
      cupon: pedido.cupon || "",
      dia_entrega: pedido.dia_entrega
        ? new Date(pedido.dia_entrega + "T00:00:00").toLocaleDateString("es-MX")
        : "Por confirmar",
      hora_entrega: pedido.hora_entrega || "Por confirmar",
      total: formatearMoneda(total),
      metodo_pago: "Transferencia Bancaria",
      direccion:
        direccion || "No especificada (te contactaremos para coordinar envío)",
      politicas:
        TEXTO_CANCELACION_3DIAS + " " + TEXTO_POLITICAS_ENTREGA,
      to_email: pedido.cliente_email,
    };


    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      params,
    );

    return true;
  } catch (error) {
    console.error("❌ Error al enviar correo (no crítico):", error);
    return false;
  }
}

// ============================================
// ENVIAR CORREO DE CANCELACIÓN
// ============================================

async function enviarCorreoCancelacion(pedido, numeroPedido) {
  try {
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
      tipo_correo: "cancelacion",
      cliente: pedido.cliente_nombre,
      numero_pedido: numeroPedido,
      fecha: new Date().toLocaleString("es-MX"),
      productos: pedido.productos.map((p) => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: formatearMoneda(p.precio * p.cantidad),
      })),
      subtotal: formatearMoneda(
        (pedido.productos || []).reduce(
          (s, p) => s + (Number(p.precio) || 0) * (Number(p.cantidad) || 0),
          0,
        ),
      ),
      envio: (Number(pedido.costo_envio) || 0) > 0 ? formatearMoneda(Number(pedido.costo_envio) || 0) : "",
      total: formatearMoneda(pedido.total),
      metodo_pago:
        pedido.metodo_pago === "transferencia" ? "Transferencia" : "Efectivo",
      direccion: pedido.direccion_entrega || "No especificada",
      mensaje_estado: "❌ Este pedido ha sido CANCELADO.",
      to_email: pedido.cliente_email,
    };


    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      params,
    );

    return true;
  } catch (error) {
    console.error(
      "❌ Error al enviar correo de cancelación (no crítico):",
      error,
    );
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
      '<span style="color:var(--regio-red);">❌ Ingresa el número de pedido</span>';
    mensaje.classList.add("visible");
    setTimeout(() => {
      mensaje.textContent = "";
      mensaje.classList.remove("visible");
    }, 5000);
    return;
  }

  try {
    const { data, error } = await window.supabase
      .from("pedidos")
      .select("*")
      .eq("numero_pedido", numeroPedido)
      .single();

    if (error || !data) {
      mensaje.innerHTML =
        '<span style="color:var(--regio-red);">❌ Pedido no encontrado. Verifica el número.</span>';
      mensaje.classList.add("visible");
      setTimeout(() => {
        mensaje.textContent = "";
        mensaje.classList.remove("visible");
      }, 5000);
      return;
    }

    if (data.estado === "cancelado") {
      mensaje.innerHTML =
        '<span style="color:#ff9500;">⚠️ Este pedido ya fue cancelado.</span>';
      mensaje.classList.add("visible");
      setTimeout(() => {
        mensaje.textContent = "";
        mensaje.classList.remove("visible");
      }, 5000);
      return;
    }

    if (data.estado === "entregado") {
      mensaje.innerHTML =
        '<span style="color:#ff9500;">⚠️ Este pedido ya fue entregado, no se puede cancelar.</span>';
      mensaje.classList.add("visible");
      setTimeout(() => {
        mensaje.textContent = "";
        mensaje.classList.remove("visible");
      }, 5000);
      return;
    }

    // ABRIR MODAL DE CONFIRMACIÓN
    const modalConfirmar = document.getElementById("modalConfirmarCancelacion");
    if (modalConfirmar) {
      document.getElementById("pedidoCancelarNumero").textContent =
        numeroPedido;

      modalConfirmar.dataset.pedidoId = data.id;
      modalConfirmar.dataset.pedidoJson = JSON.stringify(data);

      modalConfirmar.style.display = "flex";
    }
  } catch (error) {
    console.error("Error:", error);
    mensaje.innerHTML = `<span style="color:var(--regio-red);">❌ Error al buscar: ${error.message}</span>`;
    mensaje.classList.add("visible");
    setTimeout(() => {
      mensaje.textContent = "";
      mensaje.classList.remove("visible");
    }, 5000);
  }
}

// ============================================
// CONFIRMAR CANCELACIÓN DESDE EL MODAL
// ============================================

async function confirmarCancelacionDesdeModal() {
  const modalConfirmar = document.getElementById("modalConfirmarCancelacion");
  const pedidoId = modalConfirmar.dataset.pedidoId;
  const pedido = JSON.parse(modalConfirmar.dataset.pedidoJson);

  try {
    const { error: updateError } = await window.supabase
      .from("pedidos")
      .update({ estado: "cancelado" })
      .eq("id", pedidoId);

    if (updateError) throw updateError;

    await enviarCorreoCancelacion(pedido, pedido.numero_pedido);

    modalConfirmar.style.display = "none";

    const modalCancelado = document.getElementById("modalCancelacionPedido");
    if (modalCancelado) {
      document.getElementById("modalCancelarNumero").textContent =
        pedido.numero_pedido;
      modalCancelado.style.display = "flex";
    }

    document.getElementById("numeroPedidoCancelar").value = "";
  } catch (error) {
    console.error("Error:", error);
    mostrarToastCupon("❌ Error al cancelar: " + error.message);
  }
}

// ============================================
// CARRUSEL DE CUPONES - CON SUPABASE
// ============================================

let carouselInterval = null;
let currentSlide = 0;
let totalSlides = 0;
const slideInterval = 5000; // 5 segundos

async function cargarCuponesDesdeDB() {
  try {
    const { data, error } = await window.supabase
      .from("cupones")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) throw error;

    const track = document.getElementById("carouselTrack");
    const indicators = document.getElementById("carouselIndicators");

    if (!track || !indicators) return;

    if (!data || data.length === 0) {
      track.innerHTML =
        '<div class="text-center text-dim py-4">No hay cupones disponibles</div>';
      indicators.innerHTML = "";
      return;
    }

    // Generar slides
    track.innerHTML = data
      .map(
        (cupon, index) => `
            <div class="carousel-slide ${index === 0 ? "active" : ""}">
                <div class="cupon-card">
                    <div class="cupon-content">
                        <span class="cupon-tag">${
                          cupon.tag || "🎯 PROMOCIÓN"
                        }</span>
                        <div class="cupon-icon">${cupon.icono || "🎁"}</div>
                        <h4>${cupon.titulo}</h4>
                        <p class="cupon-desc">${cupon.descripcion}</p>
                        <div class="cupon-code">
                            <span>${cupon.codigo}</span>
                            <button class="btn-copy-code" onclick="copiarCodigo('${
                              cupon.codigo
                            }')">📋</button>
                        </div>
                        <span class="cupon-expiry">${
                          cupon.vigencia || "Válido hasta: Sin fecha"
                        }</span>
                    </div>
                </div>
            </div>
        `,
      )
      .join("");

    // Generar indicadores
    indicators.innerHTML = data
      .map(
        (_, index) => `
            <span class="dot ${
              index === 0 ? "active" : ""
            }" data-slide="${index}"></span>
        `,
      )
      .join("");

    // Actualizar total de slides y reiniciar carrusel
    totalSlides = data.length;
    currentSlide = 0;
    iniciarCarrusel();

  } catch (error) {
    console.error("Error cargando cupones:", error);
    const track = document.getElementById("carouselTrack");
    if (track) {
      track.innerHTML =
        '<div class="text-center text-danger py-4">❌ Error al cargar cupones</div>';
    }
  }
}

// ============================================
// NOTICIAS - CON SUPABASE
// ============================================

async function cargarNoticiasDesdeDB() {
  try {
    const { data, error } = await window.supabase
      .from("noticias")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) throw error;

    const container = document.getElementById("newsletterContent");
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML =
        '<div class="text-center text-dim py-3">No hay noticias disponibles</div>';
      return;
    }

    container.innerHTML = data
      .map(
        (noticia) => `
            <div class="news-item ${noticia.destacado ? "highlight" : ""}">
                <span class="news-date">${
                  noticia.fecha || "📅 Sin fecha"
                }</span>
                <p class="news-title">${noticia.titulo}</p>
                <p class="news-desc">${noticia.descripcion}</p>
            </div>
        `,
      )
      .join("");

  } catch (error) {
    console.error("Error cargando noticias:", error);
    const container = document.getElementById("newsletterContent");
    if (container) {
      container.innerHTML =
        '<div class="text-center text-danger py-3">❌ Error al cargar noticias</div>';
    }
  }
}

// ============================================
// FUNCIÓN iniciarCarrusel
// ============================================

function iniciarCarrusel() {
  const slides = document.querySelectorAll(".carousel-slide");
  const dots = document.querySelectorAll(".dot");

  if (!slides.length) {
    console.warn("⚠️ No se encontraron slides para el carrusel");
    return;
  }

  totalSlides = slides.length;

  function irASlide(index) {
    slides.forEach((s) => s.classList.remove("active"));
    dots.forEach((d) => d.classList.remove("active"));

    currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;

    slides[currentSlide].classList.add("active");
    if (dots[currentSlide]) {
      dots[currentSlide].classList.add("active");
    }
  }

  function siguienteSlide() {
    irASlide(currentSlide + 1);
  }

  function irASlideEspecifico(index) {
    if (carouselInterval) {
      clearInterval(carouselInterval);
      carouselInterval = null;
    }

    irASlide(index);

    setTimeout(() => {
      if (!carouselInterval) {
        carouselInterval = setInterval(siguienteSlide, slideInterval);
      }
    }, 1500);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => irASlideEspecifico(index));
  });

  irASlide(0);

  if (carouselInterval) {
    clearInterval(carouselInterval);
  }
  carouselInterval = setInterval(siguienteSlide, slideInterval);

}

// ============================================
// FUNCIÓN PARA COPIAR CÓDIGO DE CUPÓN
// ============================================

function copiarCodigo(codigo) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(codigo)
      .then(() => {
        mostrarToastCupon("✅ Código copiado: " + codigo);
      })
      .catch(() => {
        copiarCodigoFallback(codigo);
      });
  } else {
    copiarCodigoFallback(codigo);
  }
}

function copiarCodigoFallback(codigo) {
  const textarea = document.createElement("textarea");
  textarea.value = codigo;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
    mostrarToastCupon("✅ Código copiado: " + codigo);
  } catch (err) {
    console.error("Error al copiar:", err);
    mostrarToastCupon("❌ Error al copiar el código");
  }

  document.body.removeChild(textarea);
}

// ============================================
// TOAST NOTIFICACIÓN
// ============================================

function mostrarToastCupon(mensaje) {
  let toast = document.getElementById("toastCupon");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastCupon";
    toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: var(--bg-card);
            border: 1px solid rgba(255,255,255,0.12);
            color: var(--text-main);
            padding: 16px 32px;
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 9999;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            pointer-events: none;
            border-radius: 0;
            box-shadow: 0 8px 50px rgba(0,0,0,0.6);
            letter-spacing: 0.5px;
            max-width: 90%;
            text-align: center;
        `;
    document.body.appendChild(toast);
  }

  toast.textContent = mensaje;
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
  }, 3000);
}

// ============================================
// FORMULARIO DE PEDIDO DIRECTO
// ============================================

// ============================================
// AVISO MODAL REUTILIZABLE (stock / vencimiento / avisos)
// ============================================
function mostrarModalAviso(titulo, mensaje) {
  const modal = document.getElementById("modalAviso");
  if (!modal) {
    alert(titulo + "\n\n" + mensaje);
    return;
  }
  document.getElementById("modalAvisoTitulo").textContent = titulo;
  document.getElementById("modalAvisoMensaje").textContent = mensaje;
  modal.style.display = "flex";
}

// ============================================
// CUPONES ACTIVOS (para el combobox y el descuento)
// ============================================
let cuponesActivos = [];

async function cargarCuponesActivos() {
  try {
    const { data, error } = await window.supabase
      .from("cupones")
      .select("codigo, titulo, descuento, vigencia, activo")
      .eq("activo", true)
     .order("orden", { ascending: true });

    if (error) throw error;
    cuponesActivos = data || [];
    rellenarSelectCupones();
  } catch (err) {
    console.warn("⚠️ No se pudieron cargar cupones activos:", err.message);
    cuponesActivos = [];
  }
}

function rellenarSelectCupones() {
  const sel = document.getElementById("cuponCliente");
  if (!sel) return;
  sel.innerHTML = '<option value="">🎟️ Sin cupón</option>';
  (cuponesActivos || []).forEach((c) => {
    const desc = Number(c.descuento) || 0;
    sel.innerHTML += `<option value="${c.codigo}" data-descuento="${desc}">${c.codigo} — ${desc}% de descuento</option>`;
  });
}

// ============================================
// FECHAS DE ENTREGA (sábado/domingo) con cierre viernes 10pm
// ============================================
function calcularFechasEntrega() {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0=dom ... 6=sáb
  const hora = hoy.getHours() + hoy.getMinutes() / 60;

  const sabado = new Date(hoy);
  sabado.setHours(0, 0, 0, 0);
  let diasParaSabado = (6 - dia + 7) % 7;

  if (dia === 6) {
    diasParaSabado = 7; // hoy es sábado -> siguiente fin de semana
  } else if (dia === 5 && hora >= 22) {
    diasParaSabado += 7; // viernes después de las 10pm -> siguiente fin de semana
  }

  sabado.setDate(sabado.getDate() + diasParaSabado);
  const domingo = new Date(sabado);
  domingo.setDate(domingo.getDate() + 1);

  return { sabado, domingo };
}

function formatoFechaLatam(fecha) {
  return `${String(fecha.getDate()).padStart(2, "0")}/${String(
    fecha.getMonth() + 1,
  ).padStart(2, "0")}/${fecha.getFullYear()}`;
}

function poblarDiasEntrega() {
  const sel = document.getElementById("diaEntrega");
  if (!sel) return;
  const { sabado, domingo } = calcularFechasEntrega();
  const sabadoISO = sabado.toISOString().slice(0, 10);
  const domingoISO = domingo.toISOString().slice(0, 10);
  sel.innerHTML = `
    <option value="" disabled selected>Selecciona tu día de entrega...</option>
    <option value="${sabadoISO}">Sábado ${formatoFechaLatam(sabado)}</option>
    <option value="${domingoISO}">Domingo ${formatoFechaLatam(domingo)}</option>
  `;
}

function poblarHorariosEntrega() {
  const sel = document.getElementById("horaEntrega");
  if (!sel) return;
  sel.innerHTML = '<option value="" disabled selected>Selecciona tu horario de entrega...</option>';
  // Horarios de 8:00 AM a 3:00 PM (solo mañana/media mañana)
  for (let h = 8; h <= 15; h++) {
    const ampm = h >= 12 ? (h === 12 ? "PM" : "PM") : "AM";
    const hora12 = h > 12 ? h - 12 : h;
    const hora12m = h === 0 ? 12 : hora12;
    sel.innerHTML += `<option value="${h}:00:00">${hora12m}:00 ${ampm}</option>`;
  }
}

// ============================================
// POLÍTICAS DE ENTREGA Y PERMANENCIA (texto reutilizable)
// ============================================
const TEXTO_POLITICAS_ENTREGA =
  "🚚 Políticas de entrega: te esperamos hasta 15 minutos en tu entrega; si no estás, se reprograma y se cobra el envío de nuevo. Un segundo intento de entrega fallido significa que la mercancía regresa al stock y se pierde la compra. Permanencia: los productos solo permanecen una semana completa en nuestro stock; de no completarse la entrega en ese plazo la compra se pierde y el stock se mueve por políticas de la tienda.";
const TEXTO_CANCELACION_3DIAS =
  "⏳ Tienes un periodo de cancelación de 3 días a partir de tu compra. Después de ese periodo el pedido ya no puede cancelarse.";

document.addEventListener("DOMContentLoaded", function () {
  cargarProductos();

  // Llenar día/horario de entrega automáticamente según el reloj
  poblarDiasEntrega();
  poblarHorariosEntrega();

  // Cargar cupones y noticias desde Supabase
  setTimeout(() => {
    cargarCuponesDesdeDB();
    cargarNoticiasDesdeDB();
  }, 500);

  esperarSupabase(function () {
    cargarCuponesActivos();
  });

  // Botón de cierre del modal de aviso
  const cerrarAviso = document.getElementById("cerrarModalAviso");
  if (cerrarAviso) {
    cerrarAviso.addEventListener("click", function () {
      const m = document.getElementById("modalAviso");
      if (m) m.style.display = "none";
    });
  }

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

  const confirmarCancelarBtn = document.getElementById("confirmarCancelarBtn");
  if (confirmarCancelarBtn) {
    confirmarCancelarBtn.addEventListener(
      "click",
      confirmarCancelacionDesdeModal,
    );
  }

  const cancelarCancelacionBtn = document.getElementById(
    "cancelarCancelacionBtn",
  );
  if (cancelarCancelacionBtn) {
    cancelarCancelacionBtn.addEventListener("click", function () {
      const modalConfirmar = document.getElementById(
        "modalConfirmarCancelacion",
      );
      if (modalConfirmar) modalConfirmar.style.display = "none";
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
        parseInt(document.getElementById("cantidadProducto").value) || 0;
      const metodoPago = document.getElementById("metodoPago").value;
      const direccion = document
        .getElementById("direccionCliente")
        .value.trim();

      // LUGAR DE ENTREGA + COSTO DE ENVÍO
      const lugarSel = document.getElementById("lugarEntrega");
      const lugarEntrega = lugarSel ? lugarSel.value : "";
      const lugarCostoOpt = lugarSel
        ? lugarSel.options[lugarSel.selectedIndex]
        : null;
      const costoEnvio = lugarCostoOpt
        ? parseFloat(lugarCostoOpt.dataset.costo) || 0
        : 0;

      const notas = document.getElementById("notasPedido").value.trim();
      const diaEntrega = document.getElementById("diaEntrega")?.value || "";
      const horaEntrega = document.getElementById("horaEntrega")?.value || "";
      const cuponCodigo =
        document.getElementById("cuponCliente")?.value.trim() || "";
      // Resolver el cupón seleccionado -> obtener su % de descuento
      let cuponObjeto = null;
      let descuentoCupon = 0;
      if (cuponCodigo) {
        const selCupon = document.getElementById("cuponCliente");
        const optCupon = selCupon
          ? selCupon.options[selCupon.selectedIndex]
          : null;
        const descData = optCupon ? Number(optCupon.dataset.descuento) : 0;
        const proc = cuponesActivos.find((c) => c.codigo === cuponCodigo);
        cuponObjeto = proc || { codigo: cuponCodigo };
        descuentoCupon =
          (proc && Number(proc.descuento)) || descData || 0;
        descuentoCupon = Math.min(100, Math.max(0, descuentoCupon));
      }

      const telefonoValidado = validarTelefono(telefonoRaw);
      if (!telefonoValidado.valido) {
        mostrarMensaje(
          mensaje,
          "❌ Teléfono inválido. Debe tener 10 dígitos (ej: 8126878080)",
          "error",
        );
        return;
      }
      const telefono = telefonoValidado.telefono;

      if (!email) {
        mostrarMensaje(
          mensaje,
          "❌ El correo electrónico es obligatorio para confirmar tu pedido.",
          "error",
        );
        return;
      }

      if (!nombre || !telefono || !productoId || !metodoPago) {
        mostrarMensaje(
          mensaje,
          "❌ Completa todos los campos obligatorios",
          "error",
        );
        return;
      }

      const producto = productos.find((p) => p.id === productoId);
      if (!producto) {
        mostrarMensaje(mensaje, "❌ Producto no encontrado", "error");
        return;
      }

      if (producto.stock === 0) {
        mostrarModalAviso(
          "❌ Sin stock",
          `Lo sentimos, el producto "${producto.nombre}" agotó su mercancía. Te invitamos a elegir otro producto. 🙏`,
        );
        return;
      }

      if (!cantidad || cantidad < 1) {
        mostrarMensaje(
          mensaje,
          "❌ Indica la cantidad requerida.",
          "error",
        );
        return;
      }

      if (cantidad > producto.stock) {
        mostrarModalAviso(
          "❌ No hay stock suficiente",
          `Lo sentimos, solo tenemos ${producto.stock} unidades disponibles de "${producto.nombre}". Por favor reduce la cantidad. 🙏`,
        );
        return;
      }

      if (!lugarEntrega) {
        mostrarMensaje(
          mensaje,
          "❌ Selecciona tu lugar de entrega.",
          "error",
        );
        return;
      }

      if (!diaEntrega || !horaEntrega) {
        mostrarMensaje(
          mensaje,
          "❌ Selecciona tu día y horario de entrega.",
          "error",
        );
        return;
      }

      // Validación: un mismo cupón no puede usarse 2 veces con el mismo correo
      if (cuponCodigo && window.supabase) {
        try {
          const { data: usado, error: errUso } = await window.supabase
            .from("cupon_usos")
            .select("id")
            .eq("correo", email)
            .eq("cupon", cuponCodigo)
            .maybeSingle();
          if (!errUso && usado) {
            mostrarModalAviso(
              "🎟️ Cupón ya utilizado",
              `Lo sentimos, el cupón ${cuponCodigo} ya fue usado con el correo ${email}. Cada cupón solo puede usarse una vez por persona. 🙏`,
            );
            return;
          }
        } catch (e) {
          console.warn("⚠️ No se pudo validar el cupón por correo:", e.message);
        }
      }

      // Total = productos + costo de envío del lugar seleccionado
      const subtotalProductos = producto.precio * cantidad;
      const subtotal = subtotalProductos + costoEnvio;
      const descuentoMonto = subtotal * (descuentoCupon / 100);
      const total = subtotal - descuentoMonto;
      const numeroPedido = generarNumeroPedido();

      const pedido = {
        numero_pedido: numeroPedido,
        cliente_nombre: nombre,
        cliente_telefono: telefono,
        cliente_email: email,
        productos: [
          {
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad,
          },
        ],
        total: Math.round(total * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        costo_envio: costoEnvio,
        lugar_entrega: lugarEntrega,
        dia_entrega: diaEntrega || null,
        hora_entrega: horaEntrega || null,
        metodo_pago: metodoPago,
        direccion_entrega: direccion || null,
        notas: notas || null,
        cupon: cuponCodigo || null,
        descuento: descuentoCupon,
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

        // Registrar el uso del cupón (una vez por correo)
        if (cuponCodigo) {
          await window.supabase
            .from("cupon_usos")
            .insert([{ correo: email, cupon: cuponCodigo }]);
        }

        await enviarCorreoConfirmacion(
          pedido,
          numeroPedido,
          total,
          metodoPago,
          direccion,
        );

        const modal = document.getElementById("modalConfirmacionPedido");
        if (modal) {
          document.getElementById("modalNumeroPedido").textContent =
            numeroPedido;
          document.getElementById("modalNombreCliente").textContent = nombre;
          document.getElementById("modalTelefonoCliente").textContent =
            telefono;
          document.getElementById("modalEmailCliente").textContent = email;
          document.getElementById("modalDireccionCliente").textContent =
            direccion || "No especificada";
          document.getElementById("modalProductoInfo").textContent =
            `${producto.nombre} × ${cantidad}`;
          document.getElementById("modalLugarEntregaInfo").textContent =
            `${lugarEntrega} · Envío ${formatearMoneda(costoEnvio)}`;
          document.getElementById("modalDiaEntregaInfo").textContent =
            diaEntrega ? new Date(diaEntrega + "T00:00:00").toLocaleDateString("es-MX") : "—";
          document.getElementById("modalHoraEntregaInfo").textContent =
            horaEntrega || "—";
          document.getElementById("modalTotalInfo").textContent =
            formatearMoneda(total);
          document.getElementById("modalMetodoPagoInfo").textContent =
            "Transferencia";
          modal.style.display = "flex";
        }

        e.target.reset();
        const selectProductos = document.getElementById("productoSelect");
        if (selectProductos) selectProductos.value = "";
        cargarSelectProductos(productos);
        cargarCuponesActivos();
        poblarDiasEntrega();
        poblarHorariosEntrega();
      } catch (error) {
        console.error("Error:", error);
        mostrarMensaje(
          mensaje,
          "❌ Error al enviar el pedido: " + error.message,
          "error",
        );
      } finally {
        btn.disabled = false;
        btn.textContent = "📤 Enviar Pedido";
      }
    });
  }

  const cerrarModalBtn = document.getElementById("cerrarModalConfirmacion");
  if (cerrarModalBtn) {
    cerrarModalBtn.addEventListener("click", function () {
      const modal = document.getElementById("modalConfirmacionPedido");
      if (modal) modal.style.display = "none";
    });
  }

  const cerrarModalCancelacionBtn = document.getElementById(
    "cerrarModalCancelacion",
  );
  if (cerrarModalCancelacionBtn) {
    cerrarModalCancelacionBtn.addEventListener("click", function () {
      const modal = document.getElementById("modalCancelacionPedido");
      if (modal) modal.style.display = "none";
    });
  }
});

// Reiniciar carrusel cuando la pestaña vuelve a ser visible
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) {
    setTimeout(cargarCuponesDesdeDB, 100);
  }
});

