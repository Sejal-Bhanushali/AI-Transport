import type {
  Vehicle,
  TrafficSegment,
  PassengerData,
  WeatherData,
  EventData,
  RouteData,
  OptimizationResult,
} from "./types"
import { SmartTransitOptimizer } from "./ai-models"

// City center coordinates (Panvel, India)
const CITY_CENTER = {
  lat: 19.0289,
  lng: 73.1095,
}

// Create routes that radiate from the city center
const ROUTES = [
  { id: "42", name: "Panvel Station Express", color: "#3b82f6" }, // blue
  { id: "15", name: "Kamothe Line", color: "#ef4444" }, // red
  { id: "7", name: "Kharghar Circuit", color: "#22c55e" }, // green
  { id: "33", name: "New Panvel Shuttle", color: "#f59e0b" }, // amber
  { id: "21", name: "Kalamboli Connector", color: "#8b5cf6" }, // purple
  { id: "9", name: "Taloja Industrial Express", color: "#ec4899" }, // pink
]

// Generate route paths (simplified for demo)
const generateRoutePath = (routeId: string): [number, number][] => {
  const paths: Record<string, [number, number][]> = {
    "42": [
      // Downtown Express - North-South route
      [CITY_CENTER.lat + 0.05, CITY_CENTER.lng],
      [CITY_CENTER.lat + 0.03, CITY_CENTER.lng + 0.01],
      [CITY_CENTER.lat, CITY_CENTER.lng],
      [CITY_CENTER.lat - 0.03, CITY_CENTER.lng - 0.01],
      [CITY_CENTER.lat - 0.05, CITY_CENTER.lng],
    ],
    "15": [
      // University Line - Northeast route
      [CITY_CENTER.lat, CITY_CENTER.lng],
      [CITY_CENTER.lat + 0.02, CITY_CENTER.lng + 0.02],
      [CITY_CENTER.lat + 0.04, CITY_CENTER.lng + 0.04],
      [CITY_CENTER.lat + 0.06, CITY_CENTER.lng + 0.06],
    ],
    "7": [
      // Riverside Circuit - Circular route
      [CITY_CENTER.lat, CITY_CENTER.lng],
      [CITY_CENTER.lat + 0.02, CITY_CENTER.lng + 0.03],
      [CITY_CENTER.lat, CITY_CENTER.lng + 0.05],
      [CITY_CENTER.lat - 0.02, CITY_CENTER.lng + 0.03],
      [CITY_CENTER.lat - 0.03, CITY_CENTER.lng],
      [CITY_CENTER.lat - 0.02, CITY_CENTER.lng - 0.03],
      [CITY_CENTER.lat, CITY_CENTER.lng - 0.05],
      [CITY_CENTER.lat + 0.02, CITY_CENTER.lng - 0.03],
      [CITY_CENTER.lat, CITY_CENTER.lng],
    ],
    "33": [
      // Airport Shuttle - East route
      [CITY_CENTER.lat, CITY_CENTER.lng],
      [CITY_CENTER.lat - 0.01, CITY_CENTER.lng + 0.03],
      [CITY_CENTER.lat - 0.02, CITY_CENTER.lng + 0.06],
      [CITY_CENTER.lat - 0.03, CITY_CENTER.lng + 0.09],
    ],
    "21": [
      // East-West Connector
      [CITY_CENTER.lat, CITY_CENTER.lng - 0.08],
      [CITY_CENTER.lat, CITY_CENTER.lng - 0.04],
      [CITY_CENTER.lat, CITY_CENTER.lng],
      [CITY_CENTER.lat, CITY_CENTER.lng + 0.04],
      [CITY_CENTER.lat, CITY_CENTER.lng + 0.08],
    ],
    "9": [
      // Industrial Zone Express - Southeast route
      [CITY_CENTER.lat, CITY_CENTER.lng],
      [CITY_CENTER.lat - 0.02, CITY_CENTER.lng + 0.02],
      [CITY_CENTER.lat - 0.04, CITY_CENTER.lng + 0.04],
      [CITY_CENTER.lat - 0.06, CITY_CENTER.lng + 0.06],
    ],
  }

  return paths[routeId] || []
}

// Generate traffic segments based on route paths
const generateTrafficSegments = (): TrafficSegment[] => {
  const segments: TrafficSegment[] = []

  ROUTES.forEach((route) => {
    const path = generateRoutePath(route.id)

    // Create segments from path points
    for (let i = 0; i < path.length - 1; i++) {
      const segmentId = `${route.id}-segment-${i}`
      const congestionLevel = Math.random() // Random congestion level

      segments.push({
        id: segmentId,
        name: `${route.name} Segment ${i + 1}`,
        congestionLevel,
        averageSpeed: Math.max(5, 60 - congestionLevel * 55), // Speed decreases with congestion
        coordinates: [path[i], path[i + 1]],
        incidents:
          congestionLevel > 0.7
            ? [
                {
                  id: `incident-${route.id}-${i}`,
                  type: Math.random() > 0.5 ? "accident" : "construction",
                  severity: congestionLevel > 0.8 ? "high" : "medium",
                  latitude: (path[i][0] + path[i + 1][0]) / 2,
                  longitude: (path[i][1] + path[i + 1][1]) / 2,
                  description: `${congestionLevel > 0.8 ? "Major" : "Minor"} ${Math.random() > 0.5 ? "accident" : "construction"}`,
                  startTime: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
                },
              ]
            : undefined,
      })
    }
  })

  return segments
}

