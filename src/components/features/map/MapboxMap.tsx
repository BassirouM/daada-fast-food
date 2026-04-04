'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/stores/cart.store'
import { formatPrice } from '@/lib/utils'
import type { AdresseLivraison } from '@/stores/cart.store'
import type { Livreur } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAROUA_CENTER: [number, number] = [14.3273, 10.5900]
const RESTAURANT_COORDS: [number, number] = [14.3280, 10.5895]
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// ─── Delivery zones GeoJSON ───────────────────────────────────────────────────

type ZoneFeature = {
  name: string
  fraisLivraison: number
  tempsMin: number
  tempsMax: number
  active: boolean
  coords: [number, number][]
}

const ZONE_DATA: ZoneFeature[] = [
  {
    name: 'Domayo', fraisLivraison: 500, tempsMin: 15, tempsMax: 25, active: true,
    coords: [[14.300, 10.575], [14.340, 10.575], [14.340, 10.600], [14.300, 10.600], [14.300, 10.575]],
  },
  {
    name: 'Kakataré', fraisLivraison: 500, tempsMin: 20, tempsMax: 35, active: true,
    coords: [[14.285, 10.598], [14.320, 10.598], [14.320, 10.635], [14.285, 10.635], [14.285, 10.598]],
  },
  {
    name: 'Doualaré', fraisLivraison: 500, tempsMin: 20, tempsMax: 30, active: true,
    coords: [[14.330, 10.582], [14.365, 10.582], [14.365, 10.615], [14.330, 10.615], [14.330, 10.582]],
  },
  {
    name: 'Kongola', fraisLivraison: 600, tempsMin: 25, tempsMax: 40, active: true,
    coords: [[14.305, 10.548], [14.342, 10.548], [14.342, 10.578], [14.305, 10.578], [14.305, 10.548]],
  },
  {
    name: 'Lopéré', fraisLivraison: 600, tempsMin: 25, tempsMax: 40, active: true,
    coords: [[14.342, 10.598], [14.382, 10.598], [14.382, 10.628], [14.342, 10.628], [14.342, 10.598]],
  },
  {
    name: 'Ouro-Tchédé', fraisLivraison: 600, tempsMin: 30, tempsMax: 45, active: true,
    coords: [[14.292, 10.548], [14.328, 10.548], [14.328, 10.578], [14.292, 10.578], [14.292, 10.548]],
  },
  {
    name: 'Pitoare', fraisLivraison: 700, tempsMin: 35, tempsMax: 50, active: true,
    coords: [[14.258, 10.568], [14.295, 10.568], [14.295, 10.603], [14.258, 10.603], [14.258, 10.568]],
  },
  {
    name: 'Dougoy', fraisLivraison: 700, tempsMin: 35, tempsMax: 50, active: true,
    coords: [[14.355, 10.552], [14.392, 10.552], [14.392, 10.582], [14.355, 10.582], [14.355, 10.552]],
  },
  {
    name: 'Founangué', fraisLivraison: 600, tempsMin: 30, tempsMax: 45, active: true,
    coords: [[14.312, 10.618], [14.352, 10.618], [14.352, 10.650], [14.312, 10.650], [14.312, 10.618]],
  },
  {
    name: 'Hors zone', fraisLivraison: 0, tempsMin: 0, tempsMax: 0, active: false,
    coords: [[14.200, 10.500], [14.450, 10.500], [14.450, 10.700], [14.200, 10.700], [14.200, 10.500]],
  },
]

const ZONES_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: ZONE_DATA.map((z) => ({
    type: 'Feature',
    properties: {
      name: z.name,
      fraisLivraison: z.fraisLivraison,
      tempsMin: z.tempsMin,
      tempsMax: z.tempsMax,
      active: z.active,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [z.coords],
    },
  })),
}

// ─── SVG marker helpers ───────────────────────────────────────────────────────

function makeMarkerEl(html: string, size = 36): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = `width:${size}px;height:${size}px;cursor:pointer;`
  el.innerHTML = html
  return el
}

const FLAME_SVG = `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="18" r="18" fill="#FF6B00"/>
  <text x="18" y="23" text-anchor="middle" font-size="18">🔥</text>
</svg>`

