'use client';

import { createTheme } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

/** Paleta inteira em `grey` do MUI; claro e escuro via CSS variables (sem flash na troca). */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: grey[900], light: grey[700], dark: grey[900], contrastText: '#fff' },
        secondary: { main: grey[600] },
        background: { default: grey[50], paper: '#fff' },
        text: { primary: grey[900], secondary: grey[700] },
        divider: grey[300],
      },
    },
    dark: {
      palette: {
        primary: { main: grey[100], light: grey[50], dark: grey[300], contrastText: grey[900] },
        secondary: { main: grey[400] },
        background: { default: '#121212', paper: grey[900] },
        text: { primary: grey[100], secondary: grey[400] },
        divider: grey[800],
      },
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'var(--font-body), system-ui, sans-serif',
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.15rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
    MuiPaper: { defaultProps: { variant: 'outlined' } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 6 } } },
  },
});
