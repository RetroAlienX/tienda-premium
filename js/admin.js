// ============================================
// PANEL ADMIN - COMPLETO CON CÓDIGO DE BARRAS
// ============================================

let productoEditando = null;
let finanzaEditando = null;
let eliminarId = null;
let eliminarTipo = null;

document.addEventListener("DOMContentLoaded", function () {
  verificarSesion();

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const tab = this.dataset.tab;
      document
        .querySelectorAll(".tab-content")
        .forEach((t) => (t.style.display = "none"));
      document
        .querySelectorAll("[data-tab]")
        .forEach((b) => b.classList.remove("active"));
      document.getElementById("tab-" + tab).style.display = "block";
      this.classList.add("active");

      if (tab === "productos") cargarProductos();
      if (tab === "inventario") cargarInventario();
      if (tab === "pedidos") cargarPedidos();
      if (tab === "finanzas") cargarFinanzas();
    });
  });

  document
    .getElementById("btnAgregarProducto")
    .addEventListener("click", () => mostrarFormProducto());
  document
    .getElementById("btnCancelarProducto")
    .addEventListener("click", ocultarFormProducto);
  document
    .getElementById("formProducto")
    .addEventListener("submit", guardarProducto);

  document
    .getElementById("btnAgregarMovimiento")
    .addEventListener("click", () => mostrarFormMovimiento());
  document
    .getElementById("btnCancelarMovimiento")
    .addEventListener("click", ocultarFormMovimiento);
  document
    .getElementById("formMovimiento")
    .addEventListener("submit", guardarMovimiento);

  document
    .getElementById("btnAgregarFinanza")
    .addEventListener("click", () => mostrarFormFinanza());
  document
    .getElementById("btnCancelarFinanza")
    .addEventListener("click", ocultarFormFinanza);
  document
    .getElementById("formFinanza")
    .addEventListener("submit", guardarFinanza);

  document
    .getElementById("formTicket")
    .addEventListener("submit", generarTicketManual);

  document
    .getElementById("btnBuscarCodigo")
    .addEventListener("click", buscarPorCodigoBarras);
  document
    .getElementById("inputCodigoBarras")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        buscarPorCodigoBarras();
      }
    });

  document.querySelectorAll(".filtro-pedido").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".filtro-pedido")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      cargarPedidos(this.dataset.estado);
    });
  });

  document
    .getElementById("modalCancelar")
    .addEventListener("click", cerrarModal);
  document
    .getElementById("modalConfirmar")
    .addEventListener("click", confirmarEliminar);

  cargarProductos();
});

// ============================================
// 1. PRODUCTOS
// ============================================

async function cargarProductos() {
  const container = document.getElementById("listaProductos");
  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar</p>';
    return;
  }

  if (!data.length) {
    container.innerHTML =
      '<p class="text-center text-secondary py-3">📦 No hay productos. Agrega uno!</p>';
    return;
  }

  container.innerHTML = `
        <table class="table table-dark table-hover table-sm">
            <thead>
                <tr>
                    <th>Imagen</th>
                    <th>Producto</th>
                    <th>Código de barras</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (p) => `
                    <tr>
                        <td>
                            <img src="${
                              p.imagen_url ||
                              "https://via.placeholder.com/40/1a1a1a/666?text=No"
                            }" 
                                 style="width:40px;height:40px;object-fit:cover;border-radius:4px;"
                                 onerror="this.src='https://via.placeholder.com/40/1a1a1a/666?text=Error'">
                        </td>
                        <td>
                            <strong>${p.nombre}</strong>
                            <br><small class="text-secondary">${
                              p.descripcion || ""
                            }</small>
                        </td>
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
}

function mostrarFormProducto(data = null) {
  const container = document.getElementById("formProductoContainer");
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });

  if (data) {
    productoEditando = data;
    document.getElementById("formProductoTitulo").textContent =
      "✏️ Editar Producto";
    document.querySelector('#formProducto button[type="submit"]').textContent =
      "💾 Actualizar";
    document.getElementById("prodId").value = data.id;
    document.getElementById("prodNombre").value = data.nombre;
    document.getElementById("prodPrecio").value = data.precio;
    document.getElementById("prodCategoria").value = data.categoria || "otros";
    document.getElementById("prodStock").value = data.stock || 0;
    document.getElementById("prodDescripcion").value = data.descripcion || "";
    document.getElementById("prodImagen").value = data.imagen_url || "";
    document.getElementById("prodTienda").value = data.tienda_origen || "";
    document.getElementById("prodCodigoBarras").value =
      data.codigo_barras || "";
  } else {
    productoEditando = null;
    document.getElementById("formProductoTitulo").textContent =
      "➕ Agregar Producto";
    document.querySelector('#formProducto button[type="submit"]').textContent =
      "💾 Guardar";
    document.getElementById("formProducto").reset();
    document.getElementById("prodId").value = "";
  }
}

function ocultarFormProducto() {
  document.getElementById("formProductoContainer").style.display = "none";
  productoEditando = null;
}

async function editarProducto(id) {
  const { data } = await supabase
    .from("productos")
    .select("*")
    .eq("id", id)
    .single();
  if (data) mostrarFormProducto(data);
}

