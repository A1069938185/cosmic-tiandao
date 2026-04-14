/**
 * Simulation routes
 * POST /api/worlds/:id/simulate         → summon 常羲 to simulate
 * GET  /api/worlds/:id/chronicles       → get chronicle records
 * GET  /api/worlds/:id/entropy          → get entropy events
 * POST /api/worlds/:id/entropy          → summon 熵君 to inject entropy
 */

import { FastifyInstance } from 'fastify';
import { summonAgent } from '../services/openclaw.js';
import { getChronicles, appendChronicle, getEntropyMeta, getEntropyReports } from '../services/worldfs.js';

// Active simulation sessions per world
const activeSessions = new Map<string, string>();

export async function simulationRoutes(fastify: FastifyInstance) {
  // Trigger simulation (常羲)
  fastify.post<{
    Params: { id: string };
    Body: { days?: number; detail?: string };
  }>('/worlds/:id/simulate', async (request, reply) => {
    try {
      const { id } = request.params;
      const { days = 7, detail = 'milestone' } = request.body;

      // Check if simulation already running
      if (activeSessions.has(id)) {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'SIMULATION_RUNNING',
            message: `Simulation already running for "${id}". Session: ${activeSessions.get(id)}`,
          },
        });
      }

      // Summon 常羲
      const { sessionKey } = await summonAgent({
        agent: '常羲',
        action: '推演',
        worldId: id,
        params: { days, detail },
      });

      activeSessions.set(id, sessionKey);

      return {
        success: true,
        data: {
          sessionKey,
          worldId: id,
          days,
          detail,
          status: 'running',
        },
        meta: { timestamp: new Date().toISOString(), agent: '常羲', worldId: id },
      };
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: { code: 'SIMULATE_FAILED', message: String(err) },
      });
    }
  });

  // Get simulation status
  fastify.get<{ Params: { id: string } }>(
    '/worlds/:id/simulate/status',
    async (request, reply) => {
      const { id } = request.params;
      const sessionKey = activeSessions.get(id);
      return {
        success: true,
        data: {
          worldId: id,
          isRunning: !!sessionKey,
          sessionKey: sessionKey ?? null,
        },
      };
    }
  );

  // Cancel simulation
  fastify.delete<{ Params: { id: string } }>(
    '/worlds/:id/simulate',
    async (request, reply) => {
      const { id } = request.params;
      activeSessions.delete(id);
      return { success: true, data: { worldId: id, cancelled: true } };
    }
  );

  // Get chronicles
  fastify.get<{ Params: { id: string } }>(
    '/worlds/:id/chronicles',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const chronicles = await getChronicles(id);
        return {
          success: true,
          data: chronicles,
          meta: { timestamp: new Date().toISOString(), worldId: id },
        };
      } catch (err) {
        return reply.status(500).send({
          success: false,
          error: { code: 'CHRONICLES_GET_FAILED', message: String(err) },
        });
      }
    }
  );

  // Get entropy events
  fastify.get<{ Params: { id: string } }>(
    '/worlds/:id/entropy',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const [meta, reports] = await Promise.all([
          getEntropyMeta(id),
          getEntropyReports(id),
        ]);
        return {
          success: true,
          data: { meta, reports },
          meta: { timestamp: new Date().toISOString(), worldId: id },
        };
      } catch (err) {
        return reply.status(500).send({
          success: false,
          error: { code: 'ENTROPY_GET_FAILED', message: String(err) },
        });
      }
    }
  );

  // Trigger entropy injection (熵君)
  fastify.post<{
    Params: { id: string };
    Body: { type?: string; intensity?: string; description?: string };
  }>('/worlds/:id/entropy', async (request, reply) => {
    try {
      const { id } = request.params;
      const { type = 'random', intensity = 'medium', description } = request.body;

      const { sessionKey } = await summonAgent({
        agent: '熵君',
        action: '注入',
        worldId: id,
        params: { entropyType: type, intensity, description },
      });

      return {
        success: true,
        data: { sessionKey, worldId: id, status: 'running' },
        meta: { timestamp: new Date().toISOString(), agent: '熵君', worldId: id },
      };
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: { code: 'ENTROPY_INJECT_FAILED', message: String(err) },
      });
    }
  });

  // Summon 女娲 to create characters
  fastify.post<{
    Params: { id: string };
    Body: { type?: string; count?: number; relations?: string };
  }>('/worlds/:id/characters', async (request, reply) => {
    try {
      const { id } = request.params;
      const { type = '关键角色', count = 1, relations = '无' } = request.body;

      const { sessionKey } = await summonAgent({
        agent: '女娲',
        action: '创造',
        worldId: id,
        params: { type, count, relations },
      });

      return {
        success: true,
        data: { sessionKey, worldId: id, status: 'running' },
        meta: { timestamp: new Date().toISOString(), agent: '女娲', worldId: id },
      };
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: { code: 'CHAR_CREATE_FAILED', message: String(err) },
      });
    }
  });
}
