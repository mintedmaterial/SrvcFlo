"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, ImageIcon, FileSpreadsheet, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface FileUpload {
  id: string
  fileName: string
  fileType: string
  category: string
  description: string
  uploadDate: string
  status: "pending" | "approved" | "rejected"
  feedback?: string
  businessId: string
}

export function BusinessFileUpload() {
  const [files, setFiles] = useState<FileUpload[]>([
    {
      id: "file_1",
      fileName: "pricing_data_2024.csv",
      fileType: "csv",
      category: "pricing",
      description: "Updated pricing structure for remodeling services",
      uploadDate: "2025-01-04",
      status: "pending",
      businessId: "biz_1",
    },
    {
      id: "file_2",
      fileName: "customer_receipts_dec.pdf",
      fileType: "pdf",
      category: "receipts",
      description: "December customer receipts and invoices",
      uploadDate: "2025-01-03",
      status: "approved",
      feedback: "All receipts verified and processed successfully.",
      businessId: "biz_1",
    },
    {
      id: "file_3",
      fileName: "service_catalog.docx",
      fileType: "docx",
      category: "documentation",
      description: "Updated service catalog with new offerings",
      uploadDate: "2025-01-02",
      status: "rejected",
      feedback: "Please include pricing information for all services listed.",
      businessId: "biz_1",
    },
  ])

  const [isUploading, setIsUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    category: "",
    description: "",
    file: null as File | null,
  })

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.file || !uploadForm.category || !uploadForm.description) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", uploadForm.file)
      formData.append("category", uploadForm.category)
      formData.append("description", uploadForm.description)
      formData.append("businessId", "biz_1") // Get from auth context

      const response = await fetch("/api/files/upload-for-approval", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()

        // Add to local state
        const newFile: FileUpload = {
          id: result.fileId,
          fileName: uploadForm.file.name,
          fileType: uploadForm.file.name.split(".").pop() || "unknown",
          category: uploadForm.category,
          description: uploadForm.description,
          uploadDate: new Date().toISOString().split("T")[0],
          status: "pending",
          businessId: "biz_1",
        }

        setFiles((prev) => [newFile, ...prev])

        // Reset form
        setUploadForm({
          category: "",
          description: "",
          file: null,
        })

        // Reset file input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      }
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        )
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "csv":
      case "xlsx":
      case "xls":
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon className="h-5 w-5 text-blue-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Files for Review</span>
          </CardTitle>
          <CardDescription>
            Upload business documents, receipts, and data files. All uploads require Master Admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>File Category</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(value) => setUploadForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pricing">Pricing Data</SelectItem>
                    <SelectItem value="receipts">Receipts & Invoices</SelectItem>
                    <SelectItem value="customer_data">Customer Data</SelectItem>
                    <SelectItem value="documentation">Business Documentation</SelectItem>
                    <SelectItem value="marketing">Marketing Materials</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setUploadForm((prev) => ({ ...prev, file }))
                  }}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the file contents and purpose..."
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={!uploadForm.file || !uploadForm.category || !uploadForm.description || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </form>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">File Upload Guidelines:</p>
                <ul className="space-y-1 text-xs">
                  <li>• All files are held for Master Admin approval before processing</li>
                  <li>• Supported formats: CSV, Excel, PDF, Word, Images</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Provide clear descriptions for faster approval</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File History */}
      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
          <CardDescription>Track the status of your uploaded files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files.map((file) => (
              <Card key={file.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.fileType)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{file.fileName}</h4>
                          {getStatusBadge(file.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                          <span>Category: {file.category}</span>
                          <span>Uploaded: {file.uploadDate}</span>
                          <span>Type: {file.fileType.toUpperCase()}</span>
                        </div>
                        {file.feedback && (
                          <div
                            className={`mt-2 p-2 rounded text-xs ${
                              file.status === "approved" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                            }`}
                          >
                            <strong>Feedback:</strong> {file.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {files.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Upload className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Files Uploaded</h3>
                <p>Upload your first file to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
