// Servidor web nativo y ligero en Node.js, sin dependencias externas.
// Ejecuta con: node server.js o npm start

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_COARENA_BODY_BYTES = 32 * 1024;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      app: 'Bencina Chile + Waze',
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/api/cne/status' && req.method === 'GET') {
    return sendJson(res, 200, { configured: Boolean(process.env.CNE_TOKEN?.trim()) });
  }

  if (pathname === '/api/cne/estaciones' && req.method === 'GET') {
    const token = process.env.CNE_TOKEN?.trim();
    if (!token) {
      return sendJson(res, 503, { error: 'La integración CNE no está configurada en el servidor.' });
    }

    const cneUrl = new URL('https://api.cne.cl/v3/combustibles/vehicular/estaciones');
    cneUrl.searchParams.set('token', token);
    cneUrl.searchParams.set('formato', 'json');

    const upstream = https.get(cneUrl, (cneRes) => {
      let raw = '';
      cneRes.on('data', chunk => { raw += chunk; });
      cneRes.on('end', () => {
        res.writeHead(cneRes.statusCode || 502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(raw);
      });
    });
    upstream.setTimeout(10000, () => upstream.destroy(new Error('CNE request timed out')));
    upstream.on('error', () => {
      if (!res.headersSent) sendJson(res, 502, { error: 'No fue posible consultar la API CNE.' });
    });
    return;
  }

  if (pathname === '/api/coarena/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      configured: Boolean((process.env.APIKEY_COARENA || process.env.COARENA_API_KEY || '').trim())
    });
  }

  if (pathname === '/api/coarena/search') {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { error: 'Método no permitido. Usa POST.' });
    }

    let body = '';
    let bodyBytes = 0;
    let tooLarge = false;
    req.on('data', chunk => {
      bodyBytes += chunk.length;
      if (bodyBytes > MAX_COARENA_BODY_BYTES) {
        tooLarge = true;
        body = '';
        return;
      }
      if (!tooLarge) body += chunk;
    });
    req.on('end', () => {
      if (tooLarge) return sendJson(res, 413, { error: 'La solicitud supera el tamaño máximo permitido.' });

      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (error) {
        return sendJson(res, 400, { error: 'El cuerpo de la solicitud debe ser JSON válido.' });
      }

      res.status = (code) => {
        res.statusCode = code;
        return {
          json: (data) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(data));
          },
          end: () => res.end()
        };
      };
      require('./api/coarena/search')(req, res);
    });
    return;
  }

  // Servir sólo recursos bajo public/.
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let filePath = path.resolve(PUBLIC_DIR, relativePath);
  if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`) && filePath !== path.join(PUBLIC_DIR, 'index.html')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Acceso denegado');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Error interno al leer archivo');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Bencina Chile + Waze disponible en http://localhost:${PORT}`);
});
