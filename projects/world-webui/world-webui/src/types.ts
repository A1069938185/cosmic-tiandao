// Shared TypeScript types for World Controller

export interface WorldDimensionLayer {
  id: string;
  name: string;
  color: string;
}

export interface WorldDimension {
  id: string;
  name: string;
  layers: WorldDimensionLayer[];
}

export interface WorldState {
  currentTime: string;            // e.g. "GL 172年3月11日"
  entropy: number[];              // entropy values per dimension layer, aligned with dimensions[]
  dimensions?: WorldDimension[];   // optional: from world.md frontmatter
  activeCharacters: number;
  activeArc: string | null;
  arcProgress: number;            // 0-100
  // Legacy flat entropy (deprecated — use entropy[] + dimensions instead)
  entropyVisible?: number;
  entropyInvisible?: number;
}

export interface CharacterMeta {
  id: string;
  name: string;
  role: string;
  layerTags: string[];            // e.g. ["visible"], ["invisible"], ["visible","invisible"]
  status: 'active' | 'missing' | 'deceased' | 'unknown';
  created: string;
  updated: string;
  note?: string;
  // Legacy field (deprecated — use layerTags instead)
  layer?: 'visible' | 'invisible' | 'both';
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

export interface EntropyReport {
  id: string;
  type: string;       // e.g. "REVELATION", "COLLAPSE", etc.
  title: string;
  date: string;
  status: string;      // "active", "dormant", "resolved", "escalating", "unknown"
  summary: string;     // first paragraph as clean text (no markdown)
  content: string;     // full report as markdown
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
  agent: string;        // 盘古 | 女娲 | 命匠 | 熵君 | 常羲
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
