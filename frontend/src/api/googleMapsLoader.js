let loaderPromise = null

/**
 * Loads the Google Maps JavaScript API once and caches the promise, so mounting multiple
 * LiveMap instances (or remounting on navigation) never injects the script twice.
 * Resolves to `window.google.maps`. VITE_GOOGLE_MAPS_API_KEY must be a browser key
 * restricted by HTTP referrer in the Google Cloud Console - it is safe to expose in
 * client-side code, unlike the backend's server-side GOOGLE_MAPS_API_KEY.
 */
export function loadGoogleMaps() {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }
  if (loaderPromise) {
    return loaderPromise
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured'))
  }

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => {
      loaderPromise = null
      reject(new Error('Failed to load Google Maps script'))
    }
    document.head.appendChild(script)
  })

  return loaderPromise
}
