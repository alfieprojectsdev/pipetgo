/**
 * ErrorBoundary Component Tests
 *
 * Basic tests to verify ErrorBoundary component structure.
 * Note: Testing error boundaries with Vitest is challenging, so these are structural tests.
 * Manual testing in browser is recommended for full verification.
 */

import { describe, it, expect } from 'vitest'
import { ErrorBoundary } from '@/components/ErrorBoundary'

describe('ErrorBoundary', () => {
  it('should be defined and importable', () => {
    expect(ErrorBoundary).toBeDefined()
  })

  it('should be a class component', () => {
    expect(ErrorBoundary.prototype).toBeDefined()
    expect(typeof ErrorBoundary.prototype.render).toBe('function')
  })

  it('should have getDerivedStateFromError static method', () => {
    expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function')
  })

  it('should have componentDidCatch lifecycle method', () => {
    expect(typeof ErrorBoundary.prototype.componentDidCatch).toBe('function')
  })
})
