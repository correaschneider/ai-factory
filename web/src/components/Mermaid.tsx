'use client';

import Box from '@mui/material/Box';
import { useColorScheme } from '@mui/material/styles';
import { useEffect, useId, useState } from 'react';

/** Renderiza o diagrama no cliente e refaz ao trocar claro/escuro. */
export function Mermaid({ code }: { code: string }) {
  const { mode, systemMode } = useColorScheme();
  const dark = (mode === 'system' ? systemMode : mode) === 'dark';
  const id = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');

  useEffect(() => {
    let alive = true;
    import('mermaid').then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'neutral', fontFamily: 'inherit' });
      const { svg } = await mermaid.render(`m${id}${dark ? 'd' : 'l'}`, code);
      if (alive) setSvg(svg);
    });
    return () => {
      alive = false;
    };
  }, [code, dark, id]);

  return (
    <Box
      sx={{ my: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', overflowX: 'auto', textAlign: 'center', '& svg': { maxWidth: '100%', height: 'auto' } }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
