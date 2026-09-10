# Manual de Uso - Panel de Administracion (tienda-premium)

Version: 1.0 | Fecha: 10/09/2026
Archivo: admin.html

## 1. Introduccion

El panel de administracion es el centro de control de la tienda. Desde aqui se
capturan productos, se atienden pedidos, se controla el inventario, se imprimen
etiquetas y tickets termicos, se envian correos, se revisan las finanzas con
graficas, y se administran promociones, lealtad y creditos (pagos).

El panel tiene **9 pestanas**:

    Productos | Pedidos | Inventario | Enviar Email | Ticket
    Finanzas | Promociones | Lealtad | Pagos

## 2. Acceso (login)

1. Abre `login.html` (o entra por la ruta /login en el sitio).
2. Inicia sesion con el correo y contrasena del administrador.
   La sesion es **privada**: sin ella no se puede ver ni operar el panel.
3. Al entrar se muestra `admin.html` con la pestana **Productos** activa.
4. Para salir usa el boton **Cerrar sesion** (vuelve al login).

> Nota de seguridad: la forma de revelar el acceso administrativo es un secreto
> operativo; no se documenta en archivos publicos del repositorio.

## 3. Pestana 1: Productos (Panel Venta)

Es la pantalla principal para vender.

### Buscar por nombre o escanear
- Escribe el nombre del producto, o
- **Escanea el codigo de barras** con un lector (funciona como teclado).
- Si el codigo escaneado tiene el formato
  `NOMBRE|MARCA|PRECIO|CATEGORIA` (separado por pipes), el sistema
  **autocompleta el formulario** con esos datos: solo confirma y guarda.

### Producto no encontrado
- Si el codigo escaneado no existe, el sistema muestra el aviso
  **"Producto no encontrado"** junto a la barra de busqueda.
- Se abre un **modal de confirmacion** con botones **Cancelar** y
  **Crear producto nuevo**.
- Al crear un producto nuevo desde el modal, el formulario se muestra
  **en blanco** (el codigo se captura manualmente si deseas asignarlo).

