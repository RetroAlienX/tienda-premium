// ============================================
// GENERADOR DE TICKETS - ROUTE66 MARKET
// ============================================

const TIENDA = {
  nombre: "✦ Route66 JV Market",
  direccion: "McAllen, TX - Monterrey, MX",
  telefono: "📱 81 2687 8080",
  email: "✉️ theroute66jvmarket@outlook.com",
  website: "🌐 theroute66jvmarket.netlify.app",
};

const ESTADO_PEDIDO_LABEL = {
  pendiente: "📋 PENDIENTE",
  confirmado: "✅ CONFIRMADO",
  vendido: "💰 VENDIDO",
  entregado: "📦 ENTREGADO",
  cancelado: "❌ CANCELADO",
  devuelto: "↩️ DEVUELTO",
};

// Fecha de entrega en formato dd/mm/aaaa (sin hora).
function formatearFechaDevolucion(fechaISO) {
  const d = new Date(fechaISO);
  if (isNaN(d.getTime())) return String(fechaISO || "");
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Suma días a una fecha ISO y la devuelve igual como ISO de fecha.
function sumarDias(fechaISO, dias) {
  const d = new Date(fechaISO);
  if (isNaN(d.getTime())) return fechaISO;
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function generarTicket(datos) {
  const container = document.getElementById("ticketBody");
  if (!container) return;

  const fecha = new Date(datos.fecha || Date.now());
  const f = formatearFecha(fecha);

  const envio = Number(datos.envio) || 0;

  // "subtotal" ya incluye productos + envío (así se pidió: el descuento
  // se aplica sobre productos + envío, no solo sobre los productos).
  const subtotal =
    datos.subtotal !== undefined && datos.subtotal !== null
      ? Number(datos.subtotal)
      : datos.items.reduce((s, i) => s + i.precio * (i.cantidad || 1), 0) +
        envio;

  // El descuento llega como PORCENTAJE (0-100), no como monto en pesos.
  const descuentoPct = Number(datos.descuento) || 0;
  const descuentoMonto = subtotal * (descuentoPct / 100);

  const totalFinal =
    datos.total !== undefined && datos.total !== null
      ? Number(datos.total)
      : subtotal - descuentoMonto;

  const num = `T-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(
    2,
    "0",
  )}${String(fecha.getDate()).padStart(2, "0")}-${String(
    Math.floor(Math.random() * 10000),
  ).padStart(4, "0")}`;

  let html = `
        <div class="ticket-header" style="overflow-wrap:break-word;">
            <h2>${TIENDA.nombre}</h2>
            <div>${TIENDA.direccion}</div>
            <div>${TIENDA.telefono}</div>
            <div>${TIENDA.email}</div>
            <div>${TIENDA.website}</div>
            <hr>
            <div><strong>TICKET: ${num}</strong></div>
            ${
              datos.numero_pedido
                ? `<div><strong>PEDIDO: ${datos.numero_pedido}</strong></div>`
                : ""
            }
            <div>FECHA: ${f}</div>
            ${
              datos.entrega_dia
                ? `<div>ENTREGA: ${formatearFechaDevolucion(
                    datos.entrega_dia,
                  )}</div>`
                : ""
            }
            ${
              datos.entrega_dia
                ? `<div>DEVOLUCIONES HASTA: ${formatearFechaDevolucion(
                    sumarDias(datos.entrega_dia, 3),
                  )}</div>`
                : ""
            }
            ${
              datos.estado
                ? `<div>ESTADO: ${
                    ESTADO_PEDIDO_LABEL[datos.estado] ||
                    datos.estado.toUpperCase()
                  }</div>`
                : ""
            }
        </div>
        <div style="margin:8px 0; overflow-wrap:break-word;">
            <strong>DATOS DEL CLIENTE</strong>
            <div>${datos.cliente || "No especificado"}</div>
            <div>📱 ${datos.telefono || "No especificado"}</div>
            ${datos.direccion ? `<div>📍 ${datos.direccion}</div>` : ""}
            ${datos.lugar_entrega ? `<div>🚚 ${datos.lugar_entrega}</div>` : ""}
            ${
              datos.punto_entrega
                ? `<div style="color:#e74c3c;">📍 ${datos.punto_entrega}</div>`
                : ""
            }
        </div>
        <hr>
        <div><strong>PRODUCTOS</strong></div>
    `;

  datos.items.forEach((item) => {
    const cant = item.cantidad || 1;
    html += `
            <div class="ticket-item">
                <span class="ticket-item-nombre">${item.nombre}</span>
                <span class="ticket-item-detalle">$${item.precio.toFixed(
                  2,
                )} x${cant}</span>
                <span>$${(item.precio * cant).toFixed(2)}</span>
            </div>
        `;
  });

  html += `
        <hr>
        <div class="ticket-total">
            ${
              envio > 0
                ? `
                <div style="display:flex;justify-content:space-between;font-weight:normal;">
                    <span>ENVÍO</span>
                    <span>$${envio.toFixed(2)}</span>
                </div>
            `
                : ""
            }
            <div style="display:flex;justify-content:space-between;font-weight:normal;">
                <span>SUBTOTAL (CON IVA)</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            ${
              descuentoPct > 0
                ? `
                <div style="display:flex;justify-content:space-between;font-weight:normal;">
                    <span>DESCUENTO (${descuentoPct}%)</span>
                    <span>-$${descuentoMonto.toFixed(2)}</span>
                </div>
            `
                : ""
            }
            <div class="ticket-linea-iva" style="display:flex;justify-content:space-between;font-weight:normal;">
                <span>IVA ${TASA_IVA}%</span>
                <span>$${desglosarIVA(totalFinal).iva.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;border-top:2px solid #000;padding-top:5px;margin-top:5px;">
                <span>TOTAL (CON IVA)</span>
                <span>$${totalFinal.toFixed(2)}</span>
            </div>
        </div>
        <hr>
        <div style="margin:8px 0;">
            <strong>MÉTODO DE PAGO:</strong> ${
              datos.metodo_pago || "Transferencia/Efectivo"
            }
        </div>
        <hr>
        <div class="ticket-footer">
            <div class="thanks">¡GRACIAS POR TU COMPRA! 🖤</div>
            <div style="font-size:8px;margin-top:6px;line-height:1.4;color:#000;">Devoluciones: 3 días desde la recepción del producto. Regresa en su empaque original, sellado y sin uso; en consumibles (alimentos, geles de manos, perfumes...) debe estar sellado como se recibió, o la devolución/garantía queda invalidada.</div>
            <div style="font-size:9px;margin-top:8px;">* Comprobante de compra *</div>
            <div style="font-size:12px;letter-spacing:2px;margin-top:5px;">${Array(
              20,
            )
              .fill("█")
              .join("")}</div>
        </div>
        ${
          datos.numero_pedido
            ? `
        <hr>
        <div style="margin:8px 0; display:flex; flex-direction:column; align-items:center; text-align:center;">
            <div style="font-size:8px; letter-spacing:1px; margin-bottom:3px;">CÓDIGO DE PEDIDO (informativo)</div>
            <svg data-barcode-ticket="${String(datos.numero_pedido).replace(
              /"/g,
              "&quot;",
            )}" style="display:block; max-width:100%; height:auto; margin:0 auto;"></svg>
            <div style="font-size:9px; margin-top:2px;">${datos.numero_pedido}</div>
        </div>
        `
            : ""
        }
    `;

  container.innerHTML = html;

  // Dibuja el código de barras del pedido (CODE128) si JsBarcode está cargado.
  if (window.JsBarcode) {
    container.querySelectorAll("svg[data-barcode-ticket]").forEach((el) => {
      const codigo = el.getAttribute("data-barcode-ticket");
      try {
        JsBarcode(el, codigo, {
          format: "CODE128",
          width: 1,
          height: 36,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
        });
        // JsBarcode a veces deja el atributo width/height del SVG desajustado
        // respecto a su propio viewBox, lo que provoca que el navegador lo
        // "estire" hacia un lado en vez de centrarlo. Forzamos que el ancho
        // visible coincida exactamente con el viewBox real que dibujó.
        const viewBox = el.getAttribute("viewBox");
        if (viewBox) {
          const partes = viewBox.split(/\s+/).map(Number);
          if (partes.length === 4 && partes[2] > 0) {
            el.style.width = partes[2] + "px";
          }
        }
      } catch (e) {
        console.warn("No se pudo dibujar el código de pedido:", codigo, e);
      }
    });
  }
}
