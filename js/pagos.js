// ============================================
// CONTROL DE PAGOS - CRUD (Supabase)
// Tabla: pagos (id, cliente, adeudo_total,
//        quincenas_totales, quincenas_pagadas, quincenas_liquidadas,
//        quincenas_pendientes, estado, fecha_liquidacion, created_at, updated_at)
// Nota: adeudo_total = deuda actual. Cargos (+), abonos (−) y moras (+50)
//       afectan SOLO adeudo_total y NO tocan las quincenas. Al llegar a 0 el
//       adeudo_total se marca "liquidado"; con cargo/abono/mora >0 se marca
//       "al_corriente". El estado "en_mora" se ajusta SOLO manualmente.
// ============================================

const CARGO_MOROSIDAD = 50; // $50 MXN por cada aviso de morosidad
const ESTADOS = ["en_mora", "al_corriente", "liquidado"];

let pagoEditando = null;

function estadoLabel(estado) {
  if (estado === "liquidado") return "Liquidado";
  if (estado === "al_corriente") return "Al corriente";
  return "En mora";
}

function mensajeErrorAmigable(error) {
  if (!error) return "Ocurrió un error desconocido.";
  const msg = String(error.message || "");
  const code = error.code || "";
  if (
    code === "23502" ||
    /null value in column/i.test(msg) ||
    /violates not-null constraint/i.test(msg)
  ) {
    return "Falta un dato obligatorio. Revisa que todos los campos requeridos estén llenos. Si el problema persiste, re-ejecuta el SQL de pagos en Supabase.";
  }
  if (code === "23505" || /duplicate key/i.test(msg)) {
    return "Ese registro ya existe (dato duplicado).";
  }
  if (code === "42P01" || /relation ".*" does not exist/i.test(msg)) {
    return 'La tabla no existe. Ejecuta el SQL para crear la tabla "pagos".';
  }
  return "Revisa los datos e inténtalo de nuevo.";
}

