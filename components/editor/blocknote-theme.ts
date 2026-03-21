import type { Theme } from "@blocknote/mantine";
import { darkDefaultTheme } from "@blocknote/mantine";

/**
 * BlockNote Mantine theme aligned with Lobe CSS variables (dark UI).
 */
export const lobeBlockNoteDarkTheme: Theme = {
  ...darkDefaultTheme,
  colors: {
    ...darkDefaultTheme.colors,
    editor: {
      text: "#f0f0f0",
      background: "#0a0a0a",
    },
    menu: {
      text: "#f0f0f0",
      background: "#1a1a1a",
    },
    tooltip: {
      text: "#f0f0f0",
      background: "#222222",
    },
    hovered: {
      text: "#f0f0f0",
      background: "#2a2a2a",
    },
    selected: {
      text: "#f0f0f0",
      background: "#333333",
    },
    disabled: {
      text: "#555555",
      background: "#1a1a1a",
    },
    shadow: "rgba(0, 0, 0, 0.5)",
    border: "#2e2e2e",
    sideMenu: "#2e2e2e",
  },
  borderRadius: 6,
  fontFamily:
    'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
};
