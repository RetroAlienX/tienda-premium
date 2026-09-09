// ============================================
// IMPRESIÓN DIRECTA CON QZ TRAY (ESC/POS 58mm)
// Route66 JV Market
// ============================================
// QZ Tray es un programa local que permite imprimir a la impresora térmica
// directo por USB/red (comandos ESC/POS), evitando los problemas de
// márgenes/escala/tamaño de papel del navegador (Chrome).
//
// Requisitos:
//  1. Descargar e instalar QZ Tray: https://qz.io (versión gratuita).
//  2. Generar las "Demo Keys" en QZ Tray:
//       QZ Tray > Advanced > Site Manager > "+" > Create New
//       -> Yes (crear llaves) > Yes (instalar) > Yes (copiar a override.crt)
//     Esto crea la carpeta "QZ Tray Demo Cert" en el Escritorio con
//     digital-certificate.txt y private-key.pem.
//  3. Pegar el contenido de ambos archivos en QZ_DEMO_CERT y QZ_DEMO_KEY.
// ============================================

// ⚠️ LLENAR: pega aquí el CERTIFICADO (contenido de digital-certificate.txt)
// entre los marcadores BEGIN/END CERTIFICATE. Si lo dejas vacío, QZ usará el
// diálogo de confianza normal (botón "Allow" cada vez).
const QZ_DEMO_CERT = `-----BEGIN CERTIFICATE-----
MIIECzCCAvOgAwIBAgIGAaBrJttmMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQG
EwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwS
UVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMx
HDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkg
RGVtbyBDZXJ0MB4XDTI2MDkwMzA2NDE0M1oXDTQ2MDkwMzA2NDE0M1owgaIxCzAJ
BgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYD
VQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMs
IExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVog
VHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDi
KqMNv6RrJuXweAo8etjL0xfL0FZtEQxuVlWtS619forqVh5Zt+lnsWWC4TMSofrQ
pw7Qg6+P0oz8iMkqV8Kl5QLWQIWvQh96xpdmOI92bqdQZN4sN8BzJiBelsVMTw/w
Hxby4JiPykUekiuPGdmpUBF097CTq2dm8tAk45WdIf6I5yhU2hylhaApT61FNtdE
LC3kY65HsTYrDRsRasjM32d7rdGD5BoR5Q5yAnpAuF7z138y7P+iDrZ5rYtg9BKb
L5pUd8G1NhHFJL7LydGjr2nmcZHLrp6cEIbox5LClDaFvL55nE2yLFTV5YNm48TK
WHlg9gMZrRkjaZn45wg1AgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYD
VR0PAQH/BAQDAgEGMB0GA1UdDgQWBBRsQ7km3V5CXzJ/Nn0ruy/BzdTcFzANBgkq
hkiG9w0BAQsFAAOCAQEA4TsxS/+x7Pn2btzb85o5f4wbJ5qA1zuoPcDj9PMEPvPh
0W+wMnSUfj8ny0zAHxR6c6hrHPaANa9bNn7Yso51OQ6/OsiWOYAduCmEVwBZ7yvt
JPbfM+CzZ8AT0U98NBgvqacBdXAc0szbWk9Q4pe6FdKFlRIP4dc34isHr5v1Qkfs
Jdhm7KyNWjWDMfJRWBo8o+eWRdXmIBlxBfLzC1wnaFi5r05eIQ71EnQeqpriPaFy
er40h6ckF3NHpAjRoLM126GlcO0jHCLPLp2Vdtvqes8U65BwWz7XDPmAUwfL/Zio
WGAZVs2zupbMlBlnbs2sa1QPtvqGE67si+tI0F5+xw==
-----END CERTIFICATE-----`;

