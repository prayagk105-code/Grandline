import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');

const apiProc = spawn(process.execPath, [path.join(__dirname, 'demoApiServer.mjs')], {
  cwd: frontendRoot,
  stdio: 'inherit'
});

const viteCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const viteProc = spawn(viteCommand, ['vite'], {
  cwd: frontendRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

function shutdown(code = 0) {
  if (!apiProc.killed) apiProc.kill();
  if (!viteProc.killed) viteProc.kill();
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
apiProc.on('exit', (code) => {
  if (code && code !== 0) shutdown(code);
});
viteProc.on('exit', (code) => shutdown(code ?? 0));

