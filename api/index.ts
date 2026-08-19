import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const mod = require('../dist/server.cjs');
const handler = mod.default || mod;

export default async function serverless(req: any, res: any) {
  if (typeof handler === 'function') {
    return handler(req, res);
  }
  res.status(500).json({ error: 'Server failed to load' });
}
