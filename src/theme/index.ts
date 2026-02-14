import { createTheme, type ThemeOptions } from '@mui/material/styles';

// ==========================================
// Material Design 3 Expressive Theme
// Dynamic Color Generation
// ==========================================

// Generate tonal palette from a seed color
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate M3 tonal palette
function generateTonalPalette(seedColor: string) {
  const [h, s] = hexToHsl(seedColor);

  const tones = {
    0: hslToHex(h, s, 0),
    10: hslToHex(h, s * 0.9, 10),
    20: hslToHex(h, s * 0.85, 20),
    30: hslToHex(h, s * 0.8, 30),
    40: hslToHex(h, s * 0.75, 40),
    50: hslToHex(h, s * 0.7, 50),
    60: hslToHex(h, s * 0.65, 60),
    70: hslToHex(h, s * 0.6, 70),
    80: hslToHex(h, s * 0.55, 80),
    90: hslToHex(h, s * 0.5, 90),
    95: hslToHex(h, s * 0.4, 95),
    99: hslToHex(h, s * 0.2, 99),
    100: hslToHex(h, 0, 100),
  };

  return tones;
}

// Generate complementary color
function getComplementary(h: number): number {
  return (h + 180) % 360;
}

function getTertiary(h: number): number {
  return (h + 60) % 360;
}

export interface M3ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceContainerLow: string;
  surfaceContainerLowest: string;
  outline: string;
  outlineVariant: string;
}

export function generateM3Scheme(seedColor: string, mode: 'light' | 'dark'): M3ColorScheme {
  const [h, s] = hexToHsl(seedColor);
  const primaryTones = generateTonalPalette(seedColor);
  const secondaryTones = generateTonalPalette(hslToHex(h, s * 0.3, 50));
  const compH = getComplementary(h);
  const tertiaryTones = generateTonalPalette(hslToHex(getTertiary(h), s * 0.6, 50));
  const neutralTones = generateTonalPalette(hslToHex(h, s * 0.05, 50));
  const neutralVariantTones = generateTonalPalette(hslToHex(h, s * 0.12, 50));
  // complementary tones (reserved for future use)
  generateTonalPalette(hslToHex(compH, s * 0.6, 50));
  const errorTones = generateTonalPalette('#BA1A1A');

  if (mode === 'light') {
    return {
      primary: primaryTones[40],
      onPrimary: primaryTones[100],
      primaryContainer: primaryTones[90],
      onPrimaryContainer: primaryTones[10],
      secondary: secondaryTones[40],
      onSecondary: secondaryTones[100],
      secondaryContainer: secondaryTones[90],
      onSecondaryContainer: secondaryTones[10],
      tertiary: tertiaryTones[40],
      onTertiary: tertiaryTones[100],
      tertiaryContainer: tertiaryTones[90],
      onTertiaryContainer: tertiaryTones[10],
      error: errorTones[40],
      onError: errorTones[100],
      errorContainer: errorTones[90],
      onErrorContainer: errorTones[10],
      surface: neutralTones[99],
      onSurface: neutralTones[10],
      surfaceVariant: neutralVariantTones[90],
      onSurfaceVariant: neutralVariantTones[30],
      surfaceContainer: neutralTones[95],
      surfaceContainerHigh: neutralTones[90],
      surfaceContainerHighest: neutralTones[90],
      surfaceContainerLow: neutralTones[99],
      surfaceContainerLowest: neutralTones[100],
      outline: neutralVariantTones[50],
      outlineVariant: neutralVariantTones[80],
    };
  }

  return {
    primary: primaryTones[80],
    onPrimary: primaryTones[20],
    primaryContainer: primaryTones[30],
    onPrimaryContainer: primaryTones[90],
    secondary: secondaryTones[80],
    onSecondary: secondaryTones[20],
    secondaryContainer: secondaryTones[30],
    onSecondaryContainer: secondaryTones[90],
    tertiary: tertiaryTones[80],
    onTertiary: tertiaryTones[20],
    tertiaryContainer: tertiaryTones[30],
    onTertiaryContainer: tertiaryTones[90],
    error: errorTones[80],
    onError: errorTones[20],
    errorContainer: errorTones[30],
    onErrorContainer: errorTones[90],
    surface: neutralTones[10],
    onSurface: neutralTones[90],
    surfaceVariant: neutralVariantTones[30],
    onSurfaceVariant: neutralVariantTones[80],
    surfaceContainer: neutralTones[20],
    surfaceContainerHigh: neutralTones[30],
    surfaceContainerHighest: neutralTones[30],
    surfaceContainerLow: neutralTones[10],
    surfaceContainerLowest: neutralTones[0],
    outline: neutralVariantTones[60],
    outlineVariant: neutralVariantTones[30],
  };
}

