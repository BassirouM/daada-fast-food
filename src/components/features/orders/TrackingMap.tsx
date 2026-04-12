'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const TOKEN           = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
const RESTAURANT_POS: [number, number] = [14.3280, 10.5895]

type Props = {
  livreurPosition: [number, number] | null
  clientPosition:  [number, number] | null
  eta:             number | null
}

export default function TrackingMap({ livreurPosition, clientPosition, eta }: Props) {
  const containerRef    = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<mapboxgl.Map | null>(null)
  const livreurMarkerRef = useRef<mapboxgl.Marker | null>(null)

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!TOKEN) return

    mapboxgl.accessToken = TOKEN

    const center = livreurPosition ?? clientPosition ?? RESTAURANT_POS

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     'mapbox://styles/mapbox/dark-v11',
      center,
      zoom:      14,
      interactive: true,
    })

    mapRef.current = map

    map.on('load', () => {
      // Restaurant marker
      const restaurantEl = document.createElement('div')
      restaurantEl.textContent = '🍔'
      restaurantEl.style.cssText = 'font-size:22px;cursor:default;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));'
      new mapboxgl.Marker({ element: restaurantEl })
        .setLngLat(RESTAURANT_POS)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Restaurant Daada'))
        .addTo(map)

      // Client destination marker
      if (clientPosition) {
        const clientEl = document.createElement('div')
        clientEl.textContent = '📍'
        clientEl.style.cssText = 'font-size:22px;cursor:default;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));'
        new mapboxgl.Marker({ element: clientEl })
          .setLngLat(clientPosition)
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Votre adresse'))
          .addTo(map)
      }

      // Route line (restaurant → client)
      if (clientPosition) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [RESTAURANT_POS, clientPosition],
            },
          },
        })
        map.addLayer({
          id:    'route',
          type:  'line',
          source:'route',
          paint: {
            'line-color': '#F97316',
            'line-width': 3,
            'line-dasharray': [2, 2],
            'line-opacity': 0.7,
          },
        })
      }

      // Livreur marker (initial)
      if (livreurPosition) {
        const motoEl = document.createElement('div')
        motoEl.textContent = '🛵'
        motoEl.style.cssText = 'font-size:26px;cursor:default;filter:drop-shadow(0 2px 6px rgba(0,0,0,.7));animation:bounce 1s ease infinite;'
        livreurMarkerRef.current = new mapboxgl.Marker({ element: motoEl })
          .setLngLat(livreurPosition)
          .addTo(map)
      }
    })

    return () => { map.remove(); mapRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Update livreur position ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !livreurPosition) return

    if (livreurMarkerRef.current) {
      livreurMarkerRef.current.setLngLat(livreurPosition)
    } else {
      const motoEl = document.createElement('div')
      motoEl.textContent = '🛵'
      motoEl.style.cssText = 'font-size:26px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.7));'
      livreurMarkerRef.current = new mapboxgl.Marker({ element: motoEl })
        .setLngLat(livreurPosition)
        .addTo(map)
    }

    map.easeTo({ center: livreurPosition, duration: 800 })
  }, [livreurPosition])

  if (!TOKEN) {
    return (
      <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
          <p style={{ fontSize: '0.875rem' }}>Carte non disponible</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Configurez NEXT_PUBLIC_MAPBOX_TOKEN</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {/* ETA badge */}
      {eta !== null && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '0.375rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', zIndex: 10 }}>
          <span style={{ fontSize: '0.875rem' }}>⏱</span>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>~{eta} min</span>
        </div>
      )}
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  )
}