### Agregar / editar producto
Campos del formulario:
- Codigo de barras
- Nombre
- Marca (select de marcas cargadas de Supabase)
- Precio
- Categoria
- Stock (cantidad disponible)
- Descripcion
- Imagen (se sube a Supabase Storage, bucket `productos`)
- Tienda origen (ej. Walmart, Target, Sam's, Costco...)

Al guardar, el producto se inserta o actualiza en Supabase y aparece en la
tienda.

### Imprimir etiqueta
- Cada producto tiene boton **Imprimir etiqueta**: genera la etiqueta **50x60
  mm** con el codigo de barras del producto.
- Tambien puede **descargarse en PDF** (jsPDF) y hay **respaldo HTML** si el
  PDF falla (describe en pantalla el contenido de la etiqueta).
- Incluye botones de **calibracion del centrado** (derecha/izquierda en puntos)
  para ajustar donde cae el barcode en la etiqueta fisica. El valor por defecto
  del centro es **184 pts**.

### Herramientas de diagnostico
- Boton de **regla** para medir la posicion del barcode en la impresora.
- Boton de **diagnostico de fuentes** (imprime el set de fuentes disponible).
- Prueba rapida por consola: `imprimirPruebaBarcode()` (F12).

## 4. Pestana 2: Pedidos

- Lista de pedidos con filtros por **estado**:
  Todos, Pendiente, Confirmado, Vendido, Entregado, Cancelado.
- **Escanear el ticket** (o escribir el numero de pedido, formato P-YYMMDD-XXXX)
  busca el pedido al instante.
- Acciones por pedido:
  - **Ver detalle / editar** (cliente, productos, total, entrega).
  - **Cambiar estado**: cada cambio registra la fecha
    (`fecha_vendido`, `fecha_entregado`).
  - **Vista previa del ticket**.
  - **Reimprimir** ticket impreso.

Flujo tipico del estado: Pendiente -> Confirmado -> Vendido -> Entregado
(continuando desde lo capturado en la venta directa).

## 5. Pestana 3: Inventario

- Registra **movimientos de stock** por producto: entradas y salidas.
- Muestra el historial y el stock actual.
- Busqueda por **nombre o codigo de barras** (tambien con escaner).
- Al hacer una venta en el Panel Venta, el stock se descuenta
  automaticamente (reflejado aqui y en la tienda).

## 6. Pestana 4: Enviar Email (Envio)

- Elige un pedido de la lista o **escanéalo** desde su ticket.
- Boton para **enviar el correo del ticket** al cliente (via EmailJS) usando la
  plantilla `emailjs_template.html`.
- El correo incluye: numero de pedido, cliente, productos, total y punto de
  entrega.
- Muestra el resultado (exito o error) en pantalla.

## 7. Pestana 5: Ticket

- **Imprimir** el ticket de la venta directa en la impresora termica **POS-58
  (58 mm)** usando QZ Tray.
- **Reimpresion** de cualquier pedido existente.
- Los **lugares de entrega** aparecen con su costo para llenar el ticket a mano
  cuando se usa ese modo.

### Como se imprime el ticket (tecnico)
- El codigo de barras se convierte a **CODE128 raster** con el comando
  `GS v 0` (imagen embedida).
- El ticket se parte en **2 trabajos de impresion** (marcador `§§RASTER§§`)
  para que la imagen raster se mande en un trabajo aparte y la impresora no se
  atore en trabajos muy largos.
- Requiere el lector/software **QZ Tray** corriendo en la PC conectada a la
  impresora.

## 8. Pestana 6: Finanzas

- Indicadores: **Ingresos**, **Gastos** y **Ganancia**.
- **Graficas** (Chart.js, cargado bajo demanda para no frenar el panel):
  - Barras: ingresos, gastos y ganancia de los **ultimos 6 meses**.
  - Pastel: gastos por **categoria contable**.
- Registro de movimientos con **filtro por categoria**.
- Controles:
  - **Refrescar**: recarga los datos.
  - **Limpiar base de datos**: borra movimientos.
  - **Reiniciar contadores a $0.00**: restablece bases en la tabla `settings`.

## 9. Pestana 7: Promociones

- Administra los **cupones** del carrusel de la tienda:
  titulo, codigo, tipo/descripcion, **descuento**, tag, vigencia y activo.
- Guardar cambios actualiza el carrusel publico al instante.

## 10. Pestana 8: Lealtad

- Clientes inscritos en el programa de lealtad.
- Muestra los **productos comprados** y el **producto de regalo** acumulado.
- Al llegar al monto/producto requerido, la tienda entrega el obsequio.

## 11. Pestana 9: Pagos (Creditos)

- Credito por cliente:
  - **Adeudo total** y quincenas: numero total, pagadas, liquidadas y
    pendientes.
  - Muestra de **monto por quincena** si aplica.
- Registro de **abonos** y **cargos extra**.
- **Morosidad**: se calcula una penalizacion de **+$50** por quincena vencida.
- **Estados** del cliente: `en_mora`, `al_corriente`, `liquidado`.
- Regla practica: mientras exista adeudo, el articulo permanece de la tienda
  hasta que se liquide (ver manual del website, apartado politicas).

## 12. Escaner de codigos de barras

- Los codigos de los tickets son el **numero de pedido** (P-YYMMDD-XXXX).
- Un lector conectado por USB (o modo entrada del teclado) escribe el codigo:
  - En Productos -> busca el producto por codigo.
  - En Inventario -> busca el movimiento/producto.
  - En Enviar Email -> carga el pedido del ticket.
  - En Pedidos -> filtra el pedido.
- No requiere configuracion adicional: es un campo de texto que captura el
  escaneo.

## 13. Impresoras soportadas

| Impresora          | Uso          | Tecnologia | Tamano |
| ------------------ | ------------ | ---------- | ------ |
| Etiqueta termica   | Etiquetas    | TSPL       | 50x60 mm |
| Termica POS-58     | Tickets      | QZ (raster barcode) | 58 mm |

## 14. Solucion de problemas rapida

- **No imprime etiqueta** -> Verifica que la impresora de etiquetas use TSPL;
  revisa el cabezal/rollo; usa el boton de regla para revisar la posicion.
- **No imprime ticket** -> QZ Tray debe estar abierto en la PC; revisa que la
  impresora sea la correcta; prueba `imprimirPruebaBarcode()` en la consola.
- **El barcode no aparece centrado** -> Usa la calibracion horizontal
  (valor 184 por defecto) hasta que coincida con el centro de la etiqueta.
- **El PDF de etiqueta no baja** -> El sistema usa respaldo HTML: el contenido
  se muestra en pantalla y puede imprimirse.
- **No encuentra un producto al escanear** -> Confirma que solo se escaneo el
  codigo (sin dobles enters) y que el formato NOMBRE|MARCA|PRECIO|CATEGORIA
  tiene todos los campos (pipes incluidos).