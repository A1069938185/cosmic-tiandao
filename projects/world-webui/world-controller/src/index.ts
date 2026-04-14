/**
 * World Controller - Main Entry
 * Single server: API + Static Frontend
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { worldRoutes } from './routes/worlds.js';
import { characterRoutes } from './routes/characters.js';
import { simulationRoutes } from './routes/simulation.js';
import { getGatewayStatus, listSessions } from './services/openclaw.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3002;
const HOST = '0.0.0.0';
const FRONTEND_DIST = resolve(__dirname, '..', '..', 'world-webui', 'dist');

const fastify = Fastify({ logger: { level: 'warn' } });

// ── Plugins ──────────────────────────────────────────────────────────────────
await fastify.register(cors, { origin: true, credentials: true });
await fastify.register(websocket);

// ── API Routes ───────────────────────────────────────────────────────────────
await fastify.register(worldRoutes, { prefix: '/api' });
await fastify.register(characterRoutes, { prefix: '/api' });
await fastify.register(simulationRoutes, { prefix: '/api' });

// Health check
fastify.get('/api/health', async () => {
  const [gateway, sessions] = await Promise.all([
    getGatewayStatus().catch(() => ({ ok: false })),
    listSessions().catch(() => []),
  ]);
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    gateway,
    activeSessions: Array.isArray(sessions) ? sessions.length : 0,
  };
});

// ── Static Frontend ──────────────────────────────────────────────────────────
await fastify.register(fastifyStatic, {
  root: FRONTEND_DIST,
  prefix: '/',
  redirect: false,
});

// SPA fallback: serve index.html for non-API routes
fastify.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith('/api') || request.url.startsWith('/ws')) {
    reply.code(404).send({ error: 'Not Found' });
    return;
  }
  reply.sendFile('index.html');
});

// ── WebSocket ────────────────────────────────────────────────────────────────
const wsClients = new Map<string, Set<import('ws').WebSocket>>();

fastify.register(async (instance) => {
  instance.get('/ws/:worldId', { websocket: true }, (connection, req) => {
    const { worldId } = req.params as { worldId: string };
    if (!wsClients.has(worldId)) wsClients.set(worldId, new Set());
    wsClients.get(worldId)!.add(connection.socket);
    connection.socket.on('close', () => wsClients.get(worldId)?.delete(connection.socket));
    connection.socket.on('error', () => wsClients.get(worldId)?.delete(connection.socket));
    connection.socket.on('message', (msg) => {
      const payload = JSON.stringify({ worldId, msg: msg.toString(), ts: Date.now() });
      wsClients.get(worldId)?.forEach(ws => ws.send(payload).catch?.(() => {}));
    });
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`\n  World Controller running`);
  console.log(`  URL:  http://localhost:${PORT}`);
  console.log(`  API:  http://localhost:${PORT}/api`);
  console.log(`  WS:   ws://localhost:${PORT}/ws/:worldId`);
  console.log(`  Frontend: ${FRONTEND_DIST}\n`);
} catch (err) {
  console.error('Start failed:', err.message);
  process.exit(1);
}

process.on('SIGINT', async () => { await fastify.close(); process.exit(0); });
