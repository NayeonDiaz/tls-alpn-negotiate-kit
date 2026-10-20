/**
 * tls-alpn-negotiate-kit
 *
 * Public entry point. Re-exports the ALPN negotiation function from core.js
 * so consumers import a single, stable path regardless of internal layout.
 */
export { negotiateAlpn } from './core.js';
