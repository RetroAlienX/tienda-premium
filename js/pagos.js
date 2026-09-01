// ============================================
// CONTROL DE PAGOS - CRUD (Supabase)
// Tabla: pagos (id, cliente, monto_actual, quincenas_totales,
//        quincenas_pendientes, cargos, estado, created_at, updated_at)
// ============================================

const CARGO_MOROSIDAD = 50; // $50 MXN por cada aviso de morosidad

let pagoEditando = null;

function mostrarMensajePago(el, msg, tipo) {
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

function estadoPagoLabel(estado) {
  return estado === "liquidado"
    ? '<span class="badge bg-success" title="Adeudo saldado por completo.">✅ Liquidado</span>'
    : '<span class="badge bg-warning text-dark" title="Adeudo pendiente por cobrar.">⏳ En mora</span>';
}

async function cargarPagos() {
  const container = document.getElementById("listaPagos");
  if (!container) return;

  container.innerHTML =
    '<div class="text-center text-dim py-3"><span class="spinner-border spinner-border-sm me-1"></span>Cargando...</div>';

  if (!window.supabase || typeof window.supabase.from !== "function") {
    setTimeout(cargarPagos, 500);
    return;
  }

  try {
    const { data, error } = await window.supabase
      .from("pagos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML =
        '<p class="text-center text-dim py-3">💳 No hay pagos registrados.</p>';
      return;
    }

    container.innerHTML = `
            <table class="table table-dark table-hover table-sm">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th style="text-align:center; white-space:nowrap;" title="Cantidad total que el cliente debe cubrir.">Adeudo actual</th>
                        <th style="text-align:center; white-space:nowrap; width:90px;" title="Total de quincenas acordadas para este pago.">Q. totales</th>
                        <th style="text-align:center; white-space:nowrap; width:90px;" title="Cuántas quincenas faltan por cubrir.">Q. pendientes</th>
                        <th style="text-align:center; white-space:nowrap; width:80px;" title="Cargos extras acumulados por morosidad/recargos.">Cargos</th>
                        <th style="text-align:center; white-space:nowrap;">Estado</th>
                        <th style="text-align:center; white-space:nowrap; min-width:640px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data
                      .map(
                        (r) => `
                        <tr data-pago-id="${r.id}">
                            <td><strong style="color:var(--text-main);">${
                              r.cliente || "—"
                            }</strong></td>
                            <td style="text-align:center;"><span style="color:var(--accent); font-weight:600; white-space:nowrap;">${formatearMoneda(
                              Number(r.monto_actual) || 0,
                            )}</span></td>
                            <td style="text-align:center; white-space:nowrap;">${
                              r.quincenas_totales ?? 0
                            }</td>
                            <td style="text-align:center; white-space:nowrap;"><span style="font-weight:600;">${
                              r.quincenas_pendientes ?? 0
                            }</span></td>
                            <td style="text-align:center; white-space:nowrap;"><span style="color:#ffd166;">${formatearMoneda(
                              Number(r.cargos) || 0,
                            )}</span></td>
                            <td style="text-align:center; white-space:nowrap;">${estadoPagoLabel(
                              r.estado,
                            )}</td>
                            <td style="white-space:nowrap;">
                                <div class="acciones-pago">
                                <button onclick="liquidarPago('${
                                  r.id
                                }')" class="btn btn-success btn-sm btn-accion" title="Liquidar: salda el adeudo a $0, quincenas pendientes a 0 y marca como Liquidado.">💰 Liquidar</button>
                                <button onclick="cargarMorosidadPago('${
                                  r.id
                                }')" class="btn btn-warning btn-sm btn-accion" title="Cargar morosidad: aumenta el adeudo en $50 MXN y suma una quincena pendiente.">⏱️ +$50 Mora</button>
                                <button onclick="abrirCargoPago('${
                                  r.id
                                }', true)" class="btn btn-info btn-sm btn-accion" title="Añadir cargo: suma un recargo extra al adeudo.">＋ Cargo</button>
                                <button onclick="abrirCargoPago('${
                                  r.id
                                }', false)" class="btn btn-outline-info btn-sm btn-accion" title="Deducir cargo: resta un abono del adeudo.">− Abono</button>
                                <button onclick="abrirModalPago('${
                                  r.id
                                }')" class="btn btn-outline-warning btn-sm btn-accion" title="Editar los datos de este pago.">✏️</button>
                                <button onclick="pedirEliminarPago('${
                                  r.id
                                }')" class="btn btn-outline-danger btn-sm btn-accion" title="Eliminar este registro de pagos.">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;
  } catch (error) {
    console.error("Error cargando pagos:", error);
    container.innerHTML =
      '<p class="text-danger text-center">❌ Error al cargar pagos. ¿Ejecutaste el SQL para crear la tabla "pagos"?</p>';
  }
}