async function guardarProducto(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeProducto");
  const btn = e.target.querySelector('button[type="submit"]');

  const datos = {
    nombre: document.getElementById("prodNombre").value.trim(),
    precio: parseFloat(document.getElementById("prodPrecio").value),
    categoria: document.getElementById("prodCategoria").value,
    stock: parseInt(document.getElementById("prodStock").value) || 0,
    descripcion: document.getElementById("prodDescripcion").value.trim(),
    imagen_url: document.getElementById("prodImagen").value.trim(),
    tienda_origen: document.getElementById("prodTienda").value.trim(),
    codigo_barras:
      document.getElementById("prodCodigoBarras").value.trim() || null,
  };

  if (!datos.nombre || !datos.precio) {
    return mostrarMensaje(msg, "❌ Nombre y precio son obligatorios", "error");
  }

  try {
    btn.disabled = true;
    btn.textContent = "Guardando...";

    const id = document.getElementById("prodId").value;
    let result;

    if (id) {
      result = await supabase.from("productos").update(datos).eq("id", id);
    } else {
      result = await supabase.from("productos").insert([datos]);
    }

    if (result.error) throw result.error;

    mostrarMensaje(msg, "✅ Producto guardado correctamente", "exito");
    ocultarFormProducto();
    cargarProductos();

    if (typeof cargarProductosCatalogo === "function")
      cargarProductosCatalogo();
  } catch (error) {
    mostrarMensaje(msg, "❌ " + error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = id ? "💾 Actualizar" : "💾 Guardar";
  }
}

// ============================================
// 1.1 BÚSQUEDA POR CÓDIGO DE BARRAS
// ============================================

async function buscarPorCodigoBarras() {
  const input = document.getElementById("inputCodigoBarras");
  const resultado = document.getElementById("resultadoBusquedaCodigo");
  const codigo = input.value.trim();

  if (!codigo) {
    resultado.innerHTML =
      '<span class="text-secondary">📷 Escanea un código de barras o escribe el número</span>';
    return;
  }

  resultado.innerHTML = '<span class="text-secondary">Buscando...</span>';

  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("codigo_barras", codigo)
    .single();

  if (error || !data) {
    resultado.innerHTML = `
            <div class="alert alert-danger alert-sm mt-2">
                ❌ Producto no encontrado con código: <strong>${codigo}</strong>
            </div>
        `;
    input.value = "";
    return;
  }

  resultado.innerHTML = `
        <div class="alert alert-success alert-sm mt-2">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>✅ Encontrado:</strong> ${data.nombre}
                    <br><small class="text-secondary">Precio: ${formatearMoneda(
                      data.precio
                    )} | Stock: ${data.stock}</small>
                </div>
                <button onclick="editarProducto('${
                  data.id
                }')" class="btn btn-warning btn-sm">✏️ Editar</button>
            </div>
        </div>
    `;
  input.value = "";
}

// ============================================
// 2. INVENTARIO
// ============================================

async function cargarInventario() {
  const container = document.getElementById("listaInventario");
  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

  const { data, error } = await supabase
    .from("inventario")
    .select(
      `
            *,
            productos (nombre, precio, codigo_barras)
        `
    )
    .order("fecha", { ascending: false });

  if (error) {
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar</p>';
    return;
  }

  const { data: productos } = await supabase.from("productos").select("stock");

  const conStock = productos?.filter((p) => p.stock > 0).length || 0;
  const sinStock = productos?.filter((p) => p.stock === 0).length || 0;

  document.getElementById("totalProductosStock").textContent = conStock;
  document.getElementById("totalSinStock").textContent = sinStock;
  document.getElementById("totalMovimientos").textContent = data?.length || 0;

  cargarSelectProductosInventario();

  if (!data || !data.length) {
    container.innerHTML =
      '<p class="text-center text-secondary py-3">📊 No hay movimientos registrados</p>';
    return;
  }

  container.innerHTML = `
        <table class="table table-dark table-hover table-sm">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
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
                          m.tipo === "entrada" ? "text-success" : "text-danger"
                        }">
                            ${m.tipo === "entrada" ? "+" : "-"} ${m.cantidad}
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
}

async function cargarSelectProductosInventario() {
  const sel = document.getElementById("movProducto");
  if (!sel) return;

  const { data } = await supabase
    .from("productos")
    .select("id, nombre, stock, codigo_barras")
    .order("nombre");

  sel.innerHTML = '<option value="">Selecciona un producto...</option>';
  data?.forEach((p) => {
    const codigo = p.codigo_barras ? ` [${p.codigo_barras}]` : "";
    sel.innerHTML += `<option value="${p.id}">${p.nombre}${codigo} (Stock: ${p.stock})</option>`;
  });
}

function mostrarFormMovimiento() {
  const container = document.getElementById("formMovimientoContainer");
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
  cargarSelectProductosInventario();
}

function ocultarFormMovimiento() {
  document.getElementById("formMovimientoContainer").style.display = "none";
  document.getElementById("formMovimiento").reset();
}

async function guardarMovimiento(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeMovimiento");
  const btn = e.target.querySelector('button[type="submit"]');

  const productoId = document.getElementById("movProducto").value;
  const tipo = document.getElementById("movTipo").value;
  const cantidad = parseInt(document.getElementById("movCantidad").value);
  const descripcion = document.getElementById("movDescripcion").value.trim();

  if (!productoId || !cantidad) {
    return mostrarMensaje(
      msg,
      "❌ Producto y cantidad son obligatorios",
      "error"
    );
  }

  try {
    btn.disabled = true;
    btn.textContent = "Registrando...";

    const { error } = await supabase.from("inventario").insert([
      {
        producto_id: productoId,
        tipo: tipo,
        cantidad: cantidad,
        descripcion: descripcion || null,
      },
    ]);

    if (error) throw error;

    mostrarMensaje(msg, "✅ Movimiento registrado correctamente", "exito");
    ocultarFormMovimiento();
    cargarInventario();
    cargarProductos();
  } catch (error) {
    mostrarMensaje(msg, "❌ " + error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Registrar";
  }
}

// ============================================
// 3. PEDIDOS
// ============================================

async function cargarPedidos(estado = "todos") {
  const container = document.getElementById("listaPedidos");
  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

  let query = supabase
    .from("pedidos")
    .select("*")
    .order("fecha_pedido", { ascending: false });

  if (estado !== "todos") {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;

  if (error) {
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar</p>';
    return;
  }

  document.getElementById("totalPedidos").textContent = data?.length || 0;

  if (!data || !data.length) {
    container.innerHTML =
      '<p class="text-center text-secondary py-3">📋 No hay pedidos</p>';
    return;
  }

  container.innerHTML = `
        <table class="table table-dark table-hover table-sm">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (p) => `
                    <tr>
                        <td>
                            <small>${formatearFecha(p.fecha_pedido)}</small>
                        </td>
                        <td>
                            <strong>${p.cliente_nombre}</strong>
                            <br><small class="text-secondary">${
                              p.cliente_telefono
                            }</small>
                        </td>
                        <td>
                            <small>${p.productos
                              .map((x) => `${x.nombre} x${x.cantidad}`)
                              .join("<br>")}</small>
                        </td>
                        <td><strong>${formatearMoneda(p.total)}</strong></td>
                        <td>
                            <select onchange="cambiarEstadoPedido('${
                              p.id
                            }', this.value)" 
                                    class="form-select form-select-sm bg-black text-white border-secondary" 
                                    style="width:auto;">
                                <option value="pendiente" ${
                                  p.estado === "pendiente" ? "selected" : ""
                                }>📋 Pendiente</option>
                                <option value="confirmado" ${
                                  p.estado === "confirmado" ? "selected" : ""
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
}

async function cambiarEstadoPedido(id, estado) {
  const { error } = await supabase
    .from("pedidos")
    .update({ estado })
    .eq("id", id);

  if (!error) {
    cargarPedidos(
      document.querySelector(".filtro-pedido.active")?.dataset?.estado ||
        "todos"
    );
  }
}

async function verDetallePedido(id) {
  const { data } = await supabase
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
    `📋 DETALLE DEL PEDIDO\n\n` +
      `👤 Cliente: ${data.cliente_nombre}\n` +
      `📱 Teléfono: ${data.cliente_telefono}\n` +
      `${data.cliente_email ? `📧 Email: ${data.cliente_email}\n` : ""}` +
      `\n📦 Productos:\n${productos}\n` +
      `\n💰 Total: ${formatearMoneda(data.total)}\n` +
      `💳 Pago: ${
        data.metodo_pago === "transferencia" ? "Transferencia" : "Efectivo"
      }\n` +
      `${
        data.direccion_entrega
          ? `📍 Dirección: ${data.direccion_entrega}\n`
          : ""
      }` +
      `${data.notas ? `📝 Notas: ${data.notas}\n` : ""}` +
      `📌 Estado: ${data.estado.toUpperCase()}`
  );
}

async function generarTicketPedido(id) {
  const { data } = await supabase
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
}

// ============================================
// 4. FINANZAS
// ============================================

async function cargarFinanzas() {
  const container = document.getElementById("listaFinanzas");
  container.innerHTML =
    '<div class="text-center text-secondary py-3">Cargando...</div>';

  const { data, error } = await supabase
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

  document.getElementById("totalIngresos").textContent =
    formatearMoneda(ingresos);
  document.getElementById("totalGastos").textContent = formatearMoneda(gastos);
  const gananciaEl = document.getElementById("gananciaNeta");
  gananciaEl.textContent = formatearMoneda(ganancia);
  gananciaEl.style.color = ganancia >= 0 ? "#28a745" : "#dc3545";

  container.innerHTML = `
        <table class="table table-dark table-hover table-sm">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (f) => `
                    <tr>
                        <td><small>${formatearFecha(f.fecha)}</small></td>
                        <td>
                            <span class="${
                              f.tipo === "ingreso"
                                ? "text-success"
                                : "text-danger"
                            }">
                                ${
                                  f.tipo === "ingreso"
                                    ? "📈 Ingreso"
                                    : "📉 Gasto"
                                }
                            </span>
                        </td>
                        <td><small>${
                          f.categoria ? f.categoria.replace("_", " ") : "otros"
                        }</small></td>
                        <td>${f.descripcion}</td>
                        <td class="${
                          f.tipo === "ingreso" ? "text-success" : "text-danger"
                        }">
                            ${
                              f.tipo === "ingreso" ? "+" : "-"
                            } ${formatearMoneda(f.monto)}
                        </td>
                        <td>
                            <button onclick="pedirEliminar('${
                              f.id
                            }','finanza')" class="btn btn-outline-danger btn-sm">🗑️</button>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;
}

function mostrarFormFinanza(data = null) {
  const container = document.getElementById("formFinanzaContainer");
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });

  if (data) {
    finanzaEditando = data;
    document.getElementById("finId").value = data.id;
    document.getElementById("finTipo").value = data.tipo;
    document.getElementById("finCategoria").value = data.categoria || "otros";
    document.getElementById("finDescripcion").value = data.descripcion;
    document.getElementById("finMonto").value = data.monto;
    document.querySelector('#formFinanza button[type="submit"]').textContent =
      "💾 Actualizar";
  } else {
    finanzaEditando = null;
    document.getElementById("formFinanza").reset();
    document.getElementById("finId").value = "";
    document.querySelector('#formFinanza button[type="submit"]').textContent =
      "💾 Guardar";
  }
}

function ocultarFormFinanza() {
  document.getElementById("formFinanzaContainer").style.display = "none";
  finanzaEditando = null;
}

async function guardarFinanza(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeFinanza");
  const btn = e.target.querySelector('button[type="submit"]');

  const datos = {
    tipo: document.getElementById("finTipo").value,
    categoria: document.getElementById("finCategoria").value,
    descripcion: document.getElementById("finDescripcion").value.trim(),
    monto: parseFloat(document.getElementById("finMonto").value),
  };

  if (!datos.descripcion || !datos.monto) {
    return mostrarMensaje(msg, "❌ Completa todos los campos", "error");
  }

  try {
    btn.disabled = true;
    btn.textContent = "Guardando...";

    const id = document.getElementById("finId").value;
    let result;

    if (id) {
      result = await supabase.from("finanzas").update(datos).eq("id", id);
    } else {
      result = await supabase.from("finanzas").insert([datos]);
    }

    if (result.error) throw result.error;

    mostrarMensaje(msg, "✅ Movimiento registrado", "exito");
    ocultarFormFinanza();
    cargarFinanzas();
  } catch (error) {
    mostrarMensaje(msg, "❌ " + error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = id ? "💾 Actualizar" : "💾 Guardar";
  }
}

// ============================================
// 5. TICKET MANUAL
// ============================================

function generarTicketManual(e) {
  e.preventDefault();
  const msg = document.getElementById("mensajeTicket");

  const cliente = document.getElementById("ticketCliente").value.trim();
  const telefono = document.getElementById("ticketTelefono").value.trim();
  const direccion = document.getElementById("ticketDireccion").value.trim();
  const productosText = document.getElementById("ticketProductos").value.trim();
  const metodoPago = document.getElementById("ticketMetodoPago").value;
  const envio = parseFloat(document.getElementById("ticketEnvio").value) || 0;

  if (!cliente || !telefono || !productosText) {
    return mostrarMensaje(msg, "❌ Completa los campos obligatorios", "error");
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
    return mostrarMensaje(
      msg,
      "❌ Formato inválido. Usa: Producto - $100 x2",
      "error"
    );
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
  mostrarMensaje(msg, "✅ Ticket generado", "exito");
}

// ============================================
// 6. ELIMINAR (MODAL)
// ============================================

function pedirEliminar(id, tipo) {
  eliminarId = id;
  eliminarTipo = tipo;

  const mensajes = {
    producto: "¿Eliminar este producto permanentemente?",
    inventario: "¿Eliminar este movimiento de inventario?",
    finanza: "¿Eliminar este registro financiero?",
  };

  document.getElementById("modalMensaje").textContent =
    mensajes[tipo] || "¿Eliminar este elemento?";

  const modal = new bootstrap.Modal(document.getElementById("modalConfirm"));
  modal.show();
}

async function confirmarEliminar() {
  if (!eliminarId) return;

  try {
    let result;

    if (eliminarTipo === "producto") {
      result = await supabase.from("productos").delete().eq("id", eliminarId);
    } else if (eliminarTipo === "inventario") {
      result = await supabase.from("inventario").delete().eq("id", eliminarId);
    } else if (eliminarTipo === "finanza") {
      result = await supabase.from("finanzas").delete().eq("id", eliminarId);
    }

    if (result.error) throw result.error;

    cerrarModal();

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
    alert("❌ Error: " + error.message);
  }
}

function cerrarModal() {
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalConfirm")
  );
  if (modal) modal.hide();
  eliminarId = null;
  eliminarTipo = null;
  // ============================================
  // PANEL ADMIN - COMPLETO CON CÓDIGO DE BARRAS
  // ============================================

  let productoEditando = null;
  let finanzaEditando = null;
  let eliminarId = null;
  let eliminarTipo = null;

  document.addEventListener("DOMContentLoaded", function () {
    verificarSesion();

    document.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", function () {
        const tab = this.dataset.tab;
        document
          .querySelectorAll(".tab-content")
          .forEach((t) => (t.style.display = "none"));
        document
          .querySelectorAll("[data-tab]")
          .forEach((b) => b.classList.remove("active"));
        document.getElementById("tab-" + tab).style.display = "block";
        this.classList.add("active");

        if (tab === "productos") cargarProductos();
        if (tab === "inventario") cargarInventario();
        if (tab === "pedidos") cargarPedidos();
        if (tab === "finanzas") cargarFinanzas();
      });
    });

    document
      .getElementById("btnAgregarProducto")
      .addEventListener("click", () => mostrarFormProducto());
    document
      .getElementById("btnCancelarProducto")
      .addEventListener("click", ocultarFormProducto);
    document
      .getElementById("formProducto")
      .addEventListener("submit", guardarProducto);

    document
      .getElementById("btnAgregarMovimiento")
      .addEventListener("click", () => mostrarFormMovimiento());
    document
      .getElementById("btnCancelarMovimiento")
      .addEventListener("click", ocultarFormMovimiento);
    document
      .getElementById("formMovimiento")
      .addEventListener("submit", guardarMovimiento);

    document
      .getElementById("btnAgregarFinanza")
      .addEventListener("click", () => mostrarFormFinanza());
    document
      .getElementById("btnCancelarFinanza")
      .addEventListener("click", ocultarFormFinanza);
    document
      .getElementById("formFinanza")
      .addEventListener("submit", guardarFinanza);

    document
      .getElementById("formTicket")
      .addEventListener("submit", generarTicketManual);

    document
      .getElementById("btnBuscarCodigo")
      .addEventListener("click", buscarPorCodigoBarras);
    document
      .getElementById("inputCodigoBarras")
      .addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          buscarPorCodigoBarras();
        }
      });

    document.querySelectorAll(".filtro-pedido").forEach((btn) => {
      btn.addEventListener("click", function () {
        document
          .querySelectorAll(".filtro-pedido")
          .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        cargarPedidos(this.dataset.estado);
      });
    });

    document
      .getElementById("modalCancelar")
      .addEventListener("click", cerrarModal);
    document
      .getElementById("modalConfirmar")
      .addEventListener("click", confirmarEliminar);

    cargarProductos();
  });

  // ============================================
  // 1. PRODUCTOS
  // ============================================

  async function cargarProductos() {
    const container = document.getElementById("listaProductos");
    container.innerHTML =
      '<div class="text-center text-secondary py-3">Cargando...</div>';

    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      container.innerHTML =
        '<p class="text-danger text-center">❌ Error al cargar</p>';
      return;
    }

    if (!data.length) {
      container.innerHTML =
        '<p class="text-center text-secondary py-3">📦 No hay productos. Agrega uno!</p>';
      return;
    }

    container.innerHTML = `
        <table class="table table-dark table-hover table-sm">
            <thead>
                <tr>
                    <th>Imagen</th>
                    <th>Producto</th>
                    <th>Código de barras</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (p) => `
                    <tr>
                        <td>
                            <img src="${
                              p.imagen_url ||
                              "https://via.placeholder.com/40/1a1a1a/666?text=No"
                            }" 
                                 style="width:40px;height:40px;object-fit:cover;border-radius:4px;"
                                 onerror="this.src='https://via.placeholder.com/40/1a1a1a/666?text=Error'">
                        </td>
                        <td>
                            <strong>${p.nombre}</strong>
                            <br><small class="text-secondary">${
                              p.descripcion || ""
                            }</small>
                        </td>
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
  }

  function mostrarFormProducto(data = null) {
    const container = document.getElementById("formProductoContainer");
    container.style.display = "block";
    container.scrollIntoView({ behavior: "smooth" });

    if (data) {
      productoEditando = data;
      document.getElementById("formProductoTitulo").textContent =
        "✏️ Editar Producto";
      document.querySelector(
        '#formProducto button[type="submit"]'
      ).textContent = "💾 Actualizar";
      document.getElementById("prodId").value = data.id;
      document.getElementById("prodNombre").value = data.nombre;
      document.getElementById("prodPrecio").value = data.precio;
      document.getElementById("prodCategoria").value =
        data.categoria || "otros";
      document.getElementById("prodStock").value = data.stock || 0;
      document.getElementById("prodDescripcion").value = data.descripcion || "";
      document.getElementById("prodImagen").value = data.imagen_url || "";
      document.getElementById("prodTienda").value = data.tienda_origen || "";
      document.getElementById("prodCodigoBarras").value =
        data.codigo_barras || "";
    } else {
      productoEditando = null;
      document.getElementById("formProductoTitulo").textContent =
        "➕ Agregar Producto";
      document.querySelector(
        '#formProducto button[type="submit"]'
      ).textContent = "💾 Guardar";
      document.getElementById("formProducto").reset();
      document.getElementById("prodId").value = "";
    }
  }

  function ocultarFormProducto() {
    document.getElementById("formProductoContainer").style.display = "none";
    productoEditando = null;
  }

  async function editarProducto(id) {
    const { data } = await supabase
      .from("productos")
      .select("*")
      .eq("id", id)
      .single();
    if (data) mostrarFormProducto(data);
  }

  async function guardarProducto(e) {
    e.preventDefault();
    const msg = document.getElementById("mensajeProducto");
    const btn = e.target.querySelector('button[type="submit"]');

    const datos = {
      nombre: document.getElementById("prodNombre").value.trim(),
      precio: parseFloat(document.getElementById("prodPrecio").value),
      categoria: document.getElementById("prodCategoria").value,
      stock: parseInt(document.getElementById("prodStock").value) || 0,
      descripcion: document.getElementById("prodDescripcion").value.trim(),
      imagen_url: document.getElementById("prodImagen").value.trim(),
      tienda_origen: document.getElementById("prodTienda").value.trim(),
      codigo_barras:
        document.getElementById("prodCodigoBarras").value.trim() || null,
    };

    if (!datos.nombre || !datos.precio) {
      return mostrarMensaje(
        msg,
        "❌ Nombre y precio son obligatorios",
        "error"
      );
    }

    try {
      btn.disabled = true;
      btn.textContent = "Guardando...";

      const id = document.getElementById("prodId").value;
      let result;

      if (id) {
        result = await supabase.from("productos").update(datos).eq("id", id);
      } else {
        result = await supabase.from("productos").insert([datos]);
      }

      if (result.error) throw result.error;

      mostrarMensaje(msg, "✅ Producto guardado correctamente", "exito");
      ocultarFormProducto();
      cargarProductos();

      if (typeof cargarProductosCatalogo === "function")
        cargarProductosCatalogo();
    } catch (error) {
      mostrarMensaje(msg, "❌ " + error.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = id ? "💾 Actualizar" : "💾 Guardar";
    }
  }

  // ============================================
  // 1.1 BÚSQUEDA POR CÓDIGO DE BARRAS
  // ============================================

  async function buscarPorCodigoBarras() {
    const input = document.getElementById("inputCodigoBarras");
    const resultado = document.getElementById("resultadoBusquedaCodigo");
    const codigo = input.value.trim();

    if (!codigo) {
      resultado.innerHTML =
        '<span class="text-secondary">📷 Escanea un código de barras o escribe el número</span>';
      return;
    }

    resultado.innerHTML = '<span class="text-secondary">Buscando...</span>';

    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("codigo_barras", codigo)
      .single();

    if (error || !data) {
      resultado.innerHTML = `
            <div class="alert alert-danger alert-sm mt-2">
                ❌ Producto no encontrado con código: <strong>${codigo}</strong>
            </div>
        `;
      input.value = "";
      return;
    }

    resultado.innerHTML = `
        <div class="alert alert-success alert-sm mt-2">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>✅ Encontrado:</strong> ${data.nombre}
                    <br><small class="text-secondary">Precio: ${formatearMoneda(
                      data.precio
                    )} | Stock: ${data.stock}</small>
                </div>
                <button onclick="editarProducto('${
                  data.id
                }')" class="btn btn-warning btn-sm">✏️ Editar</button>
            </div>
        </div>
    `;
    input.value = "";
  }

  // ============================================
  // 2. INVENTARIO
  // ============================================

  async function cargarInventario() {
    const container = document.getElementById("listaInventario");
    container.innerHTML =
      '<div class="text-center text-secondary py-3">Cargando...</div>';

    const { data, error } = await supabase
      .from("inventario")
      .select(
        `
            *,
            productos (nombre, precio, codigo_barras)
        `
      )
      .order("fecha", { ascending: false });

    if (error) {
      container.innerHTML =
        '<p class="text-danger text-center">❌ Error al cargar</p>';
      return;
    }

    const { data: productos } = await supabase
      .from("productos")
      .select("stock");

    const conStock = productos?.filter((p) => p.stock > 0).length || 0;
    const sinStock = productos?.filter((p) => p.stock === 0).length || 0;

    document.getElementById("totalProductosStock").textContent = conStock;
    document.getElementById("totalSinStock").textContent = sinStock;
    document.getElementById("totalMovimientos").textContent = data?.length || 0;

    cargarSelectProductosInventario();

    if (!data || !data.length) {
      container.innerHTML =
        '<p class="text-center text-secondary py-3">📊 No hay movimientos registrados</p>';
      return;
    }

    container.innerHTML = `
        <table class="table table-dark table-hover table-sm">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
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
                          m.tipo === "entrada" ? "text-success" : "text-danger"
                        }">
                            ${m.tipo === "entrada" ? "+" : "-"} ${m.cantidad}
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
  }

  async function cargarSelectProductosInventario() {
    const sel = document.getElementById("movProducto");
    if (!sel) return;

    const { data } = await supabase
      .from("productos")
      .select("id, nombre, stock, codigo_barras")
      .order("nombre");

    sel.innerHTML = '<option value="">Selecciona un producto...</option>';
    data?.forEach((p) => {
      const codigo = p.codigo_barras ? ` [${p.codigo_barras}]` : "";
      sel.innerHTML += `<option value="${p.id}">${p.nombre}${codigo} (Stock: ${p.stock})</option>`;
    });
  }

  function mostrarFormMovimiento() {
    const container = document.getElementById("formMovimientoContainer");
    container.style.display = "block";
    container.scrollIntoView({ behavior: "smooth" });
    cargarSelectProductosInventario();
  }

  function ocultarFormMovimiento() {
    document.getElementById("formMovimientoContainer").style.display = "none";
    document.getElementById("formMovimiento").reset();
  }

  async function guardarMovimiento(e) {
    e.preventDefault();
    const msg = document.getElementById("mensajeMovimiento");
    const btn = e.target.querySelector('button[type="submit"]');

    const productoId = document.getElementById("movProducto").value;
    const tipo = document.getElementById("movTipo").value;
    const cantidad = parseInt(document.getElementById("movCantidad").value);
    const descripcion = document.getElementById("movDescripcion").value.trim();

    if (!productoId || !cantidad) {
      return mostrarMensaje(
        msg,
        "❌ Producto y cantidad son obligatorios",
        "error"
      );
    }

    try {
      btn.disabled = true;
      btn.textContent = "Registrando...";

      const { error } = await supabase.from("inventario").insert([
        {
          producto_id: productoId,
          tipo: tipo,
          cantidad: cantidad,
          descripcion: descripcion || null,
        },
      ]);

      if (error) throw error;

      mostrarMensaje(msg, "✅ Movimiento registrado correctamente", "exito");
      ocultarFormMovimiento();
      cargarInventario();
      cargarProductos();
    } catch (error) {
      mostrarMensaje(msg, "❌ " + error.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "💾 Registrar";
    }
  }

  // ============================================
  // 3. PEDIDOS
  // ============================================

  async function cargarPedidos(estado = "todos") {
    const container = document.getElementById("listaPedidos");
    container.innerHTML =
      '<div class="text-center text-secondary py-3">Cargando...</div>';

    let query = supabase
      .from("pedidos")
      .select("*")
      .order("fecha_pedido", { ascending: false });

    if (estado !== "todos") {
      query = query.eq("estado", estado);
    }

    const { data, error } = await query;

    if (error) {
      container.innerHTML =
        '<p class="text-danger text-center">❌ Error al cargar</p>';
      return;
    }

    document.getElementById("totalPedidos").textContent = data?.length || 0;

    if (!data || !data.length) {
      container.innerHTML =
        '<p class="text-center text-secondary py-3">📋 No hay pedidos</p>';
      return;
    }

    container.innerHTML = `
        <table class="table table-dark table-hover table-sm">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (p) => `
                    <tr>
                        <td>
                            <small>${formatearFecha(p.fecha_pedido)}</small>
                        </td>
                        <td>
                            <strong>${p.cliente_nombre}</strong>
                            <br><small class="text-secondary">${
                              p.cliente_telefono
                            }</small>
                        </td>
                        <td>
                            <small>${p.productos
                              .map((x) => `${x.nombre} x${x.cantidad}`)
                              .join("<br>")}</small>
                        </td>
                        <td><strong>${formatearMoneda(p.total)}</strong></td>
                        <td>
                            <select onchange="cambiarEstadoPedido('${
                              p.id
                            }', this.value)" 
                                    class="form-select form-select-sm bg-black text-white border-secondary" 
                                    style="width:auto;">
                                <option value="pendiente" ${
                                  p.estado === "pendiente" ? "selected" : ""
                                }>📋 Pendiente</option>
                                <option value="confirmado" ${
                                  p.estado === "confirmado" ? "selected" : ""
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
  }

  async function cambiarEstadoPedido(id, estado) {
    const { error } = await supabase
      .from("pedidos")
      .update({ estado })
      .eq("id", id);

    if (!error) {
      cargarPedidos(
        document.querySelector(".filtro-pedido.active")?.dataset?.estado ||
          "todos"
      );
    }
  }

  async function verDetallePedido(id) {
    const { data } = await supabase
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
      `📋 DETALLE DEL PEDIDO\n\n` +
        `👤 Cliente: ${data.cliente_nombre}\n` +
        `📱 Teléfono: ${data.cliente_telefono}\n` +
        `${data.cliente_email ? `📧 Email: ${data.cliente_email}\n` : ""}` +
        `\n📦 Productos:\n${productos}\n` +
        `\n💰 Total: ${formatearMoneda(data.total)}\n` +
        `💳 Pago: ${
          data.metodo_pago === "transferencia" ? "Transferencia" : "Efectivo"
        }\n` +
        `${
          data.direccion_entrega
            ? `📍 Dirección: ${data.direccion_entrega}\n`
            : ""
        }` +
        `${data.notas ? `📝 Notas: ${data.notas}\n` : ""}` +
        `📌 Estado: ${data.estado.toUpperCase()}`
    );
  }

  async function generarTicketPedido(id) {
    const { data } = await supabase
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
  }

  // ============================================
  // 4. FINANZAS
  // ============================================

  async function cargarFinanzas() {
    const container = document.getElementById("listaFinanzas");
    container.innerHTML =
      '<div class="text-center text-secondary py-3">Cargando...</div>';

    const { data, error } = await supabase
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

    document.getElementById("totalIngresos").textContent =
      formatearMoneda(ingresos);
    document.getElementById("totalGastos").textContent =
      formatearMoneda(gastos);
    const gananciaEl = document.getElementById("gananciaNeta");
    gananciaEl.textContent = formatearMoneda(ganancia);
    gananciaEl.style.color = ganancia >= 0 ? "#28a745" : "#dc3545";

    container.innerHTML = `
        <table class="table table-dark table-hover table-sm">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (f) => `
                    <tr>
                        <td><small>${formatearFecha(f.fecha)}</small></td>
                        <td>
                            <span class="${
                              f.tipo === "ingreso"
                                ? "text-success"
                                : "text-danger"
                            }">
                                ${
                                  f.tipo === "ingreso"
                                    ? "📈 Ingreso"
                                    : "📉 Gasto"
                                }
                            </span>
                        </td>
                        <td><small>${
                          f.categoria ? f.categoria.replace("_", " ") : "otros"
                        }</small></td>
                        <td>${f.descripcion}</td>
                        <td class="${
                          f.tipo === "ingreso" ? "text-success" : "text-danger"
                        }">
                            ${
                              f.tipo === "ingreso" ? "+" : "-"
                            } ${formatearMoneda(f.monto)}
                        </td>
                        <td>
                            <button onclick="pedirEliminar('${
                              f.id
                            }','finanza')" class="btn btn-outline-danger btn-sm">🗑️</button>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;
  }

  function mostrarFormFinanza(data = null) {
    const container = document.getElementById("formFinanzaContainer");
    container.style.display = "block";
    container.scrollIntoView({ behavior: "smooth" });

    if (data) {
      finanzaEditando = data;
      document.getElementById("finId").value = data.id;
      document.getElementById("finTipo").value = data.tipo;
      document.getElementById("finCategoria").value = data.categoria || "otros";
      document.getElementById("finDescripcion").value = data.descripcion;
      document.getElementById("finMonto").value = data.monto;
      document.querySelector('#formFinanza button[type="submit"]').textContent =
        "💾 Actualizar";
    } else {
      finanzaEditando = null;
      document.getElementById("formFinanza").reset();
      document.getElementById("finId").value = "";
      document.querySelector('#formFinanza button[type="submit"]').textContent =
        "💾 Guardar";
    }
  }

  function ocultarFormFinanza() {
    document.getElementById("formFinanzaContainer").style.display = "none";
    finanzaEditando = null;
  }

  async function guardarFinanza(e) {
    e.preventDefault();
    const msg = document.getElementById("mensajeFinanza");
    const btn = e.target.querySelector('button[type="submit"]');

    const datos = {
      tipo: document.getElementById("finTipo").value,
      categoria: document.getElementById("finCategoria").value,
      descripcion: document.getElementById("finDescripcion").value.trim(),
      monto: parseFloat(document.getElementById("finMonto").value),
    };

    if (!datos.descripcion || !datos.monto) {
      return mostrarMensaje(msg, "❌ Completa todos los campos", "error");
    }

    try {
      btn.disabled = true;
      btn.textContent = "Guardando...";

      const id = document.getElementById("finId").value;
      let result;

      if (id) {
        result = await supabase.from("finanzas").update(datos).eq("id", id);
      } else {
        result = await supabase.from("finanzas").insert([datos]);
      }

      if (result.error) throw result.error;

      mostrarMensaje(msg, "✅ Movimiento registrado", "exito");
      ocultarFormFinanza();
      cargarFinanzas();
    } catch (error) {
      mostrarMensaje(msg, "❌ " + error.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = id ? "💾 Actualizar" : "💾 Guardar";
    }
  }

  // ============================================
  // 5. TICKET MANUAL
  // ============================================

  function generarTicketManual(e) {
    e.preventDefault();
    const msg = document.getElementById("mensajeTicket");

    const cliente = document.getElementById("ticketCliente").value.trim();
    const telefono = document.getElementById("ticketTelefono").value.trim();
    const direccion = document.getElementById("ticketDireccion").value.trim();
    const productosText = document
      .getElementById("ticketProductos")
      .value.trim();
    const metodoPago = document.getElementById("ticketMetodoPago").value;
    const envio = parseFloat(document.getElementById("ticketEnvio").value) || 0;

    if (!cliente || !telefono || !productosText) {
      return mostrarMensaje(
        msg,
        "❌ Completa los campos obligatorios",
        "error"
      );
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
      return mostrarMensaje(
        msg,
        "❌ Formato inválido. Usa: Producto - $100 x2",
        "error"
      );
    }

    const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const total = subtotal + envio;

    const datosTicket = {
      cliente,
      telefono,
      direccion,
      metodo_pago:
        metodoPago === "transferencia" ? "Transferencia" : "Efectivo",
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
    mostrarMensaje(msg, "✅ Ticket generado", "exito");
  }

  // ============================================
  // 6. ELIMINAR (MODAL)
  // ============================================

  function pedirEliminar(id, tipo) {
    eliminarId = id;
    eliminarTipo = tipo;

    const mensajes = {
      producto: "¿Eliminar este producto permanentemente?",
      inventario: "¿Eliminar este movimiento de inventario?",
      finanza: "¿Eliminar este registro financiero?",
    };

    document.getElementById("modalMensaje").textContent =
      mensajes[tipo] || "¿Eliminar este elemento?";

    const modal = new bootstrap.Modal(document.getElementById("modalConfirm"));
    modal.show();
  }

  async function confirmarEliminar() {
    if (!eliminarId) return;

    try {
      let result;

      if (eliminarTipo === "producto") {
        result = await supabase.from("productos").delete().eq("id", eliminarId);
      } else if (eliminarTipo === "inventario") {
        result = await supabase
          .from("inventario")
          .delete()
          .eq("id", eliminarId);
      } else if (eliminarTipo === "finanza") {
        result = await supabase.from("finanzas").delete().eq("id", eliminarId);
      }

      if (result.error) throw result.error;

      cerrarModal();

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
      alert("❌ Error: " + error.message);
    }
  }

  function cerrarModal() {
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("modalConfirm")
    );
    if (modal) modal.hide();
    eliminarId = null;
    eliminarTipo = null;
  }
}
