#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const arg = process.argv[2] ? process.argv[2].toLowerCase().replace(/^--?/, '') : '';

function launchElectron(flag) {
  console.log(`\n\x1b[36m🚀 Launching LuckyGuy with preview flag: ${flag}\x1b[0m\n`);
  
  // Resolve electron binary
  const isWindows = process.platform === 'win32';
  const electronBin = isWindows
    ? path.join(rootDir, 'node_modules', '.bin', 'electron.cmd')
    : path.join(rootDir, 'node_modules', '.bin', 'electron');

  const args = ['.', flag];
  const proc = spawn(electronBin, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWindows,
  });

  proc.on('exit', (code) => {
    process.exit(code || 0);
  });
}

if (arg === 'update' || arg === 'preview-update') {
  launchElectron('--preview-update');
} else if (arg === 'error' || arg === 'crash' || arg === 'preview-error') {
  launchElectron('--preview-error');
} else if (arg === 'hud' || arg === 'toolbar' || arg === 'preview-hud' || arg === 'ui') {
  launchElectron('--preview-hud');
} else {
  // Interactive Terminal Menu
  console.clear();
  console.log('\x1b[35m╔════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║             LuckyGuy UI State Preview & Inspector              ║\x1b[0m');
  console.log('\x1b[35m╚════════════════════════════════════════════════════════════════╝\x1b[0m\n');
  console.log('\x1b[33mSelect a state to preview in the software:\x1b[0m\n');
  console.log('  \x1b[32m[1]\x1b[0m \x1b[1m🚀 New Update Available Banner\x1b[0m (Floating notification, changelog, download actions)');
  console.log('  \x1b[31m[2]\x1b[0m \x1b[1m💥 Error / Crash Screen\x1b[0m (Full-screen ErrorBoundary, stack trace, GitHub issue tool)');
  console.log('  \x1b[36m[3]\x1b[0m \x1b[1m🛠️ In-App Live Dev Toolbar\x1b[0m (Docked bar to toggle all states in real time)');
  console.log('  \x1b[90m[4] ✖ Exit\x1b[0m\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\x1b[33mEnter your choice [1-4]: \x1b[0m', (answer) => {
    rl.close();
    const choice = answer.trim();
    if (choice === '1') {
      launchElectron('--preview-update');
    } else if (choice === '2') {
      launchElectron('--preview-error');
    } else if (choice === '3') {
      launchElectron('--preview-hud');
    } else {
      console.log('Exited.');
      process.exit(0);
    }
  });
}
