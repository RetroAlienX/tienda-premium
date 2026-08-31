// ============================================
// PROGRAMA DE LEALTAD - CRUD (Supabase)
// Tabla: lealtad (id, nombre_cliente, productos_comprados, producto_regalo,
//                  created_at, updated_at)
// ============================================

let lealtadEditando = null;

function mostrarMensajeLealtad(el, msg, tipo) {
  if (!el) return;
  const clase =
    tipo === "error"
      ? "mensaje-error"
      : tipo === "exito"
        ? "mensaje-exito"
        : "mensaje-info";
  el.innerHTML = msg;
  el.className = "mt-2 " + clase;
  el.style.display = "block";
}

async function cargarLealtad() {
  const container = document.getElementById("listaLealtad");
  if (!container) return;

  container.innerHTML =
    '<div class="text-center text-dim py-3"><span class="spinner-border spinner-border-sm me-1"></span>Cargando...</div>';

  if (!window.supabase || typeof window.supabase.from !== "function") {
    setTimeout(cargarLealtad, 500);
    return;
  }

  try {
    const { data, error } = await window.supabase
      .from("lealtad")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const total = document.getElementById("totalLealtad");
    if (total) total.textContent = data?.length || 0;

    if (!data || data.length === 0) {
      container.innerHTML =
        '<p class="text-center text-dim py-3">💎 No hay clientes registrados en el programa de lealtad.</p>';
      return;
    }

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th style="white-space:nowrap; text-align:center;">Productos comprados</th>
                        <th>Producto de regalo</th>
                        <th style="white-space:nowrap;">Registrado</th>
                        <th style="white-space:nowrap; min-width:110px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data
                      .map(
                        (r) => `
                        <tr data-lealtad-id="${r.id}">
                            <td><strong style="color:var(--text-main);">${
                              r.nombre_cliente
                            }</strong></td>
                            <td style="text-align:center;"><span style="color:var(--accent); font-weight:600; white-space:nowrap;">${
                              r.productos_comprados ?? 0
                            }</span></td>
                            <td>${
                              r.producto_regalo
                                ? `<span style="color:#ffd166;">🎁 ${r.producto_regalo}</span>`
                                : '<span style="color:var(--text-dim);">—</span>'
                            }</td>
                            <td><small style="white-space:nowrap; color:var(--text-silver);">${formatearFecha(
                              r.created_at,
                            )}</small></td>
                            <td style="white-space:nowrap;">
                                <button onclick="abrirModalLealtad('${
                                  r.id
                                }')" class="btn btn-outline-secondary btn-sm" title="Editar cliente">✏️</button>
                                <button onclick="pedirEliminarLealtad('${
                                  r.id
                                }')" class="btn btn-outline-danger btn-sm" title="Eliminar cliente del programa">🗑️</button>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;
  } catch (error) {
    console.error("Error cargando lealtad:", error);
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar lealtad</p>';
  }
}

function abrirModalLealtad(id) {
  if (!id) {
    lealtadEditando = null;
    document.getElementById("lealtadId").value = "";
    document.getElementById("lealtadNombreCliente").value = "";
    document.getElementById("lealtadProductosComprados").value = "";
    document.getElementById("lealtadProductoRegalo").value = "";
    document.getElementById("lealtadModalTitulo").textContent =
      "💎 Agregar Cliente";
    const m = document.getElementById("mensajeLealtad");
    if (m) {
      m.innerHTML = "";
      m.className = "";
    }
    document.getElementById("modalLealtad").style.display = "flex";
    return;
  }

  const row = document.querySelector(`tr[data-lealtad-id="${id}"]`);
  if (!row) {
    mostrarModalAlerta("❌ No se encontró el cliente de lealtad");
    return;
  }

  lealtadEditando = id;
  document.getElementById("lealtadId").value = id;
  document.getElementById("lealtadNombreCliente").value =
    row.children[0].textContent.trim();
  document.getElementById("lealtadProductosComprados").value =
    row.children[1].textContent.trim();
  document.getElementById("lealtadProductoRegalo").value =
    row.children[2].textContent.replace(/🎁\s*/, "").trim();
  document.getElementById("lealtadModalTitulo").textContent =
    "✏️ Editar Cliente";

  const m = document.getElementById("mensajeLealtad");
  if (m) {
    m.innerHTML = "";
    m.className = "";
  }
  document.getElementById("modalLealtad").style.display = "flex";
}

async function guardarLealtad() {
  const msg = document.getElementById("mensajeLealtad");
  const nombreCliente = document
    .getElementById("lealtadNombreCliente")
    .value.trim();
  const productosComprados =
    parseInt(document.getElementById("lealtadProductosComprados").value) || 0;
  const productoRegalo = document
    .getElementById("lealtadProductoRegalo")
    .value.trim();

  if (!nombreCliente) {
    return mostrarMensajeLealtad(
      msg,
      "❌ El nombre del cliente es obligatorio",
      "error",
    );
  }

  try {
    if (lealtadEditando) {
      const { error } = await window.supabase
        .from("lealtad")
        .update({
          nombre_cliente: nombreCliente,
          productos_comprados: productosComprados,
          producto_regalo: productoRegalo || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lealtadEditando);
      if (error) throw error;
    } else {
      const { error } = await window.supabase.from("lealtad").insert([
        {
          nombre_cliente: nombreCliente,
          productos_comprados: productosComprados,
          producto_regalo: productoRegalo || null,
        },
      ]);
      if (error) throw error;
    }

    document.getElementById("modalLealtad").style.display = "none";
    cargarLealtad();
    mostrarModalAlerta(
      lealtadEditando
        ? "✅ Cliente actualizado correctamente"
        : "✅ Cliente agregado al programa de lealtad",
    );
    lealtadEditando = null;
  } catch (error) {
    console.error("Error guardando lealtad:", error);
    mostrarModalAlerta("❌ Error al guardar: " + error.message);
  }
}

async function pedirEliminarLealtad(id) {
  if (typeof modalConfirmar === "function") {
    modalConfirmar("¿Eliminar a este cliente del programa de lealtad?", async function () {
      try {
        const { error } = await window.supabase
          .from("lealtad")
          .delete()
          .eq("id", id);
        if (error) throw error;
        cargarLealtad();
        mostrarModalAlerta("✅ Cliente eliminado del programa de lealtad");
      } catch (error) {
        console.error("Error al eliminar de lealtad:", error);
        mostrarModalAlerta("❌ Error al eliminar: " + error.message);
      }
    });
    return;
  }
  if (!confirm("¿Eliminar a este cliente del programa de lealtad?")) return;
  try {
    const { error } = await window.supabase
      .from("lealtad")
      .delete()
      .eq("id", id);
    if (error) throw error;
    cargarLealtad();
  } catch (error) {
    console.error("Error al eliminar de lealtad:", error);
  }
}

window.cargarLealtad = cargarLealtad;
window.abrirModalLealtad = abrirModalLealtad;
window.guardarLealtad = guardarLealtad;
window.pedirEliminarLealtad = pedirEliminarLealtad;

