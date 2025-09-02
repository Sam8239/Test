'use client'

import { useState, useEffect, ReactElement, ReactNode } from 'react'

interface NoSSRProps {
  children: ReactNode
  fallback?: ReactElement
}

export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and before hydration, show fallback
  if (!mounted) {
    return fallback
  }

  // After hydration, show actual content
  return <>{children}</>
}
