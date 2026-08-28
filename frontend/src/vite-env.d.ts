/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HTTPS_PROXY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
