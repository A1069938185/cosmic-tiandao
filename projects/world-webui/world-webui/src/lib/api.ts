// API client for World Controller

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? 'API error');
  return json.data as T;
}

export const api = {
  // Worlds
  listWorlds: () => request<{ id: string; name: string; exists: boolean }[]>('/worlds'),
  getWorld: (id: string) => request<Record<string, unknown>>(`/worlds/${encodeURIComponent(id)}`),
  updateWorldState: (id: string, updates: Record<string, unknown>) =>
    request(`/worlds/${encodeURIComponent(id)}/state`, { method: 'PATCH', body: JSON.stringify(updates) }),

  // Characters
  listCharacters: (worldId: string) =>
    request(`/worlds/${encodeURIComponent(worldId)}/characters`),
  getCharacter: (worldId: string, charId: string) =>
    request(`/worlds/${encodeURIComponent(worldId)}/characters/${encodeURIComponent(charId)}`),
  getCharacterFile: (worldId: string, charId: string, file: string) =>
    request(`/worlds/${encodeURIComponent(worldId)}/characters/${encodeURIComponent(charId)}/${file}`),

  // Simulation
  simulate: (worldId: string, days: number, detail = 'milestone') =>
    request<{ sessionKey: string; status: string }>(
      `/worlds/${encodeURIComponent(worldId)}/simulate`,
      { method: 'POST', body: JSON.stringify({ days, detail }) }
    ),
  getSimStatus: (worldId: string) =>
    request<{ isRunning: boolean; sessionKey: string | null }>(
      `/worlds/${encodeURIComponent(worldId)}/simulate/status`
    ),
  cancelSim: (worldId: string) =>
    request(`/worlds/${encodeURIComponent(worldId)}/simulate`, { method: 'DELETE' }),

  // Chronicles
  getChronicles: (worldId: string) =>
    request<{ file: string; raw: string; size: number }[]>(
      `/worlds/${encodeURIComponent(worldId)}/chronicles`
    ),

  // Entropy
  getEntropy: (worldId: string) =>
    request<{ meta: Record<string, unknown>; reports: unknown[] }>(
      `/worlds/${encodeURIComponent(worldId)}/entropy`
    ),
  injectEntropy: (worldId: string, params: { type?: string; intensity?: string; description?: string }) =>
    request(`/worlds/${encodeURIComponent(worldId)}/entropy`, { method: 'POST', body: JSON.stringify(params) }),

  // Agent
  createCharacters: (worldId: string, params: { type?: string; count?: number; relations?: string }) =>
    request(`/worlds/${encodeURIComponent(worldId)}/characters`, { method: 'POST', body: JSON.stringify(params) }),
};

export type { WorldInfo, CharacterMeta } from './types';
