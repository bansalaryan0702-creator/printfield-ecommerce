import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let handler: any = null;
let loadError: any = null;

try {
  const mod = require('../dist/server.cjs');
  handler = mod.default || mod;
} catch (err: any) {
  loadError = err;
  console.error('[Vercel Serverless] Module load error:', err);
}

export default async function serverless(req: any, res: any) {
  if (!handler) {
    try {
      const mod = require('../dist/server.cjs');
      handler = mod.default || mod;
      loadError = null;
    } catch (err: any) {
      loadError = err;
      console.error('[Vercel Serverless] Retry load error:', err);
    }
  }

  if (typeof handler === 'function') {
    try {
      return await handler(req, res);
    } catch (runtimeErr: any) {
      console.error('[Vercel Serverless] Runtime execution error:', runtimeErr);
      return res.status(500).json({
        error: 'Serverless runtime error',
        message: runtimeErr?.message || String(runtimeErr)
      });
    }
  }

  return res.status(500).json({
    error: 'Server failed to load',
    details: loadError?.message || 'Handler is not a function'
  });
}
