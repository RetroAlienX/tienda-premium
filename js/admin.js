// ============================================
// PANEL ADMIN - VERSIÓN CORREGIDA
// ============================================

let productoEditando = null;
let finanzaEditando = null;
let eliminarId = null;
let eliminarTipo = null;

// ============================================
// FUNCIÓN SEGURA PARA EVENTOS
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
  if (!el) {
    console.warn(`⚠️ Elemento no encontrado: #${id}`);
  }
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
// INICIALIZACIÓN
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("📦 Inicializando panel admin...");

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
  // TABS
  // ============================================
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const tab = this.dataset.tab;
      document
        .querySelectorAll(".tab-content")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll("[data-tab]")
        .forEach((b) => b.classList.remove("active"));
      const target = document.getElementById("tab-" + tab);
      if (target) target.classList.add("active");
      this.classList.add("active");
      if (tab === "productos") cargarProductos();
      if (tab === "inventario") cargarInventario();
      if (tab === "pedidos") cargarPedidos();
      if (tab === "finanzas") cargarFinanzas();
    });
  });

  // ============================================
  // PRODUCTOS
  // ============================================
  addEventListenerSafe("btnAgregarProducto", "click", () =>
    mostrarFormProducto()
  );
  addEventListenerSafe("btnCancelarProducto", "click", ocultarFormProducto);

  const formProducto = document.getElementById("formProducto");
  if (formProducto) {
    formProducto.addEventListener("submit", guardarProducto);
  }

  // ============================================
  // INVENTARIO
  // ============================================
  addEventListenerSafe("btnAgregarMovimiento", "click", () =>
    mostrarFormMovimiento()
  );
  addEventListenerSafe("btnCancelarMovimiento", "click", ocultarFormMovimiento);

  const formMovimiento = document.getElementById("formMovimiento");
  if (formMovimiento) {
    formMovimiento.addEventListener("submit", guardarMovimiento);
  }

  // ============================================
  // FINANZAS
  // ============================================
  addEventListenerSafe("btnAgregarFinanza", "click", () =>
    mostrarFormFinanza()
  );
  addEventListenerSafe("btnCancelarFinanza", "click", ocultarFormFinanza);

  const formFinanza = document.getElementById("formFinanza");
  if (formFinanza) {
    formFinanza.addEventListener("submit", guardarFinanza);
  }

  // ============================================
  // TICKET
  // ============================================
  const formTicket = document.getElementById("formTicket");
  if (formTicket) {
    formTicket.addEventListener("submit", generarTicketManual);
  }

  // ============================================
  // BÚSQUEDA POR CÓDIGO DE BARRAS
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
        console.warn("⚠️ cerrarSesion no está definida");
        window.location.href = "login.html";
      }
    });
  } else {
    console.warn("⚠️ Botón de logout no encontrado");
  }

  // ============================================
  // CARGAR DATOS INICIALES
  // ============================================
  cargarProductos();
  console.log("✅ Panel admin inicializado");
});

// ============================================
// 1. PRODUCTOS (CRUD)
// ============================================

