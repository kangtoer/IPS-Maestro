import { spawn } from 'child_process';
const child = spawn('node', ['server.ts']);
child.stdout.on('data', d => process.stdout.write(d));
child.stderr.on('data', d => process.stderr.write(d));
setTimeout(() => {
  child.kill();
  process.exit(0);
}, 3000);
