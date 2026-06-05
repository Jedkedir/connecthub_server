import { createExpressApp } from './loaders/express.js';

/**
 * Configured Express application used by the HTTP server and tests.
 */
export const app = createExpressApp();
