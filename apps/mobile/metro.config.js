// Metro config untuk monorepo npm workspaces.
// Mengizinkan Metro melihat paket bersama (@idx/shared) di root repo
// dan resolusi node_modules dari root maupun lokal.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch seluruh monorepo (agar perubahan di packages/shared ter-reload).
config.watchFolders = [monorepoRoot];

// 2. Cari modul di node_modules lokal lalu root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
