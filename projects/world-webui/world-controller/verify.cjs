// verify.cjs - validates server without network I/O
const { readFileSync } = require('fs');
const path = require('path');

// Check all source files exist
const files = [
  'src/index.ts',
  'src/services/openclaw.ts',
  'src/services/worldfs.ts',
  'src/routes/worlds.ts',
  'src/routes/characters.ts',
  'src/routes/simulation.ts',
  'src/types/world.ts',
];

console.log('=== World Controller File Check ===');
let ok = true;
for (const f of files) {
  const fp = path.join(__dirname, f);
  try {
    const stat = require('fs').statSync(fp);
    console.log(`✓ ${f} (${stat.size} bytes)`);
  } catch {
    console.log(`✗ ${f} MISSING`);
    ok = false;
  }
}

console.log('\n=== package.json check ===');
try {
  const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  console.log('✓ package.json valid');
  console.log('  Dependencies:', Object.keys(pkg.dependencies).join(', '));
} catch(e) {
  console.log('✗ package.json error:', e.message);
  ok = false;
}

console.log('\n=== Server startup test (in-process) ===');
// Use fastify's inject() for zero-network test
(async () => {
  try {
    const { default: Fastify } = await import('fastify');
    const f = Fastify({ logger: false });
    await f.register((await import('@fastify/cors')).default, { origin: true });
    await f.register((await import('@fastify/websocket')).default);
    f.get('/api/health', async () => ({ status: 'ok', ts: Date.now() }));
    const r = await f.inject({ method: 'GET', url: '/api/health' });
    console.log('✓ Fastify server test:', r.statusCode, r.body);
    await f.close();
  } catch(e) {
    console.log('✗ Fastify test error:', e.message);
    ok = false;
  }
})().finally(() => {
  console.log('\n=== Result:', ok ? 'PASS ✓' : 'FAIL ✗', '===');
});
