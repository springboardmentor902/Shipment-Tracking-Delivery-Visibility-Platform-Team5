import React, { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../api/googleMapsLoader'

/**
 * Renders the live driver position with the planned route drawn as a line, using the real
 * Google Maps JavaScript API when VITE_GOOGLE_MAPS_API_KEY is configured. If it isn't (or
 * the script fails to load), falls back to a schematic waybill-style plot so the page still
 * shows *something* useful instead of breaking - the driver's current coordinates and a
 * dashed line toward the destination.
 *
 * Props:
 *  - origin, destination: address strings from the Route
 *  - currentPosition: { lat, lng } | null - the latest known driver position
 *  - connected: boolean - whether the STOMP subscription is currently live
 */
export default function LiveMap({ origin, destination, currentPosition, connected }) {
  const mapDivRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const rendererRef = useRef(null)
  const [mapError, setMapError] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Load the map + directions polyline once we have a container and a destination to aim for.
  useEffect(() => {
    let cancelled = false

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapDivRef.current) return

        const center = currentPosition || { lat: 20.5937, lng: 78.9629 } // India centroid fallback
        const map = new maps.Map(mapDivRef.current, {
          center,
          zoom: currentPosition ? 12 : 5,
          disableDefaultUI: true,
          zoomControl: true,
        })
        mapRef.current = map

        if (origin && destination) {
          const directionsService = new maps.DirectionsService()
          const renderer = new maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: { strokeColor: '#E8A33D', strokeWeight: 4 },
          })
          rendererRef.current = renderer

          directionsService.route(
            {
              origin: currentPosition || origin,
              destination,
              travelMode: maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === 'OK') {
                renderer.setDirections(result)
              }
            },
          )
        }

        setMapReady(true)
      })
      .catch(() => {
        if (!cancelled) setMapError(true)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination])

  // Move the driver marker whenever a new location arrives, without re-creating the map.
  useEffect(() => {
    if (!mapReady || !window.google?.maps || !mapRef.current || !currentPosition) return

    const maps = window.google.maps
    if (!markerRef.current) {
      markerRef.current = new maps.Marker({
        map: mapRef.current,
        position: currentPosition,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#E8A33D',
          fillOpacity: 1,
          strokeColor: '#16202E',
          strokeWeight: 2,
        },
      })
    } else {
      markerRef.current.setPosition(currentPosition)
    }
    mapRef.current.panTo(currentPosition)
  }, [currentPosition, mapReady])

  if (mapError || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return <SchematicFallback origin={origin} destination={destination} currentPosition={currentPosition} connected={connected} />
  }

  return (
    <div className="relative">
      <div ref={mapDivRef} className="w-full h-72 border border-manifest" />
      <LiveBadge connected={connected} />
    </div>
  )
}

function LiveBadge({ connected }) {
  return (
    <div className="absolute top-3 right-3 stamp-card bg-paper px-2.5 py-1 flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-cleared animate-pulse' : 'bg-manifest'}`} />
      <span className="eyebrow">{connected ? 'Live' : 'Connecting'}</span>
    </div>
  )
}

/** No Maps key configured (or it failed to load) - a schematic, not-to-scale line plot. */
function SchematicFallback({ origin, destination, currentPosition, connected }) {
  return (
    <div className="relative border border-manifest p-6 h-72 flex flex-col justify-center bg-papershade">
      <LiveBadge connected={connected} />
      <div className="flex items-center justify-between mb-3">
        <div className="max-w-[40%]">
          <p className="eyebrow mb-1">Origin</p>
          <p className="text-xs text-slate truncate">{origin || '\u2014'}</p>
        </div>
        <div className="max-w-[40%] text-right">
          <p className="eyebrow mb-1">Destination</p>
          <p className="text-xs text-slate truncate">{destination || '\u2014'}</p>
        </div>
      </div>

      <div className="relative h-px bg-dashed-line my-6">
        <div
          className="absolute -top-2 w-4 h-4 rounded-full bg-beacon border-2 border-ink transition-all duration-700"
          style={{ left: currentPosition ? '55%' : '8%' }}
          title="Driver"
        />
      </div>

      <p className="eyebrow text-center text-slate">
        {currentPosition
          ? `${currentPosition.lat.toFixed(5)}, ${currentPosition.lng.toFixed(5)}`
          : 'Waiting for driver location\u2026'}
      </p>
      <p className="text-[11px] text-slate/70 text-center mt-2">
        Schematic view {'\u2014'} set VITE_GOOGLE_MAPS_API_KEY for a real map.
      </p>
    </div>
  )
}