const USER_SVG = `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="18" r="16" fill="#3B82F6" stroke="white" stroke-width="2"/>
  <circle cx="18" cy="18" r="6" fill="white"/>
  <circle cx="18" cy="18" r="16" fill="none" stroke="#3B82F6" stroke-width="2" opacity="0.4">
    <animate attributeName="r" from="16" to="26" dur="1.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite"/>
  </circle>
</svg>`

const PIN_SVG = `<svg viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 2C10.3 2 4 8.3 4 16c0 10.5 14 26 14 26S32 26.5 32 16C32 8.3 25.7 2 18 2z" fill="#FF6B00" stroke="white" stroke-width="2"/>
  <circle cx="18" cy="16" r="5" fill="white"/>
</svg>`

const MOTO_SVG = `<svg viewBox="0 0 40 36" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="18" r="18" fill="#10B981"/>
  <text x="20" y="24" text-anchor="middle" font-size="18">🏍</text>
  <animateTransform attributeName="transform" type="translate"
    values="0,0; 0,-2; 0,0" dur="0.8s" repeatCount="indefinite"/>
</svg>`

// ─── Reverse geocoding ────────────────────────────────────────────────────────

async function reverseGeocode(lng: number, lat: number): Promise<string> {
  if (!TOKEN) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}&language=fr&country=CM&limit=1`
    )
    const data = await res.json() as { features?: Array<{ place_name: string }> }
    return data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

// ─── Forward geocoding (autocomplete) ────────────────────────────────────────

type GeoFeature = { id: string; place_name: string; center: [number, number] }

async function forwardGeocode(query: string): Promise<GeoFeature[]> {
  if (!TOKEN || query.length < 2) return []
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&proximity=${MAROUA_CENTER[0]},${MAROUA_CENTER[1]}&language=fr&country=CM&limit=5`
    )
    const data = await res.json() as { features?: GeoFeature[] }
    return data.features ?? []
  } catch {
    return []
  }
}

// ─── Find zone for coordinates ────────────────────────────────────────────────

function findZone(lng: number, lat: number): ZoneFeature | null {
  for (const zone of ZONE_DATA) {
    if (!zone.active) continue
    const first = zone.coords[0]
    const third = zone.coords[2]
    if (!first || !third) continue
    const [minLng, minLat] = first
    const [maxLng, maxLat] = third
    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
      return zone
    }
  }
  return null
}

// ─── Directions API ───────────────────────────────────────────────────────────

