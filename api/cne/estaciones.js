const https = require('https');

module.exports = (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ error: 'Token CNE requerido (?token=...)' });
  }

  const url = `https://api.cne.cl/v3/combustibles/vehicular/estaciones?token=${encodeURIComponent(token)}&formato=json`;
  
  https.get(url, (cneRes) => {
    let rawData = '';
    cneRes.on('data', (chunk) => { rawData += chunk; });
    cneRes.on('end', () => {
      try {
        const parsed = JSON.parse(rawData);
        res.status(cneRes.statusCode || 200).json(parsed);
      } catch (e) {
        res.status(500).json({ error: 'Error parseando respuesta de CNE', details: e.message });
      }
    });
  }).on('error', (err) => {
    res.status(502).json({ error: 'Error al conectar con API CNE', details: err.message });
  });
};
