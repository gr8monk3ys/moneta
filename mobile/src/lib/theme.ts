import { Platform } from 'react-native';

// Moneta brand palette. Single source of truth: docs/brand/identity.md.
export const palette = {
  ledgerInk: '#0C1415',
  inkDeep: '#0B1112',
  signalTeal: '#173033',
  tealSurface: '#122123',
  tealRaised: '#193135',
  brass: '#D1A15C',
  brassBright: '#E2B474',
  paper: '#F6F1E7',
  paperSoft: '#DDD4C3',
  mint: '#6ECDA6',
  mist: '#9AB0AA',
  coral: '#E4726B'
} as const;

export const theme = {
  bg: palette.ledgerInk,
  card: palette.tealSurface,
  cardElevated: palette.tealRaised,
  overlay: 'rgba(7, 12, 13, 0.74)',

  line: 'rgba(246, 241, 231, 0.12)',
  lineStrong: 'rgba(246, 241, 231, 0.24)',

  textPrimary: palette.paper,
  textSecondary: palette.paperSoft,
  textMuted: palette.mist,

  accent: palette.brass,
  accentBright: palette.brassBright,
  accentSoft: 'rgba(209, 161, 92, 0.16)',
  onAccent: palette.ledgerInk,

  success: palette.mint,
  successSoft: 'rgba(110, 205, 166, 0.14)',
  danger: palette.coral,
  dangerSoft: 'rgba(228, 114, 107, 0.14)'
} as const;

// Brand type stacks. Iowan Old Style (display serif) and Avenir Next
// (interface sans) ship with iOS; Android falls back to its system faces.
export const font = {
  display: Platform.select({ ios: 'Iowan Old Style', default: 'serif' }),
  ui: Platform.select({ ios: 'Avenir Next', default: 'sans-serif' })
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999
} as const;

// Shared text styles so screens stay consistent without repeating themselves.
export const type = {
  display: {
    fontFamily: font.display,
    color: theme.textPrimary,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '700' as const
  },
  title: {
    fontFamily: font.display,
    color: theme.textPrimary,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700' as const
  },
  eyebrow: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const
  },
  body: {
    color: theme.textSecondary,
    fontSize: 15,
    lineHeight: 21
  },
  caption: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17
  }
} as const;

// Shared surface/control styles for the recurring card + button shapes.
export const surface = {
  card: {
    backgroundColor: theme.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line
  },
  cardElevated: {
    backgroundColor: theme.cardElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: theme.line
  },
  buttonPrimary: {
    backgroundColor: theme.accent,
    borderRadius: radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 16
  },
  buttonSecondary: {
    borderRadius: radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.lineStrong
  },
  input: {
    backgroundColor: theme.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    color: theme.textPrimary,
    padding: 13
  }
} as const;
