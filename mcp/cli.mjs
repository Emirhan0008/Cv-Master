#!/usr/bin/env node
/**
 * Cv-Master CLI — MCP olmadan, tek komutta CV doldurma.
 *
 * Neden CLI: MCP'de her alan grubu ayrı bir model↔araç turu demek.
 * CLI'da model tek bir JSON üretir, tek komutla yazar. 5-10× daha az tur.
 *
 * Kullanım:
 *   node mcp/cli.mjs schema
 *   node mcp/cli.mjs create rehber-ogretmen-2026 --template split-sidebar --title "Emirhan Yılmaz — Rehber Öğretmen"
 *   node mcp/cli.mjs apply rehber-ogretmen-2026 --file payload.json
 *   type payload.json | node mcp/cli.mjs apply rehber-ogretmen-2026
 *   node mcp/cli.mjs style rehber-ogretmen-2026 --template split-sidebar --density compact
 *   node mcp/cli.mjs validate rehber-ogretmen-2026
 *   node mcp/cli.mjs list
 *   node mcp/cli.mjs export rehber-ogretmen-2026 --downloads
 *   node mcp/cli.mjs pdf rehber-ogretmen-2026 [--out ~/Downloads/cv.pdf] [--api <url>] [--token <t>]
 *   node mcp/cli.mjs push rehber-ogretmen-2026 [--api <url>] [--token <t>]   # siteye gönder
 *   node mcp/cli.mjs pull [slug] [--as <yerel-slug>]           # siteden çek
 *   node mcp/cli.mjs remote                                     # sitedeki CV listesi
 *
 * Çıkış: her komut tek JSON döndürür (stdout). Boru hattına uygundur.
 * En hızlı yol: model tek JSON üretir → apply --file.
 * pdf komutu: site headless print (http.request) → PDF.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { runCommand, runCommandAsync, schema as schemaCmd } from './core.mjs';

const require = createRequire(import.meta.url);

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const [, , cmd, ...rest] = process.argv;

function fail(msg) {
  process.stderr.write(`HATA: ${msg}\n`);
  process.exit(1);
}

function out(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

/** --key value / --flag / --key=value ayrıştırıcı */
function parseFlags(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          flags[a.slice(2)] = next;
          i++;
        } else {
          flags[a.slice(2)] = true;
        }
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

/** "startDate=2013-09" biçimindeki düz anahtarları içe göm */
function expandDotted(obj) {
  const outObj = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!k.includes('.')) {
      outObj[k] = v;
      continue;
    }
    const parts = k.split('.');
    let cur = outObj;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = v;
  }
  return outObj;
}

function loadPayload(flags) {
  let raw = '';
  if (flags.file) {
    const p = path.resolve(String(flags.file));
    if (!fs.existsSync(p)) fail(`Dosya yok: ${p}`);
    raw = fs.readFileSync(p, 'utf8');
  } else if (flags.json) {
    raw = String(flags.json);
  } else {
    raw = readStdin();
  }
  const trimmed = (raw || '').trim();
  if (!trimmed) fail('İçerik yok. --file <yol>, --json <metin> veya stdin kullanın.');
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    fail('JSON bekleniyordu (obje). Markdown/metin için önce JSON üretin.');
  }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    fail(`JSON ayrıştırılamadı: ${e.message}`);
  }
  if (Array.isArray(parsed)) {
    if (parsed.length !== 1) fail('Dizi geldi; tek CV objesi gönderin (toplu içe aktarma uygulamada yapılır).');
    parsed = parsed[0];
  }
  return expandDotted(parsed);
}

