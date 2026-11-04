'use client';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import NextLink from 'next/link';
import { createContext, useContext, useState, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import type { Block } from '@/lib/blocks';
import type { Locale } from '@/lib/nav';
import { Mermaid } from './Mermaid';

type Ctx = { file: string; locale: Locale };
const PageCtx = createContext<Ctx>({ file: 'index', locale: 'en' });

/** `../reference/config.md#x` relativo ao arquivo atual → rota do site no mesmo idioma. */
function resolveHref(href: string, { file, locale }: Ctx): { href: string; internal: boolean } {
  if (/^[a-z]+:/i.test(href) || href.startsWith('#')) return { href, internal: false };
  const [target, hash] = href.split('#');
  if (!target.endsWith('.md')) return { href, internal: false };
  const parts = file.split('/').slice(0, -1);
  for (const seg of target.replace(/\.md$/, '').split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  const path = parts.join('/').replace(/(^|\/)index$/, '');
  const route = `${locale === 'en' ? '/' : '/pt/'}${path ? `${path}/` : ''}`;
  return { href: hash ? `${route}#${hash}` : route, internal: true };
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Paper sx={{ position: 'relative', my: 2.5, bgcolor: 'action.hover', overflow: 'hidden' }}>
      {lang && (
        <Typography variant="caption" sx={{ position: 'absolute', top: 6, left: 12, color: 'text.secondary', fontFamily: 'var(--font-mono)' }}>
          {lang}
        </Typography>
      )}
      <Tooltip title={copied ? 'Copied' : 'Copy'}>
        <IconButton
          size="small"
          aria-label="copy"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          sx={{ position: 'absolute', top: 4, right: 4 }}
        >
          {copied ? <CheckIcon fontSize="inherit" /> : <ContentCopyIcon fontSize="inherit" />}
        </IconButton>
      </Tooltip>
      <Box component="pre" sx={{ m: 0, p: 2, pt: lang ? 4 : 2, overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.6 }}>
        <code>{code}</code>
      </Box>
    </Paper>
  );
}

function A({ href = '', children }: { href?: string; children?: ReactNode }) {
  const ctx = useContext(PageCtx);
  const r = resolveHref(href, ctx);
  if (r.internal) return <MuiLink component={NextLink} href={r.href} underline="hover" sx={{ fontWeight: 500 }}>{children}</MuiLink>;
  const external = /^https?:/.test(r.href);
  return (
    <MuiLink href={r.href} underline="hover" sx={{ fontWeight: 500 }} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {children}
    </MuiLink>
  );
}

const heading = (variant: 'h2' | 'h3' | 'h4', mt: number) =>
  function H({ id, children }: { id?: string; children?: ReactNode }) {
    return (
      <Typography variant={variant} id={id} sx={{ mt, mb: 1.5, scrollMarginTop: 88, '&:hover a': { opacity: 1 } }}>
        {children}
        {id && (
          <MuiLink href={`#${id}`} underline="none" sx={{ ml: 1, opacity: 0, color: 'text.secondary', transition: 'opacity .15s' }}>
            #
          </MuiLink>
        )}
      </Typography>
    );
  };

const components: Components = {
  h1: heading('h2', 5),
  h2: heading('h2', 5),
  h3: heading('h3', 3.5),
  h4: heading('h4', 3),
  p: ({ children }) => <Typography sx={{ my: 1.5, lineHeight: 1.75 }}>{children}</Typography>,
  a: ({ href, children }) => <A href={href}>{children}</A>,
  ul: ({ children }) => <Box component="ul" sx={{ pl: 3, my: 1.5, '& li': { my: 0.75, lineHeight: 1.7 } }}>{children}</Box>,
  ol: ({ children }) => <Box component="ol" sx={{ pl: 3, my: 1.5, '& li': { my: 0.75, lineHeight: 1.7 } }}>{children}</Box>,
  hr: () => <Divider sx={{ my: 4 }} />,
  blockquote: ({ children }) => (
    <Box component="blockquote" sx={{ m: 0, my: 2, pl: 2, borderLeft: 3, borderColor: 'divider', color: 'text.secondary' }}>{children}</Box>
  ),
  table: ({ children }) => (
    <TableContainer component={Paper} sx={{ my: 3 }}>
      <Table size="small">{children}</Table>
    </TableContainer>
  ),
  thead: ({ children }) => <TableHead sx={{ bgcolor: 'action.hover', '& th': { fontWeight: 700 } }}>{children}</TableHead>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow hover>{children}</TableRow>,
  th: ({ children }) => <TableCell>{children}</TableCell>,
  td: ({ children }) => <TableCell sx={{ verticalAlign: 'top' }}>{children}</TableCell>,
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const text = String(children ?? '');
    const lang = className?.replace('language-', '');
    if (lang === 'mermaid') return <Mermaid code={text.trimEnd()} />;
    if (className || text.includes('\n')) return <CodeBlock code={text.replace(/\n$/, '')} lang={lang} />;
    return (
      <Box component="code" sx={{ px: 0.6, py: 0.15, borderRadius: 1, bgcolor: 'action.selected', fontFamily: 'var(--font-mono)', fontSize: '0.85em' }}>
        {children}
      </Box>
    );
  },
};

const SEVERITY: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  note: 'info', info: 'info', abstract: 'info', tip: 'success', success: 'success', question: 'info',
  warning: 'warning', caution: 'warning', danger: 'error', failure: 'error', bug: 'error', example: 'info', quote: 'info',
};

function TabsBlock({ tabs }: { tabs: { label: string; children: Block[] }[] }) {
  const [value, setValue] = useState(0);
  return (
    <Paper sx={{ my: 3, overflow: 'hidden' }}>
      <Tabs value={value} onChange={(_, v) => setValue(v)} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
        {tabs.map((t) => <Tab key={t.label} label={t.label} />)}
      </Tabs>
      <Box sx={{ px: 2.5, py: 1 }}>
        <Blocks blocks={tabs[value].children} />
      </Box>
    </Paper>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return blocks.map((b, i) => {
    if (b.type === 'md')
      return <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>{b.text}</ReactMarkdown>;
    if (b.type === 'tabs') return <TabsBlock key={i} tabs={b.tabs} />;
    return (
      <Alert key={i} severity={SEVERITY[b.kind] ?? 'info'} variant="outlined" sx={{ my: 3, '& .MuiAlert-message': { width: '100%', minWidth: 0 }, '& p:first-of-type': { mt: 0 }, '& p:last-child': { mb: 0 } }}>
        {b.title && <AlertTitle sx={{ fontWeight: 700 }}>{b.title}</AlertTitle>}
        <Blocks blocks={b.children} />
      </Alert>
    );
  });
}

export function Markdown({ blocks, file, locale }: { blocks: Block[] } & Ctx) {
  return (
    <PageCtx.Provider value={{ file, locale }}>
      <Blocks blocks={blocks} />
    </PageCtx.Provider>
  );
}
