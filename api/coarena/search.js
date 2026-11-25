const https = require('https');

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_QUERY_LENGTH = 1000;

function isRateLimited(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
  const now = Date.now();
  const current = rateLimitStore.get(ip);

  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function isSameOriginRequest(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers['x-forwarded-host'] || req.headers.host;
    return Boolean(requestHost) && originHost === requestHost;
  } catch (error) {
    return false;
  }
}

function safeText(value, maxLength = 120) {
  return String(value || '').replace(/[\r\n]+/g, ' ').slice(0, maxLength);
}

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  if (!isSameOriginRequest(req)) {
    return res.status(403).json({ error: 'Origen no permitido.' });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Se alcanzó el límite temporal de consultas. Inténtalo más tarde.' });
  }

  const apiKey = (process.env.APIKEY_COARENA || process.env.COARENA_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(503).json({ error: 'El asistente IA no está configurado en el servidor.' });
  }

  const { query, context } = req.body || {};
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Escribe una consulta antes de enviar.' });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(413).json({ error: 'La consulta es demasiado larga.' });
  }

  const stations = Array.isArray(context?.stations) ? context.stations.slice(0, 10) : [];
  const stationLines = stations.map(station => {
    const prices = station.prices || {};
    const lat = Number(station.lat);
    const lng = Number(station.lng);
    const location = Number.isFinite(lat) && Number.isFinite(lng) ? ` https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : '';
    return `- ${safeText(station.name)} (${safeText(station.brand)}) en ${safeText(station.address)}, ${safeText(station.comuna)}. 93: $${safeText(prices.gasolina93, 16)}, 95: $${safeText(prices.gasolina95, 16)}, 97: $${safeText(prices.gasolina97, 16)}, diésel: $${safeText(prices.diesel, 16)}.${location}`;
  }).join('\n');

  const contextPrompt = stationLines
    ? `\nEstaciones visibles en ${safeText(context.comuna || 'Chile')}, región ${safeText(context.region)}:\n${stationLines}\nCombustible seleccionado: ${safeText(context.fuelName || 'no especificado')}.`
    : '\nNo se entregaron estaciones actuales; no inventes precios, disponibilidad ni proyecciones.';
  const systemMessage = `Eres el asistente de BencinaChile. Responde en español de forma breve y clara. Usa sólo la información proporcionada y conocimiento general; no afirmes que consultaste internet ni inventes precios, estaciones, horarios o proyecciones. Los precios son referenciales en pesos chilenos. Si falta un dato, dilo explícitamente.${contextPrompt}`;
  const payload = JSON.stringify({
    model: 'ministral-3-3b',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: query.trim() }
    ],
    temperature: 0.3,
    max_tokens: 800
  });

  const options = {
    hostname: 'coarena.ai',
    port: 443,
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const upstream = https.request(options, (upstreamResponse) => {
    let data = '';
    upstreamResponse.on('data', chunk => { data += chunk; });
    upstreamResponse.on('end', () => {
      let json;
      try {
        json = JSON.parse(data);
      } catch (error) {
        return res.status(502).json({ error: 'El servicio IA devolvió una respuesta inválida.' });
      }

      if (upstreamResponse.statusCode >= 200 && upstreamResponse.statusCode < 300) {
        const answer = json.choices?.[0]?.message?.content;
        if (typeof answer !== 'string' || !answer.trim()) {
          return res.status(502).json({ error: 'El servicio IA no entregó una respuesta válida.' });
        }
        return res.status(200).json({ success: true, answer });
      }

      return res.status(upstreamResponse.statusCode >= 400 && upstreamResponse.statusCode < 500 ? 502 : 503)
        .json({ error: 'No fue posible completar la consulta con el servicio IA.' });
    });
  });

  upstream.setTimeout(15000, () => upstream.destroy(new Error('Coarena request timed out')));
  upstream.on('error', () => {
    if (!res.headersSent) return res.status(502).json({ error: 'No fue posible conectar con el servicio IA.' });
  });
  upstream.write(payload);
  upstream.end();
};
