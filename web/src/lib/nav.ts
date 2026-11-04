export type Locale = 'en' | 'pt';
export const LOCALES: Locale[] = ['en', 'pt'];

export type NavItem = { file: string } | { label: Record<Locale, string>; children: NavItem[] };

/** Espelha o antigo `nav` do mkdocs.yml. `file` é o caminho em docs/ sem o `.md`. */
export const NAV: NavItem[] = [
  { file: 'index' },
  { file: 'getting-started' },
  { file: 'concepts' },
  {
    label: { en: 'Factories', pt: 'Fábricas' },
    children: ['demo', 'init', 'po', 'dev', 'qa', 'cr'].map((f) => ({ file: `factories/${f}` })),
  },
  {
    label: { en: 'Reference', pt: 'Referência' },
    children: ['config', 'drivers', 'models'].map((f) => ({ file: `reference/${f}` })),
  },
  { file: 'faq' },
  {
    label: { en: 'Legal', pt: 'Legal' },
    children: [{ file: 'privacy' }, { file: 'terms' }],
  },
];

export const UI = {
  en: {
    tagline: 'Config-driven agent factories for Claude Code — PO, DEV, QA and CR.',
    onThisPage: 'On this page',
    edit: 'Edit this page',
    language: 'Português',
  },
  pt: {
    tagline: 'Fábricas de agentes config-driven para Claude Code — PO, DEV, QA e CR.',
    onThisPage: 'Nesta página',
    edit: 'Editar esta página',
    language: 'English',
  },
} as const;

/** Rota de um arquivo de docs: `factories/dev` → `/pt/factories/dev/`. */
export function routeOf(file: string, locale: Locale): string {
  const path = file === 'index' ? '' : `${file.replace(/\/index$/, '')}/`;
  return `${locale === 'en' ? '/' : '/pt/'}${path}`;
}

export function flatFiles(items: NavItem[] = NAV): string[] {
  return items.flatMap((i) => ('file' in i ? [i.file] : flatFiles(i.children)));
}
