import { useState, useEffect } from 'react'

/**
 * Hook to detect if the component is running on the client side
 * This helps prevent hydration mismatches when using browser-only APIs
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
} 