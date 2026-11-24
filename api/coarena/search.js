const https = require('https');

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
    const { query, apiKey: clientApiKey, context, model: clientModel } = req.body || {};

    const apiKey = (clientApiKey || process.env.APIKEY_COARENA || process.env.COARENA_API_KEY || '').trim();

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API Key de Coarena no configurada. Por favor ingresa tu APIKEY_COARENA en Configuración.' 
      });
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'La consulta (query) es requerida.' });
    }

    // Modelo a usar en Coarena (por defecto ministral-3-3b o compatible con Coarena)
    const model = clientModel || 'ministral-3-3b';

    // Contexto enriquecido con las bencineras actuales si existen
    let contextPrompt = '';
    if (context && context.stations && Array.isArray(context.stations) && context.stations.length > 0) {
      const topStations = context.stations.slice(0, 10).map(s => 
        `- ${s.name} (${s.brand}) en ${s.address}, ${s.comuna}. Precios: 93: $${s.prices.gasolina93 || '-'}, 95: $${s.prices.gasolina95 || '-'}, 97: $${s.prices.gasolina97 || '-'}, Diésel: $${s.prices.diesel || '-'}. Coordenadas: [${s.lat}, ${s.lng}]. Enlace Waze: https://waze.com/ul?ll=${s.lat},${s.lng}&navigate=yes`
      ).join('\n');

      contextPrompt = `\nInformación de bencineras detectadas en la zona seleccionada (${context.comuna || 'Chile'}, Región ${context.region || ''}):\n${topStations}\nCombustible consultado: ${context.fuelName || 'Gasolina'}.`;
    }

    const systemMessage = `Eres el asistente experto de "BencinaChile + Waze". Ayudas a conductores en Chile a encontrar los precios de bencina más económicos (Gasolina 93, 95, 97, Diésel, Parafina/Kerosene, GLP), calcular cuánto dinero ahorran por estanque completo y generar recomendaciones claras con enlaces directos para navegar con Waze (formato: https://waze.com/ul?ll=LAT,LNG&navigate=yes). Responde en español de forma amigable, precisa, con formato Markdown legible y destacando los precios en pesos chilenos ($CLP).`;

    const payload = JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemMessage + contextPrompt },
        { role: 'user', content: query }
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

    const coarenaReq = https.request(options, (coarenaRes) => {
      let data = '';
      coarenaRes.on('data', chunk => { data += chunk; });
      coarenaRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (coarenaRes.statusCode >= 200 && coarenaRes.statusCode < 300) {
            const answer = json.choices && json.choices[0] && json.choices[0].message
              ? json.choices[0].message.content
              : 'No se obtuvo una respuesta válida del modelo.';
            return res.status(200).json({ success: true, answer, raw: json });
          } else {
            return res.status(coarenaRes.statusCode || 500).json({
              error: json.error?.message || json.error || 'Error al consultar API Coarena',
              status: coarenaRes.statusCode
            });
          }
        } catch (e) {
          return res.status(500).json({ error: 'Error parseando respuesta de Coarena', details: e.message });
        }
      });
    });

    coarenaReq.on('error', (err) => {
      return res.status(502).json({ error: 'Error de conexión con Coarena', details: err.message });
    });

    coarenaReq.write(payload);
    coarenaReq.end();

  } catch (error) {
    return res.status(500).json({ error: 'Error interno en el servidor', details: error.message });
  }
};
