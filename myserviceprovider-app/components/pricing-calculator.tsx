"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calculator, DollarSign } from "lucide-react"

interface PricingData {
  service: string
  squareFootage: number
  materialGrade: string
  laborHours: number
}

const serviceRates = {
  "trim-carpentry": {
    name: "Trim Carpentry",
    laborRate: { min: 30, max: 50 },
    materialRate: { min: 10, max: 20 },
    markup: { min: 20, max: 30 },
  },
  remodeling: {
    name: "Complete Remodeling",
    totalRate: { min: 50, max: 100 },
    markup: { min: 15, max: 25 },
  },
  decking: {
    name: "Custom Decking",
    laborRate: { min: 25, max: 45 },
    materialRate: { min: 15, max: 30 },
    markup: 20,
  },
  "post-frame": {
    name: "Post Frame Building",
    laborRate: { min: 30, max: 50 },
    materialRate: { min: 20, max: 40 },
    markup: { min: 15, max: 25 },
  },
}

export function PricingCalculator() {
  const [formData, setFormData] = useState<PricingData>({
    service: "",
    squareFootage: 0,
    materialGrade: "standard",
    laborHours: 0,
  })
  const [estimate, setEstimate] = useState<any>(null)

  const calculateEstimate = () => {
    if (!formData.service || !formData.squareFootage) return

    const service = serviceRates[formData.service as keyof typeof serviceRates]
    let materialCost = 0
    let laborCost = 0
    let markup = 0
    let total = 0

    if (formData.service === "remodeling") {
      // Remodeling uses total rate per sq ft
      const rate =
        formData.materialGrade === "premium"
          ? service.totalRate.max
          : formData.materialGrade === "budget"
            ? service.totalRate.min
            : (service.totalRate.min + service.totalRate.max) / 2

      total = formData.squareFootage * rate
      materialCost = total * 0.6 // Assume 60% materials
      laborCost = total * 0.4 // Assume 40% labor
      markup = total * (service.markup.max / 100)
    } else {
      // Other services use separate material and labor rates
      const materialMultiplier =
        formData.materialGrade === "premium" ? 1.3 : formData.materialGrade === "budget" ? 0.8 : 1.0

      materialCost =
        formData.squareFootage * ((service.materialRate.min + service.materialRate.max) / 2) * materialMultiplier

      laborCost =
        (formData.laborHours || formData.squareFootage * 0.5) * ((service.laborRate.min + service.laborRate.max) / 2)

      const markupRate =
        typeof service.markup === "number" ? service.markup : (service.markup.min + service.markup.max) / 2

      markup = (materialCost + laborCost) * (markupRate / 100)
      total = materialCost + laborCost + markup
    }

    setEstimate({
      service: service.name,
      materialCost,
      laborCost,
      markup,
      total,
      priceRange: {
        low: total * 0.85,
        high: total * 1.15,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calculator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Project Details</span>
            </CardTitle>
            <CardDescription>Enter your project specifications for an accurate estimate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service">Service Type</Label>
              <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trim-carpentry">Trim Carpentry</SelectItem>
                  <SelectItem value="remodeling">Complete Remodeling</SelectItem>
                  <SelectItem value="decking">Custom Decking</SelectItem>
                  <SelectItem value="post-frame">Post Frame Building</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sqft">Square Footage</Label>
              <Input
                id="sqft"
                type="number"
                value={formData.squareFootage || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    squareFootage: Number.parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Enter square footage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Material Grade</Label>
              <Select
                value={formData.materialGrade}
                onValueChange={(value) => setFormData({ ...formData, materialGrade: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget (Basic materials)</SelectItem>
                  <SelectItem value="standard">Standard (Quality materials)</SelectItem>
                  <SelectItem value="premium">Premium (High-end materials)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.service && formData.service !== "remodeling" && (
              <div className="space-y-2">
                <Label htmlFor="hours">Estimated Labor Hours (Optional)</Label>
                <Input
                  id="hours"
                  type="number"
                  value={formData.laborHours || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      laborHours: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Leave blank for auto-calculation"
                />
              </div>
            )}

            <Button
              onClick={calculateEstimate}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!formData.service || !formData.squareFootage}
            >
              Calculate Estimate
            </Button>
          </CardContent>
        </Card>

        {/* Estimate Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Cost Estimate</span>
            </CardTitle>
            <CardDescription>Based on current Oklahoma market rates</CardDescription>
          </CardHeader>
          <CardContent>
            {estimate ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">{estimate.service}</h3>
                  <div className="text-3xl font-bold text-blue-600">${estimate.total.toLocaleString()}</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Range: ${estimate.priceRange.low.toLocaleString()} - ${estimate.priceRange.high.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Materials</span>
                    <span className="font-semibold">${estimate.materialCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Labor</span>
                    <span className="font-semibold">${estimate.laborCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Markup & Overhead</span>
                    <span className="font-semibold">${estimate.markup.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 font-bold text-lg">
                    <span>Total Estimate</span>
                    <span>${estimate.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This is a preliminary estimate based on average rates. Final pricing requires
                    an in-person consultation to assess specific project requirements.
                  </p>
                </div>

                <Button className="w-full bg-transparent" variant="outline">
                  Schedule Free Consultation
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter project details to see your estimate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Oklahoma Market Pricing Guide</CardTitle>
          <CardDescription>Our pricing is based on current Oklahoma construction market rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(serviceRates).map(([key, service]) => (
              <div key={key} className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">{service.name}</h4>
                <div className="space-y-1 text-sm">
                  {service.laborRate && (
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        Labor
                      </Badge>
                      <span className="ml-2">
                        ${service.laborRate.min}-${service.laborRate.max}/hr
                      </span>
                    </div>
                  )}
                  {service.materialRate && (
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        Materials
                      </Badge>
                      <span className="ml-2">
                        ${service.materialRate.min}-${service.materialRate.max}/sq.ft
                      </span>
                    </div>
                  )}
                  {service.totalRate && (
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        Total
                      </Badge>
                      <span className="ml-2">
                        ${service.totalRate.min}-${service.totalRate.max}/sq.ft
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
