import { useIsClient } from './useIsClient'
import type { ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * ClientOnly component to prevent hydration mismatches
 * Only renders children on the client side after hydration
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isClient = useIsClient()
  
  if (!isClient) {
    return fallback
  }
  
  return children
}

/**
 * Higher-order component to suppress hydration warnings for specific components
 */
export function withSuppressHydrationWarning<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const ComponentWithHydrationSuppression = (props: P) => {
    return (
      <div suppressHydrationWarning>
        <WrappedComponent {...props} />
      </div>
    )
  }
  
  ComponentWithHydrationSuppression.displayName = `withSuppressHydrationWarning(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return ComponentWithHydrationSuppression
} 