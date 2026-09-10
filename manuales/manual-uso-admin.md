# Manual de Uso - Panel de Administracion (tienda-premium)

Version: 1.1 | Fecha: 10/09/2026
Archivo: admin.html

## 1. Introduccion

El panel de administracion es el centro de control de la tienda. Desde aqui se
capturan productos, se atienden pedidos, se controla el inventario, se imprimen
etiquetas y tickets termicos, se envian correos, se revisan las finanzas con
graficas, y se administran promociones, lealtad y creditos (pagos).

El panel tiene **9 pestanas** en este orden:

    Productos | Pedidos | Inventario | Enviar Email | Ticket
    Finanzas | Promociones | Lealtad | Pagos

Cada pestana tiene botones genericos en su encabezado: **Refrescar** (recarga
los datos) y **Limpiar base de datos** (borra TODO de esa tabla, pide
confirmacion). Ambos piden confirmacion antes de ejecutar.

## 2. Acceso (login)

1. Abre `login.html` (o entra por la ruta /login del sitio).
2. Inicia sesion con el correo y contrasena del administrador.
3. Al entrar se muestra `admin.html` con la pestana **Productos** activa.
4. Para salir usa el boton **Cerrar sesion**.

Nota: la forma de revelar el acceso administrativo es un secreto operativo y no
se documenta en archivos publicos del repositorio.

## 3. Pestana 1: Productos (Panel Venta)

Es la pantalla principal para vender.

### Buscar por nombre o escanear
- Escribe parte del nombre en el campo "Buscar por producto" para filtrar la
  lista en vivo.
- **Escanea el codigo de barras** (lector USB funciona como teclado).
  - Si el codigo pertenece a un producto existente, se **abre su edicion**
    automaticamente (nombre, marca, precio, stock, codigo y descripcion).
  - Si el codigo tiene el formato `NOMBRE|MARCA|PRECIO|CATEGORIA` (separado por
    pipes), el sistema **autocompleta el formulario**; solo confirma y guarda.

### Producto no encontrado
- Si el codigo escaneado no existe, el sistema muestra el aviso
  **"Producto no encontrado"** bajo la barra del escaner.
- Aparece un **modal de confirmacion** con dos botones:
  - **Cancelar**: cierra el modal sin hacer nada.
  - **Crear producto nuevo**: abre el formulario **en blanco** (el codigo de
    barras se asigna manualmente).

### Formulario de producto
Campos:
- **Nombre**: texto (obligatorio).
- **Marca**: campo de texto libre (ej. Bath and Body Works). Aparece en la
  columna Marca del tab y en la etiqueta impresa.
- **Precio**: en pesos, IVA incluido (obligatorio).
- **Stock**: unidades disponibles.
- **Codigo de barras**: opcional. El boton **Generar** crea el siguiente
  codigo **EAN-13 (prefijo 750)** automaticamente.
- **Imagen**: pega una **URL directa** (termina en .jpg/.png/.webp) o usa
  **Subir imagen** para elegir un archivo de tu PC: se sube a Supabase Storage
  (bucket `productos`) **sin redimensionar** (resolucion original).
  Incluye miniatura de vista previa y boton **Ver foto** (abre en pantalla
  completa). Si la liga no termina en extension de imagen, la tarjeta publica
  muestra el icono de paquete.
- **De donde se trae** (ej. McAllen, Texas): texto, por defecto "McAllen,
  Texas".
- **Categoria**: lista fija: Suplementos, Accesorios, Ropa Deportiva, Ropa y
  Calzado, Perfumes, Cuidado Personal u Otros.
- **Descripcion**: texto visible en la tarjeta publica.

Al guardar se inserta/actualiza en Supabase y el producto aparece en la tienda.

### Impresion de etiquetas y calibracion
- **Etiqueta de un solo producto**: el boton del producto en la tabla abre el
  modal "Etiqueta de Producto" con la **vista previa** (nombre, marca, precio,
  categoria, codigo de barras EAN-13) y las opciones:
  - Selector de **protocolo**: TSPL etiquetas (recomendado), ESC/POS termico o
    texto plano.
  - **Calibracion del centro** (dentro del modal):
    - **◀ / ▶**: mueven el centro horizontal 8 puntos; el valor se
      **guarda automaticamente** y se usa en todas las etiquetas (por defecto
      **184 pts**).
    - **Prueba de centrado**: imprime una linea vertical en la posicion del
      centro para ajustar a ojo.
    - **Regla**: imprime una regla con marcas cada 16 pts (mas largas cada 64)
      y el centro marcado, para medir las posiciones reales con una foto.
    - **Diagnostico**: imprime filas de letras en distintas X (fuentes F1-F5)
      para medir el ancho real de las fuentes.
  - Indicador **"Centro: -- pts"** en vivo.
  - Botones: **Enviar a Bluetooth** (impresora portatil), **Imprimir**
    (con QZ o en el navegador) y **Cerrar**.
