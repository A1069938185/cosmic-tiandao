/**
 * World routes
 * GET  /api/worlds              → list all worlds
 * GET  /api/worlds/:id          → get world state
 * PATCH /api/worlds/:id/state   → update world state
 * GET  /api/worlds/:id/constitution → get world.md
 */

import { FastifyInstance } from 'fastify';
import { listWorlds, getWorldState, updateWorldState, getWorldConstitution } from '../services/worldfs.js';
import { getGatewayStatus } from '../services/openclaw.js';

export async function worldRoutes(fastify: FastifyInstance) {
  // List all worlds
  fastify.get('/worlds', async (request, reply) => {
    try {
      const worlds = await listWorlds();
      return {
        success: true,
        data: worlds,
        meta: { timestamp: new Date().toISOString() },
      };
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: { code: 'WORLD_LIST_FAILED', message: String(err) },
      });
    }
  });

  // Get single world state
  fastify.get<{ Params: { id: string } }>('/worlds/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const state = await getWorldState(id);
      if (!state) {
        return reply.status(404).send({
          success: false,
          error: { code: 'WORLD_NOT_FOUND', message: `World "${id}" not found` },
        });
      }
      
      // Get gateway status as well
      const gateway = await getGatewayStatus();
      
      return {
        success: true,
        data: { worldId: id, ...state, gateway },
        meta: { timestamp: new Date().toISOString(), worldId: id },
      };
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: { code: 'WORLD_GET_FAILED', message: String(err) },
      });
    }
  });

  // Update world state
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/worlds/:id/state',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const updates = request.body as Record<string, unknown>;
        const updated = await updateWorldState(id, updates);
        return {
          success: true,
          data: updated,
          meta: { timestamp: new Date().toISOString(), worldId: id },
        };
      } catch (err) {
        return reply.status(500).send({
          success: false,
          error: { code: 'WORLD_UPDATE_FAILED', message: String(err) },
        });
      }
    }
  );

  // Get world constitution
  fastify.get<{ Params: { id: string } }>(
    '/worlds/:id/constitution',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const constitution = await getWorldConstitution(id);
        if (!constitution) {
          return reply.status(404).send({
            success: false,
            error: { code: 'CONSTITUTION_NOT_FOUND', message: 'world.md not found' },
          });
        }
        return {
          success: true,
          data: constitution,
          meta: { timestamp: new Date().toISOString(), worldId: id },
        };
      } catch (err) {
        return reply.status(500).send({
          success: false,
          error: { code: 'CONSTITUTION_GET_FAILED', message: String(err) },
        });
      }
    }
  );
}
