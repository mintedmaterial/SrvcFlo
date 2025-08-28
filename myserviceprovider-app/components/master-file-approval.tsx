"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Clock, Eye, Download, FileText, Receipt, Database } from "lucide-react"

export function MasterFileApproval() {
  const [pendingFiles, setPendingFiles] = useState([
    {
      id: "1",
      businessId: "biz_001",
      businessName: "Southeast Remodeling",
      fileName: "december_receipts.csv",
      fileType: "receipt",
      uploadDate: "2025-01-04",
      status: "pending_approval",
      description: "Monthly receipts for materials and labor costs",
      size: "2.3 MB",
      uploadedBy: "john@southeastremodeling.com",
      filePreview: "Material costs: $15,420, Labor: $8,900, Equipment: $2,100...",
    },
    {
      id: "2",
      businessId: "biz_002",
      businessName: "Bella's Beauty Salon",
      fileName: "service_pricing_update.csv",
      fileType: "csv",
      uploadDate: "2025-01-04",
      status: "pending_approval",
      description: "Updated pricing for hair services and packages",
      size: "856 KB",
      uploadedBy: "sarah@bellasbeauty.com",
      filePreview: "Hair Cut: $45, Color: $85, Highlights: $120, Package Deal: $150...",
    },
    {
      id: "3",
      businessId: "biz_001",
      businessName: "Southeast Remodeling",
      fileName: "customer_feedback.pdf",
      fileType: "document",
      uploadDate: "2025-01-03",
      status: "pending_approval",
      description: "Customer testimonials and feedback for AI training",
      size: "1.2 MB",
      uploadedBy: "john@southeastremodeling.com",
      filePreview: "Customer reviews, satisfaction scores, common questions...",
    },
  ])

  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [reviewNotes, setReviewNotes] = useState("")

  const handleApproval = async (fileId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch("/api/files/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          action,
          reviewNotes,
          reviewedBy: "master_admin",
        }),
      })

      if (response.ok) {
        // Update local state
        setPendingFiles((files) =>
          files.map((file) =>
            file.id === fileId ? { ...file, status: action === "approve" ? "approved" : "rejected" } : file,
          ),
        )
        setSelectedFile(null)
        setReviewNotes("")
      }
    } catch (error) {
      console.error("Error processing file review:", error)
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "receipt":
        return <Receipt className="h-5 w-5 text-green-600" />
      case "csv":
        return <Database className="h-5 w-5 text-blue-600" />
      case "document":
        return <FileText className="h-5 w-5 text-purple-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>File Approval Queue</span>
          </CardTitle>
          <CardDescription>Review and approve business file uploads before AI integration</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* File List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Pending Approvals ({pendingFiles.filter((f) => f.status === "pending_approval").length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingFiles
                  .filter((file) => file.status === "pending_approval")
                  .map((file) => (
                    <div
                      key={file.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedFile?.id === file.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getFileIcon(file.fileType)}
                          <div>
                            <h4 className="font-medium">{file.fileName}</h4>
                            <p className="text-sm text-gray-600 mb-1">{file.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>
                                <strong>Business:</strong> {file.businessName}
                              </span>
                              <span>
                                <strong>Size:</strong> {file.size}
                              </span>
                              <span>
                                <strong>Uploaded:</strong> {file.uploadDate}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              <strong>By:</strong> {file.uploadedBy}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                      </div>
                    </div>
                  ))}

                {pendingFiles.filter((f) => f.status === "pending_approval").length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Files Reviewed</h3>
                    <p className="text-gray-600">No files pending approval at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Review Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>File Review</CardTitle>
              <CardDescription>
                {selectedFile ? "Review file details and approve/reject" : "Select a file to review"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFile ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{selectedFile.fileName}</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Business:</strong> {selectedFile.businessName}
                      </div>
                      <div>
                        <strong>Type:</strong> {selectedFile.fileType}
                      </div>
                      <div>
                        <strong>Size:</strong> {selectedFile.size}
                      </div>
                      <div>
                        <strong>Uploaded by:</strong> {selectedFile.uploadedBy}
                      </div>
                      <div>
                        <strong>Date:</strong> {selectedFile.uploadDate}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Description:</h5>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedFile.description}</p>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">File Preview:</h5>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedFile.filePreview}</p>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View Full
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Review Notes:</h5>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about the approval/rejection..."
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproval(selectedFile.id, "approve")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Integrate
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleApproval(selectedFile.id, "reject")}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Review Guidelines:</strong> Ensure data accuracy, check for sensitive information, and
                      verify the file will improve AI agent performance before approving.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a file from the list to review</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
