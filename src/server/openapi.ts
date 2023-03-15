import { generateOpenApiDocument } from 'trpc-openapi';

import { appRouter } from "./api/root";

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Enscan',
  description: 'OpenAPI compliant REST API for triggering cron jobs to crawl and index ENS contracts.',
  version: '1.0.0',
  baseUrl: 'https://enscan.yashkarthik.xyz/api',
  docsUrl: 'https://enscan.yashkarthik.xyz/',
  tags: ['ens', 'ethereum', 'sql', 'search'],
});