function abrirModalPago(id) {
  if (!id) {
    pagoEditando = null;
    document.getElementById("pagoId").value = "";
    document.getElementById("pagoCliente").value = "";
    document.getElementById("pagoMonto").value = "";
    document.getElementById("pagoQuincenasTotales").value = "";
    document.getElementById("pagoQuincenasPendientes").value = "";
    document.getElementById("pagoModalTitulo").textContent = "💳 Agregar Pago";
    const m = document.getElementById("mensajePago");
    if (m) {
      m.innerHTML = "";
      m.className = "";
    }
    document.getElementById("modalPago").style.display = "flex";
    return;
  }

  const row = document.querySelector(`tr[data-pago-id="${id}"]`);
  if (!row) {
    mostrarModalAlerta("❌ No se encontró el pago");
    return;
  }

  pagoEditando = id;
  document.getElementById("pagoId").value = id;
  document.getElementById("pagoCliente").value =
    row.children[0].textContent.trim();
  document.getElementById("pagoMonto").value = row.children[1].textContent
    .replace(/[^\d.]/g, "");
  document.getElementById("pagoQuincenasTotales").value =
    row.children[2].textContent.trim();
  document.getElementById("pagoQuincenasPendientes").value =
    row.children[3].textContent.trim();
  document.getElementById("pagoModalTitulo").textContent = "✏️ Editar Pago";

  const m = document.getElementById("mensajePago");
  if (m) {
    m.innerHTML = "";
    m.className = "";
  }
  document.getElementById("modalPago").style.display = "flex";
}

