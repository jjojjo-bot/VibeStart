export { TaskRegistry } from './registry';

// Install tasks
export { installGit } from './tasks/install-git';
export { installNodeLts } from './tasks/install-node-lts';
export { installVscode } from './tasks/install-vscode';

// Project tasks
export { createNextjsApp } from './tasks/create-nextjs-app';
export { npmInstall } from './tasks/npm-install';
export { runDevServer } from './tasks/run-dev-server';

import { TaskRegistry } from './registry';
import { installGit } from './tasks/install-git';
import { installNodeLts } from './tasks/install-node-lts';
import { installVscode } from './tasks/install-vscode';
import { createNextjsApp } from './tasks/create-nextjs-app';
import { npmInstall } from './tasks/npm-install';
import { runDevServer } from './tasks/run-dev-server';

export const defaultRegistry = new TaskRegistry([
  installGit,
  installNodeLts,
  installVscode,
  createNextjsApp,
  npmInstall,
  runDevServer,
]);
