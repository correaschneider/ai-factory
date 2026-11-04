import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import GithubSlugger from 'github-slugger';
import { parseBlocks, type Block } from './blocks';
import { flatFiles, type Locale } from './nav';

const DOCS = path.resolve(process.cwd(), '..', 'docs');

export type Heading = { id: string; text: string };
export type Doc = { file: string; source: string; title: string; blocks: Block[]; headings: Heading[] };

/** Arquivo da página no idioma; sem tradução, cai no inglês (igual ao mkdocs-static-i18n). */
function sourcePath(file: string, locale: Locale): string {
  const localized = path.join(DOCS, `${file}.${locale}.md`);
  return locale !== 'en' && existsSync(localized) ? localized : path.join(DOCS, `${file}.md`);
}

const plain = (s: string) => s.replace(/`([^`]*)`/g, '$1').replace(/\*\*?([^*]*)\*\*?/g, '$1').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

export function loadDoc(file: string, locale: Locale): Doc {
  const abs = sourcePath(file, locale);
  const raw = readFileSync(abs, 'utf8');
  const h1 = raw.match(/^#\s+(.+)$/m);
  const title = h1 ? plain(h1[1].trim()) : file;
  // o H1 vira o título da página no layout
  const body = h1 ? raw.replace(h1[0], '') : raw;
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const m = !inFence && line.match(/^##\s+(.+)$/);
    if (m) headings.push({ id: slugger.slug(plain(m[1].trim())), text: plain(m[1].trim()) });
  }
  return { file, source: path.relative(path.dirname(DOCS), abs), title, blocks: parseBlocks(body), headings };
}

export function titleOf(file: string, locale: Locale): string {
  const h1 = readFileSync(sourcePath(file, locale), 'utf8').match(/^#\s+(.+)$/m);
  return h1 ? plain(h1[1].trim()) : file;
}

export function staticSlugs() {
  return flatFiles().map((f) => ({ slug: f === 'index' ? [] : f.split('/') }));
}

export function fileFromSlug(slug: string[] | undefined): string {
  const file = slug?.length ? slug.join('/') : 'index';
  if (!flatFiles().includes(file)) throw new Error(`página desconhecida: ${file}`);
  return file;
}
