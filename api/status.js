module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'BencinaBarata Chile + Waze',
    deployment: 'Vercel Serverless',
    timestamp: new Date().toISOString()
  });
};
