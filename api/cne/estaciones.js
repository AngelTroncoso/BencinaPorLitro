const https = require('https');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Usa GET.' });
  }

  const token = process.env.CNE_TOKEN?.trim();
  if (!token) {
    return res.status(503).json({ error: 'La integración CNE no está configurada en el servidor.' });
  }

  const cneUrl = new URL('https://api.cne.cl/v3/combustibles/vehicular/estaciones');
  cneUrl.searchParams.set('token', token);
  cneUrl.searchParams.set('formato', 'json');

  const upstream = https.get(cneUrl, (cneRes) => {
    let rawData = '';
    cneRes.on('data', chunk => { rawData += chunk; });
    cneRes.on('end', () => {
      try {
        const parsed = JSON.parse(rawData);
        return res.status(cneRes.statusCode || 502).json(parsed);
      } catch (error) {
        return res.status(502).json({ error: 'La API CNE devolvió una respuesta inválida.' });
      }
    });
  });

  upstream.setTimeout(10000, () => upstream.destroy(new Error('CNE request timed out')));
  upstream.on('error', () => {
    return res.status(502).json({ error: 'No fue posible consultar la API CNE.' });
  });
};