async function fetchRoute(
  from: [number, number],
  to: [number, number]
): Promise<GeoJSON.LineString | null> {
  if (!TOKEN) return null
  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${TOKEN}&overview=full`
    )
    const data = await res.json() as { routes?: Array<{ geometry: GeoJSON.LineString; duration: number }> }
    return data.routes?.[0]?.geometry ?? null
  } catch {
    return null
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type MapboxMapProps = {
  mode?: 'selection' | 'tracking' | 'minimap'
  orderId?: string
  initialCoords?: [number, number]
  onAddressConfirm?: (addr: AdresseLivraison) => void
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapboxMap({
  mode = 'selection',
  orderId,
  initialCoords,
  onAddressConfirm,
  className = '',
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const livreurMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const hoverPopupRef = useRef<mapboxgl.Popup | null>(null)
  const livreurMarkersRef = useRef<mapboxgl.Marker[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { setAdresseLivraison } = useCartStore()

  // UI state
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState<GeoFeature[]>([])
  const [selectedAddr, setSelectedAddr] = useState<AdresseLivraison | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [trackingInfo, _setTrackingInfo] = useState<{ nom: string; eta: number } | null>(null)

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapboxgl.accessToken = TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: initialCoords ?? MAROUA_CENTER,
      zoom: mode === 'minimap' ? 14 : 13,
      minZoom: 11,
      maxZoom: 17,
      interactive: mode !== 'minimap',
      attributionControl: false,
    })

    mapRef.current = map

    map.on('load', () => {
      setMapLoaded(true)

      // ── Attribution compact ──────────────────────────────────────────────
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

      // ── Navigation controls (selection + tracking only) ──────────────────
      if (mode !== 'minimap') {
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      }

      // ── Delivery zones fill ──────────────────────────────────────────────
      map.addSource('zones', { type: 'geojson', data: ZONES_GEOJSON })

      // Out-of-zone fill (render first = bottom)
      map.addLayer({
        id: 'zones-out-fill',
        type: 'fill',
        source: 'zones',
        filter: ['==', ['get', 'active'], false],
        paint: {
          'fill-color': '#EF4444',
          'fill-opacity': 0.08,
        },
      })

      // Active zones fill
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        filter: ['==', ['get', 'active'], true],
        paint: {
          'fill-color': '#FF6B00',
          'fill-opacity': 0.12,
        },
      })

      // Zone outlines
      map.addLayer({
        id: 'zones-line',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': ['case', ['get', 'active'], '#FF6B00', '#EF4444'],
          'line-width': 1.5,
          'line-opacity': 0.6,
        },
      })

      // ── Restaurant marker ────────────────────────────────────────────────
      new mapboxgl.Marker({ element: makeMarkerEl(FLAME_SVG) })
        .setLngLat(RESTAURANT_COORDS)
        .setPopup(
          new mapboxgl.Popup({ offset: 20, closeButton: false })
            .setHTML('<div style="color:#0A0A0A;font-weight:700;font-size:0.875rem">🍔 Daada Fast Food</div><div style="color:#666;font-size:0.75rem">Maroua Centre</div>')
        )
        .addTo(map)

      // ── Hover tooltip on zones ───────────────────────────────────────────
      if (mode !== 'minimap') {
        hoverPopupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
        })

        map.on('mousemove', 'zones-fill', (e) => {
          map.getCanvas().style.cursor = 'pointer'
          const props = e.features?.[0]?.properties as { name: string; tempsMin: number; tempsMax: number; fraisLivraison: number } | undefined
          if (!props || !hoverPopupRef.current) return
          hoverPopupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="color:#0A0A0A;font-weight:700;font-size:0.875rem">${props.name}</div>` +
              `<div style="color:#666;font-size:0.75rem">⏱ ${props.tempsMin}–${props.tempsMax} min · ${formatPrice(props.fraisLivraison)}</div>`
            )
            .addTo(map)
        })

        map.on('mouseleave', 'zones-fill', () => {
          map.getCanvas().style.cursor = ''
          hoverPopupRef.current?.remove()
        })

        map.on('mousemove', 'zones-out-fill', (e) => {
          map.getCanvas().style.cursor = 'not-allowed'
          if (!hoverPopupRef.current) return
          hoverPopupRef.current
            .setLngLat(e.lngLat)
            .setHTML('<div style="color:#EF4444;font-weight:700;font-size:0.875rem">⛔ Hors zone de livraison</div>')
            .addTo(map)
        })

        map.on('mouseleave', 'zones-out-fill', () => {
          map.getCanvas().style.cursor = ''
          hoverPopupRef.current?.remove()
        })
      }

      // ── Click to place marker (selection mode) ───────────────────────────
      if (mode === 'selection') {
        map.on('click', (e) => {
          const { lng, lat } = e.lngLat
          placePin(lng, lat)
        })
      }

      // ── Initial pin (minimap mode) ───────────────────────────────────────
      if (mode === 'minimap' && initialCoords) {
        const [lng, lat] = initialCoords
        selectedMarkerRef.current = new mapboxgl.Marker({
          element: makeMarkerEl(PIN_SVG, 32),
          draggable: false,
        })
          .setLngLat([lng, lat])
          .addTo(map)
      }
    })

    return () => {
      hoverPopupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Load delivery agents (selection mode) ──────────────────────────────────
  useEffect(() => {
    if (mode !== 'selection' || !mapLoaded) return

    const loadAgents = async () => {
      const { data } = await supabase
        .from('livreurs')
        .select('*')
        .eq('disponible', true)
        .limit(10)

      if (!data || !mapRef.current) return

      livreurMarkersRef.current.forEach((m) => m.remove())
      livreurMarkersRef.current = []

      for (const livreur of data as Livreur[]) {
        if (!livreur.latitude || !livreur.longitude) continue
        const marker = new mapboxgl.Marker({ element: makeMarkerEl(MOTO_SVG, 40) })
          .setLngLat([livreur.longitude, livreur.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 20, closeButton: false })
              .setHTML(`<div style="color:#0A0A0A;font-weight:700;font-size:0.875rem">🏍 Livreur actif</div><div style="color:#10B981;font-size:0.75rem">Disponible</div>`)
          )
          .addTo(mapRef.current)
        livreurMarkersRef.current.push(marker)
      }
    }

    void loadAgents()
  }, [mode, mapLoaded])

  // ── Realtime tracking (tracking mode) ─────────────────────────────────────
  useEffect(() => {
    if (mode !== 'tracking' || !orderId || !mapLoaded) return

    let livreurId: string | null = null

    const init = async () => {
      // Fetch order to get livreur_id
      const { data: commande } = await supabase
        .from('commandes')
        .select('livreur_id, adresse_livraison')
        .eq('id', orderId)
        .single()

      if (!commande) return
      livreurId = (commande as { livreur_id: string | null }).livreur_id

      if (!livreurId) return

      // Fetch livreur initial position
      const { data: livreur } = await supabase
        .from('livreurs')
        .select('*')
        .eq('livreur_id', livreurId)
        .single()

      if (livreur && mapRef.current) {
        const l = livreur as Livreur
        updateLivreurMarker(l.longitude, l.latitude)
        await drawRoute([l.longitude, l.latitude], RESTAURANT_COORDS)
      }

      // Subscribe to position updates
      supabase
        .channel(`livreur-tracking-${orderId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'livreurs', filter: `livreur_id=eq.${livreurId}` },
          async (payload) => {
            const updated = payload.new as Livreur
            updateLivreurMarker(updated.longitude, updated.latitude)
            await drawRoute([updated.longitude, updated.latitude], RESTAURANT_COORDS)
          }
        )
        .subscribe()
    }

    void init()

    return () => {
      void supabase.removeAllChannels()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, orderId, mapLoaded])

  // ── Place pin helper ───────────────────────────────────────────────────────
  const placePin = useCallback(async (lng: number, lat: number) => {
    if (!mapRef.current) return

    // Remove existing pin
    selectedMarkerRef.current?.remove()

    // Create draggable marker
    const el = makeMarkerEl(PIN_SVG, 36)
    const marker = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat([lng, lat])
      .addTo(mapRef.current)

    selectedMarkerRef.current = marker

    // Resolve address
    const [adresse, zone] = await Promise.all([
      reverseGeocode(lng, lat),
      Promise.resolve(findZone(lng, lat)),
    ])

    const addr: AdresseLivraison = {
      label: adresse.split(',')[0] ?? adresse,
      adresse,
      quartier: zone?.name ?? 'Maroua',
      lng,
      lat,
      fraisLivraison: zone?.fraisLivraison ?? ZONE_DATA.find((z) => !z.active) ? 0 : 500,
      tempsEstime: zone ? Math.round((zone.tempsMin + zone.tempsMax) / 2) : 45,
    }

    setSelectedAddr(addr)
    setSearchText(adresse)

    // Update on drag end
    marker.on('dragend', async () => {
      const pos = marker.getLngLat()
      const [newAdresse, newZone] = await Promise.all([
        reverseGeocode(pos.lng, pos.lat),
        Promise.resolve(findZone(pos.lng, pos.lat)),
      ])
      const updated: AdresseLivraison = {
        label: newAdresse.split(',')[0] ?? newAdresse,
        adresse: newAdresse,
        quartier: newZone?.name ?? 'Maroua',
        lng: pos.lng,
        lat: pos.lat,
        fraisLivraison: newZone?.fraisLivraison ?? 500,
        tempsEstime: newZone ? Math.round((newZone.tempsMin + newZone.tempsMax) / 2) : 45,
      }
      setSelectedAddr(updated)
      setSearchText(newAdresse)
    })
  }, [])

  // ── GPS handler ────────────────────────────────────────────────────────────
  const handleGps = useCallback(async () => {
    setGpsLoading(true)
    try {
      // Web Geolocation API (Capacitor wraps this on native)
      let lng = 0, lat = 0
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => { lng = pos.coords.longitude; lat = pos.coords.latitude; resolve() },
          reject,
          { timeout: 8000, enableHighAccuracy: true }
        )
      })

      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 })

      // User location marker
      const el = makeMarkerEl(USER_SVG, 36)
      new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapRef.current!)

      await placePin(lng, lat)
    } catch {
      // Geolocation denied or unavailable
    } finally {
      setGpsLoading(false)
    }
  }, [placePin])

  // ── Search autocomplete ────────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value)
    setSuggestions([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 2) return
    debounceRef.current = setTimeout(async () => {
      const results = await forwardGeocode(value)
      setSuggestions(results)
    }, 300)
  }, [])

  const handleSuggestionClick = useCallback(async (feat: GeoFeature) => {
    setSuggestions([])
    setSearchText(feat.place_name)
    const [lng, lat] = feat.center
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 })
    await placePin(lng, lat)
  }, [placePin])

  // ── Confirm address ────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (!selectedAddr) return
    setAdresseLivraison(selectedAddr)
    onAddressConfirm?.(selectedAddr)
  }, [selectedAddr, setAdresseLivraison, onAddressConfirm])

  // ── Livreur marker helper ──────────────────────────────────────────────────
  const updateLivreurMarker = useCallback((lng: number, lat: number) => {
    if (!mapRef.current) return
    if (!livreurMarkerRef.current) {
      const el = makeMarkerEl(MOTO_SVG, 40)
      livreurMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapRef.current)
    } else {
      livreurMarkerRef.current.setLngLat([lng, lat])
    }
    mapRef.current.easeTo({ center: [lng, lat], duration: 800 })
  }, [])

  // ── Draw route helper ──────────────────────────────────────────────────────
  const drawRoute = useCallback(async (from: [number, number], to: [number, number]) => {
    const map = mapRef.current
    if (!map) return
    const geometry = await fetchRoute(from, to)
    if (!geometry) return

    const source = map.getSource('route') as mapboxgl.GeoJSONSource | undefined
    if (source) {
      source.setData({ type: 'Feature', geometry, properties: {} })
    } else {
      map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry, properties: {} } })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#FF6B00', 'line-width': 4, 'line-opacity': 0.85 },
      })
    }

    // Fit bounds to route
    const coords = geometry.coordinates as [number, number][]
    const bounds = coords.reduce(
      (b, c) => b.extend(c as mapboxgl.LngLatLike),
      new mapboxgl.LngLatBounds(coords[0], coords[0])
    )
    map.fitBounds(bounds, { padding: 60, duration: 1000 })
  }, [])

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (mode === 'minimap') {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{ width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}
      />
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Search overlay — top */}
      {mode === 'selection' && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 56,
            zIndex: 10,
          }}
        >
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 16 }}>
              🔍
            </div>
            <input
              type="text"
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher une adresse à Maroua…"
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'rgba(10,10,10,0.92)',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                backdropFilter: 'blur(12px)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div
              style={{
                marginTop: 4,
                background: 'rgba(10,10,10,0.95)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
              }}
            >
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => void handleSuggestionClick(s)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.625rem 0.875rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: 'white',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ flexShrink: 0, opacity: 0.5 }}>📍</span>
                  <span>{s.place_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GPS button */}
      {mode === 'selection' && (
        <button
          onClick={() => void handleGps()}
          disabled={gpsLoading}
          title="Ma position GPS"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(10,10,10,0.92)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'white',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          {gpsLoading ? (
            <span style={{ animation: 'spin 0.8s linear infinite', display: 'block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
          ) : '📡'}
        </button>
      )}

      {/* Selected address panel — bottom */}
      {mode === 'selection' && selectedAddr && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 10,
            background: 'rgba(10,10,10,0.95)',
            borderRadius: 16,
            padding: '1rem',
            border: '1px solid rgba(255,107,0,0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📍 {selectedAddr.label}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedAddr.adresse}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.75rem' }}>
              <p style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.9375rem' }}>
                ~{selectedAddr.tempsEstime} min
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                {formatPrice(selectedAddr.fraisLivraison)}
              </p>
            </div>
          </div>

          {selectedAddr.fraisLivraison === 0 && !findZone(selectedAddr.lng, selectedAddr.lat) ? (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.5rem 0.75rem', color: '#EF4444', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
              ⛔ Zone hors livraison
            </div>
          ) : null}

          <button
            onClick={handleConfirm}
            disabled={!findZone(selectedAddr.lng, selectedAddr.lat) && selectedAddr.fraisLivraison === 0}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #FF6B00, #CC5500)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9375rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(255,107,0,0.35)',
              opacity: (!findZone(selectedAddr.lng, selectedAddr.lat) && selectedAddr.fraisLivraison === 0) ? 0.5 : 1,
            }}
          >
            Confirmer cette adresse
          </button>
        </div>
      )}

      {/* Tracking info panel */}
      {mode === 'tracking' && trackingInfo && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 10,
            background: 'rgba(10,10,10,0.95)',
            borderRadius: 16,
            padding: '1rem',
            border: '1px solid rgba(255,107,0,0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem' }}>
            🏍 {trackingInfo.nom}
          </p>
          <p style={{ color: '#FF6B00', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            ETA : ~{trackingInfo.eta} min
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
