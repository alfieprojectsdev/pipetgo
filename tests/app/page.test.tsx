/**
 * Home Page Tests
 *
 * Tests for the landing page including service loading, timeout handling,
 * error states, and retry functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Home from '@/app/page'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('Home Page - Service Loading & Timeout Handling', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    ;(useSession as any).mockReturnValue({ data: null })
    ;(useRouter as any).mockReturnValue({
      push: vi.fn(),
    })

    // Reset fetch mock
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful Service Loading', () => {
    it('should call fetch API when component mounts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          pagination: {
            page: 1,
            pageSize: 12,
            totalCount: 0,
            totalPages: 0,
            hasMore: false,
          },
        }),
      })

      render(<Home />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/services?page=1&pageSize=12'),
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        )
      })
    })

    it('should display loading spinner while fetching services', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({
                  items: [],
                  pagination: {
                    page: 1,
                    pageSize: 12,
                    totalCount: 0,
                    totalPages: 0,
                    hasMore: false,
                  },
                }),
              })
            }, 100)
          )
      )

      render(<Home />)

      expect(screen.getByText('Loading services...')).toBeInTheDocument()
    })

    it('should display no services message when services array is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          pagination: {
            page: 1,
            pageSize: 12,
            totalCount: 0,
            totalPages: 0,
            hasMore: false,
          },
        }),
      })

      render(<Home />)

      await waitFor(() => {
        expect(
          screen.getByText('No lab services available at the moment.')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Timeout Handling', () => {
    it('should display timeout error message when fetch times out', async () => {
      // Simulate AbortError (timeout)
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

      render(<Home />)

      await waitFor(() => {
        // Use partial text matching since error message is split across elements
        expect(
          screen.getByText(/Service loading is taking longer/)
        ).toBeInTheDocument()
      })

      expect(screen.queryByText('Loading services...')).not.toBeInTheDocument()
    })

    it('should show timeout error with warning icon', async () => {
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

      render(<Home />)

      await waitFor(() => {
        expect(
          screen.getByText('Unable to Load Services')
        ).toBeInTheDocument()
        expect(screen.getByText(/⚠️/)).toBeInTheDocument()
      })
    })

    it('should display retry button when timeout occurs', async () => {
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

      render(<Home />)

      // Wait for error message to appear
      await waitFor(() => {
        expect(
          screen.getByText(/Service loading is taking longer/)
        ).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /Retry/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('should have functional retry button when timeout occurs', async () => {
      // First attempt times out
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

      render(<Home />)

      // Wait for error message to appear
      await waitFor(() => {
        expect(
          screen.getByText(/Service loading is taking longer/)
        ).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /Retry/i })
      expect(retryButton).toBeEnabled()
      expect(retryButton).toHaveClass('bg-red-600')
    })
  })

  describe('Generic Error Handling', () => {
    it('should display error message on API error (non-OK status)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      })

      render(<Home />)

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load services/)
        ).toBeInTheDocument()
      })
    })

    it('should display error message on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<Home />)

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load services/)
        ).toBeInTheDocument()
      })
    })

    it('should display retry button on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      render(<Home />)

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Retry/i })
        expect(retryButton).toBeInTheDocument()
      })
    })

    it('should show retry button on API error response', async () => {
      // API returns error status
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      render(<Home />)

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Retry/i })
        expect(retryButton).toBeInTheDocument()
        expect(retryButton).toBeEnabled()
      })
    })
  })


  describe('Accessibility & UI', () => {
    it('should have proper heading structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          pagination: {
            page: 1,
            pageSize: 12,
            totalCount: 0,
            totalPages: 0,
            hasMore: false,
          },
        }),
      })

      render(<Home />)

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(
        screen.getByText('Available Lab Services')
      ).toBeInTheDocument()
    })

    it('should display error box with proper structure', async () => {
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

      render(<Home />)

      await waitFor(() => {
        const errorBox = screen.getByText('Unable to Load Services')
        expect(errorBox).toBeInTheDocument()
        // Check that error box and its container are present
        const errorContainer = errorBox.closest('[class*="rounded-lg"]')
        expect(errorContainer).toBeInTheDocument()
      })
    })

    it('should have accessible retry button', async () => {
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

      render(<Home />)

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Retry/i })
        expect(retryButton).toBeInTheDocument()
        expect(retryButton).toBeEnabled()
      })
    })
  })

  describe('Service Display - UI Elements Present', () => {
    it('should render Available Lab Services heading', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          pagination: {
            page: 1,
            pageSize: 12,
            totalCount: 0,
            totalPages: 0,
            hasMore: false,
          },
        }),
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Available Lab Services')).toBeInTheDocument()
      })
    })

    it('should have header with PipetGo branding', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          pagination: {
            page: 1,
            pageSize: 12,
            totalCount: 0,
            totalPages: 0,
            hasMore: false,
          },
        }),
      })

      render(<Home />)

      expect(screen.getByText('PipetGo!')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    it('should have footer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          pagination: {
            page: 1,
            pageSize: 12,
            totalCount: 0,
            totalPages: 0,
            hasMore: false,
          },
        }),
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/Lab Services Marketplace MVP/)).toBeInTheDocument()
      })
    })
  })
})
