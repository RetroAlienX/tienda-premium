# Manual de Netlify - The Route66 Market

Version: 1.0 | Fecha: 10/09/2026
Sitio: https://theroute66jvmarket.netlify.app/

## 1. Introduccion

El sitio se publica con **Netlify** (hosting estatico con HTTPS automatico,
despliegue continuo desde GitHub y reescritura de rutas para la SPA).

## 2. Configuracion del proyecto

El archivo `netlify.toml` en la raiz dice como publicar:

    [build]
      publish = "."          # publica la raiz del proyecto

    [[redirects]]
      from = "/*"            # SPA: cualquier ruta interna
      to = "/index.html"     # redirige a la home
      status = 200

Con esto, rutas como `/login`, `/admin` o `/ticket` funcionan al abrir el
sitio, porque Netlify devuelve `index.html` (la SPA resuelve la ruta).

## 3. Primer despliegue

**Opcion A - Con GitHub (recomendada):**
1. Sube el repositorio a `https://github.com/RetroAlienX/tienda-premium`.
2. En Netlify: *Add new site* -> *Import an existing project*.
3. Elige **GitHub** y autoriza; selecciona el repo.
4. Deja `[build]` como viene (Netlify lee `netlify.toml`).
5. *Deploy site*. Queda en `https://theroute66jvmarket.netlify.app/`.

**Opcion B - Manual (drag & drop):**
1. En Netlify: *Deploys* -> *Deploy manually*.
2. Arrastra la carpeta completa del proyecto (sin `node_modules`).
3. Listo: se publica al instante (sin auto-build por push).

## 4. Variables de entorno (claves)

La app lee Supabase de dos maneras (el codigo usa la que encuentre):
- **Meta tags** en el `<head>` de cada HTML: `supabase-url` y `supabase-key`.
- **Archivo generado** `js/config.netlify.generated.js`, que Netlify crea en el
  build a partir de las variables de entorno.

Para usar el metodo de variables:
1. En Netlify: *Site settings* -> *Environment variables* -> *Add variable*.
2. Agrega:
       SUPABASE_URL         https://TU-PROYECTO.supabase.co
       SUPABASE_ANON_KEY    tu-clave-anonima
3. El archivo `js/config.netlify.js` y `js/config.netlify.generated.js` se
   encargan de cargarlas automaticamente.
4. Re-despliega para que el cambio aplique.

> Las claves anonimas de Supabase son publicas por diseno (RLS protege los
> datos). Nunca pongas claves de admin ni del service_role aqui.

## 5. Correos (EmailJS)

- EmailJS no va en Netlify: su ID de servicio, template ID y public key se
  configuran en la app (meta tags o `js/config.js`) usando la plantilla
  `emailjs_template.html`.
- Revisa que el dominio desde donde se envia este autorizado en el panel de
  EmailJS para evitar rechazos CORS.

## 6. Dominio y HTTPS

- El dominio de Netlify ya entrega **HTTPS automatico**.
- Para dominio propio: *Domain management* -> *Add custom domain*.
  Netlify gestiona el certificado SSL gratis.
- Si cambias de dominio, actualiza el **canonical**, las direcciones `og:*` /
  `twitter:*` y los **datos estructurados (JSON-LD)** en `index.html`, asi como
  `sitemap.xml` y `robots.txt`.

## 7. SEO y Google Search Console

- `sitemap.xml` y `robots.txt` estan en la raiz y se sirven en `/`.
- Paso a paso para Search Console:
  1. Entra a https://search.google.com/search-console
  2. Agrega la propiedad: prefijo de URL
     `https://theroute66jvmarket.netlify.app/`.
  3. Verificacion: elige **HTML tag** y pega la meta etiqueta
     `google-site-verification` (la que ya existe en `<head>` de `index.html`),
     o usa la verificacion de DNS.
  4. En el menu **Sitemaps** envía `sitemap.xml`.
  5. En **Inspección de URL** pega la home y *Solicitar indexación*.

## 8. Actualizar el sitio (despliegues)

- Con GitHub conectado: cada `git push origin main` dispara un deploy.
- Estados en *Deploys*: *Publishing* (se publica) o *Build failed* (revisa el
  log).
- Boton **Redeploy** para volver a publicar sin cambios.

## 9. Solucion de problemas rapida

- **Sitio en blanco o 404 en /admin** -> Revisa que apunte a la SPA
  (`redirects` del `netlify.toml`) y que el deploy haya terminado.
- **La tienda no carga productos** -> Verifica `SUPABASE_URL` /
  `SUPABASE_ANON_KEY` (entorno o meta tags), que los scripts SQL se hayan
  corrido y que CORS permita el dominio del sitio.
- **Fotos sin cargar** -> Confirma que se corrio `sql_storage_productos.sql`
  (bucket `productos`) y que las URLs apunten al bucket publico.
- **Search Console no indexa** -> Se demora; primero verifica la propiedad,
  envia el sitemap y solicita indexacion. Pendiente que Google la indexe.