import { createServer } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const address = 'http://localhost:5174';
async function isCommunityRunning() {
  try {
    const response = await fetch(address, { signal: AbortSignal.timeout(2000) });
    return response.ok && (await response.text()).includes('name="traction-app" content="community"');
  } catch { return false; }
}
function showRunning() {
  console.log(`\n  ➜  Local:   \x1b[34m\x1b[4m${address}/\x1b[0m\n`);
}
if (await isCommunityRunning()) {
  showRunning();
} else {
  let server;
  try {
    server = await createServer({ root, configFile: resolve(root, 'vite.config.js') });
    await server.listen();
    server.printUrls();
  } catch (error) {
    await server?.close();
    if (await isCommunityRunning()) showRunning();
    else {
      console.error(error.code === 'EADDRINUSE' || /Port 5174 is already in use/.test(error.message)
        ? 'El puerto 5174 lo utiliza otra aplicacion. Cierra ese servidor antes de iniciar Comunidad.'
        : `No se pudo iniciar Comunidad: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
