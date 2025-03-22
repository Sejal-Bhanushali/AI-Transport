// Define types for the application

export interface Vehicle {
  id: string
  route: string
  latitude: number
  longitude: number
  speed: number
  heading: number
  status: "on-time" | "delayed" | "out-of-service"
  passengers: number
  capacity: number
  lastUpdated: Date
  // Enhanced GPS data properties (optional since not all vehicles will have these initially)
  eta?: number
  nextStop?: string
  fuelLevel?: number
}

export interface TrafficSegment {
  id: string
  name: string
  congestionLevel: number // 0-1 scale
  averageSpeed: number // mph
  coordinates: [number, number][] // Array of [lat, lng] points
  incidents?: Incident[]
}

export interface Incident {
  id: string
  type: "accident" | "construction" | "event" | "weather"
  severity: "low" | "medium" | "high"
  latitude: number
  longitude: number
  description: string
  startTime: Date
  estimatedEndTime?: Date
}

export interface PassengerData {
  totalPassengers: number
  byRoute: {
    routeId: string
    passengers: number
    capacity: number
    occupancyRate: number
  }[]
  byStation: {
    stationId: string
    waitingPassengers: number
    boardingRate: number
    averageWaitTime: number
  }[]
}

export interface WeatherData {
  location: string
  condition: "clear" | "cloudy" | "rain" | "snow" | "fog"
  temperature: number
  precipitation: number
  windSpeed: number
  visibility: number
  impact: "none" | "low" | "medium" | "high"
}

export interface EventData {
  id: string
  name: string
  type: string
  location: {
    name: string
    latitude: number
    longitude: number
  }
  startTime: Date
  endTime: Date
  estimatedAttendees: number
  impact: "low" | "medium" | "high"
}

export interface Recommendation {
  route: string
  recommendation: string
  impact: string
  priority: "low" | "medium" | "high"
  confidence?: number
  explanation?: string
}

export interface OptimizationResult {
  routeId: string
  originalRoute: string
  optimizedRoute: string
  reason: string
  impact: {
    travelTimeReduction: number
    waitTimeReduction: number
    fuelSavings: number
  }
  confidence: number
}

export interface RouteData {
  id: string
  name: string
  status: "normal" | "optimized" | "reduced"
  activeVehicles: number
  currentPassengers: number
  averageDelay: number
  congestionLevel: "low" | "medium" | "high"
  stops: {
    id: string
    name: string
    latitude: number
    longitude: number
    passengerCount: number
  }[]
  path: [number, number][] // Array of [lat, lng] points representing the route
}

