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
│   └── config.netlify.js   # Lee Supabase desde meta tags / archivo generado
│
├── img/
│   ├── favicon.png         # Favicon optimizado (2.7 KB)
│   └── banner.webp         # Banner para redes sociales (12.3 KB)
```

> Nota: estos archivos existen solo en local y están excluidos del repositorio
> (`.gitignore`): `js/config.local.js`, `js/config.netlify.generated.js`,
> `manuales/`, `servidor-local.js`, `_backup_before_mods/`, `*.sql` y
> `emailjs_template.html`.