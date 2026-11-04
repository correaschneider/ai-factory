/**
 * Converte as extensões do Material for MkDocs que as docs usam (`!!! tipo "título"` e `=== "aba"`,
 * ambas com corpo indentado em 4 espaços) numa árvore de blocos; o resto segue como Markdown comum.
 */
export type Block =
  | { type: 'md'; text: string }
  | { type: 'admonition'; kind: string; title: string | null; children: Block[] }
  | { type: 'tabs'; tabs: { label: string; children: Block[] }[] };

const ADMONITION = /^(!!!|\?\?\?\+?)\s+(\w+)(?:\s+"([^"]*)")?\s*$/;
const TAB = /^===\s+"([^"]*)"\s*$/;

/** Lê o corpo indentado que começa em `start`; devolve o texto sem a indentação e o índice seguinte. */
function readIndented(lines: string[], start: number): [string, number] {
  const body: string[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      body.push('');
      i++;
      continue;
    }
    if (!line.startsWith('    ')) break;
    body.push(line.slice(4));
    i++;
  }
  while (body.length && body[body.length - 1] === '') {
    body.pop();
    i--;
  }
  // linhas em branco devolvidas acima voltam a separar o próximo bloco
  while (i < lines.length && lines[i].trim() === '') i++;
  return [body.join('\n'), i];
}

export function parseBlocks(source: string): Block[] {
  const lines = source.split('\n');
  const blocks: Block[] = [];
  let md: string[] = [];
  let fence: string | null = null;
  const flush = () => {
    if (md.join('').trim()) blocks.push({ type: 'md', text: md.join('\n') });
    md = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1];
      else if (line.trim().startsWith(fence)) fence = null;
    }
    const adm = !fence && line.match(ADMONITION);
    const tab = !fence && line.match(TAB);
    if (adm) {
      flush();
      const [body, next] = readIndented(lines, i + 1);
      blocks.push({ type: 'admonition', kind: adm[2], title: adm[3] ?? null, children: parseBlocks(body) });
      i = next;
    } else if (tab) {
      flush();
      const tabs: { label: string; children: Block[] }[] = [];
      let m: RegExpMatchArray | null;
      while (i < lines.length && (m = lines[i].match(TAB))) {
        const [body, next] = readIndented(lines, i + 1);
        tabs.push({ label: m[1], children: parseBlocks(body) });
        i = next;
      }
      blocks.push({ type: 'tabs', tabs });
    } else {
      md.push(line);
      i++;
    }
  }
  flush();
  return blocks;
}