async function main() {
  const { flags, positional } = parseFlags(rest);

  switch (cmd) {
    case undefined:
    case 'help':
    case '--help':
    case '-h': {
      out({
        usage: [
          'node mcp/cli.mjs schema',
          'node mcp/cli.mjs create <slug> [--template <id>] [--title <metin>] [--photo]',
          'node mcp/cli.mjs apply <slug> --file payload.json',
          'node mcp/cli.mjs add <slug> --section <bölüm> --file items.json',
          'node mcp/cli.mjs remove <slug> --section <bölüm> --id <id> | --index <n>',
          'node mcp/cli.mjs style <slug> [--template <id>] [--density compact] [--font inter] [--primary #hex]',
          'node mcp/cli.mjs validate <slug>',
          'node mcp/cli.mjs read <slug> [--out dosya.json]',
          'node mcp/cli.mjs list',
          'node mcp/cli.mjs export <slug> [--downloads]',
          'node mcp/cli.mjs pdf <slug> [--out <dosya>] [--api <url>] [--token <t>]',
          'node mcp/cli.mjs push <slug> [--api <url>] [--token <t>]   # siteye gönder',
          'node mcp/cli.mjs pull [slug] [--as <yerel-slug>]           # siteden çek',
          'node mcp/cli.mjs remote                                     # sitedeki CV listesi',
        ],
        note: 'Her komut JSON döndürür. En hızlı yol: model tek JSON üretir → apply --file.',
        remote: {
          env: ['CV_API_URL (varsayılan http://localhost:3010)', 'CV_API_TOKEN (zorunlu)'],
          siteButton: 'Sitede "CV Geri Çağır" → "API\'den Yükle"',
        },
      });
      return;
    }

    case 'schema':
      out(schemaCmd());
      return;

    case 'create': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli: create <slug>');
      out(runCommand('create', {
        slug,
        title: flags.title,
        template: flags.template,
        photo: !!flags.photo,
        overwrite: flags.overwrite !== 'false',
      }));
      return;
    }

    case 'apply': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli: apply <slug> --file payload.json');
      const payload = loadPayload(flags);
      out(runCommand('apply', { ...payload, slug }));
      return;
    }

    case 'add': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli: add <slug> --section <bölüm> --file items.json');
      const section = flags.section;
      if (!section) fail('--section gerekli (workExperiences | educations | projects | skills | socialLinks | customSections)');
      const payload = loadPayload(flags);
      const items = Array.isArray(payload) ? payload : payload.items ?? payload;
      out(runCommand('add', { slug, section, items }));
      return;
    }

    case 'remove': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli');
      out(runCommand('remove', {
        slug,
        section: flags.section,
        id: flags.id,
        index: flags.index !== undefined ? Number(flags.index) : undefined,
      }));
      return;
    }

    case 'style': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli');
      const styleKeys = ['template', 'primaryColor', 'secondaryColor', 'accentColor', 'textColor',
        'backgroundColor', 'font', 'fontSize', 'lineHeight', 'density', 'shadowIntensity'];
      const styles = {};
      for (const k of styleKeys) if (flags[k] !== undefined) styles[k] = flags[k];
      if (flags.glassEffect !== undefined) styles.glassEffect = flags.glassEffect === true || flags.glassEffect === 'true';
      if (!Object.keys(styles).length) fail('En az bir stil bayrağı verin (--template, --density, --font, --primaryColor…).');
      out(runCommand('style', { slug, ...styles }));
      return;
    }

    case 'validate': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli');
      const r = runCommand('validate', { slug });
      out(r);
      if (!r.ok) process.exitCode = 2;
      return;
    }

    case 'read': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli');
      const r = runCommand('read', { slug });
      if (flags.out) {
        fs.writeFileSync(path.resolve(String(flags.out)), JSON.stringify(r.cv, null, 2), 'utf8');
        out({ ok: true, written: path.resolve(String(flags.out)), bytes: fs.statSync(path.resolve(String(flags.out))).size });
      } else {
        out(r);
      }
      return;
    }

    case 'list':
      out(runCommand('list'));
      return;

    case 'export': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli');
      out(runCommand('export', { slug, copyToDownloads: !!flags.downloads }));
      return;
    }

    case 'pdf': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli: pdf <slug> [--out <dosya>]');

      const outPath = flags.out
        ? path.resolve(String(flags.out).replace(/^~/, process.env.USERPROFILE || process.env.HOME || ''))
        : path.join(process.env.USERPROFILE || process.env.HOME || PROJECT_DIR, 'Downloads', `${slug}.pdf`);

      const scriptPath = path.join(PROJECT_DIR, 'mcp', 'pdf-final.cjs');
      if (!fs.existsSync(scriptPath)) fail(`PDF uretici bulunamadi: ${scriptPath}`);

      const res = spawnSync(process.execPath, [scriptPath, slug, outPath], {
        stdio: 'inherit',
        cwd: PROJECT_DIR,
      });

      if (res.status !== 0) process.exitCode = res.status || 1;
      return;
    }

    case 'push': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli: push <slug>');
      const r = await runCommandAsync('push', {
        slug,
        apiUrl: flags.api || flags['api-url'],
        apiToken: flags.token,
      });
      out(r);
      return;
    }

    case 'pull': {
      const r = await runCommandAsync('pull', {
        slug: positional[0] || flags.slug,
        as: flags.as,
        apiUrl: flags.api || flags['api-url'],
        apiToken: flags.token,
      });
      out(r);
      return;
    }

    case 'remote': {
      const r = await runCommandAsync('remote', {
        apiUrl: flags.api || flags['api-url'],
        apiToken: flags.token,
      });
      out(r);
      return;
    }

    case 'delete': {
      const slug = positional[0] || flags.slug;
      if (!slug) fail('slug gerekli');
      if (!flags.yes) fail('Silmek için --yes ekleyin.');
      const dir = path.join(process.env.CV_MASTER_DIR || path.resolve(import.meta.dirname, '..'), 'cv-data', 'drafts');
      const p = path.join(dir, `${slug}.json`);
      if (!fs.existsSync(p)) fail(`Taslak yok: ${slug}`);
      fs.rmSync(p, { force: true });
      out({ ok: true, deleted: slug });
      return;
    }

    default:
      fail(`Bilinmeyen komut: ${cmd}. "node mcp/cli.mjs help" çalıştırın.`);
  }
}

main().catch((err) => {
  process.stderr.write(`HATA: ${err?.message || String(err)}\n`);
  process.exit(1);
});