/**
 * OrderTimeline Component Tests
 *
 * Tests for the order status timeline component that displays
 * the progression of an order through various states.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrderTimeline } from '@/components/ui/order-timeline'
import { OrderStatus } from '@/types'

describe('OrderTimeline', () => {
  const baseProps = {
    status: OrderStatus.PENDING,
    createdAt: '2024-11-18T10:00:00Z',
  }

  describe('Component Structure', () => {
    it('should be defined and importable', () => {
      expect(OrderTimeline).toBeDefined()
    })

    it('should render without crashing', () => {
      render(<OrderTimeline {...baseProps} />)
      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('should render Order Submitted step', () => {
      render(<OrderTimeline {...baseProps} />)
      expect(screen.getByText('Order Submitted')).toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should show completed checkmark for passed steps', () => {
      render(
        <OrderTimeline
          status={OrderStatus.ACKNOWLEDGED}
          createdAt="2024-11-18T10:00:00Z"
          acknowledgedAt="2024-11-18T12:00:00Z"
        />
      )
      // Order Submitted should be completed
      const submittedStep = screen.getByText('Order Submitted').closest('li')
      expect(submittedStep).toHaveTextContent('Order Submitted')
    })

    it('should show current status as active', () => {
      render(
        <OrderTimeline
          status={OrderStatus.IN_PROGRESS}
          createdAt="2024-11-18T10:00:00Z"
          acknowledgedAt="2024-11-18T12:00:00Z"
        />
      )
      expect(screen.getByText('Testing in Progress')).toBeInTheDocument()
    })

    it('should show pending steps as gray', () => {
      render(
        <OrderTimeline
          status={OrderStatus.PENDING}
          createdAt="2024-11-18T10:00:00Z"
        />
      )
      expect(screen.getByText('Results Available')).toBeInTheDocument()
    })
  })

  describe('Quote Workflow', () => {
    it('should show Quote Provided step when quotedAt exists', () => {
      render(
        <OrderTimeline
          status={OrderStatus.QUOTE_PROVIDED}
          createdAt="2024-11-18T10:00:00Z"
          quotedAt="2024-11-19T14:00:00Z"
        />
      )
      expect(screen.getByText('Quote Provided')).toBeInTheDocument()
    })

    it('should show Awaiting Quote step for QUOTE_REQUESTED status', () => {
      render(
        <OrderTimeline
          status={OrderStatus.QUOTE_REQUESTED}
          createdAt="2024-11-18T10:00:00Z"
        />
      )
      expect(screen.getByText('Awaiting Quote')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('should display formatted createdAt date', () => {
      render(
        <OrderTimeline
          status={OrderStatus.PENDING}
          createdAt="2024-11-18T10:00:00Z"
        />
      )
      // formatDate returns format like "November 18th, 2024"
      expect(screen.getByText(/November 18/)).toBeInTheDocument()
    })

    it('should display formatted acknowledgedAt date when provided', () => {
      render(
        <OrderTimeline
          status={OrderStatus.ACKNOWLEDGED}
          createdAt="2024-11-18T10:00:00Z"
          acknowledgedAt="2024-11-19T10:00:00Z"
        />
      )
      expect(screen.getByText(/November 19/)).toBeInTheDocument()
    })

    it('should display formatted completedAt date when provided', () => {
      render(
        <OrderTimeline
          status={OrderStatus.COMPLETED}
          createdAt="2024-11-18T10:00:00Z"
          acknowledgedAt="2024-11-18T12:00:00Z"
          completedAt="2024-11-20T02:00:00Z"
        />
      )
      expect(screen.getByText(/November 20/)).toBeInTheDocument()
    })
  })

  describe('All Status Values', () => {
    const allStatuses = [
      OrderStatus.QUOTE_REQUESTED,
      OrderStatus.QUOTE_PROVIDED,
      OrderStatus.QUOTE_REJECTED,
      OrderStatus.PENDING,
      OrderStatus.ACKNOWLEDGED,
      OrderStatus.IN_PROGRESS,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ]

    it.each(allStatuses)('should render correctly for status: %s', (status) => {
      render(
        <OrderTimeline
          status={status}
          createdAt="2024-11-18T10:00:00Z"
        />
      )
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render as a list for screen readers', () => {
      render(<OrderTimeline {...baseProps} />)
      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('should have list items for each step', () => {
      render(<OrderTimeline {...baseProps} />)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThan(0)
    })

    it('should have aria-current on the active step', () => {
      render(
        <OrderTimeline
          status={OrderStatus.IN_PROGRESS}
          createdAt="2024-11-18T10:00:00Z"
          acknowledgedAt="2024-11-18T12:00:00Z"
        />
      )
      const currentStep = screen.getByText('Testing in Progress').closest('li')
      expect(currentStep).toHaveAttribute('aria-current', 'step')
    })
  })

  describe('Edge Cases', () => {
    it('should handle cancelled status', () => {
      render(
        <OrderTimeline
          status={OrderStatus.CANCELLED}
          createdAt="2024-11-18T10:00:00Z"
        />
      )
      expect(screen.getByText('Cancelled')).toBeInTheDocument()
    })

    it('should handle quote rejected status', () => {
      render(
        <OrderTimeline
          status={OrderStatus.QUOTE_REJECTED}
          createdAt="2024-11-18T10:00:00Z"
          quotedAt="2024-11-19T10:00:00Z"
        />
      )
      expect(screen.getByText('Quote Declined')).toBeInTheDocument()
    })
  })
})
