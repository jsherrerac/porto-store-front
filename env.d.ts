/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />
import type { Env as AppEnv } from './app/lib/env';
// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';
declare global {
  interface Env extends AppEnv {}
}