import { createServer } from 'vite';
import { build } from 'esbuild';
import { spawn } from 'child_process';
import electronPath from 'electron';

async function startDev() {
  // 1. Build electron main & preload
  await build({
    entryPoints: ['electron/main.ts', 'electron/preload.ts'],
    outdir: 'dist-electron',
    bundle: true,
    platform: 'node',
    external: ['electron', 'adm-zip'],
    sourcemap: true,
  });
  console.log('[Dev] Electron main & preload built successfully.');

  // 2. Start Vite server
  const server = await createServer({
    configFile: './vite.config.ts',
  });
  await server.listen();
  const address = server.httpServer?.address();
  const port = typeof address === 'object' && address ? address.port : 5173;
  console.log(`[Dev] Vite dev server running at http://localhost:${port}`);

  // 3. Start Electron process
  process.env.VITE_DEV_SERVER_URL = `http://localhost:${port}`;
  const electronProcess = spawn(String(electronPath), ['.'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  });

  electronProcess.on('close', () => {
    server.close();
    process.exit();
  });
}

startDev().catch((err) => {
  console.error('[Dev] Failed to start:', err);
  process.exit(1);
});
