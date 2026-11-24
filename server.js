// Servidor Web nativo y ligero en Node.js (SIN dependencias externas necesarias)
// Se ejecuta directamente con: node server.js o npm start

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Endpoint de estado
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      app: 'BencinaBarata Chile + Waze',
      timestamp: new Date().toISOString()
    }));
  }

  // Proxy CNE API (Comisión Nacional de Energía)
  if (pathname === '/api/cne/estaciones') {
    const token = parsedUrl.query.token;
    if (!token) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Token CNE requerido (?token=...)' }));
    }

    const cneUrl = `https://api.cne.cl/v3/combustibles/vehicular/estaciones?token=${encodeURIComponent(token)}&formato=json`;
    https.get(cneUrl, (cneRes) => {
      let raw = '';
      cneRes.on('data', chunk => { raw += chunk; });
      cneRes.on('end', () => {
        res.writeHead(cneRes.statusCode || 200, { 'Content-Type': 'application/json' });
        res.end(raw);
      });
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error al conectar con CNE', details: err.message }));
    });
    return;
  }

  // Servidor de archivos estáticos
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let filePath = path.join(PUBLIC_DIR, relativePath);

  // Seguridad: evitar directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Acceso denegado');
  }

  // Si no existe el archivo, probar con index.html (SPA fallback)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Error interno al leer archivo');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log('===================================================');
  console.log('🚗 BencinaBarata Chile + Waze');
  console.log(`🌐 Servidor iniciado en http://localhost:${PORT}`);
  console.log('📍 Abre tu navegador para buscar las bencineras');
  console.log('===================================================');
});
