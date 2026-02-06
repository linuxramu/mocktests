/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Analytics components
          analytics: [
            './src/components/analytics/PerformanceDashboard',
            './src/components/analytics/SubjectAnalysis',
            './src/components/analytics/ProgressTracker',
            './src/components/analytics/ComparisonView',
            './src/components/analytics/TrendAnalysis',
            './src/components/analytics/HeatmapView',
          ],

          // Test components
          'test-interface': [
            './src/components/test/TestInterface',
            './src/components/test/TestLauncher',
            './src/components/test/QuestionRenderer',
            './src/components/test/NavigationPanel',
            './src/components/test/TimerComponent',
          ],

          // History components
          history: [
            './src/components/history/TestHistoryList',
            './src/components/history/TestReview',
            './src/components/history/DataExport',
          ],
        },
      },
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        'src/test/',
      ],
    },
  },
});