// Generate vehicles along routes
const generateVehicles = (): Vehicle[] => {
  const vehicles: Vehicle[] = []
  const now = new Date()

  ROUTES.forEach((route) => {
    const path = generateRoutePath(route.id)
    const vehicleCount = 4 + Math.floor(Math.random() * 4) // 4-7 vehicles per route

    for (let i = 0; i < vehicleCount; i++) {
      // Place vehicle somewhere along the route path
      const pathIndex = Math.floor(Math.random() * (path.length - 1))
      const startPoint = path[pathIndex]
      const endPoint = path[pathIndex + 1]

      // Interpolate position between points
      const progress = Math.random()
      const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * progress
      const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * progress

      // Calculate heading (direction)
      const heading = Math.atan2(endPoint[1] - startPoint[1], endPoint[0] - startPoint[0]) * (180 / Math.PI)

      // Generate random status
      const statusOptions: Vehicle["status"][] = ["on-time", "delayed", "out-of-service"]
      const statusWeights = [0.7, 0.25, 0.05] // 70% on-time, 25% delayed, 5% out-of-service
      const status = weightedRandom(statusOptions, statusWeights)

      // Generate random passenger count
      const capacity = 50
      const passengers = Math.floor(Math.random() * capacity)

      vehicles.push({
        id: `${route.id}-vehicle-${i}`,
        route: route.id,
        latitude: lat,
        longitude: lng,
        speed: 15 + Math.random() * 30, // 15-45 mph
        heading,
        status,
        passengers,
        capacity,
        lastUpdated: now,
      })
    }
  })

  return vehicles
}

// Helper function for weighted random selection
function weightedRandom<T>(options: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < options.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return options[i]
    }
  }

  return options[0] // Fallback
}

// Generate passenger data
const generatePassengerData = (): PassengerData => {
  const byRoute = ROUTES.map((route) => {
    const capacity = 200 + Math.floor(Math.random() * 300) // 200-500 capacity
    const passengers = Math.floor(Math.random() * capacity)

    return {
      routeId: route.id,
      passengers,
      capacity,
      occupancyRate: passengers / capacity,
    }
  })

  const totalPassengers = byRoute.reduce((sum, route) => sum + route.passengers, 0)

  // Generate station data
  const stations = [
    "Panvel Station Terminal",
    "Kamothe Station",
    "Kharghar Park",
    "New Panvel Terminal",
    "Kalamboli Central",
    "Taloja Industrial Zone",
  ]

  const byStation = stations.map((station) => ({
    stationId: station,
    waitingPassengers: Math.floor(Math.random() * 100),
    boardingRate: 10 + Math.floor(Math.random() * 20), // 10-30 passengers per minute
    averageWaitTime: 2 + Math.floor(Math.random() * 8), // 2-10 minutes
  }))

  return {
    totalPassengers,
    byRoute,
    byStation,
  }
}

// Fetch vehicle locations (simulated)
export async function fetchVehicleLocations(): Promise<Vehicle[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return generateVehicles()
}

// Fetch traffic data (simulated)
export async function fetchTrafficData(): Promise<TrafficSegment[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 700))

  return generateTrafficSegments()
}

// Fetch passenger data (simulated)
export async function fetchPassengerData(): Promise<PassengerData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  return generatePassengerData()
}

// Fetch weather data (simulated)
export async function fetchWeatherData(): Promise<WeatherData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const conditions: WeatherData["condition"][] = ["clear", "cloudy", "rain", "snow", "fog"]
  const condition = conditions[Math.floor(Math.random() * conditions.length)]

  let impact: WeatherData["impact"] = "none"
  if (condition === "rain" || condition === "snow") {
    impact = Math.random() > 0.5 ? "medium" : "high"
  } else if (condition === "fog") {
    impact = "medium"
  } else if (condition === "cloudy") {
    impact = "low"
  }

  return {
    location: "City Center",
    condition,
    temperature: Math.floor(40 + Math.random() * 50), // 40-90°F
    precipitation: condition === "rain" || condition === "snow" ? Math.random() * 0.5 : 0,
    windSpeed: Math.floor(Math.random() * 20), // 0-20 mph
    visibility: condition === "fog" ? 2 + Math.random() * 3 : 10, // miles
    impact,
  }
}

