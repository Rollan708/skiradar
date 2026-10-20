import { spawn } from 'bun';

console.log('🚀 Starting SkiRadar Full-Stack (API Server + Vite Frontend)...');

const apiProc = spawn(['bun', 'run', 'server/index.ts'], {
  stdout: 'inherit',
  stderr: 'inherit',
});

const webProc = spawn(['bun', 'run', 'vite', '--host', '--port', '5173'], {
  stdout: 'inherit',
  stderr: 'inherit',
});

process.on('SIGINT', () => {
  apiProc.kill();
  webProc.kill();
  process.exit(0);
});
