module.exports = async function handler(req, res) {
  const mod = require('../dist/server.cjs');
  const fn = mod.default || mod;
  if (typeof fn === 'function') {
    return fn(req, res);
  }
  res.status(500).json({ error: 'Server failed to load' });
};