// ⚠️ LLENAR: pega aquí la LLAVE PRIVADA (contenido de private-key.pem, que
// empieza con "-----BEGIN PRIVATE KEY-----").
const QZ_DEMO_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDiKqMNv6RrJuXw
eAo8etjL0xfL0FZtEQxuVlWtS619forqVh5Zt+lnsWWC4TMSofrQpw7Qg6+P0oz8
iMkqV8Kl5QLWQIWvQh96xpdmOI92bqdQZN4sN8BzJiBelsVMTw/wHxby4JiPykUe
kiuPGdmpUBF097CTq2dm8tAk45WdIf6I5yhU2hylhaApT61FNtdELC3kY65HsTYr
DRsRasjM32d7rdGD5BoR5Q5yAnpAuF7z138y7P+iDrZ5rYtg9BKbL5pUd8G1NhHF
JL7LydGjr2nmcZHLrp6cEIbox5LClDaFvL55nE2yLFTV5YNm48TKWHlg9gMZrRkj
aZn45wg1AgMBAAECggEAWwub+ShpWYNetGe2gzNW+/J+FVvItv5SeUaDFhCthiP/
ayeA71Akg0w8F6xtoXYYoI9n3NPuRGEXxX+RL90FbEAdXL+7sVpWjtfMUee6BQy1
iR0Z/UXyUMiL5lgek8IOIfV6CQsWD2h3W7+vDlvzLgAgDuy5JjEtnpln5jnB3G91
Y1mjP9DxOkkGKTzMEKgBssLFAqFNSzm1WeIjd7phuXVWYaapuv427mQXrmBfmLoD
mcSkVx+IgXyGnj04wBPGgaZJy+flDT7Za8SMTW7lVENCN1lQfth01KDlm6cUPgV9
fcXuRkMtr8C1BS2e4UDlLajbOn7zwFisoUjvtriNvwKBgQD970lk+vMN+w2zrfiB
ch4uObw9QJOpD7QL8gOamTwjriwLTFOw7C9FsD75KyWNIXhirBMDIJUEREPMtLnc
uoaV/gr1tED81rXr3qWGLw0737mTFSd6P3FVcgkzn2jjuV7HsqyUXzGwsmfbwbpG
t5GWbBvTeOc2m4H9G6Sdh0WtewKBgQDkAYjbLGlB0ezFy/E1ssES764xw+dPLYJc
36jAKzJmksbngG2rzkifdAWcxoGARe+zgcbmVfzBDbhIF/JWoeuSbEdfP930RhSb
xXUJZ8dGj1aBLxjFZvCjDQIlcn70Ex+TbFMD/b+K9M76pkCTAyuYoSky3UfKEaav
+UHkpkw6DwKBgHf3vqL4dC/cteJ3hHoTYfLQz//YLGqowpUKJ224i1MIDELiMn/Z
dZPk6jtpiPoeH/Pt+6V0lTJI1gc2MsD3VnIybRcbq8BH5/ahX23/eK8ayV+VlOsK
Yg7OK066NyGvB/osjaAjQSSLhMmrwsd6HkwEkzjbW9DOsyDTGHhb2i1VAoGAG+GM
KLD/lgrjlzRfJJ/dOEGS3YcFLAt2m4DGE+m0WhKsu/Zact3gx47aeNdVUqg6rYq7
FcOCCuFwnXBANBPMyLTw7VbT/2DqeDnnG+VS2vAANf/aWZlC581Za9baa2JDRDXE
2QIYgBd7j+7wiomitSFP9mZUtwL9jRs/0YP8YkUCgYBjBYNzI79rAlBjyv7ATL7F
/8Nlj7EvnT3p5v2anopPaH4O787OYWAz3+IGTV5xl2VN9TDJ3VML7O5CXABV7k6o
UvPEkzHfMhxi+gJlH8YDoFOU+5Ss80OlFXk+vie9/mtAwWI18/WnoDa6+2py0WVz
XzyiNqxU2NHwa4it67U31Q==
-----END PRIVATE KEY-----`;

// Prefijo ASCII: simboliza que enviamos ESC/POS en texto plano con fuentes A/B.
const ESC = "\x1B";
const NEW_LINE = "\n";

// Estructura de datos auto-contenida (no depende de ticket.js, porque este
// archivo también se carga en el panel admin donde ticket.js no existe).
const QZ_ESTADO_LABEL = {
  pendiente: "PENDIENTE",
  confirmado: "CONFIRMADO",
  vendido: "VENDIDO",
  entregado: "ENTREGADO",
  cancelado: "CANCELADO",
  devuelto: "DEVUELTO",
};

function qzFormatearFecha(fecha) {
  try {
    const d = new Date(fecha);
    if (isNaN(d)) return String(fecha || "");
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return dd + "/" + mm + "/" + yyyy + " " + hh + ":" + mi;
  } catch (e) {
    return String(fecha || "");
  }
}

// Utilidades: reutiliza las funciones globales si existen; si no, usa locales.
function qzFmtFecha(fecha) {
  if (typeof formatearFecha === "function") return formatearFecha(fecha);
  return qzFormatearFecha(fecha);
}
function qzEstadoLabel(estado) {
  if (estado && QZ_ESTADO_LABEL[estado]) return QZ_ESTADO_LABEL[estado];
  return (estado || "").toUpperCase();
}

// ============================================
// Utilidades de texto para 58mm (ancho de impresión ~32 caracteres
// en fuente normal).
// ============================================
function qzCentrar(texto, ancho) {
  texto = String(texto);
  const t = Math.max(0, ancho - texto.length);
  const izq = Math.floor(t / 2);
  const der = t - izq;
  return " ".repeat(izq) + texto + " ".repeat(der);
}

function qzLinea(ancho, char) {
  return (char || "-").repeat(ancho);
}

// Separa nombre y detalle a los extremos (izquierda y derecha) en una línea.
function qzFila(izq, der, ancho) {
  izq = String(izq);
  der = String(der);
  const espacios = Math.max(1, ancho - izq.length - der.length);
  return izq + " ".repeat(espacios) + der;
}

// Convierte etiquetas a una versión imprimible sin emojis (la térmica de
// 58mm no tiene juego de caracteres con emojis; salen como cuadros).
function qzSinEmojis(texto) {
  return String(texto)
    .replace(/[📱✉️🌐✦📍🚚📋✅💰📦❌↩️🖤]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ============================================
// Código de barras CODE128 como imagen (GS v 0).
// Esta impresora NO soporta GS k, así que se rasteriza el código: se genera
// la secuencia de módulos CODE128, se convierten a una imagen 1-bit y se envía
// como mapa de puntos con el comando universal de imagen ESC/POS.
// ============================================
const C128_PAT = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
  "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
  "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
  "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
  "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
  "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
  "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
  "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
  "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
  "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
  "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
  "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
  "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
  "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
  "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
  "10111101110", "11101011110", "11110101110", "11010000100", "11010010000",
  "11010011100", "1100011101011",
];
// Ancho de impresión en puntos de una térmica 58mm (384 dots ≈ 48mm); el
// rectángulo de referencia se hace con el mismo comando.
const ESCPOS_ANCHO_PTS = 384;

function escposCodigo128Raster(codigo, alturaDots) {
  const texto = String(codigo || "").toUpperCase();
  const vals = [104]; // START CODE SET B
  for (let i = 0; i < texto.length; i++) {
    let v = texto.charCodeAt(i) - 32;
    if (v < 0 || v > 94) v = 63; // '?' por caracteres fuera de CODE-B
    vals.push(v);
  }
  let suma = 104;
  for (let i = 1; i < vals.length; i++) suma += vals[i] * i;
  vals.push(suma % 103); // checksum
  vals.push(106); // stop

  const quiet = 10;
  let mods = [];
  for (let i = 0; i < quiet; i++) mods.push(0);
  for (let i = 0; i < vals.length; i++) {
    const p = C128_PAT[vals[i]] || C128_PAT[106];
    for (let k = 0; k < p.length; k++) mods.push(p[k] === "1" ? 1 : 0);
  }
  for (let i = 0; i < quiet; i++) mods.push(0);

  const MW = mods.length * 2 > ESCPOS_ANCHO_PTS ? 1 : 2;
  const ancho = mods.length * MW;
  const xIni = Math.floor((ESCPOS_ANCHO_PTS - ancho) / 2);
  const xBytes = Math.ceil(ancho / 8);
  const filas = [];
  for (let y = 0; y < alturaDots; y++) {
    for (let i = 0; i < xBytes; i++) {
      let byte = 0;
      for (let b = 0; b < 8; b++) {
        const dot = i * 8 + b;
        if (dot < ancho && mods[Math.floor(dot / MW)] === 1) byte |= 0x80 >> b;
      }
      filas.push(byte);
    }
  }
  const bytes = [
    0x1b, 0x24, xIni & 0xff, (xIni >> 8) & 0xff, // ESC $  posición absoluta (centra)
    0x1d, 0x76, 0x30, 0x00, // GS v 0 m=0
    xBytes & 0xff, (xBytes >> 8) & 0xff, // ancho en bytes
    alturaDots & 0xff, (alturaDots >> 8) & 0xff, // alto en puntos
  ].concat(filas);
  return String.fromCharCode.apply(null, bytes);
}

// ============================================
// Constructor del contenido del ticket (ESC/POS).
// ============================================
function construirTicketESC(datos) {
  const ANCHO = 32; // caracteres por línea a 58mm con fuente normal
  const fecha = new Date(datos.fecha || Date.now());
  const f = qzFmtFecha(fecha);

  const envio = Number(datos.envio) || 0;
  const subtotal =
    datos.subtotal !== undefined && datos.subtotal !== null
      ? Number(datos.subtotal)
      : datos.items.reduce((s, i) => s + i.precio * (i.cantidad || 1), 0) +
        envio;
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

  const estado = qzEstadoLabel(datos.estado);

  const L = [];
  L.push(ESC + "@"); // inicializa la impresora (borra buffers)
  // Cabecera centrada
  L.push(qzCentrar("ROUTE66 JV MARKET", ANCHO));
  L.push(qzCentrar("McAllen, TX - Monterrey, MX", ANCHO));
  L.push(qzCentrar("Tel: 81 2687 8080", ANCHO));
  L.push(qzCentrar("theroute66jvmarket.netlify.app", ANCHO));
  L.push(qzLinea(ANCHO, "="));
  L.push(qzCentrar("TICKET: " + num, ANCHO));
  if (datos.numero_pedido) L.push(qzCentrar("PEDIDO: " + datos.numero_pedido, ANCHO));
  L.push(qzCentrar("FECHA: " + f, ANCHO));
  if (estado) L.push(qzCentrar("ESTADO: " + qzSinEmojis(estado), ANCHO));
  // Fecha de entrega y tope de devolución (3 días después de la entrega).
  if (datos.entrega_dia) {
    const fechaEntrega = new Date(datos.entrega_dia);
    if (!isNaN(fechaEntrega.getTime())) {
      const fe = qzFormatearFecha(fechaEntrega).slice(0, 10); // dd/mm/yyyy
      L.push(qzCentrar("ENTREGA: " + fe, ANCHO));
      if (datos.entrega_hora)
        L.push(qzCentrar("HORA ENTREGA: " + datos.entrega_hora, ANCHO));
      const finDevolucion = new Date(fechaEntrega);
      finDevolucion.setDate(finDevolucion.getDate() + 3);
      L.push(
        qzCentrar(
          "DEVOLUCIONES HASTA: " +
            qzFormatearFecha(finDevolucion).slice(0, 10),
          ANCHO,
        ),
      );
    }
  }
  L.push(qzLinea(ANCHO, "="));

  // Cliente
  L.push("CLIENTE");
  L.push("  " + (datos.cliente || "No especificado"));
  L.push("  Tel: " + (datos.telefono || "No especificado"));
  if (datos.direccion) L.push("  Dir: " + datos.direccion);
  if (datos.lugar_entrega) L.push("  Ent: " + qzSinEmojis(datos.lugar_entrega));
  if (datos.punto_entrega) L.push("  Punto: " + qzSinEmojis(datos.punto_entrega));
  L.push(qzLinea(ANCHO, "-"));

  // Productos
  L.push("PRODUCTOS");
  datos.items.forEach((item) => {
    const cant = item.cantidad || 1;
    L.push(item.nombre);
    L.push(qzFila("   $" + item.precio.toFixed(2) + " x" + cant,
      "$" + (item.precio * cant).toFixed(2), ANCHO));
  });
  L.push(qzLinea(ANCHO, "-"));

  // Totales
  if (envio > 0) L.push(qzFila("ENVIO", "$" + envio.toFixed(2), ANCHO));
  L.push(qzFila("SUBTOTAL (CON IVA)", "$" + subtotal.toFixed(2), ANCHO));
  if (descuentoPct > 0)
    L.push(qzFila("DESCUENTO (" + descuentoPct + "%)", "-$" + descuentoMonto.toFixed(2), ANCHO));
  L.push(ESC + "!" + String.fromCharCode(0x10)); // doble tamaño
  L.push(qzFila("TOTAL (CON IVA)", "$" + totalFinal.toFixed(2), ANCHO));
  L.push(ESC + "!" + String.fromCharCode(0x00)); // tamaño normal

  L.push(qzLinea(ANCHO, "="));
  L.push("METODO: " + (datos.metodo_pago || "Transferencia/Efectivo"));
  L.push(qzLinea(ANCHO, "="));

  // Pie
  L.push(qzCentrar("GRACIAS POR TU COMPRA", ANCHO));
  L.push(qzCentrar("Nota: cambios y devoluciones", ANCHO));
  L.push(qzCentrar("3 dias desde la recepcion.", ANCHO));
  L.push(qzCentrar("En su empaque ORIGINAL,", ANCHO));
  L.push(qzCentrar("sellado y sin uso. Si esta", ANCHO));
  L.push(qzCentrar("abierto o usado, no aplica.", ANCHO));
  L.push(qzCentrar("* COMPROBANTE DE COMPRA *", ANCHO));
  L.push(qzLinea(ANCHO, "*"));

  // Código de pedido en barras (CODE128 rasterizado): va al final, debajo del
  // pie. Su valor es el mismo N° de pedido (código UNICO por venta) que el
  // administrador puede escanear en Pedidos, Ticket o el correo para buscar el
  // pedido al instante. Es informativo para caja/depósito.
  // Esta POS58 NO soporta el comando ESC/POS GS k (imprimía el dato como texto),
  // así que se dibuja el código como imagen de mapa de bits con GS v 0.
  if (datos.numero_pedido) {
    const codigoPedido = String(datos.numero_pedido).toUpperCase();
    L.push(qzCentrar("CODIGO DE PEDIDO", ANCHO));
    L.push(qzCentrar("(informativo)", ANCHO));
    L.push(escposCodigo128Raster(codigoPedido, 48));
    L.push(qzCentrar(codigoPedido, ANCHO));
  }

  L.push("\n\n"); // espacio final
  L.push(ESC + "i"); // corta el papel (ESC i / GS V)
  return L.join(NEW_LINE);
}

// ============================================
// Firma (Certificate Signing) para imprimir en silencio.
// Elimina el diálogo "Invalid Certificate" usando las Demo Keys que QZ
// genera para tu equipo (QZ Tray > Advanced > Site Manager > + > Create New).
// ============================================
let qzSecurityConfigurado = false;
function qzConfigurarSeguridad($) {
  if (qzSecurityConfigurado || !QZ_DEMO_CERT || !QZ_DEMO_KEY) return;
  try {
    const forge = window.forge;
    if (!forge) return; // si no está forge, no se puede firmar -> usar modo normal

    qzSecurityConfigurado = true;
    $.security.setCertificatePromise(function (resolve, reject) {
      try {
        resolve(QZ_DEMO_CERT);
      } catch (e) {
        reject(e);
      }
    });
    $.security.setSignatureAlgorithm("SHA512");
    $.security.setSignaturePromise(function (toSign) {
      return function (resolve, reject) {
        try {
          const privateKey = forge.pki.privateKeyFromPem(QZ_DEMO_KEY);
          const md = forge.md.sha512.create();
          md.update(toSign, "utf8");
          const signature = privateKey.sign(md);
          resolve(forge.util.encode64(signature));
        } catch (e) {
          reject(e);
        }
      };
    });
  } catch (e) {
    // Si falla la configuración de la firma, se usa el diálogo normal.
    console.warn("No se pudo configurar la firma QZ:", e);
  }
}

// ============================================
// Impresión vía QZ Tray.
// ============================================
let qzConectado = false;
function qzConectar(impresora) {
  const $ = window.qz;
  if (!$ || typeof $.websocket !== "object") {
    return Promise.reject(
      new Error(
        "QZ Tray no está instalado o el script no se cargó. Instálalo en https://qz.io e inténtalo de nuevo.",
      ),
    );
  }
  qzConfigurarSeguridad($);
  // Proceso: conectar (una sola vez) -> encontrar impresora -> imprimir.
  const conectar = qzConectado
    ? Promise.resolve()
    : $.websocket.connect().then(function () {
        qzConectado = true;
      });
  return conectar
    .then(function () {
      // find() sin argumentos devuelve TODAS las impresoras del sistema.
      return $.printers.find();
    })
    .then(function (lista) {
      if (!lista || !lista.length) {
        throw new Error(
          "No se encontró ninguna impresora. Revisa que la térmica esté encendida y conectada, y que esté instalada en Windows.",
        );
      }
      // Los nombres pueden venir como string o como objeto con .name.
      function nom(p) {
        return typeof p === "string" ? p : p && (p.name || "");
      }
      // Usa la impresora pedida si existe; si no, la primera de la lista.
      if (impresora) {
        for (var i = 0; i < lista.length; i++) {
          if (nom(lista[i]) === impresora) return lista[i];
        }
      }
      return lista[0];
    });
}

function imprimirConQZ(datos, fallback) {
  const $ = window.qz;
  // Si QZ no está disponible o instalado, ejecuta el fallback (abrir ventana).
  if (!$ || typeof $.websocket !== "object") {
    console.warn("QZ no disponible; usando fallback.");
    if (typeof fallback === "function") fallback();
    return Promise.resolve();
  }
  const texto = construirTicketESC(datos);
  const impresora = qzNombreImpresora();

  return qzConectar(impresora)
    .then(function (impresoraObj) {
      // Se envía como bytes exactos (base64) para que el mapa de puntos del
      // código de barras (bits 0x00-0xFF) llegue intacto a la impresora.
      const bytes = new Uint8Array(texto.length);
      for (let i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i) & 0xff;
      const data = [
        {
          type: "raw",
          format: "base64",
          language: "POS",
          data: qzBytesABase64(bytes),
          options: {
            encoding: "windows-1252",
          },
        },
      ];
      const cfg = $.configs.create(impresoraObj);
      // Se envía en bloques de 512 bytes: el mapa de puntos del barcode hace
      // el trabajo pesado al final del ticket y, si se manda de golpe, rebasa
      // el buffer de la térmica (se corta justo en el barcode y no llega el
      // corte de papel). El chunking de QZ evita ese desbordamiento.
      return $.print(cfg, data, 512);
    })
    .then(function () {
      if (typeof mostrarModalAlerta === "function") {
        mostrarModalAlerta("✅ Ticket enviado a la impresora");
      }
    })
    .catch(function (err) {
      console.error("QZ error:", err);
      // Si hay un problema de conexión/firma con QZ, cae al fallback.
      if (typeof fallback === "function") fallback();
      else if (typeof mostrarModalAlerta === "function") {
        mostrarModalAlerta(
          "❌ No se pudo imprimir con QZ: " +
            (err && err.message ? err.message : err),
        );
      }
    })
    .then(function () {
      // Cierra la conexión para poder volver a imprimir después.
      const $ = window.qz;
      if ($ && typeof $.websocket === "object" && qzConectado) {
        qzConectado = false;
        try {
          return $.websocket.disconnect().catch(function () {});
        } catch (e) {
          return Promise.resolve();
        }
      }
    });
}

function qzNombreImpresora() {
  // Nombre exacto de la impresora térmica de 58mm, tal como aparece en
  // "Dispositivos e impresoras" de Windows / lo que QZ detecta.
  // Para ver el listado: abre la consola (F12) y ejecuta qzListarImpresoras()
  return "POS-58";
}

// Codifica bytes a base64 sin depender de helpers internos de QZ.
function qzBytesABase64(bytes) {
  const CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  let i;
  for (i = 0; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + CHARS[(n >> 6) & 63] + CHARS[n & 63];
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const n = bytes[i] << 16;
    out += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + "==";
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + CHARS[(n >> 6) & 63] + "=";
  }
  return out;
}

// Diagnóstico: lista las impresoras que QZ Tray detecta.
// Abre admin con la consola (F12) y ejecuta: qzListarImpresoras()
function qzListarImpresoras() {
  const $ = window.qz;
  if (!$ || typeof $.websocket !== "object") {
    console.warn("QZ no disponible.");
    return Promise.resolve([]);
  }
  qzConfigurarSeguridad($);
  return $.websocket
    .connect()
    .then(function () {
      qzConectado = true;
      return $.printers.find();
    })
    .then(function (arr) {
      console.log("OBJETOS de impresoras (sin procesar):", arr);
      const nombres = (arr || []).map(function (p) {
        if (!p) return "(nulo)";
        return (
          p &&
          (p.name || p.nameStr || p.printerName || p.location || p.label || p.id ||
            (p.info && p.info.name) || JSON.stringify(p))
        );
      });
      console.log("Nombres extraídos:", nombres);
      alert(
        "Impresoras detectadas por QZ (" + (arr || []).length + "):\n" +
          (nombres.length ? nombres.join("\n") : "(ninguna)"),
      );
      return nombres;
    })
    .then(function (nombres) {
      const $ = window.qz;
      if ($ && typeof $.websocket === "object" && qzConectado) {
        qzConectado = false;
        try {
          return $.websocket.disconnect().catch(function () {});
        } catch (e) {}
      }
      return nombres;
    });
}

// Función para imprimir desde el admin: intenta QZ y, si no, abre el ticket
// en el modal del panel (fallback). Se usa desde los botones existentes.
function imprimirTicketAdmin(datos) {
  const abrirVentana = function () {
    if (typeof abrirTicketPreviewModal === "function") {
      abrirTicketPreviewModal(
        "ticket.html?pedido=" + encodeURIComponent(JSON.stringify(datos)),
      );
    } else if (typeof abrirVentanaCentrada === "function") {
      abrirVentanaCentrada(
        "ticket.html?pedido=" + encodeURIComponent(JSON.stringify(datos)),
        400,
        700,
      );
    }
  };
  return imprimirConQZ(datos, abrirVentana);
}

window.construirTicketESC = construirTicketESC;
window.imprimirConQZ = imprimirConQZ;
window.imprimirTicketAdmin = imprimirTicketAdmin;
window.qzListarImpresoras = qzListarImpresoras;  
