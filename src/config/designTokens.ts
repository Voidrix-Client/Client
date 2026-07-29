export const designTokens = {
  // Spacing scale based on Tailwind CSS
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Border radius
  borderRadius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.25rem', // 20px
    full: '9999px',
  },

  // Z-index scale - used for layering
  zIndex: {
    dropdown: '100',
    tooltip: '75',
    popover: '50',
    modal: '1000',
    overlay: '40',
    sidebar: '20',
    default: '10',
    hide: '-1',
  },

  // Animation/transition durations
  animationDuration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },

  // Timing functions for animations
  animationTiming: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Opacity values
  opacity: {
    disabled: '0.5',
    hover: '0.8',
    subtle: '0.7',
    muted: '0.5',
    invisible: '0.3',
  },

  // Shadow definitions for depth
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Font sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },

  // Line height
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Transition presets
  transitions: {
    default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Type-safe token access
export type DesignToken = typeof designTokens;
export type SpacingKey = keyof typeof designTokens.spacing;
export type ZIndexKey = keyof typeof designTokens.zIndex;
export type AnimationDurationKey = keyof typeof designTokens.animationDuration;

// Helper functions for common patterns
export const getSpacing = (key: SpacingKey): string => designTokens.spacing[key];
export const getZIndex = (key: ZIndexKey): string => designTokens.zIndex[key];
export const getAnimationDuration = (key: AnimationDurationKey): string =>
  designTokens.animationDuration[key];

// Responsive utility
export const isResponsiveSize = (width: number): 'mobile' | 'tablet' | 'desktop' => {
  if (width < parseInt(designTokens.breakpoints.md)) return 'mobile';
  if (width < parseInt(designTokens.breakpoints.lg)) return 'tablet';
  return 'desktop';
};