async function guardarPago() {
  const msg = document.getElementById("mensajePago");
  const cliente = document.getElementById("pagoCliente").value.trim();
  const monto = parseFloat(document.getElementById("pagoMonto").value) || 0;
  const qTotales =
    parseInt(document.getElementById("pagoQuincenasTotales").value) || 0;
  const qPendientes =
    parseInt(document.getElementById("pagoQuincenasPendientes").value) || 0;

  if (!cliente) {
    return mostrarMensajePago(
      msg,
      "❌ El nombre del cliente es obligatorio",
      "error",
    );
  }
  if (monto <= 0) {
    return mostrarMensajePago(
      msg,
      "❌ El monto del adeudo debe ser mayor a 0",
      "error",
    );
  }
  if (qTotales < 1) {
    return mostrarMensajePago(
      msg,
      "❌ Las quincenas totales deben ser al menos 1",
      "error",
    );
  }
  // Las quincenas pendientes nunca pueden superar las totales.
  const qPend = Math.min(Math.max(0, qPendientes), qTotales);

  try {
    if (pagoEditando) {
      const { error } = await window.supabase
        .from("pagos")
        .update({
          cliente,
          monto_actual: monto,
          quincenas_totales: qTotales,
          quincenas_pendientes: qPend,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pagoEditando);
      if (error) throw error;
    } else {
      const { error } = await window.supabase.from("pagos").insert([
        {
          cliente,
          monto_actual: monto,
          quincenas_totales: qTotales,
          quincenas_pendientes: qPend > 0 ? qPend : qTotales,
          cargos: 0,
          estado: "activo",
        },
      ]);
      if (error) throw error;
    }

    document.getElementById("modalPago").style.display = "none";
    cargarPagos();
    mostrarModalAlerta(
      pagoEditando ? "✅ Pago actualizado correctamente" : "✅ Pago registrado",
    );
    pagoEditando = null;
  } catch (error) {
    console.error("Error guardando pago:", error);
    mostrarModalAlerta("❌ Error al guardar: " + error.message);
  }
}

async function liquidarPago(id) {
  if (typeof modalConfirmar === "function") {
    modalConfirmar(
      "¿Liquidar este adeudo? Se pondrá en $0 y quincenas pendientes en 0.",
      async () => {
        try {
          const { error } = await window.supabase
            .from("pagos")
            .update({
              monto_actual: 0,
              quincenas_pendientes: 0,
              estado: "liquidado",
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);
          if (error) throw error;
          cargarPagos();
          mostrarModalAlerta("✅ Adeudo liquidado correctamente");
        } catch (error) {
          console.error("Error liquidando:", error);
          mostrarModalAlerta("❌ Error al liquidar: " + error.message);
        }
      },
    );
  }
}

async function cargarMorosidadPago(id) {
  if (typeof modalConfirmar === "function") {
    modalConfirmar(
      `¿Cargar morosidad? El adeudo aumentará $${CARGO_MOROSIDAD} MXN y sumará 1 quincena pendiente.`,
      async () => {
        try {
          const { data, error } = await window.supabase
            .from("pagos")
            .select("*")
            .eq("id", id)
            .single();
          if (error) throw error;
          const nuevoMonto = (Number(data.monto_actual) || 0) + CARGO_MOROSIDAD;
          const nuevasPendientes = Math.min(
            (Number(data.quincenas_pendientes) || 0) + 1,
            Number(data.quincenas_totales) || 0,
          );
          const { error: upError } = await window.supabase
            .from("pagos")
            .update({
              monto_actual: nuevoMonto,
              cargos: (Number(data.cargos) || 0) + CARGO_MOROSIDAD,
              quincenas_pendientes: nuevasPendientes,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);
          if (upError) throw upError;
          cargarPagos();
          mostrarModalAlerta(`✅ Morosidad cargada: +$${CARGO_MOROSIDAD} MXN`);
        } catch (error) {
          console.error("Error cargando morosidad:", error);
          mostrarModalAlerta("❌ Error al cargar morosidad: " + error.message);
        }
      },
    );
  }
}

function abrirCargoPago(id, esCargo) {
  const titulo = esCargo ? "➕ Añadir Cargo" : "➖ Deducir Abono";
  document.getElementById("cargoTitulo").textContent = titulo;
  document.getElementById("cargoId").value = id || "";
  document.getElementById("cargoEsCargo").value = esCargo ? "1" : "0";
  document.getElementById("cargoMonto").value = "";

  const row = document.querySelector(`tr[data-pago-id="${id}"]`);
  const info = document.getElementById("cargoClienteInfo");
  if (info) {
    info.textContent = row
      ? `Cliente: ${row.children[0].textContent.trim()}`
      : "";
  }

  const msg = document.getElementById("mensajeCargo");
  if (msg) {
    msg.innerHTML = "";
    msg.className = "";
    msg.style.display = "none";
  }

  document.getElementById("modalCargoPago").style.display = "flex";
  const montoInput = document.getElementById("cargoMonto");
  if (montoInput) montoInput.focus();
}

function confirmarCargoPago() {
  const msg = document.getElementById("mensajeCargo");
  const id = document.getElementById("cargoId").value.trim();
  const esCargo =
    document.getElementById("cargoEsCargo").value === "1";
  const monto = parseFloat(document.getElementById("cargoMonto").value);

  if (!id) {
    if (msg) {
      msg.textContent = "❌ No se pudo identificar el pago.";
      msg.className = "mt-2 mensaje-error";
      msg.style.display = "block";
    }
    return;
  }
  if (isNaN(monto) || monto <= 0) {
    if (msg) {
      msg.textContent = "❌ Ingresa un monto válido mayor a 0.";
      msg.className = "mt-2 mensaje-error";
      msg.style.display = "block";
    }
    return;
  }

  document.getElementById("modalCargoPago").style.display = "none";
  aplicarCargoPago(id, esCargo, monto);
}

async function aplicarCargoPago(id, esCargo, monto) {
  try {
    const { data, error } = await window.supabase
      .from("pagos")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;

    let nuevoMonto = Number(data.monto_actual) || 0;
    let nuevosCargos = Number(data.cargos) || 0;
    if (esCargo) {
      nuevoMonto += monto;
      nuevosCargos += monto;
    } else {
      nuevoMonto = Math.max(0, nuevoMonto - monto);
    }

    // Si se deduce hasta quedar en $0, se liquida.
    const estado = nuevoMonto <= 0 ? "liquidado" : data.estado;
    const qPendientes =
      nuevoMonto <= 0 ? 0 : Number(data.quincenas_pendientes) || 0;

    const { error: upError } = await window.supabase
      .from("pagos")
      .update({
        monto_actual: nuevoMonto,
        cargos: nuevosCargos,
        quincenas_pendientes: qPendientes,
        estado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (upError) throw upError;

    cargarPagos();
    mostrarModalAlerta(
      esCargo
        ? `✅ Cargo añadido: +${formatearMoneda(monto)}`
        : `✅ Abono deducido: −${formatearMoneda(monto)}${nuevoMonto <= 0 ? " · Adeudo liquidado" : ""}`,
    );
  } catch (error) {
    console.error("Error aplicando cargo:", error);
    mostrarModalAlerta("❌ Error al aplicar: " + error.message);
  }
}

async function pedirEliminarPago(id) {
  if (typeof modalConfirmar === "function") {
    modalConfirmar("¿Eliminar este registro de pagos?", async () => {
      try {
        const { error } = await window.supabase
          .from("pagos")
          .delete()
          .eq("id", id);
        if (error) throw error;
        cargarPagos();
        mostrarModalAlerta("✅ Registro de pago eliminado");
      } catch (error) {
        console.error("Error al eliminar pago:", error);
        mostrarModalAlerta("❌ Error al eliminar: " + error.message);
      }
    });
  }
}

// Cargar datos dummy (2 registros) si la tabla está vacía
async function cargarPagosDummySiVacio() {
  try {
    const { data, error } = await window.supabase
      .from("pagos")
      .select("id")
      .limit(1);
    if (error) throw error;
    if (data && data.length === 0) {
      await window.supabase.from("pagos").insert([
        {
          cliente: "Cliente Demo 1",
          monto_actual: 1200,
          quincenas_totales: 4,
          quincenas_pendientes: 4,
          cargos: 0,
          estado: "activo",
        },
        {
          cliente: "Cliente Demo 2",
          monto_actual: 500,
          quincenas_totales: 2,
          quincenas_pendientes: 2,
          cargos: 0,
          estado: "activo",
        },
      ]);
    }
  } catch (error) {
    console.warn("⚠️ No se pudieron cargar pagos de ejemplo:", error.message);
  }
}

window.cargarPagos = cargarPagos;
window.abrirModalPago = abrirModalPago;
window.guardarPago = guardarPago;
window.liquidarPago = liquidarPago;
window.cargarMorosidadPago = cargarMorosidadPago;
window.abrirCargoPago = abrirCargoPago;
window.confirmarCargoPago = confirmarCargoPago;
window.pedirEliminarPago = pedirEliminarPago;
window.cargarPagosDummySiVacio = cargarPagosDummySiVacio;

