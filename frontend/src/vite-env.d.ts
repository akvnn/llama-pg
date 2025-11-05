/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    VITE_API_URL: string;
    VITE_JWT_EXPIRES_IN: number;
  }
}

export {};