// Default Karnet seed color - energetic orange
const DEFAULT_SEED_COLOR = '#FF6B35';

export function createKarnetTheme(
  mode: 'light' | 'dark' = 'light',
  seedColor: string = DEFAULT_SEED_COLOR
) {
  const scheme = generateM3Scheme(seedColor, mode);

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: scheme.primary,
        contrastText: scheme.onPrimary,
      },
      secondary: {
        main: scheme.secondary,
        contrastText: scheme.onSecondary,
      },
      error: {
        main: scheme.error,
        contrastText: scheme.onError,
      },
      background: {
        default: scheme.surface,
        paper: scheme.surfaceContainer,
      },
      text: {
        primary: scheme.onSurface,
        secondary: scheme.onSurfaceVariant,
      },
      divider: scheme.outlineVariant,
    },
    shape: {
      borderRadius: 4,
    },
    typography: {
      fontFamily: '"Roboto Flex", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 400, fontSize: '2.25rem', letterSpacing: 0, lineHeight: 1.2 },
      h2: { fontWeight: 400, fontSize: '1.75rem', letterSpacing: 0, lineHeight: 1.3 },
      h3: { fontWeight: 400, fontSize: '1.5rem', letterSpacing: 0, lineHeight: 1.3 },
      h4: { fontWeight: 500, fontSize: '1.25rem', letterSpacing: 0.15, lineHeight: 1.4 },
      h5: { fontWeight: 500, fontSize: '1.125rem', letterSpacing: 0, lineHeight: 1.4 },
      h6: { fontWeight: 500, fontSize: '1rem', letterSpacing: 0.15, lineHeight: 1.5 },
      subtitle1: { fontWeight: 500, fontSize: '1rem', letterSpacing: 0.15 },
      subtitle2: { fontWeight: 500, fontSize: '0.875rem', letterSpacing: 0.1 },
      body1: { fontWeight: 400, fontSize: '1rem', letterSpacing: 0.5 },
      body2: { fontWeight: 400, fontSize: '0.875rem', letterSpacing: 0.25 },
      button: { fontWeight: 500, fontSize: '0.875rem', letterSpacing: 0.1, textTransform: 'none' },
      caption: { fontWeight: 400, fontSize: '0.75rem', letterSpacing: 0.4 },
      overline: { fontWeight: 500, fontSize: '0.6875rem', letterSpacing: 0.5 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            padding: '10px 24px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none' as const,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            textTransform: 'none' as const,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: scheme.surfaceContainer,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            backgroundColor: scheme.surfaceContainerHigh,
          },
          paperFullScreen: {
            borderRadius: 0,
            backgroundColor: scheme.surface,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            height: 80,
            backgroundColor: scheme.surfaceContainer,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              color: scheme.primary,
            },
            minWidth: 'auto',
            padding: '6px 0',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: scheme.surface,
            color: scheme.onSurface,
            boxShadow: 'none',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            height: 8,
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
}

export { DEFAULT_SEED_COLOR };
