amint/Desktop/Projects0/retro-file-share/next-font.d.ts
declare module 'next/font/google' {
  export interface FontOptions {
    weight?: string | string[];
    style?: string | string[];
    subsets?: string[];
    display?: string;
    variable?: string;
  }

  export function Press_Start_2P(options: FontOptions): {
    className: string;
    style: React.CSSProperties;
    variable: string;
  };

  export function IBM_Plex_Mono(options: FontOptions): {
    className: string;
    style: React.CSSProperties;
    variable: string;
  };
}