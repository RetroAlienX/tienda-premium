# 🖤 The Route66 Market · Premium USA Imports

> "Exclusividad Sin Fronteras." · "The road to premium quality."

## 📖 Descripción

Plataforma de e-commerce de productos originales importados de Estados Unidos,
enfocada al mercado de Monterrey y su zona metropolitana (Apodaca, San Nicolás,
Escobedo, San Pedro, Guadalupe y McAllen, TX como origen). Incluye tienda
pública (SPA), panel de administración completo, impresión de etiquetas y
tickets térmicos, base de datos en Supabase e integración de correos con EmailJS.

## ✅ Funcionalidades principales

- **Tienda pública**: catálogo de productos, marcas, cupones, noticias, carrito,
  checkout con punto/horario de entrega y contacto directo por WhatsApp.
- **Panel admin con 9 pestañas**: Productos, Pedidos, Inventario, Enviar Email,
  Ticket, Finanzas, Promociones, Lealtad y Pagos.
- **Impresión de etiquetas** de producto (50×60 mm, TSPL) con código de barras.
- **Impresión de tickets** térmicos (POS-58, 58 mm) con CODE128 rasterizado y
  corte de papel automático (QZ Tray).
- **Escáner de códigos de barras**: busca productos / pedidos al instante en
  varias pestañas (el código del ticket = número de pedido).
- **Finanzas con gráficas**: ingresos/gastos/ganancia (6 meses) y gastos por
  categoría (Chart.js), contadores y reinicio a $0.
- **Pagos a crédito**: abonos, cargos, morosidad y estados (en_mora /
  al_corriente / liquidado).
- **SEO**: meta tags, Open Graph, Twitter Card, datos estructurados (JSON-LD),
  `sitemap.xml`, `robots.txt` y verificación de Google Search Console.

## 🛠️ Tecnologías

| Tecnología            | Uso                                          |
| --------------------- | -------------------------------------------- |
| HTML5 + CSS3          | Frontend (diseño minimalista con acentos neón) |
| JavaScript puro       | Lógica de tienda y panel (sin frameworks)    |
| Supabase              | PostgreSQL + Storage (fotos) + auth anónimo  |
| EmailJS               | Envío de correos de ticket al cliente        |
| QZ Tray               | Impresión térmica (POS-58 y etiquetas TSPL)  |
| Chart.js, JsBarcode, jsPDF | Gráficas, códigos de barras y PDF de etiquetas |
| Netlify               | Despliegue y hosting                          |
| GitHub                | Control de versiones (`main`)                 |

## 🎨 Paleta de Colores

Todos los colores viven en la variable `:root` del archivo `css/custom.css`.

### Fondos — negro mate profundo
| Variable        | Color   | Uso                           |
| --------------- | ------- | ----------------------------- |
| `--bg-black`    | #050505 | Fondo principal               |
| `--bg-dark`     | #0a0a0a | Fondo secundario              |
| `--bg-card`     | #0d0d0c | Tarjetas y secciones          |
| `--bg-input`    | #121212 | Campos de texto               |

### Bordes sutiles
| Variable         | Color   | Uso                       |
| ---------------- | ------- | ------------------------- |
| `--border`       | #1a1a1a | Bordes sutiles            |
| `--border-light` | #222222 | Bordes más claros         |

### Textos
| Variable        | Color   | Uso                               |
| --------------- | ------- | --------------------------------- |
| `--text-main`   | #ffffff | Texto principal                   |
| `--text-silver` | #888888 | Texto secundario                  |
| `--text-dim`    | #555555 | Texto tenue / deshabilitado       |

### Acentos
| Variable         | Color   | Uso                         |
| ---------------- | ------- | --------------------------- |
| `--accent`       | #ffffff | Acento principal            |
| `--accent-hover` | #cccccc | Acento al pasar el cursor   |

### Neón
| Variable        | Color                 | Uso                          |
| --------------- | --------------------- | ---------------------------- |
| `--neon-white`  | rgba(255,255,255,0.15)| Brillo blanco sutil          |
| `--neon-glow`   | rgba(255,255,255,0.05)| Resplandor tenue             |
| `--neon-border` | rgba(255,255,255,0.4) | Borde con efecto neón        |

