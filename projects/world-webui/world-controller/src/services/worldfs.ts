/**
 * World File System Service
 * Reads and writes world data files from the shared workspace.
 *
 * File structure:
 * worlds/[world-id]/           → world.md (frontmatter: dimensions), _state.md
 * worlds/[world-id]/characters/ → character dirs + _meta.json
 * worlds/[world-id]/chronicles/ → GL-YYYY-MM.md
 * worlds/[world-id]/entropy/    → ent_xxx/report.md
 * worlds/[world-id]/narratives/ → narrative files
 */

import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, basename } from 'path';
import matter from 'gray-matter';

const WORKSPACE = 'C:\\Users\\OseasyVM\\.qclaw\\workspace-agent-7d863614';
const WORLDS_DIR = join(WORKSPACE, 'worlds');

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

export interface WorldDimensions {
  dimensions: WorldDimension[];
}

// ─────────────────────────────────────────────────────────────────────────────
// World listing
// ─────────────────────────────────────────────────────────────────────────────

export async function listWorlds() {
  const entries = await readdir(WORLDS_DIR).catch(() => []);
  return entries
    .filter(name => !name.startsWith('.'))
    .map(name => ({
      id: name,
      name,
      path: join(WORLDS_DIR, name),
      exists: existsSync(join(WORLDS_DIR, name, 'world.md')),
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// World dimensions (reads world.md frontmatter)
// ─────────────────────────────────────────────────────────────────────────────

export async function getWorldDimensions(worldId: string): Promise<WorldDimensions | null> {
  const worldPath = join(WORLDS_DIR, worldId, 'world.md');
  if (!existsSync(worldPath)) return null;

  try {
    const raw = await readFile(worldPath, 'utf-8');
    const { data } = matter(raw);

    if (data?.dimensions && Array.isArray(data.dimensions)) {
      return { dimensions: data.dimensions };
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// World state
// ─────────────────────────────────────────────────────────────────────────────

export async function getWorldState(worldId: string) {
  const statePath = join(WORLDS_DIR, worldId, '_state.md');
  try {
    const raw = await readFile(statePath, 'utf-8');
    const parsed = parseStateMarkdown(raw);

    // Attach dimensions if available
    const dims = await getWorldDimensions(worldId);
    if (dims) {
      (parsed as Record<string, unknown>).dimensions = dims.dimensions;

      // Build entropy[] aligned with dimensions[].layers order
      const legacy = parsed.entropy as { visible?: number; invisible?: number } | undefined;
      if (legacy) {
        const entropyValues: number[] = [];
        for (const dim of dims.dimensions) {
          for (const layer of dim.layers) {
            if (layer.id === 'visible') entropyValues.push(legacy.visible ?? 0);
            else if (layer.id === 'invisible') entropyValues.push(legacy.invisible ?? 0);
            else entropyValues.push(0);
          }
        }
        (parsed as Record<string, unknown>).entropy = entropyValues;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

function parseStateMarkdown(raw: string): Record<string, unknown> {
  const lines = raw.split('\n');
  const state: Record<string, unknown> = {};

  // Extract from header comments
  for (const line of lines.slice(0, 10)) {
    if (line.includes('当前时间：')) {
      state.currentTime = line.split('当前时间：')[1]?.trim();
    }
    if (line.includes('推演进度：')) {
      state.activeArc = line.split('推演进度：')[1]?.trim();
    }
    if (line.includes('熵值：')) {
      const entropyStr = line.split('熵值：')[1]?.trim();
      const visibleMatch = entropyStr?.match(/可见层(\d+)/);
      const invisibleMatch = entropyStr?.match(/不可见层(\d+)/);
      state.entropy = {
        visible: visibleMatch ? parseInt(visibleMatch[1]) : 7,
        invisible: invisibleMatch ? parseInt(invisibleMatch[1]) : 4,
      };
    }
  }

  // Extract character status from table
  const charStatus: Record<string, string> = {};
  let inTable = false;
  for (const line of lines) {
    if (line.includes('## 角色状态')) inTable = true;
    if (inTable && line.startsWith('|') && !line.includes('---')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3 && cells[0] !== '角色') {
        charStatus[cells[0]] = cells[1];
      }
    }
    if (inTable && line.startsWith('## ')) break;
  }
  state.characterStatus = charStatus;

  return state;
}

export async function updateWorldState(worldId: string, updates: Record<string, unknown>) {
  const statePath = join(WORLDS_DIR, worldId, '_state.md');
  const existing = await getWorldState(worldId);
  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };

  const lines = Object.entries(merged)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');

  await writeFile(statePath, lines, 'utf-8');
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Characters
// ─────────────────────────────────────────────────────────────────────────────

export async function getCharactersMeta(worldId: string) {
  const metaPath = join(WORLDS_DIR, worldId, 'characters', '_meta.json');
  try {
    const raw = await readFile(metaPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { world: worldId, version: '1.0', characters: [] };
  }
}

export async function getCharacterFiles(worldId: string, charId: string) {
  const charDir = join(WORLDS_DIR, worldId, 'characters', charId);
  if (!existsSync(charDir)) return null;

  const files = await readdir(charDir).catch(() => []);
  const fileMap: Record<string, boolean> = {
    identity: false,
    personality: false,
    timeline: false,
    relationships: false,
    fate: false,
    existence: false,
  };

  for (const file of files) {
    const name = basename(file, extname(file));
    if (file === '_index.md' || name === '_index') {
      fileMap.possessions = true;
    } else if (name in fileMap) {
      fileMap[name as keyof typeof fileMap] = true;
    }
  }

  return {
    id: charId,
    path: charDir,
    files: await Promise.all(
      files.map(async f => {
        const fp = join(charDir, f);
        const st = await stat(fp);
        return { name: f, size: st.size, isDir: st.isDirectory() };
      })
    ),
    ...fileMap,
  };
}

export async function readCharacterFile(worldId: string, charId: string, fileName: string) {
  const path = join(WORLDS_DIR, worldId, 'characters', charId, fileName);
  if (!existsSync(path)) return null;

  const raw = await readFile(path, 'utf-8');
  const { data, content } = matter(raw);
  return { data, content, raw };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chronicles
// ─────────────────────────────────────────────────────────────────────────────

const WORLD_FOOTER_LINES = [
  // World constitution footers
  '*本文件为世界宪法，记录世界的根本法则与设计理念。*',
  '*由天道创立，用于定义世界的维度、规则与运行逻辑。*',
  // Chronicle footers (混入了 constitution 语气的编年元数据)
  '*本记录为推演存档，每次推演后追加记录至本文件。*',
  '*由天道维护，孟婆负责编年归档。*',
];

export async function getChronicles(worldId: string) {
  const dir = join(WORLDS_DIR, worldId, 'chronicles');
  if (!existsSync(dir)) return [];

  const files = await readdir(dir);
  const chronicles = await Promise.all(
    files
      .filter(f => f.endsWith('.md'))
      .map(async f => {
        const raw = await readFile(join(dir, f), 'utf-8');
        const cleaned = cleanWorldFooter(raw);
        return { file: f, raw: cleaned, size: cleaned.length };
      })
  );

  return chronicles.sort((a, b) => a.file.localeCompare(b.file));
}

/** Strip world constitution footer lines that may have been appended to chronicle files */
function cleanWorldFooter(raw: string): string {
  const lines = raw.split('\n');
  const footerSet = new Set(WORLD_FOOTER_LINES);
  // Strip trailing world footer lines
  while (lines.length > 0 && footerSet.has(lines[lines.length - 1].trim())) {
    lines.pop();
  }
  return lines.join('\n');
}

export async function appendChronicle(worldId: string, monthKey: string, content: string) {
  const dir = join(WORLDS_DIR, worldId, 'chronicles');
  await mkdir(dir, { recursive: true });

  const filePath = join(dir, `GL-${monthKey}.md`);
  const existing = existsSync(filePath)
    ? await readFile(filePath, 'utf-8')
    : `# GL ${monthKey} 编年记录\n\n`;

  await writeFile(filePath, existing + '\n' + content, 'utf-8');
}

// ─────────────────────────────────────────────────────────────────────────────
// Entropy
// ─────────────────────────────────────────────────────────────────────────────

export async function getEntropyMeta(worldId: string) {
  const metaPath = join(WORLDS_DIR, worldId, 'entropy', '_meta.json');
  try {
    const raw = await readFile(metaPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { world: worldId, events: [] };
  }
}

export async function getEntropyReports(worldId: string) {
  const dir = join(WORLDS_DIR, worldId, 'entropy');
  if (!existsSync(dir)) return [];

  const entries = await readdir(dir);
  const reports = await Promise.all(
    entries
      .filter(d => d.startsWith('ent_'))
      .map(async d => {
        const reportPath = join(dir, d, 'report.md');
        if (!existsSync(reportPath)) return null;
        const raw = await readFile(reportPath, 'utf-8');
        const { data, content } = matter(raw);
        return {
          id: d,
          type: data?.type ?? 'UNKNOWN',
          title: data?.name ?? data?.title ?? d,
          date: data?.created ?? data?.date ?? '',
          status: data?.status ?? 'unknown',
          summary: extractFirstParagraph(content),
          content: content ?? '',
        };
      })
  );

  return reports.filter(Boolean);
}

/** Extract first non-empty paragraph from markdown as summary */
function extractFirstParagraph(md: string): string {
  const lines = md.split('\n');
  const paragraphs: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#') || trimmed.startsWith('---')) continue;
    if (trimmed.startsWith('|')) continue;
    paragraphs.push(trimmed);
    if (paragraphs.length >= 2) break;
  }
  return paragraphs.join(' ').slice(0, 200);
}

export async function getEntropyReport(worldId: string, reportId: string) {
  const dir = join(WORLDS_DIR, worldId, 'entropy', reportId);
  if (!existsSync(dir)) return null;

  const reportPath = join(dir, 'report.md');
  if (!existsSync(reportPath)) return null;

  const raw = await readFile(reportPath, 'utf-8');
  const { data, content } = matter(raw);
  return {
    id: reportId,
    type: data?.type ?? 'UNKNOWN',
    title: data?.name ?? data?.title ?? reportId,
    date: data?.created ?? data?.date ?? '',
    status: data?.status ?? 'unknown',
    content,
    raw,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Narratives
// ─────────────────────────────────────────────────────────────────────────────

export async function getNarrativesMeta(worldId: string) {
  const metaPath = join(WORLDS_DIR, worldId, 'narratives', '_meta.json');
  try {
    const raw = await readFile(metaPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { world: worldId, narratives: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// World constitution
// ─────────────────────────────────────────────────────────────────────────────

export async function getWorldConstitution(worldId: string) {
  const path = join(WORLDS_DIR, worldId, 'world.md');
  if (!existsSync(path)) return null;

  const raw = await readFile(path, 'utf-8');
  const { data, content } = matter(raw);
  return { data, content, raw };
}

// ─────────────────────────────────────────────────────────────────────────────
// Geography
// ─────────────────────────────────────────────────────────────────────────────

export async function getGeography(worldId: string) {
  const dir = join(WORLDS_DIR, worldId, 'geography');
  if (!existsSync(dir)) return [];

  const entries = await readdir(dir);
  const geoItems = await Promise.all(
    entries
      .filter(d => !d.startsWith('.'))
      .map(async d => {
        const indexPath = join(dir, d, 'index.md');
        if (!existsSync(indexPath)) return { id: d, name: d };
        const raw = await readFile(indexPath, 'utf-8');
        const { data } = matter(raw);
        return { id: d, ...data };
      })
  );

  return geoItems;
}
