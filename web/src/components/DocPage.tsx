'use client';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import GitHubIcon from '@mui/icons-material/GitHub';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import TranslateIcon from '@mui/icons-material/Translate';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Doc } from '@/lib/content';
import { type Locale, UI } from '@/lib/nav';
import type { NavNode } from '@/lib/page';
import { Markdown } from './Markdown';

const REPO = 'https://github.com/correaschneider/ai-factory';
const DRAWER = 272;
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

type Props = { locale: Locale; doc: Doc; nav: NavNode[]; altHref: string };

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  if (!mode) return <Box sx={{ width: 40 }} />;
  const next = { light: 'dark', dark: 'system', system: 'light' } as const;
  const icon = { light: <LightModeOutlinedIcon />, dark: <DarkModeOutlinedIcon />, system: <SettingsBrightnessOutlinedIcon /> };
  return (
    <Tooltip title={mode}>
      <IconButton onClick={() => setMode(next[mode])} aria-label={`theme: ${mode}`}>
        {icon[mode]}
      </IconButton>
    </Tooltip>
  );
}

function NavList({ nodes, path, onNavigate }: { nodes: NavNode[]; path: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <List dense sx={{ px: 1.5 }}>
      {nodes.map((n) =>
        n.children ? (
          <Box key={n.label} sx={{ mt: 1 }}>
            <ListItemButton onClick={() => setOpen((o) => ({ ...o, [n.label]: !(o[n.label] ?? true) }))}>
              <ListItemText primary={n.label} slotProps={{ primary: { sx: { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary' } } }} />
              {(open[n.label] ?? true) ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </ListItemButton>
            <Collapse in={open[n.label] ?? true}>
              <List dense disablePadding sx={{ ml: 1.5, pl: 1, borderLeft: 1, borderColor: 'divider' }}>
                {n.children.map((c) => (
                  <NavLeaf key={c.href} node={c} path={path} onNavigate={onNavigate} />
                ))}
              </List>
            </Collapse>
          </Box>
        ) : (
          <NavLeaf key={n.href} node={n} path={path} onNavigate={onNavigate} />
        ),
      )}
    </List>
  );
}

function NavLeaf({ node, path, onNavigate }: { node: NavNode; path: string; onNavigate?: () => void }) {
  const selected = node.href === path;
  return (
    <ListItemButton component={NextLink} href={node.href!} selected={selected} onClick={onNavigate} sx={{ my: 0.25 }}>
      <ListItemText primary={node.label} slotProps={{ primary: { sx: { fontWeight: selected ? 700 : 500 } } }} />
    </ListItemButton>
  );
}

function flatten(nodes: NavNode[]): NavNode[] {
  return nodes.flatMap((n) => (n.children ? flatten(n.children) : [n]));
}

function Hero({ locale, nav }: { locale: Locale; nav: NavNode[] }) {
  const start = flatten(nav)[1];
  const factories = nav.find((n) => n.children && n.children.some((c) => c.href?.includes('/factories/')))?.children ?? [];
  return (
    <Box sx={{ mb: 6 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <Box component="img" src={`${BASE}/icon.svg`} alt="" sx={{ width: 64, height: 64, filter: 'grayscale(1)' }} />
        <Chip label="Claude Code plugin" variant="outlined" size="small" />
      </Stack>
      <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, mb: 2 }}>Factory</Typography>
      <Typography variant="h5" component="p" sx={{ color: 'text.secondary', maxWidth: 640, mb: 4, fontWeight: 400 }}>
        {UI[locale].tagline}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mb: 5, flexWrap: 'wrap', rowGap: 1.5 }}>
        <Button variant="contained" size="large" component={NextLink} href={start.href!} endIcon={<ArrowForwardIcon />} disableElevation>
          {start.label}
        </Button>
        <Button variant="outlined" size="large" href={REPO} target="_blank" rel="noreferrer" startIcon={<GitHubIcon />}>
          GitHub
        </Button>
      </Stack>
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' } }}>
        {factories.map((f) => (
          <Card key={f.href} variant="outlined">
            <CardActionArea component={NextLink} href={f.href!} sx={{ p: 2, height: '100%' }}>
              <Typography sx={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{f.label}</Typography>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

export function DocPage({ locale, doc, nav, altHref }: Props) {
  const path = usePathname();
  const current = path.endsWith('/') ? path : `${path}/`;
  const [mobileOpen, setMobileOpen] = useState(false);
  const pages = flatten(nav);
  const idx = pages.findIndex((p) => p.href === current);
  const prev = idx > 0 ? pages[idx - 1] : null;
  const next = idx >= 0 && idx < pages.length - 1 ? pages[idx + 1] : null;
  const home = doc.file === 'index';
  const t = UI[locale];

  const drawer = (
    <Box sx={{ py: 2 }}>
      <NavList nodes={nav} path={current} onNavigate={() => setMobileOpen(false)} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', zIndex: (th) => th.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }} aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Stack component={NextLink} href={locale === 'en' ? '/' : '/pt/'} direction="row" spacing={1.25} sx={{ alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
            <Box component="img" src={`${BASE}/icon.svg`} alt="" sx={{ width: 28, height: 28, filter: 'grayscale(1)' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Factory</Typography>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Button component={NextLink} href={altHref} startIcon={<TranslateIcon />} color="inherit" size="small">
            {t.language}
          </Button>
          <ThemeToggle />
          <IconButton href={REPO} target="_blank" rel="noreferrer" aria-label="GitHub">
            <GitHubIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER } }}>
        <Toolbar />
        {drawer}
      </Drawer>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: DRAWER, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER, borderRight: 1, borderColor: 'divider', bgcolor: 'background.default' } }}>
        <Toolbar />
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar />
        <Container maxWidth="lg" sx={{ display: 'flex', gap: 6, py: { xs: 4, md: 6 }, px: { xs: 2, sm: 4 } }}>
          <Box component="article" sx={{ flexGrow: 1, minWidth: 0, maxWidth: 820 }}>
            {home ? <Hero locale={locale} nav={nav} /> : <Typography variant="h1" sx={{ mb: 3 }}>{doc.title}</Typography>}
            <Markdown blocks={doc.blocks} file={doc.file} locale={locale} />

            <Divider sx={{ mt: 6, mb: 3 }} />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
              {prev ? (
                <Button component={NextLink} href={prev.href!} startIcon={<ArrowBackIcon />} color="inherit">{prev.label}</Button>
              ) : <span />}
              {next && (
                <Button component={NextLink} href={next.href!} endIcon={<ArrowForwardIcon />} color="inherit">{next.label}</Button>
              )}
            </Stack>
            <MuiLink href={`${REPO}/edit/main/${doc.source}`} target="_blank" rel="noreferrer" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 3, color: 'text.secondary', fontSize: '0.85rem' }}>
              <EditOutlinedIcon fontSize="inherit" /> {t.edit}
            </MuiLink>
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>MIT · Pedro Schneider</Typography>
          </Box>

          {doc.headings.length > 1 && (
            <Box component="nav" sx={{ display: { xs: 'none', lg: 'block' }, width: 220, flexShrink: 0 }}>
              <Box sx={{ position: 'sticky', top: 96 }}>
                <ListSubheader disableSticky sx={{ bgcolor: 'transparent', px: 0, lineHeight: 2, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                  {t.onThisPage}
                </ListSubheader>
                <Stack spacing={1} sx={{ borderLeft: 1, borderColor: 'divider', pl: 2 }}>
                  {doc.headings.map((h) => (
                    <MuiLink key={h.id} href={`#${h.id}`} underline="hover" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      {h.text}
                    </MuiLink>
                  ))}
                </Stack>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
}