### Estados
| Variable        | Color   | Uso                       |
| --------------- | ------- | ------------------------- |
| `--regio-red`   | #ff3333 | Agotado / Error           |
| `--regio-green` | #00ff88 | Disponible / Éxito        |

### Tipografía
- **Inter** (Google Fonts): pesos 300–900. Se descarga por `preconnect` para
  acelerar la carga (Core Web Vitals).

## 📁 Estructura del Proyecto

```
tienda-premium/
├── admin.html              # Panel de administración (9 pestañas)
├── index.html              # Tienda pública (SPA)
├── login.html              # Inicio de sesión del panel
├── recuperar.html          # Recuperar contraseña
├── ticket.html             # Vista/impresión pública del ticket
├── netlify.toml            # Config de despliegue Netlify
├── robots.txt              # Reglas para buscadores
├── sitemap.xml             # Mapa del sitio (SEO)
├── README.md               # Este documento
├── .gitignore              # Archivos excluidos del repositorio
│
├── css/
│   └── custom.css          # Estilos globales + paleta (:root)
│
├── js/
│   ├── admin.js            # Lógica del panel (productos, pedidos, finanzas, etiquetas…)
│   ├── auth.js             # Sesión / inicio y cierre de sesión
│   ├── catalog.js          # Tienda pública (catálogo, carrito, checkout)
│   ├── ticket.js           # Lógica del ticket público
│   ├── ticket-qz.js        # Impresión térmica POS-58 (QZ Tray, barcode raster)
│   ├── qz-tray.js          # Integración con QZ Tray
│   ├── pagos.js            # Tab Pagos (adeudo, quincenas, estados)
│   ├── lealtad.js          # Tab Lealtad
│   ├── supabase.js         # Cliente Supabase
│   ├── utils.js            # Utilidades (número de pedido, moneda, fechas)
│   ├── config.js           # Config de la tienda (nombre, WhatsApp…)
│   ├── config.netlify.js   # Lee Supabase desde meta tags / archivo generado
│   └── config.netlify.generated.js  # GENERADO por Netlify (no se sube)
│
├── img/
│   ├── favicon.png         # Favicon optimizado (2.7 KB)
│   └── banner.webp         # Banner para redes sociales (12.3 KB)
│
├── sql_completo.sql        # Reparación/esquema completo de la BD
├── sql_datos_reales.sql    # Limpiar BD para cargar datos reales
├── sql_datos_dummy.sql     # Limpiar BD + cargar datos de ejemplo
├── sql_lugares_entrega.sql # Puntos de entrega definitivos (v2)
├── sql_storage_productos.sql  # Bucket de fotos en Supabase Storage
│
├── emailjs_template.html   # Plantilla de correo (EmailJS)
├── servidor-local.js       # Servidor local de desarrollo
└── _backup_before_mods/    # Respaldo local (fuera de GitHub)
```

> Nota: `js/config.local.js` y `js/config.netlify.generated.js` existen solo en
> local / en el build de Netlify y están excluidos del repositorio (`.gitignore`).

## 🚀 Puesta en marcha

