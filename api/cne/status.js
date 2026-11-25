module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Usa GET.' });
  }

  return res.status(200).json({ configured: Boolean(process.env.CNE_TOKEN?.trim()) });
};
