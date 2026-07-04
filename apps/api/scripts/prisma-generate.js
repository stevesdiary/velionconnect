#!/usr/bin/env node
// Prisma generate wrapper for pnpm monorepos.
//
// Prisma CLI resolves @prisma/client from the schema directory, but pnpm
// doesn't hoist it there. We create a temporary symlink so the CLI can find
// the package, then run generate normally. Prisma follows the symlink chain
// into the pnpm store and generates the client in-place there, which is
// exactly where @prisma/client/index.d.ts re-exports from.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apiDir = path.resolve(__dirname, '..');
const schemaDir = path.resolve(apiDir, '../../prisma');
const apiClient = path.join(apiDir, 'node_modules/@prisma/client');

// Symlink @prisma/client into the schema directory so Prisma CLI can find it
const atPrisma = path.join(schemaDir, 'node_modules/@prisma');
const clientLink = path.join(atPrisma, 'client');
fs.mkdirSync(atPrisma, { recursive: true });
if (!fs.existsSync(clientLink)) {
  fs.symlinkSync(apiClient, clientLink, 'dir');
}

execSync(
  'node_modules/.bin/prisma generate --schema ../../prisma/schema.prisma',
  {
    cwd: apiDir,
    stdio: 'inherit',
    env: { ...process.env, PRISMA_GENERATE_SKIP_AUTOINSTALL: '1' },
  },
);
