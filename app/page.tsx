"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BarChart3, Bus, MapPin, TrendingUp } from "lucide-react"
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

export default function HomePage() {
  return (
    <ClientOnly>
      <SmartTransportDashboard />
    </ClientOnly>
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Panvel Smart Transport Dashboard</h2>
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

