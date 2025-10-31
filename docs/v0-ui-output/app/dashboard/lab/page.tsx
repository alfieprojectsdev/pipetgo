import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Package, TrendingUp, DollarSign, Clock, CheckCircle2, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LabDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manila Materials Laboratory</h1>
          <p className="text-gray-600">Manage your test requests and analytical services</p>
        </div>

        {/* Alert for Pending Orders */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">3 test requests require your attention</AlertTitle>
          <AlertDescription className="text-amber-700">
            You have pending sample submissions waiting for acknowledgment.{" "}
            <Button variant="link" className="p-0 h-auto text-amber-900 underline">
              Review now
            </Button>
          </AlertDescription>
        </Alert>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
              <Clock className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">3</div>
              <p className="text-xs text-amber-600 mt-1 font-medium">Requires action</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
              <Package className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">7</div>
              <p className="text-xs text-gray-500 mt-1">Currently testing</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed (Month)</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">42</div>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue (Month)</CardTitle>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">₱84,500</div>
              <p className="text-xs text-gray-500 mt-1">October 2024</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders - Materials Testing Context */}
          <div className="lg:col-span-2">
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Test Requests</CardTitle>
                    <CardDescription>Latest sample submissions for your lab</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: "TST-2024-0156",
                      service: "Tensile Strength Testing",
                      client: "ABC Engineering Corp",
                      status: "PENDING",
                      date: "2024-10-10",
                      price: "₱1,500",
                      urgent: true,
                    },
                    {
                      id: "TST-2024-0155",
                      service: "Concrete Compressive Test",
                      client: "BuildRight Construction",
                      status: "IN_PROGRESS",
                      date: "2024-10-09",
                      price: "₱800",
                      urgent: false,
                    },
                    {
                      id: "TST-2024-0154",
                      service: "Metallurgical Analysis",
                      client: "SteelWorks Manufacturing",
                      status: "PENDING",
                      date: "2024-10-09",
                      price: "₱2,800",
                      urgent: true,
                    },
                    {
                      id: "TST-2024-0153",
                      service: "Environmental Sampling",
                      client: "EcoTest Solutions",
                      status: "ACKNOWLEDGED",
                      date: "2024-10-08",
                      price: "₱2,200",
                      urgent: false,
                    },
                  ].map((order) => (
                    <div
                      key={order.id}
                      className={`
                        flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-all cursor-pointer
                        ${order.urgent && order.status === "PENDING" ? "border-amber-300 bg-amber-50" : "border-gray-200 hover:border-teal-500"}
                      `}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{order.service}</h4>
                          <Badge
                            variant={
                              order.status === "IN_PROGRESS"
                                ? "secondary"
                                : order.status === "ACKNOWLEDGED"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={
                              order.status === "IN_PROGRESS"
                                ? "bg-teal-100 text-teal-700 border-teal-200"
                                : order.status === "ACKNOWLEDGED"
                                  ? "bg-purple-100 text-purple-700 border-purple-200"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                            }
                          >
                            {order.status.replace("_", " ")}
                          </Badge>
                          {order.urgent && order.status === "PENDING" && (
                            <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Client: {order.client}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{order.id}</span>
                          <span>•</span>
                          <span>{order.date}</span>
                          <span>•</span>
                          <span className="font-medium text-gray-900">{order.price}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {order.status === "PENDING" && (
                          <Button size="sm" className="bg-teal-500 hover:bg-teal-600">
                            Acknowledge
                          </Button>
                        )}
                        {order.status === "IN_PROGRESS" && (
                          <Button size="sm" variant="outline" className="border-gray-300 bg-transparent">
                            Upload Report
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your lab</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-teal-500 hover:bg-teal-600">View All Requests</Button>
                <Button variant="outline" className="w-full bg-transparent border-gray-300">
                  Manage Services
                </Button>
                <Button variant="outline" className="w-full bg-transparent border-gray-300">
                  Edit Lab Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Active Services</CardTitle>
                <CardDescription>Your testing offerings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tensile Strength Testing</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Concrete Compressive Test</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Metallurgical Analysis</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <Button variant="link" className="w-full p-0 h-auto text-blue-600">
                    View all 8 services →
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
              <CardHeader>
                <CardTitle className="text-white">Performance Insights</CardTitle>
                <CardDescription className="text-white/80">Your lab is performing well</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/90">Avg. Turnaround</span>
                  <span className="font-semibold">3.2 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">Client Satisfaction</span>
                  <span className="font-semibold">4.8/5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">On-time Delivery</span>
                  <span className="font-semibold">96%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