1. Clona o descarga el repositorio.
2. Configura tu proyecto de Supabase: corre los scripts SQL (ver
   [Manual de la Base de Datos](#-manual-de-la-base-de-datos)).
3. En `index.html`, `login.html`, `admin.html`, `recuperar.html` y `ticket.html`
   actualiza las meta etiquetas `supabase-url` / `supabase-key` o sube las
   variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` en Netlify.
4. Configura EmailJS (service ID, template ID y public key en
   `js/config.js`/meta tags) usando `emailjs_template.html` como base.
5. En local, levanta `servidor-local.js` (o un servidor estático) y abre el
   sitio.

---

# 🧭 Manual de Funcionamiento

## Tienda pública (`index.html`)

- **Catálogo**: los productos y marcas se cargan desde Supabase
  (`productos`, `marcas`). Las tarjetas incluyen foto, precio y stock.
- **Carrito → Pedido**: el cliente arma su carrito y en el checkout elige
  punto, día y horario de entrega.
- **Entrega**: puntos **fijos** ($0, con horario asignado: Apodaca centro
  08:00-08:30, San Nicolás centro 09:00-09:30, Costco Escobedo 10:00-10:30) y
  puntos **coordinados** ($200: San Pedro, Monterrey y Guadalupe, horario por
  WhatsApp).
- **Cupones y noticias**: carrusel de promociones y avisos desde `cupones` y
  `noticias`.
- **Contacto**: WhatsApp y correo en el footer.

## Panel de administración (`admin.html`)

Acceso **restringido** (sesión de administrador). Pestañas:

### 1. Productos (Panel Venta)
- Buscar por nombre o **escanear código de barras** (si es `NOMBRE|MARCA|PRECIO|CATEGORÍA` autocompleta el formulario; si no existe un código leído,
  se ofrece crear un producto nuevo).
- **Agregar/editar producto**: nombre, marca, precio, categoría, stock,
  descripción, imagen (se sube a Supabase Storage), tienda origen y código de
  barras.
- **Imprimir etiqueta**: genera la etiqueta 50×60 mm (TSPL) con código de
  barras; se puede bajar en PDF (jsPDF, con respaldo HTML).
- **Calibración del centrado**: la etiqueta trae botones para ajustar el centro
  horizontal (pts), regla y diagnóstico de fuentes.

### 2. Pedidos
- Filtros por estado (todos, pendiente, confirmado, vendido, entregado,
  cancelado).
- **Escanear el ticket** filtra/busca el pedido al instante.
- Editar, cambiar estado (con `fecha_vendido`/`fecha_entregado`), ver vista
  previa del ticket y reimprimir.

### 3. Inventario
- Movimientos de stock por producto (entradas/salidas).
- Búsqueda por **nombre o código de barras** (también con escáner).

### 4. Enviar Email (Envío)
- Selecciona un pedido (o escanéalo desde el ticket) y envía el correo del
  ticket por EmailJS (`correoCliente`, productos, total).

### 5. Ticket
- **Imprimir** ticket para la venta directa (impresora térmica POS-58).
- **Reimpresión** de cualquier pedido.
- Muestra los lugares de entrega y sus costos para llenar el ticket manual.

### 6. Finanzas
- Indicadores: Ingresos, Gastos y Ganancia.
- **Gráficas** (Chart.js, se carga bajo demanda):
  - Barras: ingresos/gastos/ganancia de los últimos 6 meses.
  - Pastel: gastos por categoría contable.
- Registro de movimientos, filtro por categoría, `Refrescar`,
  `Limpiar base de datos` y `Reiniciar contadores a $0.00` (usa `settings`).

### 7. Promociones
- Cupones del carrusel (título, código, descuento, tag, vigencia, activo).

### 8. Lealtad
- Clientes del programa con productos comprados y producto de regalo.

### 9. Pagos
- Crédito por cliente: `adeudo_total`, quincenas (totales/pagadas/
  liquidadas/pendientes), abonos, cargos, morosidad (+$50) y estados
  `en_mora` / `al_corriente` / `liquidado`.

## Escáner de códigos de barras
- Los códigos de los **tickets** son el número de pedido (`P-YYMMDD-XXXX`).
- Un lector (USB/manual) escribe el código como teclado: se captura en
  Productos, Inventario, Enviar Email y Pedidos para buscar al instante.

## Impresión térmica
- **Etiquetas**: comando TSPL, tamaño 50×60 mm. El centrado se calibra por
  puntos (`centroEtiquetaX`, por defecto 184).
- **Ticket POS-58**: usa QZ Tray. El código de barras se **rasteriza**
  (CODE128, comando GS v 0) y el ticket se parte en 2 trabajos con el marcador
  `§§RASTER§§` para que la impresora no se trague la imagen al final de un
  trabajo largo. Prueba de barcode: `imprimirPruebaBarcode()` (F12).

---

# 🗄️ Manual de la Base de Datos

## Tablas principales (Supabase / PostgreSQL)

| Tabla             | Propósito                                              |
| ----------------- | ------------------------------------------------------ |
| `productos`       | Catálogo: nombre, marca, precio, categoría, stock, origen, fotos, código |
| `pedidos`         | Pedidos: cliente, productos (JSON), totales, entrega, estado, fechas |
| `inventario`      | Movimientos de stock (`producto_id`, tipo, cantidad)   |
| `finanzas`        | Ingresos/gastos: tipo, categoría, monto, fecha         |
| `lealtad`         | Programa de lealtad por cliente                        |
| `pagos`           | Crédito: adeudo_total, quincenas, estados              |
| `cupones`         | Cupones del carrusel / descuentos                      |
| `cupon_usos`      | Usos de cupón por correo (único por correo+cupón)      |
| `noticias`        | Avisos y promos para la tienda                         |
| `marcas`          | Marcas (cards de index.html)                           |
| `lugares_entrega` | Puntos de entrega: lugar, costo, orden, `horario_fijo` |
| `settings`        | Llave/valor: bases de reinicio de contadores finanzas  |

## Scripts SQL (los 5 del proyecto)

> Todos son **idempotentes** (se pueden re-ejecutar). Devuelven correctamente
> en el SQL Editor de Supabase. **No mezcles categorías**: cada uno cumple una
> función distinta y respeta `marcas`/`lugares_entrega` cuando corresponde.

### 1. `sql_completo.sql` — Esquema/reparación COMPLETA
- Crea/repara tablas (`pagos`, `lugares_entrega`, `marcas`, `cupon_usos`,
  `noticias`, `finanzas`, `settings`).
- Garantiza columnas nuevas: productos (`marca`, `tienda_origen`, `codigo_barras`, `imagen_url`),
  pedidos (`lugar_entrega`, fechas, `punto_entrega`, vista…), pagos (`adeudo_total`, quincenas,
  `fecha_liquidacion`).
- Activa RLS con políticas abiertas (la app usa clave anónima).
- Siembra los **6 puntos de entrega v2** y las **15 marcas** (solo si la tabla
  está vacía).
- Limpia la columna huérfana `pagos.nombre`.
- **Cuándo**: base nueva o para dejar toda la BD "al día". Es la base de los demás.

### 2. `sql_datos_reales.sql` — LIMPIAR para datos reales
- Elimina TODO el contenido de productos, pedidos, inventario, finanzas,
  lealtad, pagos, cupones, noticias, cupon_usos y settings.
- **NO toca** `lugares_entrega` ni `marcas`.
- Recrea `settings` en 0 y limpia CHECK constraints / columna `pagos.nombre`.
- **Cuándo**: después de un respaldo, para empezar a capturar datos reales
  desde el panel (no inserta nada).

### 3. `sql_datos_dummy.sql` — LIMPIAR + datos de ejemplo
- Igual que el reales, pero **inserta datos dummy**: 6 productos, 5 pedidos
  (con puntos fijos y coordinados), inventario, finanzas, lealtad, pagos,
  cupones y noticias.
- Respeta las fotos ya subidas en el panel (las respalda y restaura por
  `codigo_barras`), reinserta marcas sin duplicarlas (índice único por nombre).
- **Cuándo**: para probar el panel con datos de muestra.

### 4. `sql_lugares_entrega.sql` — Puntos de entrega definitivos (v2)
- Crea la tabla + columna `horario_fijo`, activa RLS y **reemplaza** los lugares
  por los 6 definitivos (3 fijos $0 con horario + 3 coordinados $200).
- **Cuándo**: para fijar los puntos de entrega actuales. Ejecútalo ANTES de
  cargar pedidos que se enlacen a estos lugares.

### 5. `sql_storage_productos.sql` — Bucket de fotos
- Crea el bucket público `productos` (idempotente).
- Políticas sobre `storage.objects`: select, insert, **update** y **delete**
  (permite reemplazar y borrar fotos de producto).
- **Cuándo**: una sola vez, para poder subir fotos desde el panel.
  La URL pública queda: `https://<proyecto>.supabase.co/storage/v1/object/public/productos/<archivo>`

## Recomendaciones
- Ejecuta el orden sugerido: `sql_completo.sql` → `sql_storage_productos.sql` →
  `sql_lugares_entrega.sql` → después `sql_datos_reales.sql` **o**
  `sql_datos_dummy.sql` (nunca los dos de datos a la vez).
- Respaldar antes de borrar (`sql_datos_*` vacían tablas).
- Si necesitas restaurar lugares del viejo esquema en `sql_completo.sql`,
  no lo hagas: el v2 es el que usa la app (fallbacks en `js/catalog.js` y
  `js/admin.js`).

---

# 🌐 Manual de Netlify

## Configuración del proyecto
`netlify.toml`:
```toml
[build]
  publish = "."          # publica la raíz del proyecto

[[redirects]]
  from = "/*"            # SPA: cualquier ruta llega a la home
  to = "/index.html"
  status = 200
```

## Despliegue
1. **Opción A (recomendada)**: Conectar el repositorio de GitHub
   (`RetroAlienX/tienda-premium`) → Netlify detecta `main` y despliega solos
   cada push.
2. **Opción B (manual)**: en Netlify → *Deploys* → *Deploy manually* → arrastra
   la carpeta del proyecto.

## Variables de entorno
En *Site settings → Environment variables* define:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Netlify genera automáticamente `js/config.netlify.generated.js` en el build
(`config.netlify.js` lo importa). Alternativa: las meta tags
`supabase-url` / `supabase-key` en el `<head>` de cada página.

## Dominio y HTTPS
- Dominio principal: `theroute66jvmarket.netlify.app` (HTTPS automático).
- Puedes agregar un dominio propio en *Domain management* (Netlify gestiona
  certificados SSL gratis).
  → Si lo haces, actualiza el **canonical** y las URLs de
  `og:*` / `twitter:*` / JSON-LD / `sitemap.xml` / `robots.txt` en
  `index.html`.

## SEO / Google
- `sitemap.xml` y `robots.txt` ya viven en la raíz (se sirven en `/`).
- Búsqueda en Google **Search Console** → propiedad
  `https://theroute66jvmarket.netlify.app/` → verificación (HTML tag) →
  **Sitemaps** → enviar `sitemap.xml` → Inspección de URL →
  *Solicitar indexación*.

---

# 🐙 Manual de GitHub

## Repositorio
- URL: `https://github.com/RetroAlienX/tienda-premium`
- Rama principal: `main` (despliegue automático a Netlify con cada push).

## Flujo diario (línea de comandos)
```bash
# 1. ¿Qué cambió?
git status

# 2. Prepend los archivos que quieres subir
git add archivo.html js/app.js

# (o todo: git add -A)

# 3. Revisa qué quedó stageado
git diff --staged

# 4. Confirma con un mensaje claro
git commit -m "Descripción del cambio"

# 5. Súbelo (dispara el deploy en Netlify)
git push origin main
```

## Buenas prácticas
- **Mensajes de commit en español y concisos**, describiendo el cambio y el
  porqué.
- Un commit por tarea lógica (no mezclar cambios no relacionados).
- **Nunca subas secretos**: Supabase keys, tokens de EmailJS o claves van en
  variables de entorno de Netlify, no en el código ni en commits.
- Archivos como `js/config.local.js`, `js/config.netlify.generated.js`,
  `.env` y `*.sql` (por política del proyecto) quedan fuera del repo vía
  `.gitignore`.
- Si el push falla, revisa `git status`; corrígelo y haz un commit nuevo
  (nunca reescribir historial con `--amend` en ramas compartidas, salvo
  necesidad explícita).

## Restaurar una versión anterior
```bash
git log --oneline            # ver historial
git checkout <hash> -- <archivo>   # recuperar un archivo de un commit pasado
# o crear rama desde un punto: git branch fix_<hash> <hash>
```

---

## 📞 Contacto público

- WhatsApp: +52 81 2687 8080
- Email: theroute66jvmarket@outlook.com
- Facebook: https://www.facebook.com/theroute66market/
- Sitio: https://theroute66jvmarket.netlify.app/