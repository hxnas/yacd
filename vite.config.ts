import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig } from 'vite';

import * as pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let hash = process.env.COMMIT_HASH;
  if (!hash) {
    try {
      hash = await gitHash();
      hash = hash.trim();
    } catch (e) {}
  }
  if (!hash) hash = '';
  console.log('commit hash', hash);

  return {
    define: {
      __VERSION__: JSON.stringify(pkg.version),
      __COMMIT_HASH__: JSON.stringify(hash),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.PUBLIC_URL': JSON.stringify(''),
    },
    base: './',
    resolve: {
      alias: {
        $src: path.resolve(__dirname, './src'),
        src: path.resolve(__dirname, './src'),
      },
    },
    publicDir: 'assets',
    build: {
      // sourcemap: true,
      // the default value is 'dist'
      // which make more sense
      // but change this may break other people's tools
      outDir: 'public',
      cssCodeSplit: false,
      assetsInlineLimit: 1024 * 200,
      chunkSizeWarningLimit: 1024 * 1024 * 2,
      rollupOptions: {
        output: {
          entryFileNames: 'yacd-[hash].js',
          chunkFileNames: 'yacd-[name]-[hash].js',
          assetFileNames: 'yacd-[name]-[hash].[ext]',
          manualChunks: () => '',
        },
      },
    },
    plugins: [react()],
  };
});

// non vite stuff

async function gitHash() {
  try {
    const mod = await import('node:child_process');
    return await run(mod.spawn, 'git', ['rev-parse', '--short', 'HEAD']);
  } catch (e) {
    return;
  }
}

function run(
  spawn: typeof import('node:child_process').spawn,
  cmd0: string,
  args0: string[],
): Promise<string> {
  const cmd = cmd0;
  const args = args0;

  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let out = Buffer.from('');
    proc.stdout.on('data', (data) => {
      out += data;
    });
    proc.on('error', (err) => {
      reject(err);
    });
    proc.on('exit', (code) => {
      if (code !== 0) reject(code);
      resolve(out.toString());
    });
  });
}
