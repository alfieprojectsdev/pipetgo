/**
 * PipetGo - B2B Lab Testing Marketplace
 * Copyright (c) 2025 PIPETGO, Inc. All rights reserved.
 * 
 * This file and its contents are the proprietary intellectual property of PIPETGO, Inc.
 * Unauthorized use, reproduction, or distribution is strictly prohibited.
 */

/**
 * 🎓 LEARNING: Vitest Configuration
 * =================================
 * Vitest is a fast unit test framework compatible with Jest API.
 * This config sets up our testing environment for React components and utilities.
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing (React components)
    environment: 'jsdom',

    // Setup files run before each test file
    setupFiles: ['./vitest.setup.ts'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'coverage/',
        '**/*.config.{js,ts}',
        '**/types/**',
        '**/*.d.ts'
      ]
    },

    // Test file patterns
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],

    // Watch mode excludes
    exclude: ['node_modules', 'dist', '.next', 'coverage']
  },

  // Path aliases (match tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