- **Descargar etiquetas** (boton del encabezado de Productos o el boton del
  producto): descarga un PDF (jsPDF, cargado bajo demanda) con la etiqueta del
  producto o de todos; si falla, **respaldo HTML** imprimible. Servira para
  impresora normal (USB).
- El **centrado en la impresion** (HTML/PDF) usa la misma posicion calibrada.
  En el modo imprimir del navegador, la etiqueta se imprime centrada en papel
  50x60 mm con contenido de 46 mm y @page propio (Chrome).

## 4. Pestana 2: Pedidos

- Lista de pedidos con **filtros por estado**:
  - Todos, Pendientes, Confirmados, Vendidos, Entregados, Cancelados y
    **Devueltos** (regresados: el stock ya se restauro).
- Busqueda por **N° de pedido**, por **correo** del cliente y por **nombre**.
- **Escanear el ticket** (el codigo es el mismo N° de pedido) filtra el pedido
  al instante.
- Acciones por pedido: ver detalle, editar, cambiar estado (registra
  `fecha_vendido` / `fecha_entregado`), ver vista previa y reimprimir.
- Flujo: Pendiente -> Confirmado (correo enviado) -> Vendido (descuenta stock)
  -> Entregado (informativo, no afecta stock). Cancelado y Devuelto tambien
  existen.

## 5. Pestana 3: Inventario

- **Registrar Movimiento**: selecciona producto, tipo **Entrada** (suma stock)
  o **Salida** (resta), cantidad y motivo/descripcion.
- La lista muestra el historial de movimientos.
- **BuscarProductoInventario**: filtra por nombre; el **escaner global**
  tambien funciona aqui (pone el codigo y filtra).
- Al hacer una venta en el Panel Venta o en el Ticket (venta directa), el stock
  se descuenta automaticamente (se refleja aqui y en la tienda).

## 6. Pestana 4: Enviar Email (Envio)

- Elige un pedido del selector (todos los estados) para precargar el correo, o
  **escanéalo** desde su ticket (N° de pedido).
- Campos precargados (solo lectura): correo del cliente, N° pedido, nombre,
  telefono, productos, direccion. **Metodo de pago** y **costo de envio** se
  pueden editar.
- Enviar correo via **EmailJS** con la plantilla `emailjs_template.html`
  (incluye numero, cliente, productos, total y datos de entrega).
- Advertencia: el boton **Limpiar base de datos** de ESTA pestana borra TODOS
  los pedidos (pide confirmacion). No afecta las otras tablas.

## 7. Pestana 5: Ticket

Pestana de **impresion | reimpresion | venta directa**.

- **Precarga de un pedido existente**: seleccionalo en el selector (o escanea su
  ticket). Es **informativo**: sirve para imprimir/reimprimir su ticket sin
  volver a descontar stock ni crear otra venta.
- **Venta directa**: deja el selector vacio y llena manualmente cliente,
  telefono, direccion, lugar de entrega y productos. Al generar el ticket, se
  **crea el pedido y se descuenta el stock**.
- Boton **Mostrar lugares de entrega**: muestra la lista de puntos y costos;
  al hacer clic en una fila **copia el costo de envio** al campo del ticket.
- El codigo de barras impreso es el N° de pedido (unico por venta); se escanea
  en cualquier pestana para buscar/reenviar/reimprimir.
- La impresion usa impresora termica **POS-58 (58 mm) via QZ Tray**; el barcode
  se convierte a CODE128 raster (GS v 0) y el ticket se parte en 2 trabajos con
  el marcador `§§RASTER§§` para que la impresora no se atore.

## 8. Pestana 6: Finanzas

- **Indicadores**: Ingresos, Gastos y Ganancia.
- Boton **Registrar**: abre el formulario para agregar un ingreso o gasto.
- **Graficas** (Chart.js, se carga bajo demanda):
  - Barras: Ingresos / Gastos / Ganancia de los **ultimos 6 meses**.
  - Pastel: Gastos por **categoria contable**.
- **Filtro por categoria**: Todas, Venta, Compra, Envio, Abono, Otros.
- Botones:
  - **Refrescar**: recarga movimientos y totales.
  - **Reiniciar contadores a $0.00**: pone Ingresos/Gastos/Ganancia en $0 SIN
    borrar el historial (usa la tabla `settings`).
  - **Limpiar base de datos**: borra TODOS los movimientos financieros y
    reinicia las bases a 0,0 (pide confirmacion).

## 9. Pestana 7: Promociones

Esta pestana agrupa **cuatro secciones** que se muestran en la tienda publica:

