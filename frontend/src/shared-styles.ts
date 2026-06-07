import { css } from "lit";

// Design tokens shared across the chat surface and individual turns. Everything
// derives from Home Assistant theme variables so the UI tracks the active theme.
export const tokens = css`
  :host {
    --amc-space-2: 8px;
    --amc-space-3: 12px;
    --amc-space-4: 16px;
    --amc-radius: var(--ha-border-radius-lg, 12px);
    --amc-mono: var(
      --ha-font-family-code,
      ui-monospace,
      "SF Mono",
      SFMono-Regular,
      Menlo,
      Consolas,
      monospace
    );
    --amc-tint: color-mix(in srgb, var(--primary-color) 7%, transparent);
    --amc-surface: color-mix(
      in srgb,
      var(--primary-text-color) 5%,
      transparent
    );
  }
`;

// Reusable popover chrome: a click-catching scrim and the floating panel. Anchor
// position (top/left/right/width) is set by the consumer via an extra class.
export const popover = css`
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 5;
  }
  .popover {
    position: absolute;
    z-index: 6;
    box-sizing: border-box;
    padding: 6px;
    background-color: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-border-radius-lg, 12px);
    box-shadow: var(--ha-card-box-shadow, 0 8px 24px rgba(0, 0, 0, 0.18));
    animation: amc-pop 160ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }
  @keyframes amc-pop {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .popover {
      animation: none;
    }
  }
`;