function formatearFechaLatam(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${String(d.getDate()).padStart(2, "0")}/${meses[d.getMonth()]}/${d.getFullYear()}`;
}

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
                        <th style="text-align:center; white-space:nowrap;" title="Estado actual del pago: en mora, al corriente o liquidado.">Estado</th>
                        <th style="text-align:center; white-space:nowrap;" title="Fecha en que se liquidó el pago (si aplica).">Fecha liquidación</th>
                        <th style="text-align:center; white-space:nowrap; width:90px;" title="Cuántas quincenas faltan por cubrir.">Q. pendientes</th>
                        <th style="text-align:center; white-space:nowrap; width:90px;" title="Cuántas quincenas ya pagó el cliente.">Q. pagadas</th>
                        <th style="text-align:center; white-space:nowrap; width:90px;" title="Total de quincenas acordadas para este pago.">Q. totales</th>
                        <th style="text-align:center; white-space:nowrap;" title="Deuda actual del cliente (cargos +, abonos −, moras +).">Adeudo total</th>
                        <th style="text-align:center; white-space:nowrap;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data
                      .map((r) => {
                        const st = ESTADOS.includes(r.estado)
                          ? r.estado
                          : "en_mora";
                        const estadoColor =
                          st === "liquidado"
                            ? "#4ade80"
                            : st === "al_corriente"
                              ? "#ffd166"
                              : "#ff4d4d";
                        const adeudoTotal = Number(r.adeudo_total) || 0;
                        const puedeLiquidarOAbonar = adeudoTotal > 0;
                        const liquidarDisabled = puedeLiquidarOAbonar
                          ? ""
                          : 'disabled style="opacity:0.4; pointer-events:none;"';
                        const abonoDisabled = puedeLiquidarOAbonar
                          ? ""
                          : 'disabled style="opacity:0.4; pointer-events:none;"';
                        return `
                        <tr data-pago-id="${r.id}"
                            data-cliente="${
                              r.cliente || ""
                            }"
                            data-totales="${r.quincenas_totales ?? 0}"
                            data-pagadas="${r.quincenas_pagadas ?? 0}"
                            data-pendientes="${r.quincenas_pendientes ?? 0}"
                            data-adeudototal="${adeudoTotal}">
                            <td><strong style="color:var(--text-main);">${
                              r.cliente || "—"
                            }</strong></td>
                            <td style="text-align:center; white-space:nowrap;">
                                <select class="form-select form-select-sm estado-select" title="Cambiar el estado de este pago."
                                    style="color:${estadoColor}; border-color:${estadoColor}; font-weight:600;"
                                    onchange="cambiarEstadoPago('${r.id}', this.value)">
                                    <option value="en_mora" style="color:#ff4d4d;" ${
                                      st === "en_mora" ? "selected" : ""
                                    }>⏰ En mora</option>
                                    <option value="al_corriente" style="color:#ffd166;" ${
                                      st === "al_corriente" ? "selected" : ""
                                    }>💵 Al corriente</option>
                                    <option value="liquidado" style="color:#4ade80;" ${
                                      st === "liquidado" ? "selected" : ""
                                    }>💰 Liquidado</option>
                                </select>
                            </td>
                            <td style="text-align:center; white-space:nowrap;">${formatearFechaLatam(
                              r.fecha_liquidacion,
                            )}</td>
                            <td style="text-align:center; white-space:nowrap;"><span style="font-weight:600;">${
                              r.quincenas_pendientes ?? 0
                            }</span></td>
                            <td style="text-align:center; white-space:nowrap;"><span style="color:#6ee7b7; font-weight:600;">${
                              r.quincenas_pagadas ?? 0
                            }</span></td>
                            <td style="text-align:center; white-space:nowrap;">${
                              r.quincenas_totales ?? 0
                            }</td>
                            <td style="text-align:center;"><span style="color:#f472b6; font-weight:600; white-space:nowrap;">${formatearMoneda(
                              adeudoTotal,
                            )}</span></td>
                            <td style="white-space:nowrap;">
                                <div class="acciones-pago">
                                <button onclick="aumentarQuincenaPago('${
                                  r.id
                                }')" class="btn btn-success btn-sm btn-accion" title="Marcar UNA quincena como pagada: suma a quincenas pagadas y baja una pendiente.">＋ Quincena</button>
                                <button onclick="quitarQuincenaPago('${
                                  r.id
                                }')" class="btn btn-outline-success btn-sm btn-accion" title="Quitar UNA quincena pagada: resta a quincenas pagadas y sube una pendiente.">－ Quincena</button>
                                <button onclick="liquidarPago('${
                                  r.id
                                }')" class="btn btn-danger btn-sm btn-accion" title="Liquidar: salda el adeudo a $0, quincenas pendientes a 0 y guarda la fecha de liquidación. Solo disponible si el adeudo total es mayor a $0." ${liquidarDisabled}>💾 Liquidar</button>
                                <button onclick="cargarMorosidadPago('${
                                  r.id
                                }')" class="btn btn-warning btn-sm btn-accion" title="Cargar morosidad: aumenta el adeudo total en $50 MXN (no modifica las quincenas).">⏱️ +$50 Mora</button>
                                <button onclick="abrirCargoPago('${
                                  r.id
                                }', true)" class="btn btn-info btn-sm btn-accion" title="Añadir cargo: suma un recargo extra al adeudo.">＋ Cargo</button>
                                <button onclick="abrirCargoPago('${
                                  r.id
                                }', false)" class="btn btn-outline-info btn-sm btn-accion" title="Deducir cargo: resta un abono del adeudo. Solo disponible si el adeudo total es mayor a $0." ${abonoDisabled}>− Abono</button>
                                <button onclick="abrirModalPago('${
                                  r.id
                                }')" class="btn btn-outline-warning btn-sm btn-accion" title="Editar los datos de este pago.">✏️</button>
                                <button onclick="pedirEliminarPago('${
                                  r.id
                                }')" class="btn btn-outline-danger btn-sm btn-accion" title="Eliminar este registro de pagos.">🗑️</button>
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
    document.getElementById("pagoAdeudoTotal").value = "";
    document.getElementById("pagoQuincenasTotales").value = "";
    document.getElementById("pagoQuincenasPagadas").value = "";
    document.getElementById("pagoModalTitulo").textContent =
      "💳 Agregar Pago";
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
  const d = row.dataset || {};
  document.getElementById("pagoId").value = id;
  document.getElementById("pagoCliente").value = (d.cliente || "").trim();
  document.getElementById("pagoAdeudoTotal").value = d.adeudototal ?? "";
  document.getElementById("pagoQuincenasTotales").value = d.totales ?? "";
  document.getElementById("pagoQuincenasPagadas").value = d.pagadas ?? "";
  document.getElementById("pagoModalTitulo").textContent = "✏️ Editar Pago";

  const m = document.getElementById("mensajePago");
  if (m) {
    m.innerHTML = "";
    m.className = "";
  }
  document.getElementById("modalPago").style.display = "flex";
}

