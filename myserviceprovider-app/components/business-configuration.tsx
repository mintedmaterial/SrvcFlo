"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Settings, Clock, DollarSign, Database, FileText } from "lucide-react"

interface BusinessConfigProps {
  businessId: string
}

export function BusinessConfiguration({ businessId }: BusinessConfigProps) {
  const [businessData, setBusinessData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch business configuration
    fetchBusinessData()
  }, [businessId])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}`)
      const result = await response.json()
      if (result.success) {
        setBusinessData(result.business)
      }
    } catch (error) {
      console.error("Error fetching business data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File, fileType: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("businessId", businessId)
    formData.append("fileType", fileType)

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        alert("File uploaded successfully!")
        // Refresh business data or update UI
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Error uploading file")
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading business configuration...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Business Configuration</span>
          </CardTitle>
          <CardDescription>Customize your AI agents and business settings for optimal performance</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="hours">Hours & Services</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Logic</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="files">File Management</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessData?.businessName || ""}
                    onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input id="businessType" value={businessData?.businessType || ""} readOnly className="bg-gray-50" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessData?.email || ""}
                    onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Business Phone</Label>
                  <Input
                    id="phone"
                    value={businessData?.phone || ""}
                    onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  value={businessData?.address || ""}
                  onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={businessData?.website || ""}
                  onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
                />
              </div>

              <Button className="w-full">Save Business Information</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Business Hours & Services</span>
              </CardTitle>
              <CardDescription>Configure your operating hours and service offerings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Hours */}
              <div>
                <h3 className="font-semibold mb-4">Operating Hours</h3>
                <div className="space-y-3">
                  {Object.entries(businessData?.hours || {}).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-20 capitalize">{day}</div>
                      <Switch
                        checked={!hours.closed}
                        onCheckedChange={(checked) => {
                          const newHours = { ...businessData.hours }
                          newHours[day].closed = !checked
                          setBusinessData({ ...businessData, hours: newHours })
                        }}
                      />
                      {!hours.closed && (
                        <>
                          <Input
                            type="time"
                            value={hours.open}
                            className="w-32"
                            onChange={(e) => {
                              const newHours = { ...businessData.hours }
                              newHours[day].open = e.target.value
                              setBusinessData({ ...businessData, hours: newHours })
                            }}
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={hours.close}
                            className="w-32"
                            onChange={(e) => {
                              const newHours = { ...businessData.hours }
                              newHours[day].close = e.target.value
                              setBusinessData({ ...businessData, hours: newHours })
                            }}
                          />
                        </>
                      )}
                      {hours.closed && <span className="text-gray-500">Closed</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="font-semibold mb-4">Services Offered</h3>
                <Textarea
                  placeholder="Enter your services, one per line..."
                  value={businessData?.services?.join("\n") || ""}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, services: e.target.value.split("\n").filter((s) => s.trim()) })
                  }
                  rows={6}
                />
              </div>

              <Button className="w-full">Save Hours & Services</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Pricing Logic</span>
              </CardTitle>
              <CardDescription>Configure how your AI calculates estimates and pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Current Package</h3>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-600 text-white capitalize">{businessData?.packageType} Package</Badge>
                  <span className="text-blue-700">${businessData?.packagePrice}/month</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Pricing Rules</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Define how your AI should calculate estimates for different services
                </p>

                {/* Pricing rules would be dynamically generated based on business type */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Default Service Pricing</h4>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Material + Labor + Markup = Total</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                  Add New Pricing Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Agent Configuration</CardTitle>
              <CardDescription>Customize your AI agents' capabilities and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Chatbot Agent</h4>
                      <p className="text-sm text-gray-600">Website chat support</p>
                    </div>
                    <Switch checked={businessData?.agentSettings?.chatbotEnabled} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Phone AI Agent</h4>
                      <p className="text-sm text-gray-600">Handle incoming calls</p>
                    </div>
                    <Switch
                      checked={businessData?.agentSettings?.phoneAgentEnabled}
                      disabled={businessData?.packageType === "basic"}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Social Media Automation</h4>
                      <p className="text-sm text-gray-600">Auto-post content</p>
                    </div>
                    <Switch
                      checked={businessData?.agentSettings?.socialMediaEnabled}
                      disabled={businessData?.packageType === "basic"}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Video Content Generation</h4>
                      <p className="text-sm text-gray-600">Create marketing videos</p>
                    </div>
                    <Switch
                      checked={businessData?.agentSettings?.videoContentEnabled}
                      disabled={businessData?.packageType !== "premier"}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Custom AI Prompts</h4>
                    <Textarea placeholder="Add custom instructions for your AI agents..." rows={8} />
                  </div>
                </div>
              </div>

              <Button className="w-full">Save AI Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>File Management</span>
              </CardTitle>
              <CardDescription>Upload documents, receipts, and data files to train your AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Business Documents</CardTitle>
                    <CardDescription>Contracts, policies, procedures</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Drop files here or click to upload</p>
                      <Button variant="outline" size="sm">
                        Choose Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Data</CardTitle>
                    <CardDescription>Receipts, invoices, pricing data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload CSV, PDF, or image files</p>
                      <Button variant="outline" size="sm">
                        Choose Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Data</CardTitle>
                    <CardDescription>Import existing customer information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">CSV files with customer data</p>
                      <Button variant="outline" size="sm">
                        Import CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Training Materials</CardTitle>
                    <CardDescription>FAQs, scripts, knowledge base</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Documents to train your AI</p>
                      <Button variant="outline" size="sm">
                        Upload Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 Pro Tip</h4>
                <p className="text-sm text-yellow-700">
                  The more quality data you provide, the better your AI agents will perform. Upload your existing
                  business documents, customer interactions, and pricing information to get the most accurate results.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
