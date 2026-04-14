/**
 * OpenClaw Gateway Service
 * Bridges World Controller to OpenClaw's sub-agent system.
 */

import type { AgentCallRequest } from '../types/world.js';

const GATEWAY_BASE = 'http://127.0.0.1:28789';

async function gatewayFetch(path: string, method = 'GET', body?: unknown) {
  const token = process.env.OPENCLAW_TOKEN ?? '';
  const res = await fetch(`${GATEWAY_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gateway ${res.status} ${path}: ${text}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent dispatch
// ─────────────────────────────────────────────────────────────────────────────

export async function summonAgent(req: AgentCallRequest): Promise<{ sessionKey: string }> {
  const { agent, action, worldId, params } = req;
  const userMessage = buildUserMessage(agent, action, params);

  const result = await gatewayFetch('/api/sessions/spawn', 'POST', {
    runtime: 'subagent',
    task: userMessage,
    model: 'qclaw/modelroute',
    timeoutSeconds: 300,
  });

  return { sessionKey: result.sessionKey ?? result.key ?? '' };
}

function buildUserMessage(agent: string, action: string, params: Record<string, unknown>): string {
  const worldPath = `C:\\Users\\OseasyVM\\.qclaw\\workspace-agent-7d863614\\worlds\\${params.worldId ?? ''}`;

  const messages: Record<string, string> = {
    '常羲-推演': `执行推演任务：\n天数：${params.days ?? 7}\n详细程度：${params.detail ?? 'milestone'}\n\n推演完成后：\n1. 将结果追加到 chronicles/GL-YYYY-MM.md\n2. 更新 _state.md\n3. 返回结构化汇报`,
    '女娲-创造': `执行角色创造任务：\n角色类型：${params.type ?? '关键角色'}\n数量：${params.count ?? 1}\n\n完成后写入对应角色档案，并更新 _meta.json。`,
    '命匠-弧光': `设计叙事弧光：\n弧光类型：${params.arcType ?? '主线弧光'}\n\n完成后写入 narratives/ 目录。`,
    '熵君-注入': `注入熵变事件：\n强度：${params.intensity ?? 'medium'}\n\n完成后写入 entropy/ 目录并更新熵值。`,
  };

  return messages[`${agent}-${action}`] ?? `执行任务：${action}，参数：${JSON.stringify(params)}`;
}

export async function listSessions(): Promise<unknown[]> {
  try {
    const result = await gatewayFetch('/api/sessions');
    return result.sessions ?? [];
  } catch { return []; }
}

export async function getGatewayStatus(): Promise<{ ok: boolean; version: string }> {
  try {
    const result = await gatewayFetch('/health');
    return { ok: result.ok ?? true, version: result.version ?? 'unknown' };
  } catch {
    return { ok: false, version: 'unknown' };
  }
}
