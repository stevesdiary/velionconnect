import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { INestApplication, Logger } from '@nestjs/common';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { parse } from 'yaml';

const logger = new Logger('Swagger');

/**
 * Candidate locations for the OpenAPI spec, covering `nest start` (cwd =
 * apps/api), running from the repo root, and the compiled `dist` build.
 */
const SPEC_CANDIDATES = [
  resolve(process.cwd(), 'docs/api/openapi.yaml'),
  resolve(process.cwd(), '../../docs/api/openapi.yaml'),
  resolve(__dirname, '../../../../docs/api/openapi.yaml'),
  resolve(__dirname, '../../../docs/api/openapi.yaml'),
];

/**
 * Serves the hand-authored OpenAPI document (docs/api/openapi.yaml) as Swagger
 * UI at `/api/docs`. The spec is maintained in a single YAML file rather than
 * as inline decorators on the controllers, keeping the route code clean.
 *
 * If the spec file is not present (e.g. a minimal production image that did not
 * copy docs/), Swagger is skipped rather than failing app startup.
 */
export function setupSwagger(app: INestApplication): void {
  const specPath = SPEC_CANDIDATES.find((p) => existsSync(p));

  if (!specPath) {
    logger.warn(
      'OpenAPI spec (docs/api/openapi.yaml) not found — skipping Swagger UI',
    );
    return;
  }

  try {
    const document = parse(readFileSync(specPath, 'utf8')) as OpenAPIObject;
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'VelionConnect API',
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger UI available at /api/docs (spec: ${specPath})`);
  } catch (err) {
    logger.error(`Failed to load OpenAPI spec: ${String(err)}`);
  }
}
