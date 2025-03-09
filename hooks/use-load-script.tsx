"use client"

import { useState, useEffect } from "react"

type Libraries = Array<"places">

type UseLoadScriptOptions = {
  googleMapsApiKey: string
  libraries: Libraries
}

type UseLoadScriptResult = {
  isLoaded: boolean
  loadError: Error | null
}

export function useLoadScript({ googleMapsApiKey, libraries }: UseLoadScriptOptions): UseLoadScriptResult {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)

  // Convert libraries array to a string to ensure stable dependency
  const librariesString = libraries.join(",")

  useEffect(() => {
    if (!googleMapsApiKey) {
      setLoadError(new Error("Google Maps API key is required"))
      return
    }

    // Check if script is already loaded
    const id = "google-maps-script"
    const existingScript = document.getElementById(id) as HTMLScriptElement

    if (existingScript) {
      // If the script exists and has loaded successfully
      if (window.google && window.google.maps) {
        setIsLoaded(true)
        return
      }

      // If script exists but failed to load properly, remove it so we can try again
      existingScript.parentNode?.removeChild(existingScript)
    }

    // Create a flag to prevent state updates if the component unmounts
    let isMounted = true

    // Load the script
    const script = document.createElement("script")
    script.id = id
    script.type = "text/javascript"
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=${librariesString}&callback=Function.prototype`
    script.async = true
    script.defer = true

    const onScriptLoad = () => {
      if (isMounted) {
        setIsLoaded(true)
      }
    }

    const onScriptError = (error: Event) => {
      if (isMounted) {
        setLoadError(new Error("Google Maps script failed to load"))
      }
    }

    script.addEventListener("load", onScriptLoad)
    script.addEventListener("error", onScriptError)

    document.head.appendChild(script)

    // Cleanup function
    return () => {
      isMounted = false
      script.removeEventListener("load", onScriptLoad)
      script.removeEventListener("error", onScriptError)
      // We don't remove the script on cleanup as it might be used by other components
    }
  }, [googleMapsApiKey, librariesString]) // Use the string version of libraries

  return { isLoaded, loadError }
}