### 9.1 Cupones del Carrusel
- Campos del cupon: **titulo**, **codigo**, **descuento** (%), **etiqueta/tag**
  (ej. NUEVO, EXCLUSIVO, ORIGINAL), **vigencia** y **activo**.
- Se muestran en el carrusel de la tienda.
- Botones: **Agregar Cupon**, Refrescar y Limpiar base de datos (borra cupones,
  noticias, lugares y marcas JUNTOS; pide confirmacion).

### 9.2 Noticias
- Campos: **titulo** y **descripcion**. Aparecen en la seccion de noticias de
  la tienda. Boton **Agregar Noticia**.

### 9.3 Lugares de Entrega y Costos de Envio
- Campos: **nombre del lugar** y **costo de envio** (pesos MXN).
- Se muestran en el formulario publico de checkout **y** en el tab Ticket.
  Editalos aqui y se actualizan en toda la tienda. Boton **Agregar Lugar**.

### 9.4 Marcas
- Campo: **nombre** (ej. Gymshark, MuscleTech).
- Se muestran en la seccion "Marcas que manejamos" de la pagina.
  Boton **Agregar Marca**.

## 10. Pestana 8: Lealtad

- Clientes del programa con campos:
  - **Nombre del cliente** (obligatorio).
  - **Productos comprados** (acumulado; se suma cada compra).
  - **Producto de regalo** (lo que le toca segun tu politica, opcional).
- Botones: Agregar Cliente, Guardar, Editar, Eliminar.

## 11. Pestana 9: Pagos (Creditos)

- **Filtros por estado**: Todos, En mora, Al corriente, Liquidado.
- Alta/edicion de credito:
  - **Adeudo total**: deuda actual. Los cargos (+), abonos (−) y moras (+50)
    se aplican a este valor; al llegar a 0 el cliente queda **liquidado**.
  - **Quincenas totales** y **quincenas pagadas**.
  - Formula automatica: **pendientes = totales − pagadas** (las pagadas se
    limitan a las totales).
- Modal **Añadir Cargo / Abono**: monto en pesos MXN a sumar o restar del
  adeudo. Con morosidad, la mora se suma como **+$50**.
- El cristal del adeudo refleja los estados: `en_mora`, `al_corriente`,
  `liquidado`.
- Regla practica: mientras exista adeudo, el articulo pertenece a la tienda
  hasta la liquidacion (ver manual del website, apartado politicas).

## 12. Escaner global de codigos de barras

Un lector (USB/webcam) escribe el codigo como teclado; el sistema lo captura en
cualquier pestana sin clic extra y actua segun la pestana activa:

- **Productos**: busca por codigo; si existe abre su edicion, si no muestra el
  modal "Producto no encontrado".
- **Inventario**: pone el codigo en la busqueda y filtra.
- **Enviar Email**: carga el pedido del ticket en el formulario.
- **Ticket**: precarga el pedido para reimprimir.
- **Modal de correo abierto**: autocompleta el correo del pedido escaneado.
- (En Pedidos el escaner tambien filtra usando la busqueda por N°.)

## 13. Impresoras soportadas

| Impresora        | Uso         | Tecnologia                  | Tamano  |
| ---------------- | ----------- | --------------------------- | ------- |
| Etiqueta termica | Etiquetas   | TSPL via Bluetooth (Web Bluetooth) o PDF/HTML | 50x60 mm |
| Termica POS-58   | Tickets     | QZ Tray, barcode CODE128 raster (GS v 0) | 58 mm |

## 14. Solucion de problemas rapida

- **No imprime etiqueta** -> Usa Chrome/Edge (requiere Web Bluetooth), revisa la
  conexion de la impresora; o descarga las etiquetas (PDF/HTML) e imprime en
  USB.
- **El barcode no sale centrado** -> Usa la calibracion: Izquierda/Derecha,
  imprime la **Prueba de centrado** y despues la **Regla** para medir; ajusta
  hasta que la linea vertical coincida con el centro del papel (184 pts).
- **No imprime ticket** -> QZ Tray debe estar abierto en la PC; revisa que la
  impresora POS-58 sea la correcta.
- **El PDF de etiqueta no baja** -> El sistema usa respaldo HTML: el contenido
  se muestra en pantalla y puede imprimirse.
- **No encuentra un producto al escanear** -> Confirma que solo se escaneo el
  codigo (sin dobles Enter) y que el formato NOMBRE|MARCA|PRECIO|CATEGORIA
  trae todos los campos separados por el caracter `|`.
- **El modal "Producto no encontrado" no aparece** -> Si formas de acceso
  administrativas se restauraron con manuales, verifica que la pestana este
  activa y que el codigo realmente no exista; el aviso en la barra del escaner
  siempre aparece.