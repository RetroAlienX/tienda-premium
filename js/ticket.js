// ============================================
// GENERADOR DE TICKETS - ROUTE66 MARKET
// ============================================

const TIENDA = {
  nombre: "Route66 JV Market",
  direccion: "McAllen, TX - Monterrey, MX",
  telefono: "📱 81 2687 8080",
  email: "✉️ theroute66jvmarket@outlook.com",
  website: "🌐 https://theroute66jvmarket.netlify.app/",
};

const ESTADO_PEDIDO_LABEL = {
  pendiente: "📋 PENDIENTE",
  confirmado: "✅ CONFIRMADO",
  vendido: "💰 VENDIDO",
  entregado: "📦 ENTREGADO",
  cancelado: "❌ CANCELADO",
  devuelto: "↩️ DEVUELTO",
};

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
        <div class="ticket-header">
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
              datos.estado
                ? `<div>ESTADO: ${
                    ESTADO_PEDIDO_LABEL[datos.estado] ||
                    datos.estado.toUpperCase()
                  }</div>`
                : ""
            }
        </div>
        <div style="margin:8px 0;">
            <strong>DATOS DEL CLIENTE</strong>
            <div>${datos.cliente || "No especificado"}</div>
            <div>📱 ${datos.telefono || "No especificado"}</div>
            ${datos.direccion ? `<div>📍 ${datos.direccion}</div>` : ""}
            ${datos.lugar_entrega ? `<div>🚚 ${datos.lugar_entrega}</div>` : ""}
        </div>
        <hr>
        <div><strong>PRODUCTOS</strong></div>
    `;

  datos.items.forEach((item) => {
    const cant = item.cantidad || 1;
    html += `
            <div class="ticket-item">
                <span>${item.nombre}</span>
                <span>×${cant}</span>
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
                <span>SUBTOTAL</span>
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
            <div style="display:flex;justify-content:space-between;font-size:16px;border-top:2px solid #000;padding-top:5px;margin-top:5px;">
                <span>TOTAL</span>
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
            <div style="font-size:9px;margin-top:6px;line-height:1.4;color:#555;">Nota: los cambios y devoluciones están sujetos a las políticas de Route66 JV Market. Conserva este ticket como comprobante de compra.</div>
            <div>${TIENDA.website}</div>
            <div style="font-size:10px;margin-top:8px;">* Comprobante de compra *</div>
            <div style="font-size:14px;letter-spacing:2px;margin-top:5px;">${Array(
              20,
            )
              .fill("█")
              .join("")}</div>
        </div>
    `;

  container.innerHTML = html;
}