async function cargarProductos() {
  const container = document.getElementById("listaProductos");
  if (!container) return;

  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

  try {
    const { data, error } = await window.supabase
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      container.innerHTML =
        '<p class="text-danger text-center">❌ Error al cargar</p>';
      return;
    }

    if (!data || !data.length) {
      container.innerHTML =
        '<p class="text-center text-secondary py-3">📦 No hay productos. Agrega uno!</p>';
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
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar productos</p>';
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

  const datos = {
    nombre: getValue("prodNombre").trim(),
    precio: parseFloat(getValue("prodPrecio")),
    categoria: getValue("prodCategoria"),
    stock: parseInt(getValue("prodStock")) || 0,
    descripcion: getValue("prodDescripcion").trim(),
    imagen_url: getValue("prodImagen").trim(),
    tienda_origen: getValue("prodTienda").trim(),
    codigo_barras: getValue("prodCodigoBarras").trim() || null,
  };

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

    const id = getValue("prodId");
    let result;
    if (id) {
      result = await window.supabase
        .from("productos")
        .update(datos)
        .eq("id", id);
    } else {
      result = await window.supabase.from("productos").insert([datos]);
    }
    if (result.error) throw result.error;

    if (msg) mostrarMensaje(msg, "✅ Producto guardado correctamente", "exito");
    ocultarFormProducto();
    cargarProductos();
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
// 2. BÚSQUEDA POR CÓDIGO DE BARRAS
// ============================================

async function buscarPorCodigoBarras() {
  const input = document.getElementById("inputCodigoBarras");
  const resultado = document.getElementById("resultadoBusquedaCodigo");
  if (!input || !resultado) return;

  const codigo = input.value.trim();
  if (!codigo) {
    resultado.innerHTML =
      '<span class="text-secondary">📷 Escanea un código de barras o escribe el número</span>';
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
      resultado.innerHTML = `<div class="alert alert-danger alert-sm mt-2">❌ Producto no encontrado con código: <strong>${codigo}</strong></div>`;
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
                    }')" class="btn btn-warning btn-sm">✏️ Editar</button>
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
    console.error("Error cargando productos:", error);
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
      btn.textContent = "Registrando...";
    }

    const { error } = await window.supabase.from("inventario").insert([
      {
        producto_id: productoId,
        tipo: tipo,
        cantidad: cantidad,
        descripcion: descripcion || null,
      },
    ]);

    if (error) throw error;

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

  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

  try {
    const { data, error } = await window.supabase
      .from("inventario")
      .select(`*, productos (nombre, precio, codigo_barras)`)
      .order("fecha", { ascending: false });

    if (error) {
      container.innerHTML =
        '<p class="text-danger text-center">❌ Error al cargar</p>';
      return;
    }

    const { data: productos } = await window.supabase
      .from("productos")
      .select("stock");
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
        '<p class="text-center text-secondary py-3">📊 No hay movimientos registrados</p>';
      return;
    }

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead><tr><th>Fecha</th><th>Producto</th><th>Código</th><th>Tipo</th><th>Cantidad</th><th>Descripción</th><th>Stock actual</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${data
                      .map(
                        (m) => `
                        <tr>
                            <td><small>${formatearFecha(m.fecha)}</small></td>
                            <td><strong>${
                              m.productos?.nombre || "Producto eliminado"
                            }</strong></td>
                            <td><code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;font-size:11px;color:#c9a84c;">${
                              m.productos?.codigo_barras || "-"
                            }</code></td>
                            <td><span class="${
                              m.tipo === "entrada"
                                ? "text-success"
                                : "text-danger"
                            }">${
                          m.tipo === "entrada" ? "📥 Entrada" : "📤 Salida"
                        }</span></td>
                            <td class="${
                              m.tipo === "entrada"
                                ? "text-success"
                                : "text-danger"
                            }">${m.tipo === "entrada" ? "+" : "-"} ${
                          m.cantidad
                        }</td>
                            <td><small>${m.descripcion || "-"}</small></td>
                            <td><span class="text-warning">${
                              m.productos?.stock || 0
                            }</span></td>
                            <td><button onclick="pedirEliminar('${
                              m.id
                            }','inventario')" class="btn btn-outline-danger btn-sm">🗑️</button></td>
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

  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

  try {
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
                <thead><tr><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${data
                      .map(
                        (p) => `
                        <tr>
                            <td><small>${formatearFecha(
                              p.fecha_pedido
                            )}</small></td>
                            <td><strong>${
                              p.cliente_nombre
                            }</strong><br><small class="text-secondary">${
                          p.cliente_telefono
                        }</small></td>
                            <td><small>${p.productos
                              .map((x) => `${x.nombre} x${x.cantidad}`)
                              .join("<br>")}</small></td>
                            <td><strong>${formatearMoneda(
                              p.total
                            )}</strong></td>
                            <td>
                                <select onchange="cambiarEstadoPedido('${
                                  p.id
                                }', this.value)" class="form-select form-select-sm bg-black text-white border-secondary" style="width:auto;">
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
                            <td>
                                <button onclick="generarTicketPedido('${
                                  p.id
                                }')" class="btn btn-warning btn-sm">🧾</button>
                                <button onclick="verDetallePedido('${
                                  p.id
                                }')" class="btn btn-outline-secondary btn-sm">📋</button>
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
          `• ${p.nombre} x${p.cantidad} = ${formatearMoneda(
            p.precio * p.cantidad
          )}`
      )
      .join("\n");
    alert(
      `📋 DETALLE DEL PEDIDO\n\n👤 Cliente: ${
        data.cliente_nombre
      }\n📱 Teléfono: ${data.cliente_telefono}\n${
        data.cliente_email ? `📧 Email: ${data.cliente_email}\n` : ""
      }\n📦 Productos:\n${productos}\n\n💰 Total: ${formatearMoneda(
        data.total
      )}\n💳 Pago: ${
        data.metodo_pago === "transferencia" ? "Transferencia" : "Efectivo"
      }\n${
        data.direccion_entrega
          ? `📍 Dirección: ${data.direccion_entrega}\n`
          : ""
      }${
        data.notas ? `📝 Notas: ${data.notas}\n` : ""
      }📌 Estado: ${data.estado.toUpperCase()}`
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
        '<p class="text-center text-secondary py-3">💰 No hay movimientos registrados</p>';
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
// 6. TICKET MANUAL
// ============================================

function generarTicketManual(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeTicket");

  const cliente = getValue("ticketCliente").trim();
  const telefono = getValue("ticketTelefono").trim();
  const direccion = getValue("ticketDireccion").trim();
  const productosText = getValue("ticketProductos").trim();
  const metodoPago = getValue("ticketMetodoPago");
  const envio = parseFloat(getValue("ticketEnvio")) || 0;

  if (!cliente || !telefono || !productosText) {
    if (msg)
      mostrarMensaje(msg, "❌ Completa los campos obligatorios", "error");
    return;
  }

  const items = productosText
    .split("\n")
    .filter((l) => l.trim())
    .map((line) => {
      const m = line.match(/^(.+?)\s*-\s*\$?([\d.]+)(?:\s*x\s*(\d+))?$/);
      if (!m) return null;
      return {
        nombre: m[1].trim(),
        precio: parseFloat(m[2]),
        cantidad: parseInt(m[3]) || 1,
      };
    })
    .filter((i) => i);

  if (!items.length) {
    if (msg)
      mostrarMensaje(
        msg,
        "❌ Formato inválido. Usa: Producto - $100 x2",
        "error"
      );
    return;
  }

  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const total = subtotal + envio;

  const datosTicket = {
    cliente,
    telefono,
    direccion,
    metodo_pago: metodoPago === "transferencia" ? "Transferencia" : "Efectivo",
    items,
    subtotal,
    envio,
    total,
    fecha: new Date().toISOString(),
  };

  window.open(
    `ticket.html?pedido=${encodeURIComponent(JSON.stringify(datosTicket))}`,
    "_blank",
    "width=400,height=700"
  );
  if (msg) mostrarMensaje(msg, "✅ Ticket generado", "exito");
}

// ============================================
// 7. ELIMINAR (MODAL)
// ============================================

function pedirEliminar(id, tipo) {
  eliminarId = id;
  eliminarTipo = tipo;
  const mensajes = {
    producto: "¿Eliminar este producto permanentemente?",
    inventario: "¿Eliminar este movimiento de inventario?",
    finanza: "¿Eliminar este registro financiero?",
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
// 8. FUNCIONES UTILES (FALLBACK)
// ============================================

// Si no existen, definir funciones de utilidad
if (typeof mostrarMensaje === "undefined") {
  window.mostrarMensaje = function (el, msg, tipo) {
    if (!el) return;
    el.textContent = msg;
    el.className = "mensaje-" + tipo;
    if (tipo === "exito") {
      setTimeout(() => {
        el.textContent = "";
        el.className = "";
      }, 5000);
    }
  };
}

if (typeof formatearMoneda === "undefined") {
  window.formatearMoneda = function (cantidad) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(cantidad);
  };
}

if (typeof formatearFecha === "undefined") {
  window.formatearFecha = function (fecha) {
    return new Date(fecha).toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
}
