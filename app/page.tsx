"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BarChart3, Bus, MapPin, TrendingUp, User } from "lucide-react"
import { 
  fetchVehicleLocations, 
  fetchTrafficData, 
  fetchPassengerData, 
  fetchRouteData 
} from "@/lib/data-service"
import TransportMap from "@/components/transport-map"
import OptimizationDashboard from "@/components/optimization-dashboard"
import type { Vehicle, TrafficSegment, Recommendation, RouteData, OptimizationResult } from "@/lib/types"
import { RouteOptimizer } from "@/lib/route-optimizer"
import ClientOnly from "@/components/client-only"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HomePage() {
  return (
    <ClientOnly>
      <PortalSelector />
    </ClientOnly>
  )
}

function PortalSelector() {
  const [activePortal, setActivePortal] = useState<"admin" | "passenger">("admin")
  
  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen">
      <Tabs 
        defaultValue="admin" 
        value={activePortal} 
        onValueChange={(value) => setActivePortal(value as "admin" | "passenger")}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Panvel Smart Transport System</h1>
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="admin">
              <BarChart3 className="mr-2 h-4 w-4" />
              Admin Portal
            </TabsTrigger>
            <TabsTrigger value="passenger">
              <User className="mr-2 h-4 w-4" />
              Passenger Portal
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="admin" className="space-y-4 mt-2">
          <SmartTransportDashboard />
        </TabsContent>
        
        <TabsContent value="passenger" className="space-y-4 mt-2">
          <PassengerPortal />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PassengerPortal() {
  const [startPoint, setStartPoint] = useState("")
  const [destination, setDestination] = useState("")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showTicketBooking, setShowTicketBooking] = useState(false)
  const [passengerName, setPassengerName] = useState("")
  const [passengerContact, setPassengerContact] = useState("")
  const [ticketBooked, setTicketBooked] = useState(false)
  
  useEffect(() => {
    const loadVehicles = async () => {
      const vehicleData = await fetchVehicleLocations()
      setVehicles(vehicleData)
    }
    
    loadVehicles()
    
    // Poll for updates
    const intervalId = setInterval(async () => {
      const vehicleData = await fetchVehicleLocations()
      setVehicles(vehicleData)
    }, 30000)
    
    return () => clearInterval(intervalId)
  }, [])
  
  const handleSearch = () => {
    // In a real app, this would filter vehicles based on the route
    // For now, we'll just enable the bus selection
    if (startPoint && destination) {
      setSelectedVehicle(null)
      setShowTicketBooking(false)
      setTicketBooked(false)
    }
  }
  
  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowTicketBooking(true)
  }
  
  const handleBookTicket = () => {
    if (passengerName && passengerContact && selectedVehicle) {
      setTicketBooked(true)
    }
  }
  
  return (
    <div className="flex flex-col space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan Your Journey</CardTitle>
          <CardDescription>
            Find available buses for your route and book tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Point</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
              >
                <option value="">Select start point</option>
                <option value="Kharghar Station">Kharghar Station</option>
                <option value="Panvel Station">Panvel Station</option>
                <option value="CBD Belapur">CBD Belapur</option>
                <option value="Vashi">Vashi</option>
                <option value="Seawoods">Seawoods</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="">Select destination</option>
                <option value="Kharghar Station">Kharghar Station</option>
                <option value="Panvel Station">Panvel Station</option>
                <option value="CBD Belapur">CBD Belapur</option>
                <option value="Vashi">Vashi</option>
                <option value="Seawoods">Seawoods</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch}
                disabled={!startPoint || !destination}
                className="w-full"
              >
                Find Buses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {startPoint && destination && (
        <Card>
          <CardHeader>
            <CardTitle>Available Buses</CardTitle>
            <CardDescription>
              Select a bus to view details and book a ticket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicles
                .filter(v => v.status !== "out-of-service")
                .slice(0, 5)
                .map((vehicle) => (
                  <div 
                    key={vehicle.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedVehicle?.id === vehicle.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectVehicle(vehicle)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold flex items-center">
                          <Bus className="mr-2 h-4 w-4 text-blue-600" />
                          Bus {vehicle.id} - Route {vehicle.routeId}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {startPoint} → {destination}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ETA: {vehicle.eta || "25"} min
                        </div>
                        <div className={`text-sm ${
                          vehicle.status === "on-time" ? "text-green-600" : "text-amber-600"
                        }`}>
                          {vehicle.status === "on-time" ? "On Time" : "Delayed"}
                        </div>
                      </div>
                    </div>
                    
                    {selectedVehicle?.id === vehicle.id && (
                      <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Current Location</div>
                          <div className="font-medium">{vehicle.currentStop || "Sector 10"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Next Stop</div>
                          <div className="font-medium">{vehicle.nextStop || "Sector 12"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Passengers</div>
                          <div className="font-medium">{vehicle.passengerCount || "18"}/40</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Fare</div>
                          <div className="font-medium">₹30</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {showTicketBooking && !ticketBooked && (
        <Card>
          <CardHeader>
            <CardTitle>Book Your Ticket</CardTitle>
            <CardDescription>
              Enter your details to book a ticket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Passenger Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Number</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    value={passengerContact}
                    onChange={(e) => setPassengerContact(e.target.value)}
                    placeholder="Enter your contact number"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={handleBookTicket}
                  disabled={!passengerName || !passengerContact}
                  className="w-full md:w-auto"
                >
                  Book Ticket
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {ticketBooked && selectedVehicle && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <svg className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Ticket Booked Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium text-gray-500">Journey Details</h3>
                  <p className="font-semibold mt-1">
                    {startPoint} → {destination}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Bus {selectedVehicle.id} - Route {selectedVehicle.routeId}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Passenger Details</h3>
                  <p className="font-semibold mt-1">{passengerName}</p>
                  <p className="text-sm text-gray-600 mt-1">{passengerContact}</p>
                </div>
              </div>
              
              <div className="border-t border-green-200 pt-4 mt-4">
                <h3 className="font-medium text-gray-500 mb-2">Ticket Information</h3>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-500">Ticket ID</span>
                    <p className="font-mono font-semibold">{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Fare</span>
                    <p className="font-semibold">₹30</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Date</span>
                    <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                  </div>
                  <Button size="sm">
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium text-gray-500 mb-2">Track Your Bus</h3>
                <div className="h-[300px] bg-white rounded-lg border border-green-200">
                  <TransportMap 
                    vehicles={[selectedVehicle]} 
                    trafficData={[]} 
                    highlightedVehicleId={selectedVehicle.id}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Live Fleet Tracking</CardTitle>
          <CardDescription>
            Track all buses in real-time across Panvel
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] p-0">
          <TransportMap 
            vehicles={vehicles} 
            trafficData={[]} 
            highlightedVehicleId={selectedVehicle?.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function SmartTransportDashboard() {
  // Data states
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [trafficData, setTrafficData] = useState<TrafficSegment[]>([])
  const [passengerCount, setPassengerCount] = useState(0)
  const [recommendations, setRecommendations] = useState<OptimizationResult[]>([])
  const [routeData, setRouteData] = useState<RouteData[]>([])
  const [actionableRecommendations, setActionableRecommendations] = useState<string[]>([])
  const [enhancedVehicles, setEnhancedVehicles] = useState<Vehicle[]>([])
  
  // UI states
  const [loading, setLoading] = useState(true)
  
  // Create the route optimizer instance
  const [routeOptimizer] = useState(() => new RouteOptimizer())

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch initial data
        const vehicleData = await fetchVehicleLocations()
        const traffic = await fetchTrafficData()
        const passengerData = await fetchPassengerData()
        const routes = await fetchRouteData()

        setVehicles(vehicleData)
        setTrafficData(traffic)
        setPassengerCount(passengerData.totalPassengers)
        setRouteData(routes)

        // Enhance vehicles with simulated GPS data
        const enhanced = routeOptimizer.enhanceVehicleData(vehicleData)
        setEnhancedVehicles(enhanced)

        // Generate route optimization recommendations
        const optimizationRecommendations = routeOptimizer.generateOptimizationRecommendations(
          traffic,
          routes
        )

        // Generate actionable recommendations for transit authorities
        const actionable = routeOptimizer.generateActionableRecommendations(
          vehicleData,
          traffic,
          routes
        )

        setRecommendations(optimizationRecommendations)
        setActionableRecommendations(actionable)

        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        setLoading(false)
      }
    }

    loadInitialData()

    // Set up polling for real-time updates
    const intervalId = setInterval(async () => {
      try {
        const vehicleData = await fetchVehicleLocations()
        const traffic = await fetchTrafficData()
        
        setVehicles(vehicleData)
        setTrafficData(traffic)
        
        // Enhance vehicles with simulated GPS data
        const enhanced = routeOptimizer.enhanceVehicleData(vehicleData)
        setEnhancedVehicles(enhanced)
      } catch (error) {
        console.error("Error updating data:", error)
      }
    }, 15000) // Update every 15 seconds

    return () => clearInterval(intervalId)
  }, [routeOptimizer])

  // Display a loading state until initialization is complete
  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Panvel Smart Transport Dashboard</h2>
          <p className="text-muted-foreground mb-6">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <MapPin className="mr-2 h-4 w-4" />
            <span>Panvel, Maharashtra</span>
          </Button>
          <Button>
            <Bus className="mr-2 h-4 w-4" />
            <span>Add Vehicle</span>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buses</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {vehicles.filter(v => v.status === "on-time").length} on time,{" "}
              {vehicles.filter(v => v.status === "delayed").length} delayed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passengerCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {vehicles.length > 0 ? Math.floor(passengerCount / vehicles.length) : 0} avg. per bus
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routeData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {routeData.filter(r => r.congestionLevel === "high").length} with high congestion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization Recommendations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {recommendations.filter(r => r.priority === "high").length} high priority
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Fleet Tracking</CardTitle>
            <CardDescription>
              Real-time location of all vehicles in the Panvel area
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[500px] p-0">
            <TransportMap vehicles={vehicles} trafficData={trafficData} />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Optimization & Recommendations</CardTitle>
            <CardDescription>
              AI-powered recommendations to improve efficiency and reduce congestion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OptimizationDashboard 
              vehicles={enhancedVehicles}
              routes={routeData}
              recommendations={recommendations}
              actionableRecommendations={actionableRecommendations}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Passenger Demand Analysis</CardTitle>
            <CardDescription>
              Historical and real-time passenger demand by route and time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Passenger demand charts will appear here</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>
              Latest activity and system notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Route optimization applied to Route 15
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Diverted via Palm Beach Road to avoid congestion
                  </p>
                </div>
                <div className="ml-auto font-medium">Just now</div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    High demand detected at Kharghar Station
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Additional bus dispatched to meet demand
                  </p>
                </div>
                <div className="ml-auto font-medium">15m ago</div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Weather alert: Light rain expected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Consider adjusting travel speeds for safety
                  </p>
                </div>
                <div className="ml-auto font-medium">2h ago</div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    System maintenance scheduled
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Non-critical updates at 2:00 AM tomorrow
                  </p>
                </div>
                <div className="ml-auto font-medium">5h ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

