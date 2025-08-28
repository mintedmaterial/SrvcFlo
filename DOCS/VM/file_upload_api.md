# File Upload API Quickstart

> Get started with the File Upload API in minutes, supporting multiple upload methods

## Welcome to File Upload API

The File Upload API provides flexible and efficient file upload services, supporting multiple upload methods to meet diverse business needs. Whether it's remote file migration, large file transmission, or quick small file uploads, our API offers the best solutions for your requirements.

<CardGroup cols={3}>
  <Card title="Base64 Upload" icon="code" href="/file-upload-api/upload-file-base-64">
    Base64 encoded file upload, suitable for small files
  </Card>

  <Card title="File Stream Upload" icon="upload" href="/file-upload-api/upload-file-stream">
    Efficient binary file stream upload, ideal for large files
  </Card>

  <Card title="URL File Upload" icon="link" href="/file-upload-api/upload-file-url">
    Automatically download and upload files from remote URLs
  </Card>
</CardGroup>

<Warning>
  **Important Notice**: Uploaded files are temporary and will be **automatically deleted after 3 days**. Please download or migrate important files promptly.
</Warning>

## Authentication

All API requests require authentication using Bearer tokens. Please obtain your API key from the [API Key Management Page](https://kie.ai/api-key).

<Warning>
  Please keep your API key secure and never share it publicly. If you suspect your key has been compromised, reset it immediately.
</Warning>

### API Base URL

```
https://kieai.redpandaai.co
```

### Authentication Header

```http
Authorization: Bearer YOUR_API_KEY
```

## Quick Start Guide

### Step 1: Choose Your Upload Method

Select the appropriate upload method based on your needs:

<Tabs>
  <Tab title="URL File Upload">
    Suitable for downloading and uploading files from remote servers:

    <CodeGroup>
      ```bash cURL
      curl -X POST "https://kieai.redpandaai.co/api/file-url-upload" \
        -H "Authorization: Bearer YOUR_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "fileUrl": "https://example.com/sample-image.jpg",
          "uploadPath": "images",
          "fileName": "my-image.jpg"
        }'
      ```

      ```javascript JavaScript
      const response = await fetch('https://kieai.redpandaai.co/api/file-url-upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileUrl: 'https://example.com/sample-image.jpg',
          uploadPath: 'images',
          fileName: 'my-image.jpg'
        })
      });

      const result = await response.json();
      console.log('Upload successful:', result);
      ```

      ```python Python
      import requests

      url = "https://kieai.redpandaai.co/api/file-url-upload"
      headers = {
          "Authorization": "Bearer YOUR_API_KEY",
          "Content-Type": "application/json"
      }

      payload = {
          "fileUrl": "https://example.com/sample-image.jpg",
          "uploadPath": "images",
          "fileName": "my-image.jpg"
      }

      response = requests.post(url, json=payload, headers=headers)
      result = response.json()

      print(f"Upload successful: {result}")
      ```
    </CodeGroup>
  </Tab>

  <Tab title="File Stream Upload">
    Suitable for directly uploading local files, especially large files:

    <CodeGroup>
      ```bash cURL
      curl -X POST "https://kieai.redpandaai.co/api/file-stream-upload" \
        -H "Authorization: Bearer YOUR_API_KEY" \
        -F "file=@/path/to/your-file.jpg" \
        -F "uploadPath=images/user-uploads" \
        -F "fileName=custom-name.jpg"
      ```

      ```javascript JavaScript
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('uploadPath', 'images/user-uploads');
      formData.append('fileName', 'custom-name.jpg');

      const response = await fetch('https://kieai.redpandaai.co/api/file-stream-upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: formData
      });

      const result = await response.json();
      console.log('Upload successful:', result);
      ```

      ```python Python
      import requests

      url = "https://kieai.redpandaai.co/api/file-stream-upload"
      headers = {
          "Authorization": "Bearer YOUR_API_KEY"
      }

      files = {
          'file': ('your-file.jpg', open('/path/to/your-file.jpg', 'rb')),
          'uploadPath': (None, 'images/user-uploads'),
          'fileName': (None, 'custom-name.jpg')
      }

      response = requests.post(url, headers=headers, files=files)
      result = response.json()

      print(f"Upload successful: {result}")
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Base64 Upload">
    Suitable for Base64 encoded file data:

    <CodeGroup>
      ```bash cURL
      curl -X POST "https://kieai.redpandaai.co/api/file-base64-upload" \
        -H "Authorization: Bearer YOUR_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "base64Data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
          "uploadPath": "images",
          "fileName": "base64-image.png"
        }'
      ```

      ```javascript JavaScript
      const response = await fetch('https://kieai.redpandaai.co/api/file-base64-upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base64Data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          uploadPath: 'images',
          fileName: 'base64-image.png'
        })
      });

      const result = await response.json();
      console.log('Upload successful:', result);
      ```

      ```python Python
      import requests
      import base64

      # Read file and convert to base64
      with open('/path/to/your-file.jpg', 'rb') as f:
          file_data = base64.b64encode(f.read()).decode('utf-8')
          base64_data = f'data:image/jpeg;base64,{file_data}'

      url = "https://kieai.redpandaai.co/api/file-base64-upload"
      headers = {
          "Authorization": "Bearer YOUR_API_KEY",
          "Content-Type": "application/json"
      }

      payload = {
          "base64Data": base64_data,
          "uploadPath": "images",
          "fileName": "base64-image.jpg"
      }

      response = requests.post(url, json=payload, headers=headers)
      result = response.json()

      print(f"Upload successful: {result}")
      ```
    </CodeGroup>
  </Tab>
</Tabs>

### Step 2: Handle Response

Upon successful upload, you'll receive a response containing file information:

```json
{
  "success": true,
  "code": 200,
  "msg": "File uploaded successfully",
  "data": {
    "fileId": "file_abc123456",
    "fileName": "my-image.jpg",
    "originalName": "sample-image.jpg",
    "fileSize": 245760,
    "mimeType": "image/jpeg",
    "uploadPath": "images",
    "fileUrl": "https://kieai.redpandaai.co/files/images/my-image.jpg",
    "downloadUrl": "https://kieai.redpandaai.co/download/file_abc123456",
    "uploadTime": "2025-01-15T10:30:00Z",
    "expiresAt": "2025-01-18T10:30:00Z"
  }
}
```

## Upload Method Comparison

Choose the most suitable upload method for your needs:

<CardGroup cols={3}>
  <Card title="URL File Upload" icon="link">
    **Best for**: File migration, batch processing

    **Advantages**:

    * No local file required
    * Automatic download handling
    * Supports remote resources

    **Limitations**:

    * Requires publicly accessible URL
    * 30-second download timeout
    * Recommended ≤100MB
  </Card>

  <Card title="File Stream Upload" icon="upload">
    **Best for**: Large files, local files

    **Advantages**:

    * High transmission efficiency
    * Supports large files
    * Binary transmission

    **Limitations**:

    * Requires local file
    * Server processing time
  </Card>

  <Card title="Base64 Upload" icon="code">
    **Best for**: Small files, API integration

    **Advantages**:

    * JSON format transmission
    * Easy integration
    * Supports Data URL

    **Limitations**:

    * Data size increases by 33%
    * Not suitable for large files
    * Recommended ≤10MB
  </Card>
</CardGroup>

## Practical Examples

### Batch File Upload

Using file stream upload to handle multiple files:

<Tabs>
  <Tab title="JavaScript">
    ```javascript
    class FileUploadAPI {
      constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://kieai.redpandaai.co';
      }
      
      async uploadFile(file, uploadPath = '', fileName = null) {
        const formData = new FormData();
        formData.append('file', file);
        if (uploadPath) formData.append('uploadPath', uploadPath);
        if (fileName) formData.append('fileName', fileName);
        
        const response = await fetch(`${this.baseUrl}/api/file-stream-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        return response.json();
      }
      
      async uploadFromUrl(fileUrl, uploadPath = '', fileName = null) {
        const response = await fetch(`${this.baseUrl}/api/file-url-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileUrl,
            uploadPath,
            fileName
          })
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        return response.json();
      }
      
      async uploadBase64(base64Data, uploadPath = '', fileName = null) {
        const response = await fetch(`${this.baseUrl}/api/file-base64-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            base64Data,
            uploadPath,
            fileName
          })
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        return response.json();
      }
    }

    // Usage example
    const uploader = new FileUploadAPI('YOUR_API_KEY');

    // Batch upload files
    async function uploadMultipleFiles(files) {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        try {
          const result = await uploader.uploadFile(
            files[i], 
            'user-uploads', 
            `file-${i + 1}-${files[i].name}`
          );
          results.push(result);
          console.log(`File ${i + 1} uploaded successfully:`, result.data.fileUrl);
        } catch (error) {
          console.error(`File ${i + 1} upload failed:`, error.message);
        }
      }
      
      return results;
    }

    // Batch upload from URLs
    async function uploadFromUrls(urls) {
      const results = [];
      
      for (let i = 0; i < urls.length; i++) {
        try {
          const result = await uploader.uploadFromUrl(
            urls[i], 
            'downloads', 
            `download-${i + 1}.jpg`
          );
          results.push(result);
          console.log(`URL ${i + 1} uploaded successfully:`, result.data.fileUrl);
        } catch (error) {
          console.error(`URL ${i + 1} upload failed:`, error.message);
        }
      }
      
      return results;
    }
    ```
  </Tab>

  <Tab title="Python">
    ```python
    import requests
    import base64
    import os
    from typing import List, Optional

    class FileUploadAPI:
        def __init__(self, api_key: str):
            self.api_key = api_key
            self.base_url = 'https://kieai.redpandaai.co'
            self.headers = {
                'Authorization': f'Bearer {api_key}'
            }
        
        def upload_file(self, file_path: str, upload_path: str = '', 
                       file_name: Optional[str] = None) -> dict:
            """File stream upload"""
            files = {
                'file': (os.path.basename(file_path), open(file_path, 'rb'))
            }
            
            data = {}
            if upload_path:
                data['uploadPath'] = upload_path
            if file_name:
                data['fileName'] = file_name
            
            response = requests.post(
                f'{self.base_url}/api/file-stream-upload',
                headers=self.headers,
                files=files,
                data=data
            )
            
            if not response.ok:
                raise Exception(f'Upload failed: {response.text}')
            
            return response.json()
        
        def upload_from_url(self, file_url: str, upload_path: str = '', 
                           file_name: Optional[str] = None) -> dict:
            """URL file upload"""
            payload = {
                'fileUrl': file_url,
                'uploadPath': upload_path,
                'fileName': file_name
            }
            
            response = requests.post(
                f'{self.base_url}/api/file-url-upload',
                headers={**self.headers, 'Content-Type': 'application/json'},
                json=payload
            )
            
            if not response.ok:
                raise Exception(f'Upload failed: {response.text}')
            
            return response.json()
        
        def upload_base64(self, base64_data: str, upload_path: str = '', 
                         file_name: Optional[str] = None) -> dict:
            """Base64 file upload"""
            payload = {
                'base64Data': base64_data,
                'uploadPath': upload_path,
                'fileName': file_name
            }
            
            response = requests.post(
                f'{self.base_url}/api/file-base64-upload',
                headers={**self.headers, 'Content-Type': 'application/json'},
                json=payload
            )
            
            if not response.ok:
                raise Exception(f'Upload failed: {response.text}')
            
            return response.json()

    # Usage example
    def main():
        uploader = FileUploadAPI('YOUR_API_KEY')
        
        # Batch upload local files
        file_paths = [
            '/path/to/file1.jpg',
            '/path/to/file2.png',
            '/path/to/document.pdf'
        ]
        
        print("Starting batch file upload...")
        for i, file_path in enumerate(file_paths):
            try:
                result = uploader.upload_file(
                    file_path, 
                    'user-uploads', 
                    f'file-{i + 1}-{os.path.basename(file_path)}'
                )
                print(f"File {i + 1} uploaded successfully: {result['data']['fileUrl']}")
            except Exception as e:
                print(f"File {i + 1} upload failed: {e}")
        
        # Batch upload from URLs
        urls = [
            'https://example.com/image1.jpg',
            'https://example.com/image2.png'
        ]
        
        print("\nStarting batch URL upload...")
        for i, url in enumerate(urls):
            try:
                result = uploader.upload_from_url(
                    url, 
                    'downloads', 
                    f'download-{i + 1}.jpg'
                )
                print(f"URL {i + 1} uploaded successfully: {result['data']['fileUrl']}")
            except Exception as e:
                print(f"URL {i + 1} upload failed: {e}")

    if __name__ == '__main__':
        main()
    ```
  </Tab>
</Tabs>

## Error Handling

Common errors and handling methods:

<AccordionGroup>
  <Accordion title="401 Unauthorized">
    ```javascript
    // Check if API key is correct
    if (response.status === 401) {
      console.error('Invalid API key, please check Authorization header');
      // Retrieve or update API key
    }
    ```
  </Accordion>

  <Accordion title="400 Bad Request">
    ```javascript
    // Check request parameters
    if (response.status === 400) {
      const error = await response.json();
      console.error('Request parameter error:', error.msg);
      // Check if required parameters are provided
      // Check if file format is supported
      // Check if URL is accessible
    }
    ```
  </Accordion>

  <Accordion title="500 Server Error">
    ```javascript
    // Implement retry mechanism
    async function uploadWithRetry(uploadFunction, maxRetries = 3) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await uploadFunction();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          
          // Exponential backoff
          const delay = Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## Best Practices

<AccordionGroup>
  <Accordion title="File Size Optimization">
    * **Small files** (≤1MB): Recommended to use Base64 upload
    * **Medium files** (1MB-10MB): Recommended to use file stream upload
    * **Large files** (>10MB): Must use file stream upload
    * **Remote files**: Use URL upload, note 100MB limit
  </Accordion>

  <Accordion title="Performance Optimization">
    * Implement concurrency control to avoid uploading too many files simultaneously
    * Consider chunked upload strategies for large files
    * Use appropriate retry mechanisms to handle network issues
    * Monitor upload progress and provide user feedback
  </Accordion>

  <Accordion title="Security Considerations">
    * Keep API keys secure and rotate them regularly
    * Validate file types and sizes
    * Consider encrypted transmission for sensitive files
    * Download important files promptly to avoid 3-day deletion
  </Accordion>

  <Accordion title="Error Handling">
    * Implement comprehensive error handling logic
    * Log uploads for troubleshooting
    * Provide user-friendly error messages
    * Offer retry options for failed uploads
  </Accordion>
</AccordionGroup>

## File Storage Information

<Warning>
  **Important Notice**: All uploaded files are temporary and will be **automatically deleted after 3 days**.
</Warning>

* Files are immediately accessible and downloadable after upload
* File URLs remain valid for 3 days
* The system provides an `expiresAt` field in the response indicating expiration time
* It's recommended to download or migrate important files before expiration
* Use the `downloadUrl` field to get direct download links

## Status Codes

<ResponseField name="200" type="Success">
  Request processed successfully, file upload completed
</ResponseField>

<ResponseField name="400" type="Bad Request">
  Request parameters are incorrect or missing required parameters
</ResponseField>

<ResponseField name="401" type="Unauthorized">
  Authentication credentials are missing or invalid
</ResponseField>

<ResponseField name="405" type="Method Not Allowed">
  Request method is not supported, please check HTTP method
</ResponseField>

<ResponseField name="500" type="Server Error">
  An unexpected error occurred while processing the request, please retry or contact support
</ResponseField>

## Next Steps

<CardGroup cols={3}>
  <Card title="URL File Upload" icon="link" href="/file-upload-api/upload-file-url">
    Learn how to upload files from remote URLs
  </Card>

  <Card title="File Stream Upload" icon="upload" href="/file-upload-api/upload-file-stream">
    Master efficient file stream upload methods
  </Card>

  <Card title="Base64 Upload" icon="code" href="/file-upload-api/upload-file-base-64">
    Understand Base64 encoded file uploads
  </Card>
</CardGroup>

## Support

<Info>
  Need help? Our technical support team is here to assist you.

  * **Email**: [support@kie.ai](mailto:support@kie.ai)
  * **Documentation**: [docs.kie.ai](https://docs.kie.ai)
  * **API Status**: Check our status page for real-time API health
</Info>

***

Ready to start uploading files? [Get your API key](https://kie.ai/api-key) and begin using the file upload service immediately!



# Base64 File Upload

> Upload temporary files via Base64 encoded data. Note: Uploaded files are temporary and automatically deleted after 3 days.

## OpenAPI

````yaml file-upload-api/file-upload-api.json post /api/file-base64-upload
paths:
  path: /api/file-base64-upload
  method: post
  servers:
    - url: https://kieai.redpandaai.co
      description: API Server
  request:
    security:
      - title: BearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                All APIs require authentication via Bearer Token.


                Get API Key:

                1. Visit [API Key Management Page](https://kie.ai/api-key) to
                get your API Key


                Usage:

                Add to request header:

                Authorization: Bearer YOUR_API_KEY
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              base64Data:
                allOf:
                  - type: string
                    description: >-
                      Base64 encoded file data. Supports pure Base64 strings or
                      data URL format
                    example: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
              uploadPath:
                allOf:
                  - type: string
                    description: File upload path, without leading or trailing slashes
                    example: images/base64
              fileName:
                allOf:
                  - type: string
                    description: File name (optional), including file extension
                    example: my-image.png
            required: true
            refIdentifier: '#/components/schemas/Base64UploadRequest'
            requiredProperties:
              - base64Data
              - uploadPath
        examples:
          with_data_url:
            summary: Using data URL format
            value:
              base64Data: >-
                data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==
              uploadPath: images/base64
              fileName: test-image.png
          with_pure_base64:
            summary: Using pure Base64 string
            value:
              base64Data: >-
                iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==
              uploadPath: documents/uploads
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - type: boolean
                    description: Whether the request was successful
              code:
                allOf:
                  - type: integer
                    enum:
                      - 200
                      - 400
                      - 401
                      - 405
                      - 500
                    description: >-
                      Response Status Code


                      | Code | Description |

                      |------|-------------|

                      | 200 | Success - Request has been processed successfully
                      |

                      | 400 | Bad Request - Request parameters are incorrect or
                      missing required parameters |

                      | 401 | Unauthorized - Authentication credentials are
                      missing or invalid |

                      | 405 | Method Not Allowed - Request method is not
                      supported |

                      | 500 | Server Error - An unexpected error occurred while
                      processing the request |
              msg:
                allOf:
                  - type: string
                    description: Response message
                    example: File uploaded successfully
              data:
                allOf:
                  - $ref: '#/components/schemas/FileUploadResult'
            requiredProperties:
              - success
              - code
              - msg
              - data
        examples:
          example:
            value:
              success: true
              code: 200
              msg: File uploaded successfully
              data:
                fileName: uploaded-image.png
                filePath: images/user-uploads/uploaded-image.png
                downloadUrl: >-
                  https://tempfile.redpandaai.co/xxx/images/user-uploads/uploaded-image.png
                fileSize: 154832
                mimeType: image/png
                uploadedAt: '2025-01-01T12:00:00.000Z'
        description: File uploaded successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - &ref_0
                    type: boolean
                    description: Whether the request was successful
              code:
                allOf:
                  - &ref_1
                    $ref: '#/components/schemas/StatusCode'
              msg:
                allOf:
                  - &ref_2
                    type: string
                    description: Response message
                    example: File uploaded successfully
            refIdentifier: '#/components/schemas/ApiResponse'
            requiredProperties: &ref_3
              - success
              - code
              - msg
        examples:
          missing_parameter:
            summary: Missing required parameter
            value:
              success: false
              code: 400
              msg: 'Missing required parameter: uploadPath'
          invalid_format:
            summary: Format error
            value:
              success: false
              code: 400
              msg: 'Base64 decoding failed: Invalid Base64 format'
        description: Request parameter error
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - *ref_0
              code:
                allOf:
                  - *ref_1
              msg:
                allOf:
                  - *ref_2
            refIdentifier: '#/components/schemas/ApiResponse'
            requiredProperties: *ref_3
        examples:
          example:
            value:
              success: false
              code: 401
              msg: 'Authentication failed: Invalid API Key'
        description: Unauthorized access
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - *ref_0
              code:
                allOf:
                  - *ref_1
              msg:
                allOf:
                  - *ref_2
            refIdentifier: '#/components/schemas/ApiResponse'
            requiredProperties: *ref_3
        examples:
          example:
            value:
              success: false
              code: 500
              msg: Internal server error
        description: Internal server error
  deprecated: false
  type: path
components:
  schemas:
    StatusCode:
      type: integer
      enum:
        - 200
        - 400
        - 401
        - 405
        - 500
      description: >-
        Response Status Code


        | Code | Description |

        |------|-------------|

        | 200 | Success - Request has been processed successfully |

        | 400 | Bad Request - Request parameters are incorrect or missing
        required parameters |

        | 401 | Unauthorized - Authentication credentials are missing or invalid
        |

        | 405 | Method Not Allowed - Request method is not supported |

        | 500 | Server Error - An unexpected error occurred while processing the
        request |
    FileUploadResult:
      type: object
      properties:
        fileName:
          type: string
          description: File name
          example: uploaded-image.png
        filePath:
          type: string
          description: Complete file path in storage
          example: images/user-uploads/uploaded-image.png
        downloadUrl:
          type: string
          format: uri
          description: File download URL
          example: >-
            https://tempfile.redpandaai.co/xxx/images/user-uploads/uploaded-image.png
        fileSize:
          type: integer
          description: File size in bytes
          example: 154832
        mimeType:
          type: string
          description: File MIME type
          example: image/png
        uploadedAt:
          type: string
          format: date-time
          description: Upload timestamp
          example: '2025-01-01T12:00:00.000Z'
      required:
        - fileName
        - filePath
        - downloadUrl
        - fileSize
        - mimeType
        - uploadedAt

````



# File Stream Upload

## OpenAPI

````yaml file-upload-api/file-upload-api.json post /api/file-stream-upload
paths:
  path: /api/file-stream-upload
  method: post
  servers:
    - url: https://kieai.redpandaai.co
      description: API Server
  request:
    security:
      - title: BearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                All APIs require authentication via Bearer Token.


                Get API Key:

                1. Visit [API Key Management Page](https://kie.ai/api-key) to
                get your API Key


                Usage:

                Add to request header:

                Authorization: Bearer YOUR_API_KEY
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      multipart/form-data:
        schemaArray:
          - type: object
            properties:
              file:
                allOf:
                  - type: string
                    format: binary
                    description: File to upload (binary data)
              uploadPath:
                allOf:
                  - type: string
                    description: File upload path, without leading or trailing slashes
                    example: images/user-uploads
              fileName:
                allOf:
                  - type: string
                    description: File name (optional), including file extension
                    example: my-image.jpg
            required: true
            requiredProperties:
              - file
              - uploadPath
        examples:
          example:
            value:
              uploadPath: images/user-uploads
              fileName: my-image.jpg
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - type: boolean
                    description: Whether the request was successful
              code:
                allOf:
                  - type: integer
                    enum:
                      - 200
                      - 400
                      - 401
                      - 405
                      - 500
                    description: >-
                      Response Status Code


                      | Code | Description |

                      |------|-------------|

                      | 200 | Success - Request has been processed successfully
                      |

                      | 400 | Bad Request - Request parameters are incorrect or
                      missing required parameters |

                      | 401 | Unauthorized - Authentication credentials are
                      missing or invalid |

                      | 405 | Method Not Allowed - Request method is not
                      supported |

                      | 500 | Server Error - An unexpected error occurred while
                      processing the request |
              msg:
                allOf:
                  - type: string
                    description: Response message
                    example: File uploaded successfully
              data:
                allOf:
                  - $ref: '#/components/schemas/FileUploadResult'
            requiredProperties:
              - success
              - code
              - msg
              - data
        examples:
          example:
            value:
              success: true
              code: 200
              msg: File uploaded successfully
              data:
                fileName: uploaded-image.png
                filePath: images/user-uploads/uploaded-image.png
                downloadUrl: >-
                  https://tempfile.redpandaai.co/xxx/images/user-uploads/uploaded-image.png
                fileSize: 154832
                mimeType: image/png
                uploadedAt: '2025-01-01T12:00:00.000Z'
        description: File uploaded successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - &ref_0
                    type: boolean
                    description: Whether the request was successful
              code:
                allOf:
                  - &ref_1
                    $ref: '#/components/schemas/StatusCode'
              msg:
                allOf:
                  - &ref_2
                    type: string
                    description: Response message
                    example: File uploaded successfully
            refIdentifier: '#/components/schemas/ApiResponse'
            requiredProperties: &ref_3
              - success
              - code
              - msg
        examples:
          missing_parameter:
            summary: Missing required parameter
            value:
              success: false
              code: 400
              msg: 'Missing required parameter: uploadPath'
          invalid_format:
            summary: Format error
            value:
              success: false
              code: 400
              msg: 'Base64 decoding failed: Invalid Base64 format'
        description: Request parameter error
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - *ref_0
              code:
                allOf:
                  - *ref_1
              msg:
                allOf:
                  - *ref_2
            refIdentifier: '#/components/schemas/ApiResponse'
            requiredProperties: *ref_3
        examples:
          example:
            value:
              success: false
              code: 401
              msg: 'Authentication failed: Invalid API Key'
        description: Unauthorized access
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - *ref_0
              code:
                allOf:
                  - *ref_1
              msg:
                allOf:
                  - *ref_2
            refIdentifier: '#/components/schemas/ApiResponse'
            requiredProperties: *ref_3
        examples:
          example:
            value:
              success: false
              code: 500
              msg: Internal server error
        description: Internal server error
  deprecated: false
  type: path
components:
  schemas:
    StatusCode:
      type: integer
      enum:
        - 200
        - 400
        - 401
        - 405
        - 500
      description: >-
        Response Status Code


        | Code | Description |

        |------|-------------|

        | 200 | Success - Request has been processed successfully |

        | 400 | Bad Request - Request parameters are incorrect or missing
        required parameters |

        | 401 | Unauthorized - Authentication credentials are missing or invalid
        |

        | 405 | Method Not Allowed - Request method is not supported |

        | 500 | Server Error - An unexpected error occurred while processing the
        request |
    FileUploadResult:
      type: object
      properties:
        fileName:
          type: string
          description: File name
          example: uploaded-image.png
        filePath:
          type: string
          description: Complete file path in storage
          example: images/user-uploads/uploaded-image.png
        downloadUrl:
          type: string
          format: uri
          description: File download URL
          example: >-
            https://tempfile.redpandaai.co/xxx/images/user-uploads/uploaded-image.png
        fileSize:
          type: integer
          description: File size in bytes
          example: 154832
        mimeType:
          type: string
          description: File MIME type
          example: image/png
        uploadedAt:
          type: string
          format: date-time
          description: Upload timestamp
          example: '2025-01-01T12:00:00.000Z'
      required:
        - fileName
        - filePath
        - downloadUrl
        - fileSize
        - mimeType
        - uploadedAt

````



# URL File Upload

## OpenAPI

````yaml file-upload-api/file-upload-api.json post /api/file-url-upload
paths:
  path: /api/file-url-upload
  method: post
  servers:
    - url: https://kieai.redpandaai.co
      description: API Server
  request:
    security:
      - title: BearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                All APIs require authentication via Bearer Token.


                Get API Key:

                1. Visit [API Key Management Page](https://kie.ai/api-key) to
                get your API Key


                Usage:

                Add to request header:

                Authorization: Bearer YOUR_API_KEY
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              fileUrl:
                allOf:
                  - type: string
                    format: uri
                    description: File download URL, must be a valid HTTP or HTTPS address
                    example: https://example.com/images/sample.jpg
              uploadPath:
                allOf:
                  - type: string
                    description: File upload path, without leading or trailing slashes
                    example: images/downloaded
              fileName:
                allOf:
                  - type: string
                    description: File name (optional), including file extension
                    example: sample-image.jpg
            required: true
            refIdentifier: '#/components/schemas/UrlUploadRequest'
            requiredProperties:
              - fileUrl
              - uploadPath
        examples:
          image_from_url:
            summary: Download image from URL
            value:
              fileUrl: https://example.com/images/sample.jpg
              uploadPath: images/downloaded
              fileName: my-downloaded-image.jpg
          document_from_url:
            summary: Download document from URL
            value:
              fileUrl: https://example.com/docs/manual.pdf
              uploadPath: documents/manuals
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - type: boolean
                    description: Whether the request was successful
              code:
                allOf:
                  - type: integer
                    enum:
                      - 200
                      - 400
                      - 401
                      - 405
                      - 500
                    description: >-
                      Response Status Code


                      | Code | Description |

                      |------|-------------|

                      | 200 | Success - Request has been processed successfully
                      |

                      | 400 | Bad Request - Request parameters are incorrect or
                      missing required parameters |

                      | 401 | Unauthorized - Authentication credentials are
                      missing or invalid |

                      | 405 | Method Not Allowed - Request method is not
                      supported |

                      | 500 | Server Error - An unexpected error occurred while
                      processing the request |
              msg:
                allOf:
                  - type: string
                    description: Response message
                    example: File uploaded successfully
              data:
                allOf:
                  - $ref: '#/components/schemas/FileUploadResult'
            requiredProperties:
              - success
              - code
              - msg
              - data
        examples:
          example:
            value:
              success: true
              code: 200
              msg: File uploaded successfully
              data:
                fileName: uploaded-image.png
                filePath: images/user-uploads/uploaded-image.png
                downloadUrl: >-
                  https://tempfile.redpandaai.co/xxx/images/user-uploads/uploaded-image.png
                fileSize: 154832
                mimeType: image/png
                uploadedAt: '2025-01-01T12:00:00.000Z'
        description: File uploaded successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - &ref_0
                    type: boolean
                    description: Whether the request was successful
              code:
                allOf:
                  - &ref_1
                    $ref: '#/components/schemas/StatusCode'
              msg:
                allOf:
                  - &ref_2
                    type: string
                    description: Response message
                    example: File uploaded successfully
            refIdentifier: '#/components/schemas/ApiResponse'
            requiredProperties: &ref_3
              - success
              - code
              - msg
        examples:
          missing_parameter:
            summary: Missing required parameter
            value:
              success: false
              code: 400
              msg: 'Missing required parameter: uploadPath'
          invalid_format:
            summary: Format error
            value:
              success: false
              code: 400
              msg: 'Base64 decoding failed: Invalid Base64 format'
        description: Request parameter error
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - *ref_0
              code:
                allOf:
                  - *ref_1
              msg:
                allOf:
                  - *ref_2
            refIdentifier: '#/components/schemas/ApiResponse'
            requiredProperties: *ref_3
        examples:
          example:
            value:
              success: false
              code: 401
              msg: 'Authentication failed: Invalid API Key'
        description: Unauthorized access
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - *ref_0
              code:
                allOf:
                  - *ref_1
              msg:
                allOf:
                  - *ref_2
            refIdentifier: '#/components/schemas/ApiResponse'
            requiredProperties: *ref_3
        examples:
          example:
            value:
              success: false
              code: 500
              msg: Internal server error
        description: Internal server error
  deprecated: false
  type: path
components:
  schemas:
    StatusCode:
      type: integer
      enum:
        - 200
        - 400
        - 401
        - 405
        - 500
      description: >-
        Response Status Code


        | Code | Description |

        |------|-------------|

        | 200 | Success - Request has been processed successfully |

        | 400 | Bad Request - Request parameters are incorrect or missing
        required parameters |

        | 401 | Unauthorized - Authentication credentials are missing or invalid
        |

        | 405 | Method Not Allowed - Request method is not supported |

        | 500 | Server Error - An unexpected error occurred while processing the
        request |
    FileUploadResult:
      type: object
      properties:
        fileName:
          type: string
          description: File name
          example: uploaded-image.png
        filePath:
          type: string
          description: Complete file path in storage
          example: images/user-uploads/uploaded-image.png
        downloadUrl:
          type: string
          format: uri
          description: File download URL
          example: >-
            https://tempfile.redpandaai.co/xxx/images/user-uploads/uploaded-image.png
        fileSize:
          type: integer
          description: File size in bytes
          example: 154832
        mimeType:
          type: string
          description: File MIME type
          example: image/png
        uploadedAt:
          type: string
          format: date-time
          description: Upload timestamp
          example: '2025-01-01T12:00:00.000Z'
      required:
        - fileName
        - filePath
        - downloadUrl
        - fileSize
        - mimeType
        - uploadedAt

````


# Get Remaining Credits

## OpenAPI

````yaml common-api/common-api.json get /api/v1/chat/credit
paths:
  path: /api/v1/chat/credit
  method: get
  servers:
    - url: https://api.kie.ai
      description: API Server
  request:
    security:
      - title: BearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                All APIs require authentication via Bearer Token.


                Get API Key:

                1. Visit [API Key Management Page](https://kie.ai/api-key) to
                get your API Key


                Usage:

                Add to request header:

                Authorization: Bearer YOUR_API_KEY
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body: {}
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              code:
                allOf:
                  - type: integer
                    enum:
                      - 200
                      - 401
                      - 402
                      - 404
                      - 422
                      - 429
                      - 455
                      - 500
                      - 505
                    description: >-
                      Response Status Code


                      | Code | Description |

                      |------|-------------|

                      | 200 | Success - Request has been processed successfully
                      |

                      | 401 | Unauthorized - Authentication credentials are
                      missing or invalid |

                      | 402 | Insufficient Credits - Account does not have
                      enough credits to perform the operation |

                      | 404 | Not Found - The requested resource or endpoint
                      does not exist |

                      | 422 | Validation Error - The request parameters failed
                      validation checks |

                      | 429 | Rate Limited - Request limit has been exceeded for
                      this resource |

                      | 455 | Service Unavailable - System is currently
                      undergoing maintenance |

                      | 500 | Server Error - An unexpected error occurred while
                      processing the request |

                      | 505 | Feature Disabled - The requested feature is
                      currently disabled |
              msg:
                allOf:
                  - type: string
                    description: Error message when code != 200
                    example: success
              data:
                allOf:
                  - type: integer
                    description: Remaining credit quantity
                    example: 100
            requiredProperties:
              - code
              - msg
              - data
        examples:
          example:
            value:
              code: 200
              msg: success
              data: 100
        description: Request successful
    '500':
      _mintlify/placeholder:
        schemaArray:
          - type: any
            description: Server Error
        examples: {}
        description: Server Error
  deprecated: false
  type: path
components:
  schemas: {}

````
