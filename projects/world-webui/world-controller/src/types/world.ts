// Shared TypeScript types for World Controller

export interface WorldState {
  currentTime: string;           // e.g. "GL 172年3月11日"
  entropy: {
    visible: number;              // 0-10
    invisible: number;            // 0-10
  };
  activeCharacters: number;
  activeArc: string | null;
  arcProgress: number;            // 0-100
}

export interface CharacterMeta {
  id: string;
  name: string;
  role: string;
  layer: 'visible' | 'invisible' | 'both';
  status: 'active' | 'missing' | 'deceased' | 'unknown';
  created: string;
  updated: string;
  note?: string;
}

export interface CharacterFile {
  id: string;
  path: string;
  hasIdentity: boolean;
  hasPersonality: boolean;
  hasTimeline: boolean;
  hasRelationships: boolean;
  hasFate: boolean;
  hasExistence: boolean;
  hasPossessions: boolean;
}

export interface WorldInfo {
  id: string;
  name: string;
  path: string;
  exists: boolean;
}

export interface EntropyEvent {
  id: string;
  type: string;
  name: string;
  date: string;
  report: string;
}

export interface SimulationRequest {
  worldId: string;
  days: number;
  detail: 'all' | 'none' | 'milestone';
}

export interface AgentCallRequest {
  agent: string;        // 女娲 | 命匠 | 熵君 | 常羲
  action: string;
  worldId: string;
  params: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    agent?: string;
    worldId?: string;
  };
}
