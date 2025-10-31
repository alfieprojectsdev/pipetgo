/**
 * 🎓 LEARNING: Custom React Hook for Orders
 * =========================================
 * This hook encapsulates order-related data fetching and mutations.
 *
 * Key Concepts:
 * - Custom hooks start with "use" prefix
 * - They can use other hooks (useState, useEffect, etc.)
 * - SWR provides caching, revalidation, and automatic refetching
 * - Mutations update local cache optimistically for better UX
 *
 * TODO: Install SWR - npm install swr
 * For now, using basic fetch with useState/useEffect
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Order, CreateOrderInput, UpdateOrderInput } from '@/types'

/**
 * 🎓 useOrders Hook
 * Fetches and manages list of orders
 */
export function useOrders(filters?: Record<string, any>) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      // TODO: Add filters to query string
      const response = await fetch('/api/orders')

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders
  }
}

/**
 * 🎓 useOrder Hook
 * Fetches a single order by ID
 */
export function useOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }

      const data = await response.json()
      setOrder(data.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  return {
    order,
    loading,
    error,
    refetch: fetchOrder
  }
}

/**
 * 🎓 useCreateOrder Hook
 * Handles order creation with loading states
 */
export function useCreateOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOrder = async (input: CreateOrderInput): Promise<Order | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const data = await response.json()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createOrder,
    loading,
    error
  }
}

/**
 * 🎓 useUpdateOrder Hook
 * Handles order status updates (for lab admins)
 */
export function useUpdateOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateOrder = async (
    orderId: string,
    input: UpdateOrderInput
  ): Promise<Order | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update order')
      }

      const data = await response.json()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    updateOrder,
    loading,
    error
  }
}
