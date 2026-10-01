/** Single source of truth for the STEMBridge look. Change colours here only. */
export const theme = {
  width: 1920,
  height: 1080,
  font: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  colors: {
    bg: 0xfffdf5,
    panel: 0xffffff,
    green: 0x1e8e3e,
    greenDark: 0x14532d,
    greenLight: 0xdff3e4,
    gold: 0xf5b700,
    goldDark: 0xc98f00,
    goldLight: 0xfff1c2,
    ink: 0x1b2a21,
    muted: 0x5b6b61,
  },
  size: { title: 88, body: 46, label: 38, small: 30 },
} as const;
