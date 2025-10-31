import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, CheckCircle2, DollarSign, ArrowRight, FileText } from "lucide-react"

export default function ClientDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Juan!</h1>
          <p className="text-gray-600">Here's an overview of your testing requests and sample analysis</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Test Requests</CardTitle>
              <Package className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">24</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
              <Clock className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">3</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting lab confirmation</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Tests</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">18</div>
              <p className="text-xs text-gray-500 mt-1">Reports available</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">₱32,500</div>
              <p className="text-xs text-gray-500 mt-1">This year</p>
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
                    <CardDescription>Your latest sample submissions</CardDescription>
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
                      lab: "Manila Materials Laboratory",
                      status: "COMPLETED",
                      date: "2024-10-08",
                      price: "₱1,500",
                    },
                    {
                      id: "TST-2024-0155",
                      service: "XRF Analysis",
                      lab: "Quezon Analytical Services",
                      status: "IN_PROGRESS",
                      date: "2024-10-06",
                      price: "₱3,500",
                    },
                    {
                      id: "TST-2024-0154",
                      service: "Concrete Compressive Test",
                      lab: "Construction Testing Lab",
                      status: "PENDING",
                      date: "2024-10-05",
                      price: "₱800",
                    },
                    {
                      id: "TST-2024-0153",
                      service: "Metallurgical Analysis",
                      lab: "MetalTest Philippines",
                      status: "ACKNOWLEDGED",
                      date: "2024-10-03",
                      price: "₱2,800",
                    },
                  ].map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{order.service}</h4>
                          <Badge
                            variant={
                              order.status === "COMPLETED"
                                ? "default"
                                : order.status === "IN_PROGRESS"
                                  ? "secondary"
                                  : order.status === "ACKNOWLEDGED"
                                    ? "secondary"
                                    : "outline"
                            }
                            className={
                              order.status === "COMPLETED"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : order.status === "IN_PROGRESS"
                                  ? "bg-teal-100 text-teal-700 border-teal-200"
                                  : order.status === "ACKNOWLEDGED"
                                    ? "bg-purple-100 text-purple-700 border-purple-200"
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                            }
                          >
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{order.lab}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{order.id}</span>
                          <span>•</span>
                          <span>{order.date}</span>
                          <span>•</span>
                          <span className="font-medium text-gray-900">{order.price}</span>
                        </div>
                      </div>
                      {order.status === "COMPLETED" && (
                        <Button size="sm" variant="outline" className="ml-4 bg-transparent border-gray-300">
                          <FileText className="h-4 w-4 mr-2" />
                          Download Report
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-teal-500 hover:bg-teal-600">Browse Testing Services</Button>
                <Button variant="outline" className="w-full bg-transparent border-gray-300">
                  View All Requests
                </Button>
                <Button variant="outline" className="w-full bg-transparent border-gray-300">
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
              <CardHeader>
                <CardTitle className="text-white">Need Help?</CardTitle>
                <CardDescription className="text-white/80">Our support team is here to assist you</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full bg-white text-slate-900 hover:bg-gray-100">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
