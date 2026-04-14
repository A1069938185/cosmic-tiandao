/**
 * Character routes
 * GET  /api/worlds/:id/characters         → list all characters
 * GET  /api/worlds/:id/characters/:cid   → get character detail
 * GET  /api/worlds/:id/characters/:cid/:file → read specific file
 */

import { FastifyInstance } from 'fastify';
import {
  getCharactersMeta,
  getCharacterFiles,
  readCharacterFile,
} from '../services/worldfs.js';

export async function characterRoutes(fastify: FastifyInstance) {
  // List all characters
  fastify.get<{ Params: { id: string } }>(
    '/worlds/:id/characters',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const meta = await getCharactersMeta(id);
        return {
          success: true,
          data: meta,
          meta: { timestamp: new Date().toISOString(), worldId: id },
        };
      } catch (err) {
        return reply.status(500).send({
          success: false,
          error: { code: 'CHAR_LIST_FAILED', message: String(err) },
        });
      }
    }
  );

  // Get character file inventory
  fastify.get<{ Params: { id: string; cid: string } }>(
    '/worlds/:id/characters/:cid',
    async (request, reply) => {
      try {
        const { id, cid } = request.params;
        const files = await getCharacterFiles(id, cid);
        if (!files) {
          return reply.status(404).send({
            success: false,
            error: { code: 'CHAR_NOT_FOUND', message: `Character "${cid}" not found` },
          });
        }
        return {
          success: true,
          data: files,
          meta: { timestamp: new Date().toISOString(), worldId: id, charId: cid },
        };
      } catch (err) {
        return reply.status(500).send({
          success: false,
          error: { code: 'CHAR_GET_FAILED', message: String(err) },
        });
      }
    }
  );

  // Read specific character file
  fastify.get<{ Params: { id: string; cid: string; file: string } }>(
    '/worlds/:id/characters/:cid/:file',
    async (request, reply) => {
      try {
        const { id, cid, file } = request.params;
        const fileName = file.endsWith('.md') ? file : `${file}.md`;
        const content = await readCharacterFile(id, cid, fileName);
        if (!content) {
          return reply.status(404).send({
            success: false,
            error: { code: 'FILE_NOT_FOUND', message: `File "${fileName}" not found` },
          });
        }
        return {
          success: true,
          data: content,
          meta: { timestamp: new Date().toISOString(), worldId: id, charId: cid, file: fileName },
        };
      } catch (err) {
        return reply.status(500).send({
          success: false,
          error: { code: 'CHAR_FILE_READ_FAILED', message: String(err) },
        });
      }
    }
  );
}
