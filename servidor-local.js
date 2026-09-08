// Servidor local sencillo para probar la app (incluye QZ Tray) antes de subirla.
// Uso:  node servidor-local.js
// Abre luego:  http://localhost:8080/admin.html
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PUERTO = 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/admin.html";

    // Evitar Path Traversal (solo servir archivos dentro del proyecto).
    const ruta = path.normalize(path.join(ROOT, urlPath));
    if (!ruta.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(ruta, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404: " + urlPath + " no encontrado");
        return;
      }
    const ext = path.extname(ruta).toLowerCase();
    // No-cache: el navegador siempre debe pedir la versión más reciente
    // (evita errores causados por versiones viejas de los .js en caché).
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    res.end(data);
    });
  })
  .listen(PUERTO, () => {
    console.log("Servidor local corriendo en:");
    console.log("  http://localhost:" + PUERTO + "/admin.html");
    console.log("Presiona Ctrl+C para detener.");
  });
