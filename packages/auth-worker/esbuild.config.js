module.exports = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  external: ['vitest', 'fast-check', '@vitest/*'],
  loader: {
    '.ts': 'ts',
  },
  // Exclude test files
  plugins: [
    {
      name: 'exclude-tests',
      setup(build) {
        build.onResolve({ filter: /\.test\.ts$/ }, () => {
          return { path: '', external: true };
        });
        build.onResolve({ filter: /\.pbt\.test\.ts$/ }, () => {
          return { path: '', external: true };
        });
      },
    },
  ],
};
