"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { checkUsername } from "@/lib/api"
import { isValidUsername } from "@/lib/validation/username"

export function useUsernameCheck() {
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  )
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetUsernameCheck = useCallback(() => {
    setUsernameAvailable(null)
    setIsCheckingUsername(false)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
  }, [])

  const scheduleUsernameCheck = useCallback((value: string) => {
    setUsernameAvailable(null)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (!isValidUsername(value)) {
      setIsCheckingUsername(false)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      setIsCheckingUsername(true)
      try {
        const result = await checkUsername(value)
        setUsernameAvailable(result.available)
      } catch {
        setUsernameAvailable(null)
      } finally {
        setIsCheckingUsername(false)
      }
    }, 450)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  return {
    usernameAvailable,
    isCheckingUsername,
    scheduleUsernameCheck,
    resetUsernameCheck,
  }
}