// Mantiene quincenas pagadas dentro de [0, totales] (nunca negativas ni
// mayores que las totales).
function sincronizarQuincenas() {
  const tot = document.getElementById("pagoQuincenasTotales");
  const pag = document.getElementById("pagoQuincenasPagadas");
  if (!tot || !pag) return;
  const t = parseInt(tot.value) || 0;
  let p = parseInt(pag.value) || 0;
  p = Math.min(Math.max(0, p), t);
  pag.value = pag.value === "" ? "" : String(p);
}

async function guardarPago() {
  const msg = document.getElementById("mensajePago");
  const cliente = document.getElementById("pagoCliente").value.trim();
  const adeudoTotal =
    parseFloat(document.getElementById("pagoAdeudoTotal").value) || 0;
  const qTotales =
    parseInt(document.getElementById("pagoQuincenasTotales").value) || 0;
  const qPagadas =
    parseInt(document.getElementById("pagoQuincenasPagadas").value) || 0;

  if (!cliente) {
    return mostrarMensajePago(
      msg,
      "❌ El nombre del cliente es obligatorio.",
      "error",
    );
  }
  if (adeudoTotal < 0) {
    return mostrarMensajePago(
      msg,
      "❌ El adeudo total no puede ser negativo.",
      "error",
    );
  }
  if (qTotales < 1) {
    return mostrarMensajePago(
      msg,
      "❌ Las quincenas totales deben ser al menos 1.",
      "error",
    );
  }
  if (qPagadas < 0 || qPagadas > qTotales) {
    return mostrarMensajePago(
      msg,
      `❌ Las quincenas pagadas (${qPagadas}) deben estar entre 0 y las totales (${qTotales}).`,
      "error",
    );
  }

  const qPend = qTotales - qPagadas;
  const liquida = adeudoTotal <= 0;
  const estado = liquida ? "liquidado" : "al_corriente";
  const fecha = liquida ? new Date().toISOString() : null;

  try {
    if (pagoEditando) {
      const { data: prev, error: prevErr } = await window.supabase
        .from("pagos")
        .select("*")
        .eq("id", pagoEditando)
        .single();
      if (prevErr) throw prevErr;
      const updates = {
        cliente,
        adeudo_total: adeudoTotal,
        quincenas_totales: qTotales,
        quincenas_pendientes: qPend,
        quincenas_pagadas: qPagadas,
        quincenas_liquidadas: qPagadas,
        estado,
        updated_at: new Date().toISOString(),
      };
      if (liquida && !prev.fecha_liquidacion) {
        updates.fecha_liquidacion = fecha;
      }
      if (!liquida && prev.fecha_liquidacion) {
        // Dejó de estar liquidado (volvió a comprar): se reinicia la fecha.
        updates.fecha_liquidacion = null;
      }
      const { error } = await window.supabase
        .from("pagos")
        .update(updates)
        .eq("id", pagoEditando);
      if (error) throw error;
    } else {
      const { error } = await window.supabase.from("pagos").insert([
        {
          cliente,
          adeudo_total: adeudoTotal,
          quincenas_totales: qTotales,
          quincenas_pendientes: qPend,
          quincenas_pagadas: qPagadas,
          quincenas_liquidadas: qPagadas,
          estado,
          fecha_liquidacion: fecha,
        },
      ]);
      if (error) throw error;
    }

    document.getElementById("modalPago").style.display = "none";
    cargarPagos();
    mostrarModalAlerta(
      pagoEditando
        ? "✅ Pago actualizado correctamente"
        : "✅ Pago registrado correctamente",
    );
    pagoEditando = null;
  } catch (error) {
    console.error("Error guardando pago:", error);
    mostrarModalAlerta(
      "❌ No se pudo guardar el pago. " + mensajeErrorAmigable(error),
    );
  }
}