// Fetch events data (simulated)
export async function fetchEventsData(): Promise<EventData[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 900))

  const events: EventData[] = []
  const eventTypes = ["concert", "sports", "conference", "festival", "parade"]
  const locations = [
    { name: "Convention Center", lat: CITY_CENTER.lat + 0.02, lng: CITY_CENTER.lng + 0.01 },
    { name: "Stadium", lat: CITY_CENTER.lat - 0.03, lng: CITY_CENTER.lng + 0.02 },
    { name: "University Campus", lat: CITY_CENTER.lat + 0.04, lng: CITY_CENTER.lng + 0.04 },
    { name: "City Park", lat: CITY_CENTER.lat - 0.01, lng: CITY_CENTER.lng - 0.03 },
  ]

  // Generate 0-3 random events
  const eventCount = Math.floor(Math.random() * 4)

  for (let i = 0; i < eventCount; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const location = locations[Math.floor(Math.random() * locations.length)]
    const attendees = 500 + Math.floor(Math.random() * 9500) // 500-10000

    let impact: EventData["impact"] = "low"
    if (attendees > 5000) {
      impact = "high"
    } else if (attendees > 2000) {
      impact = "medium"
    }

    // Event starts between now and 6 hours from now
    const startTime = new Date(Date.now() + Math.floor(Math.random() * 6 * 3600000))
    // Event lasts 1-4 hours
    const endTime = new Date(startTime.getTime() + (1 + Math.floor(Math.random() * 4)) * 3600000)

    events.push({
      id: `event-${i}`,
      name: `${location.name} ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
      type: eventType,
      location: {
        name: location.name,
        latitude: location.lat,
        longitude: location.lng,
      },
      startTime,
      endTime,
      estimatedAttendees: attendees,
      impact,
    })
  }

  return events
}

// Fetch route data (simulated)
export async function fetchRouteData(): Promise<RouteData[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  return ROUTES.map((route) => {
    const path = generateRoutePath(route.id)
    const activeVehicles = 4 + Math.floor(Math.random() * 4) // 4-7 vehicles
    const currentPassengers = 50 + Math.floor(Math.random() * 450) // 50-500 passengers
    const averageDelay = Math.floor(Math.random() * 10) // 0-10 minutes

    // Generate congestion level
    let congestionLevel: "low" | "medium" | "high" = "low"
    const congestionValue = Math.random()
    if (congestionValue > 0.7) {
      congestionLevel = "high"
    } else if (congestionValue > 0.3) {
      congestionLevel = "medium"
    }

    // Generate status
    let status: RouteData["status"] = "normal"
    if (congestionLevel === "high" && Math.random() > 0.5) {
      status = "optimized"
    } else if (congestionLevel === "low" && Math.random() > 0.7) {
      status = "reduced"
    }

    // Generate stops
    const stops = path.map((point, index) => ({
      id: `${route.id}-stop-${index}`,
      name: `${route.name} Stop ${index + 1}`,
      latitude: point[0],
      longitude: point[1],
      passengerCount: Math.floor(Math.random() * 50), // 0-50 passengers waiting
    }))

    return {
      id: route.id,
      name: route.name,
      status,
      activeVehicles,
      currentPassengers,
      averageDelay,
      congestionLevel,
      stops,
      path,
    }
  })
}

// Generate optimization recommendations (simulated)
export async function generateOptimizationRecommendations(): Promise<OptimizationResult[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Initialize the optimizer
  const optimizer = new SmartTransitOptimizer()

  // Generate recommendations for specific routes
  const recommendations: OptimizationResult[] = [
    {
      routeId: "15",
      originalRoute: "University Line: Main St → College Ave → University Blvd",
      optimizedRoute: "University Line: Main St → Oak St → University Blvd",
      reason: "Construction on College Ave causing 15-minute delays",
      impact: {
        travelTimeReduction: 12,
        waitTimeReduction: 8,
        fuelSavings: 320,
      },
      confidence: 92,
    },
    {
      routeId: "9",
      originalRoute: "Industrial Zone: Downtown → Highway 7 → Industrial Park",
      optimizedRoute: "Industrial Zone: Downtown → Riverside Dr → Industrial Park",
      reason: "Heavy traffic on Highway 7 during morning rush hour",
      impact: {
        travelTimeReduction: 8,
        waitTimeReduction: 5,
        fuelSavings: 180,
      },
      confidence: 87,
    },
    {
      routeId: "42",
      originalRoute: "Downtown Express: 15-minute frequency all day",
      optimizedRoute: "Downtown Express: 10-minute frequency during peak hours, 20-minute off-peak",
      reason: "Passenger demand varies significantly throughout the day",
      impact: {
        travelTimeReduction: 0,
        waitTimeReduction: 12,
        fuelSavings: 450,
      },
      confidence: 95,
    },
  ]

  return recommendations
}

