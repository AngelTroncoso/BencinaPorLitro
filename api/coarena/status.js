module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Usa GET.' });
  }

  const configured = Boolean((process.env.APIKEY_COARENA || process.env.COARENA_API_KEY || '').trim());
  return res.status(200).json({ configured });
};
