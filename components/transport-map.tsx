"use client"

import { useEffect, useRef, useState } from "react"
import type { Vehicle, TrafficSegment } from "@/lib/types"
import "leaflet/dist/leaflet.css"

// We're using Leaflet for the map
// This is a client-side only component
export default function TransportMap({
  vehicles,
  trafficData,
  highlightedVehicleId,
}: {
  vehicles: Vehicle[]
  trafficData: TrafficSegment[]
  highlightedVehicleId?: string | number
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isClient, setIsClient] = useState(false)

  // Only run initialization on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Dynamic import of leaflet to avoid SSR issues
    const initializeMap = async () => {
      if (typeof window !== "undefined" && mapRef.current && !mapInstanceRef.current) {
        // Dynamic import of leaflet
        const L = (await import("leaflet")).default

        // Create map instance
        const map = L.map(mapRef.current).setView([19.0289, 73.1095], 13)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        mapInstanceRef.current = map

        // Create custom bus icon
        const busIcon = L.divIcon({
          html: `<div class="bus-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-bus"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M18 18h2a2 2 0 0 0 2-2v-6a8 8 0 0 0-16 0v6a2 2 0 0 0 2 2h2"/><path d="M9 18h6"/><path d="M5 18v2"/><path d="M19 18v2"/><rect x="5" y="18" width="14" height="2" rx="1"/></svg></div>`,
          className: "",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        // Add style for bus icon
        const style = document.createElement("style")
        style.textContent = `
          .bus-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background-color: #3b82f6;
            border-radius: 50%;
            color: white;
          }
          
          .bus-icon-highlighted {
            background-color: #f97316;
            width: 36px;
            height: 36px;
            border: 2px solid #7c2d12;
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.6);
            z-index: 1000 !important;
          }
        `
        document.head.appendChild(style)

        // Add traffic congestion overlay
        addTrafficOverlay(L, map, trafficData)
      }
    }

    // Only initialize map on client side
    if (isClient) {
      initializeMap()
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isClient, trafficData])

  // Update markers when vehicles data changes
  useEffect(() => {
    // Skip if not on client or if map isn't initialized
    if (!isClient || !mapInstanceRef.current) return

    const updateMarkers = async () => {
      if (!mapInstanceRef.current) return

      const L = (await import("leaflet")).default
      const map = mapInstanceRef.current

      // Remove existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // Add new markers
      vehicles.forEach((vehicle) => {
        // Check if this vehicle should be highlighted
        const isHighlighted = vehicle.id === highlightedVehicleId;
        
        // Create custom bus icon with conditional highlighting
        const busIcon = L.divIcon({
          html: `<div class="bus-icon ${isHighlighted ? 'bus-icon-highlighted' : ''}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="${isHighlighted ? '24' : '16'}" height="${isHighlighted ? '24' : '16'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-bus">
                    <path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/>
                    <path d="M18 18h2a2 2 0 0 0 2-2v-6a8 8 0 0 0-16 0v6a2 2 0 0 0 2 2h2"/>
                    <path d="M9 18h6"/><path d="M5 18v2"/><path d="M19 18v2"/>
                    <rect x="5" y="18" width="14" height="2" rx="1"/>
                  </svg>
                </div>`,
          className: "",
          iconSize: [isHighlighted ? 36 : 32, isHighlighted ? 36 : 32],
          iconAnchor: [isHighlighted ? 18 : 16, isHighlighted ? 18 : 16],
        });

        const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon: busIcon })
          .addTo(map)
          .bindPopup(`
            <div>
              <strong>${vehicle.id}</strong><br/>
              Route: ${vehicle.route || vehicle.routeId}<br/>
              Speed: ${vehicle.speed?.toFixed(1) || '25.0'} mph<br/>
              Passengers: ${vehicle.passengers || vehicle.passengerCount || '18'}/${vehicle.capacity || '40'}<br/>
              Status: ${vehicle.status || 'On time'}
              ${vehicle.eta ? `<br/>ETA: ${vehicle.eta} min` : ''}
              ${vehicle.nextStop ? `<br/>Next stop: ${vehicle.nextStop}` : ''}
              ${vehicle.fuelLevel ? `<br/>Fuel level: ${vehicle.fuelLevel}%` : ''}
            </div>
          `)
        
        // If this is the highlighted vehicle, open its popup and pan to it
        if (isHighlighted) {
          marker.openPopup();
          map.panTo(marker.getLatLng());
          map.setZoom(14);
        }

        markersRef.current.push(marker)
      })
    }

    if (vehicles.length > 0 && mapInstanceRef.current) {
      updateMarkers()
    }
  }, [vehicles, isClient, highlightedVehicleId])

  // Update traffic overlay when traffic data changes
  useEffect(() => {
    // Skip if not on client or if map isn't initialized
    if (!isClient || !mapInstanceRef.current) return

    const updateTrafficOverlay = async () => {
      if (!mapInstanceRef.current) return

      const L = (await import("leaflet")).default
      const map = mapInstanceRef.current

      // Remove existing traffic layers
      map.eachLayer((layer) => {
        if (layer._path && layer.options.className === "traffic-segment") {
          layer.remove()
        }
      })

      // Add updated traffic overlay
      addTrafficOverlay(L, map, trafficData)
    }

    if (trafficData.length > 0 && mapInstanceRef.current) {
      updateTrafficOverlay()
    }
  }, [trafficData, isClient])

  // Helper function to add traffic overlay
  const addTrafficOverlay = (L: any, map: any, trafficData: TrafficSegment[]) => {
    trafficData.forEach((segment) => {
      // Create a line for each traffic segment
      if (segment.coordinates && segment.coordinates.length >= 2) {
        const color = getTrafficColor(segment.congestionLevel)

        const line = L.polyline(segment.coordinates, {
          color,
          weight: 5,
          opacity: 0.7,
          className: "traffic-segment",
        }).addTo(map)

        line.bindPopup(`
          <div>
            <strong>${segment.name}</strong><br/>
            Congestion: ${(segment.congestionLevel * 100).toFixed(0)}%<br/>
            Avg. Speed: ${segment.averageSpeed.toFixed(1)} mph
          </div>
        `)
      }
    })
  }

  // Helper function to get color based on congestion level
  const getTrafficColor = (congestionLevel: number) => {
    if (congestionLevel > 0.7) return "#ef4444" // Red for high congestion
    if (congestionLevel > 0.4) return "#f59e0b" // Amber for medium congestion
    return "#22c55e" // Green for low congestion
  }

  return (
    <div>
      {!isClient && (
        <div className="flex items-center justify-center p-12 h-[500px]">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
      <div 
        ref={mapRef} 
        className={`w-full h-full min-h-[400px] ${!isClient ? 'hidden' : ''}`} 
      />
    </div>
  )
}