// Cambia el estado (dropdown). Si pasa a "liquidado", guarda la fecha de
// liquidación y ajusta las quincenas.
async function cambiarEstadoPago(id, nuevoEstado) {
  if (!id || !ESTADOS.includes(nuevoEstado)) return;
  if (typeof modalConfirmar === "function") {
    modalConfirmar(
      `¿Cambiar el estado de este pago a "${estadoLabel(nuevoEstado)}"?`,
      async () => {
        try {
          const { data, error } = await window.supabase
            .from("pagos")
            .select("*")
            .eq("id", id)
            .single();
          if (error) throw error;
          const esLiquidado = nuevoEstado === "liquidado";
          const updates = {
            estado: nuevoEstado,
            updated_at: new Date().toISOString(),
          };
          if (esLiquidado) {
            const totales = Number(data.quincenas_totales) || 0;
            updates.quincenas_pendientes = 0;
            updates.quincenas_pagadas = totales;
            updates.quincenas_liquidadas = totales;
            updates.fecha_liquidacion = new Date().toISOString();
          } else {
            // Si sale del estado "liquidado" (volvió a comprar), se reinicia
            // la fecha de liquidación: solo se repone al liquidar de nuevo.
            updates.fecha_liquidacion = null;
          }
          const { error: upError } = await window.supabase
            .from("pagos")
            .update(updates)
            .eq("id", id);
          if (upError) throw upError;
          cargarPagos();
          mostrarModalAlerta(
            `✅ Estado actualizado a "${estadoLabel(nuevoEstado)}"`,
          );
        } catch (error) {
          console.error("Error cambiando estado:", error);
          mostrarModalAlerta(
            "❌ Error al cambiar el estado: " + mensajeErrorAmigable(error),
          );
        }
      },
    );
  }
}

