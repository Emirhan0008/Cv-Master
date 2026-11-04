#!/usr/bin/env node
/**
 * Cv-Master MCP sunucusu (stdio, JSON-RPC 2.0, satır başına mesaj).
 * Mantık: mcp/core.mjs
 */

import readline from 'node:readline';
import { runCommandAsync, toolDefinitions, TOOL_TO_COMMAND, PROJECT_DIR } from './core.mjs';

const SERVER_INFO = { name: 'cv-master', version: '1.0.0' };
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const TOOLS = toolDefinitions();
const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const reply = (id, result) => send({ jsonrpc: '2.0', id, result });
const replyError = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

async function handle(msg) {
  const { id, method, params } = msg || {};  if (typeof method !== 'string') {
    if (id !== undefined) replyError(id, -32600, 'Geçersiz istek.');
    return;
  }
  const isNotification = id === undefined || id === null;

  switch (method) {
    case 'initialize': {
      const requested = params?.protocolVersion;
      reply(id, {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          `Cv-Master CV taslakları (${PROJECT_DIR}\\cv-data\\drafts). ` +
          'Akış: cv_schema → cv_create → cv_apply (tüm içerik tek çağrıda) → cv_validate → cv_export.',
      });
      return;
    }
    case 'notifications/initialized':
    case 'initialized':
      return;
    case 'ping':
      if (!isNotification) reply(id, {});
      return;
    case 'tools/list':
      reply(id, { tools: TOOLS });
      return;
    case 'tools/call': {
      const name = params?.name;
      if (!TOOL_MAP.has(name)) return replyError(id, -32602, `Bilinmeyen araç: ${name}`);
      try {
        const result = await runCommandAsync(TOOL_TO_COMMAND[name], params?.arguments || {});
        reply(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      } catch (err) {
        reply(id, { content: [{ type: 'text', text: `HATA: ${err?.message || String(err)}` }], isError: true });
      }
      return;
    }
    case 'resources/list':
      reply(id, { resources: [] });
      return;
    case 'prompts/list':
      reply(id, { prompts: [] });
      return;
    default:
      if (!isNotification) replyError(id, -32601, `Desteklenmeyen metot: ${method}`);
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return replyError(null, -32700, 'JSON ayrıştırılamadı.');
  }
  Promise.resolve()
    .then(() => handle(msg))
    .catch((err) => {
      if (msg?.id !== undefined) replyError(msg.id, -32603, err?.message || 'Sunucu hatası');
    });
});

rl.on('close', () => process.exit(0));
process.on('uncaughtException', (err) => process.stderr.write(`[cv-master-mcp] ${err?.stack || err}\n`));
