/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly INFURA_API_KEY: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}