async function liquidarPago(id) {
  if (typeof modalConfirmar === "function") {
    modalConfirmar(
      "¿Liquidar este adeudo? Se pondrá en $0, quincenas pendientes en 0 y se guardará la fecha de liquidación.",
      async () => {
        try {
          const { data, error } = await window.supabase
            .from("pagos")
            .select("*")
            .eq("id", id)
            .single();
          if (error) throw error;
          // No se puede liquidar un adeudo que ya está en $0.
          if ((Number(data.adeudo_total) || 0) <= 0) {
            mostrarModalAlerta(
              "⚠️ No se puede liquidar porque el adeudo total ya está en $0.",
            );
            return;
          }
          const totales = Number(data.quincenas_totales) || 0;
          const adeudoLiquidado = Number(data.adeudo_total) || 0;
          const { error: upError } = await window.supabase
            .from("pagos")
            .update({
              adeudo_total: 0,
              quincenas_pendientes: 0,
              quincenas_pagadas: totales,
              quincenas_liquidadas: totales,
              estado: "liquidado",
              fecha_liquidacion: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);
          if (upError) throw upError;
          // La liquidación deja el adeudo en $0; el monto liquidado sí se
          // registra como ingreso en Finanzas (suma a Ingresos y Ganancia).
          if (adeudoLiquidado > 0) {
            const { error: finError } = await window.supabase
              .from("finanzas")
              .insert([
                {
                  tipo: "ingreso",
                  categoria: "abono",
                  descripcion: `Liquidación de ${data.cliente || "cliente"}`,
                  monto: adeudoLiquidado,
                },
              ]);
            if (finError) throw finError;
          }
          cargarPagos();
          if (typeof cargarFinanzas === "function") cargarFinanzas();
          mostrarModalAlerta(
            "✅ Adeudo liquidado y fecha de liquidación guardada",
          );
        } catch (error) {
          console.error("Error liquidando:", error);
          mostrarModalAlerta(
            "❌ Error al liquidar: " + mensajeErrorAmigable(error),
          );
        }
      },
    );
  }
}

async function cargarMorosidadPago(id) {
  if (typeof modalConfirmar === "function") {
    modalConfirmar(
      `¿Cargar morosidad? El adeudo total aumentará $${CARGO_MOROSIDAD} MXN (NO modifica las quincenas).`,
      async () => {
        try {
          const { data, error } = await window.supabase
            .from("pagos")
            .select("*")
            .eq("id", id)
            .single();
          if (error) throw error;
          const baseAdeudo = Number(data.adeudo_total) || 0;
          const update = {
            adeudo_total: baseAdeudo + CARGO_MOROSIDAD,
            estado: "al_corriente",
            updated_at: new Date().toISOString(),
          };
          // Si estaba liquidado y se le carga morosidad, dejó de estarlo:
          // se reinicia la fecha de liquidación.
          if (data.fecha_liquidacion) update.fecha_liquidacion = null;
          const { error: upError } = await window.supabase
            .from("pagos")
            .update(update)
            .eq("id", id);
          if (upError) throw upError;
          cargarPagos();
          mostrarModalAlerta(
            `✅ Morosidad cargada: +$${CARGO_MOROSIDAD} MXN al adeudo total`,
          );
        } catch (error) {
          console.error("Error cargando morosidad:", error);
          mostrarModalAlerta(
            "❌ Error al cargar morosidad: " + mensajeErrorAmigable(error),
          );
        }
      },
    );
  }
}

// Ajusta quincenas pagadas/liquidadas/pendientes manteniendo consistencia.
async function ajustarQuincenas(id, delta, exitoMsg) {
  try {
    const { data, error } = await window.supabase
      .from("pagos")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;

    const totales = Number(data.quincenas_totales) || 0;

    if (totales <= 0) {
      mostrarModalAlerta(
        '⚠️ Este cliente no tiene "Quincenas totales" configuradas (está en 0), por eso no hay nada que sumar o restar. Edítalo con ✏️ y captura cuántas quincenas totales tiene su plan.',
      );
      return;
    }

    const pagadas = Math.min(
      Math.max(0, (Number(data.quincenas_pagadas) || 0) + delta),
      totales,
    );
    const pendientes = Math.max(0, totales - pagadas);

    // Reglas de estado al ajustar quincenas:
    //  · QUITAR quincena: solo vuelve a "liquidado" si las quincenas pagadas
    //    son iguales a las totales Y el adeudo total está en $0 (ambas).
    //    Si estaba liquidado pero no cumple ambas, pasa a "al corriente".
    //  · AGREGAR quincena: si el cliente estaba "liquidado" pasa a
    //    "al corriente" (posiblemente volvió a comprar) y se reinicia la
    //    fecha de liquidación.
    const adeudoNum = Number(data.adeudo_total) || 0;
    const esQuitar = delta < 0;
    let nuevoEstado = data.estado;
    let nuevaFechaLiquidacion; // undefined = no tocar la fecha

    if (esQuitar) {
      if (pagadas === totales && adeudoNum === 0) {
        nuevoEstado = "liquidado";
        nuevaFechaLiquidacion = new Date().toISOString();
      } else if (data.estado === "liquidado") {
        nuevoEstado = "al_corriente";
        nuevaFechaLiquidacion = null;
      }
    } else if (data.estado === "liquidado") {
      nuevoEstado = "al_corriente";
      nuevaFechaLiquidacion = null;
    }

    const baseUpdate = {
      quincenas_pagadas: pagadas,
      quincenas_liquidadas: pagadas,
      quincenas_pendientes: pendientes,
      estado: nuevoEstado,
      updated_at: new Date().toISOString(),
    };
    if (nuevaFechaLiquidacion !== undefined) {
      baseUpdate.fecha_liquidacion = nuevaFechaLiquidacion;
    }

    let upError = null;
    // Intenta actualizar todas las columnas (pagadas/liquidadas).
    try {
      const { error } = await window.supabase
        .from("pagos")
        .update(baseUpdate)
        .eq("id", id);
      upError = error;
    } catch (e) {
      upError = e;
    }

    // Si las columnas nuevas aún no existen (SQL no re-ejecutado),
    // degrada para que al menos quincenas_pendientes se actualice.
    if (
      upError &&
      /quincenas_pagadas|quincenas_liquidadas|Could not find/i.test(
        String(upError.message || ""),
      )
    ) {
      const fallbackUpdate = {
        quincenas_pendientes: pendientes,
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      };
      if (nuevaFechaLiquidacion !== undefined) {
        fallbackUpdate.fecha_liquidacion = nuevaFechaLiquidacion;
      }
      const { error: fbErr } = await window.supabase
        .from("pagos")
        .update(fallbackUpdate)
        .eq("id", id);
      if (fbErr) throw fbErr;
      cargarPagos();
      mostrarModalAlerta(
        exitoMsg +
          " (las quincenas pagadas se mostrarán en 0 hasta re-ejecutar el SQL de pagos)",
      );
      return;
    }
    if (upError) throw upError;

    cargarPagos();
    mostrarModalAlerta(exitoMsg);
  } catch (error) {
    console.error("Error ajustando quincena:", error);
    mostrarModalAlerta(
      "❌ Error al ajustar quincena: " + mensajeErrorAmigable(error),
    );
  }
}

function aumentarQuincenaPago(id) {
  if (typeof modalConfirmar === "function") {
    modalConfirmar(
      "¿Marcar UNA quincena como pagada? Se suma a quincenas pagadas y baja una pendiente.",
      () => ajustarQuincenas(id, 1, "✅ Quincena marcada como pagada"),
    );
  }
}

function quitarQuincenaPago(id) {
  if (typeof modalConfirmar === "function") {
    modalConfirmar(
      "¿Quitar UNA quincena como pagada? Se resta a quincenas pagadas y sube una pendiente.",
      () => ajustarQuincenas(id, -1, "✅ Quincena pagada removida"),
    );
  }
}

function abrirCargoPago(id, esCargo) {
  // El botón "− Abono" (esCargo=false) no puede usarse si el adeudo está en $0.
  if (!esCargo && id) {
    const row = document.querySelector(`tr[data-pago-id="${id}"]`);
    const adeudoFila = row
      ? Number(row.dataset.adeudototal || row.getAttribute("data-adeudototal"))
      : 0;
    if (!isNaN(adeudoFila) && adeudoFila <= 0) {
      mostrarModalAlerta(
        "⚠️ No se puede abonar porque el adeudo total ya está en $0.",
      );
      return;
    }
  }
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
  const esCargo = document.getElementById("cargoEsCargo").value === "1";
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

    const adeudo = Number(data.adeudo_total) || 0;

    // Refuerzo: el abono no se permite cuando el adeudo ya está en $0.
    if (!esCargo && adeudo <= 0) {
      mostrarModalAlerta(
        "⚠️ No se puede abonar porque el adeudo total ya está en $0.",
      );
      return;
    }

    const nuevoAdeudo = esCargo
      ? adeudo + monto
      : Math.max(0, adeudo - monto);

    const quedaLiquidado = nuevoAdeudo <= 0;
    const updates = {
      adeudo_total: nuevoAdeudo,
      estado: quedaLiquidado ? "liquidado" : "al_corriente",
      updated_at: new Date().toISOString(),
    };
    // Si estaba liquidado y se le aplica cargo o abono, dejó de estarlo
    // (posiblemente volvió a comprar): se reinicia la fecha de liquidación.
    if (data.fecha_liquidacion) {
      updates.fecha_liquidacion = null;
    } else if (quedaLiquidado) {
      updates.fecha_liquidacion = new Date().toISOString();
    }

    const { error: upError } = await window.supabase
      .from("pagos")
      .update(updates)
      .eq("id", id);
    if (upError) throw upError;

    // Solo el ABONO genera un movimiento de ingreso en Finanzas
    // (suma a Ingresos y Ganancia). Los cargos y las moras NO se
    // reflejan en Finanzas: solo modifican el adeudo del cliente.
    // Los gastos nunca se tocan desde la tab Pagos.
    if (!esCargo && monto > 0) {
      const { error: finError } = await window.supabase.from("finanzas").insert([
        {
          tipo: "ingreso",
          categoria: "abono",
          descripcion: `Abono de ${data.cliente || "cliente"}`,
          monto: monto,
        },
      ]);
      if (finError) throw finError;
    }

    cargarPagos();
    if (typeof cargarFinanzas === "function") cargarFinanzas();
    mostrarModalAlerta(
      esCargo
        ? `✅ Cargo añadido: +${formatearMoneda(monto)}`
        : `✅ Abono deducido: −${formatearMoneda(monto)}${quedaLiquidado ? " · Adeudo liquidado" : ""}`,
    );
  } catch (error) {
    console.error("Error aplicando cargo:", error);
    mostrarModalAlerta("❌ Error al aplicar: " + mensajeErrorAmigable(error));
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
        mostrarModalAlerta(
          "❌ Error al eliminar: " + mensajeErrorAmigable(error),
        );
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
          adeudo_total: 1200,
          quincenas_totales: 4,
          quincenas_pagadas: 0,
          quincenas_liquidadas: 0,
          quincenas_pendientes: 4,
          estado: "en_mora",
          fecha_liquidacion: null,
        },
        {
          cliente: "Cliente Demo 2",
          adeudo_total: 500,
          quincenas_totales: 2,
          quincenas_pagadas: 1,
          quincenas_liquidadas: 1,
          quincenas_pendientes: 1,
          estado: "al_corriente",
          fecha_liquidacion: null,
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
window.sincronizarQuincenas = sincronizarQuincenas;
window.cambiarEstadoPago = cambiarEstadoPago;
window.liquidarPago = liquidarPago;
window.cargarMorosidadPago = cargarMorosidadPago;
window.aumentarQuincenaPago = aumentarQuincenaPago;
window.quitarQuincenaPago = quitarQuincenaPago;
window.abrirCargoPago = abrirCargoPago;
window.confirmarCargoPago = confirmarCargoPago;
window.pedirEliminarPago = pedirEliminarPago;
window.cargarPagosDummySiVacio = cargarPagosDummySiVacio;
