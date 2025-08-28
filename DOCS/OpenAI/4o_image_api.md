# 4o Image API Quickstart

> Get started with the 4o Image API to generate high-quality AI images in minutes

## Welcome to 4o Image API

The 4o Image API, powered by the advanced GPT-4o model, provides high-quality AI image generation services. Whether you need text-to-image generation, image editing, or image variants, our API meets all your creative needs.

<CardGroup cols={2}>
  <Card title="Text-to-Image" icon="wand-magic-sparkles" href="/4o-image-api/generate-4-o-image">
    Generate high-quality images from text descriptions
  </Card>

  <Card title="Image Editing" icon="image" href="/4o-image-api/generate-4-o-image">
    Edit existing images using masks and prompts
  </Card>

  <Card title="Image Variants" icon="clone" href="/4o-image-api/generate-4-o-image">
    Generate multiple creative variants from input images
  </Card>

  <Card title="Task Management" icon="list-check" href="/4o-image-api/get-4-o-image-details">
    Track and monitor your image generation tasks
  </Card>
</CardGroup>

## Authentication

All API requests require authentication using a Bearer token. Get your API key from the [API Key Management Page](https://kie.ai/api-key).

<Warning>
  Keep your API key secure and never share it publicly. If compromised, reset it immediately.
</Warning>

### API Base URL

```
https://api.kie.ai
```

### Authentication Header

```http
Authorization: Bearer YOUR_API_KEY
```

## Quick Start Guide

### Step 1: Generate Your First Image

Start with a simple text-to-image generation request:

<CodeGroup>
  ```bash cURL
  curl -X POST "https://api.kie.ai/api/v1/gpt4o-image/generate" \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "prompt": "A serene mountain landscape at sunset with a lake reflecting the orange sky, photorealistic style",
      "size": "1:1",
      "nVariants": 1
    }'
  ```

  ```javascript JavaScript
  const response = await fetch('https://api.kie.ai/api/v1/gpt4o-image/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: 'A serene mountain landscape at sunset with a lake reflecting the orange sky, photorealistic style',
      size: '1:1',
      nVariants: 1
    })
  });

  const data = await response.json();
  console.log('Task ID:', data.data.taskId);
  ```

  ```python Python
  import requests

  url = "https://api.kie.ai/api/v1/gpt4o-image/generate"
  headers = {
      "Authorization": "Bearer YOUR_API_KEY",
      "Content-Type": "application/json"
  }

  payload = {
      "prompt": "A serene mountain landscape at sunset with a lake reflecting the orange sky, photorealistic style",
      "size": "1:1",
      "nVariants": 1
  }

  response = requests.post(url, json=payload, headers=headers)
  result = response.json()

  print(f"Task ID: {result['data']['taskId']}")
  ```

  ```php PHP
  <?php
  $url = 'https://api.kie.ai/api/v1/gpt4o-image/generate';
  $headers = [
      'Authorization: Bearer YOUR_API_KEY',
      'Content-Type: application/json'
  ];

  $payload = [
      'prompt' => 'A serene mountain landscape at sunset with a lake reflecting the orange sky, photorealistic style',
      'size' => '1:1',
      'nVariants' => 1
  ];

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  $response = curl_exec($ch);
  curl_close($ch);

  $result = json_decode($response, true);
  echo "Task ID: " . $result['data']['taskId'];
  ?>
  ```
</CodeGroup>

### Step 2: Check Task Status

Use the returned task ID to check the generation status:

<CodeGroup>
  ```bash cURL
  curl -X GET "https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=YOUR_TASK_ID" \
    -H "Authorization: Bearer YOUR_API_KEY"
  ```

  ```javascript JavaScript
  const response = await fetch(`https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=${taskId}`, {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  const result = await response.json();

  if (result.data.status === 'SUCCESS') {
    console.log('Generation completed!');
    console.log('Image URLs:', result.data.response.result_urls);
  } else if (result.data.status === 'GENERATING') {
    console.log('Still generating...');
  } else {
    console.log('Generation failed:', result.data.status);
  }
  ```

  ```python Python
  import requests
  import time

  def check_task_status(task_id, api_key):
      url = f"https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId={task_id}"
      headers = {"Authorization": f"Bearer {api_key}"}
      
      response = requests.get(url, headers=headers)
      result = response.json()
      
      status = result['data']['status']
      
      if status == 'SUCCESS':
          print("Generation completed!")
          result_urls = result['data']['response']['result_urls']
          for i, url in enumerate(result_urls):
              print(f"Image {i+1}: {url}")
          return result_urls
      elif status == 'GENERATING':
          print("Still generating...")
          return None
      else:
          print(f"Generation failed: {status}")
          return None

  # Poll until completion
  task_id = "YOUR_TASK_ID"
  while True:
      result_urls = check_task_status(task_id, "YOUR_API_KEY")
      if result_urls:
          break
      time.sleep(10)  # Wait 10 seconds before checking again
  ```
</CodeGroup>

### Response Format

**Successful Response:**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_4o_abc123"
  }
}
```

**Task Status Response:**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_4o_abc123",
    "status": "SUCCESS",
    "response": {
      "result_urls": [
        "https://example.com/generated-image.png"
      ]
    }
  }
}
```

## Core Features

### Text-to-Image

Generate high-quality images from text descriptions:

```json
{
  "prompt": "A cute orange cat sitting on a rainbow, cartoon style, bright colors",
  "size": "1:1",
  "nVariants": 2,
  "isEnhance": false
}
```

### Image Editing

Edit existing images using masks and prompts:

```json
{
  "filesUrl": ["https://example.com/original-image.jpg"],
  "maskUrl": "https://example.com/mask-image.png",
  "prompt": "Replace the sky with a starry night sky",
  "size": "3:2"
}
```

### Image Variants

Generate creative variants based on input images:

```json
{
  "filesUrl": ["https://example.com/base-image.jpg"],
  "prompt": "Keep main elements, change to watercolor painting style",
  "size": "2:3",
  "nVariants": 4
}
```

## Image Size Support

Three standard image ratios are supported:

<CardGroup cols={3}>
  <Card title="1:1" icon="square">
    **Square**

    Perfect for social media posts, avatars, product displays
  </Card>

  <Card title="3:2" icon="rectangle-wide">
    **Landscape**

    Ideal for landscape photos, desktop wallpapers, banners
  </Card>

  <Card title="2:3" icon="rectangle-vertical">
    **Portrait**

    Great for portraits, mobile wallpapers, poster designs
  </Card>
</CardGroup>

## Key Parameters

<ParamField path="prompt" type="string">
  Text description for image generation. Provide detailed, specific descriptions for better results.

  **Prompt Tips:**

  * Describe main objects and scenes
  * Specify artistic styles (e.g., "photorealistic", "cartoon", "watercolor")
  * Add color and lighting descriptions
  * Include mood and atmosphere elements
</ParamField>

<ParamField path="size" type="string" required>
  Image aspect ratio, required parameter:

  * `1:1` - Square
  * `3:2` - Landscape
  * `2:3` - Portrait
</ParamField>

<ParamField path="filesUrl" type="array">
  Input image URL list, supports up to 5 images. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.jfif`
</ParamField>

<ParamField path="maskUrl" type="string">
  Mask image URL to specify areas for editing. Black areas will be modified, white areas remain unchanged.
</ParamField>

<ParamField path="nVariants" type="integer">
  Number of image variants to generate. Options: 1, 2, or 4. Default is 1.
</ParamField>

<ParamField path="isEnhance" type="boolean">
  Prompt enhancement option. For specific scenarios like 3D image generation, enabling this can achieve more refined effects. Default is false.
</ParamField>

<ParamField path="enableFallback" type="boolean">
  Enable fallback mechanism. Automatically switches to backup models when the main model is unavailable. Default is false.
</ParamField>

## Complete Workflow Example

Here's a complete example for image generation and editing:

<Tabs>
  <Tab title="JavaScript">
    ```javascript
    class FourOImageAPI {
      constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.kie.ai/api/v1/gpt4o-image';
      }
      
      async generateImage(options) {
        const response = await fetch(`${this.baseUrl}/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(options)
        });
        
        const result = await response.json();
        if (result.code !== 200) {
          throw new Error(`Generation failed: ${result.msg}`);
        }
        
        return result.data.taskId;
      }
      
      async waitForCompletion(taskId, maxWaitTime = 300000) { // 5 minutes max
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
          const status = await this.getTaskStatus(taskId);
          
          if (status.status === 'SUCCESS') {
            return status.response;
          } else if (status.status === 'CREATE_TASK_FAILED' || status.status === 'GENERATE_FAILED') {
            throw new Error(`Generation failed: ${status.status}`);
          }
          
          // Wait 10 seconds before next check
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        throw new Error('Generation timeout');
      }
      
      async getTaskStatus(taskId) {
        const response = await fetch(`${this.baseUrl}/record-info?taskId=${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
        
        const result = await response.json();
        return result.data;
      }
      
      async getDownloadUrl(imageUrl) {
        const response = await fetch(`${this.baseUrl}/download-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageUrl })
        });
        
        const result = await response.json();
        return result.data.downloadUrl;
      }
    }

    // Usage Example
    async function main() {
      const api = new FourOImageAPI('YOUR_API_KEY');
      
      try {
        // Text-to-Image Generation
        console.log('Starting image generation...');
        const taskId = await api.generateImage({
          prompt: 'A futuristic cityscape with flying cars and neon lights, cyberpunk style',
          size: '1:1',
          nVariants: 2,
          isEnhance: true,
          enableFallback: true
        });
        
        // Wait for completion
        console.log(`Task ID: ${taskId}. Waiting for completion...`);
        const result = await api.waitForCompletion(taskId);
        
        console.log('Image generation successful!');
        result.result_urls.forEach((url, index) => {
          console.log(`Image ${index + 1}: ${url}`);
        });
        
        // Get download URL
        const downloadUrl = await api.getDownloadUrl(result.result_urls[0]);
        console.log('Download URL:', downloadUrl);
        
        // Image Editing Example
        console.log('\nStarting image editing...');
        const editTaskId = await api.generateImage({
          filesUrl: [result.result_urls[0]],
          prompt: 'Add beautiful rainbow in the sky',
          size: '3:2'
        });
        
        const editResult = await api.waitForCompletion(editTaskId);
        console.log('Image editing successful!');
        console.log('Edited image:', editResult.result_urls[0]);
        
      } catch (error) {
        console.error('Error:', error.message);
      }
    }

    main();
    ```
  </Tab>

  <Tab title="Python">
    ```python
    import requests
    import time

    class FourOImageAPI:
        def __init__(self, api_key):
            self.api_key = api_key
            self.base_url = 'https://api.kie.ai/api/v1/gpt4o-image'
            self.headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
        
        def generate_image(self, **options):
            response = requests.post(f'{self.base_url}/generate', 
                                   headers=self.headers, json=options)
            result = response.json()
            
            if result['code'] != 200:
                raise Exception(f"Generation failed: {result['msg']}")
            
            return result['data']['taskId']
        
        def wait_for_completion(self, task_id, max_wait_time=300):
            start_time = time.time()
            
            while time.time() - start_time < max_wait_time:
                status = self.get_task_status(task_id)
                
                if status['status'] == 'SUCCESS':
                    return status['response']
                elif status['status'] in ['CREATE_TASK_FAILED', 'GENERATE_FAILED']:
                    raise Exception(f"Generation failed: {status['status']}")
                
                time.sleep(10)  # Wait 10 seconds
            
            raise Exception('Generation timeout')
        
        def get_task_status(self, task_id):
            response = requests.get(f'{self.base_url}/record-info?taskId={task_id}',
                                  headers={'Authorization': f'Bearer {self.api_key}'})
            return response.json()['data']
        
        def get_download_url(self, image_url):
            response = requests.post(f'{self.base_url}/download-url',
                                   headers=self.headers, 
                                   json={'imageUrl': image_url})
            return response.json()['data']['downloadUrl']

    # Usage Example
    def main():
        api = FourOImageAPI('YOUR_API_KEY')
        
        try:
            # Text-to-Image Generation
            print('Starting image generation...')
            task_id = api.generate_image(
                prompt='A futuristic cityscape with flying cars and neon lights, cyberpunk style',
                size='1:1',
                nVariants=2,
                isEnhance=True,
                enableFallback=True
            )
            
            # Wait for completion
            print(f'Task ID: {task_id}. Waiting for completion...')
            result = api.wait_for_completion(task_id)
            
            print('Image generation successful!')
            for i, url in enumerate(result['result_urls']):
                print(f'Image {i + 1}: {url}')
            
            # Get download URL
            download_url = api.get_download_url(result['result_urls'][0])
            print(f'Download URL: {download_url}')
            
            # Image Editing Example
            print('\nStarting image editing...')
            edit_task_id = api.generate_image(
                filesUrl=[result['result_urls'][0]],
                prompt='Add beautiful rainbow in the sky',
                size='3:2'
            )
            
            edit_result = api.wait_for_completion(edit_task_id)
            print('Image editing successful!')
            print(f'Edited image: {edit_result["result_urls"][0]}')
            
        except Exception as error:
            print(f'Error: {error}')

    if __name__ == '__main__':
        main()
    ```
  </Tab>
</Tabs>

## Advanced Features

### Mask Editing

Use masks for precise image editing:

```javascript
const editTaskId = await api.generateImage({
  filesUrl: ['https://example.com/original.jpg'],
  maskUrl: 'https://example.com/mask.png',
  prompt: 'Replace the masked area with a beautiful garden',
  size: '3:2'
});
```

<Info>
  Black areas in the mask image will be edited, white areas remain unchanged. The mask must match the original image dimensions.
</Info>

### Fallback Mechanism

Enable fallback mechanism for service reliability:

```javascript
const taskId = await api.generateImage({
  prompt: 'Artistic concept design',
  size: '1:1',
  enableFallback: true,
  fallbackModel: 'FLUX_MAX' // or 'GPT_IMAGE_1'
});
```

### Using Callbacks

Set up webhook callbacks for automatic notifications:

```javascript
const taskId = await api.generateImage({
  prompt: 'Digital artwork',
  size: '1:1',
  callBackUrl: 'https://your-server.com/4o-callback'
});

// Your callback endpoint will receive:
app.post('/4o-callback', (req, res) => {
  const { code, data } = req.body;
  
  if (code === 200) {
    console.log('Images ready:', data.info.result_urls);
  } else {
    console.log('Generation failed:', req.body.msg);
  }
  
  res.status(200).json({ status: 'received' });
});
```

<Card title="Learn More About Callbacks" icon="webhook" href="/4o-image-api/generate-4-o-image-callbacks">
  Set up webhook callbacks to receive automatic notifications when your images are ready.
</Card>

## Task Status Descriptions

<ResponseField name="GENERATING" type="In Progress">
  Task is currently being processed
</ResponseField>

<ResponseField name="SUCCESS" type="Success">
  Task completed successfully
</ResponseField>

<ResponseField name="CREATE_TASK_FAILED" type="Creation Failed">
  Task creation failed
</ResponseField>

<ResponseField name="GENERATE_FAILED" type="Generation Failed">
  Image generation failed
</ResponseField>

## Best Practices

<AccordionGroup>
  <Accordion title="Prompt Optimization">
    * Use detailed, specific descriptions
    * Include style and technique descriptions (e.g., "photorealistic", "impressionist", "digital art")
    * Specify color, lighting, and composition requirements
    * Avoid overly complex or contradictory descriptions
  </Accordion>

  <Accordion title="Image Quality">
    * Choose appropriate aspect ratios for your use case
    * Consider enabling prompt enhancement for complex scenes
    * Use high-quality input images for editing
    * Ensure mask images accurately mark editing areas
  </Accordion>

  <Accordion title="Performance Optimization">
    * Use callbacks instead of frequent polling
    * Enable fallback mechanism for service reliability
    * Set appropriate variant counts to balance quality and cost
    * Download images promptly to avoid 14-day expiration
  </Accordion>

  <Accordion title="Error Handling">
    * Implement proper retry logic
    * Monitor task status and handle exceptions
    * Verify input image accessibility
    * Log error information for debugging
  </Accordion>
</AccordionGroup>

## Image Storage and Downloads

<Warning>
  Generated images are stored for **14 days** before automatic deletion. Download URLs are valid for **20 minutes**.
</Warning>

* Image URLs remain accessible for 14 days after generation
* Use download URL API to solve cross-domain download issues
* Download URLs expire after 20 minutes
* Recommended to download and store important images locally

## Next Steps

<CardGroup cols={2}>
  <Card title="Generate Images" icon="image" href="/4o-image-api/generate-4-o-image">
    Complete API reference for image generation
  </Card>

  <Card title="Task Details" icon="magnifying-glass" href="/4o-image-api/get-4-o-image-details">
    Query and monitor task status
  </Card>

  <Card title="Download URL" icon="download" href="/4o-image-api/get-4-o-image-download-url">
    Get direct download URLs
  </Card>

  <Card title="Callback Setup" icon="webhook" href="/4o-image-api/generate-4-o-image-callbacks">
    Set up automatic notification callbacks
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

Ready to start creating amazing AI images? [Get your API key](https://kie.ai/api-key) and begin creating today!


# Get 4o Image Details

> Create a new 4o Image generation task. Generated images are stored for 14 days, after which they expire.

## OpenAPI

````yaml 4o-image-api/4o-image-api.json post /api/v1/gpt4o-image/generate
paths:
  path: /api/v1/gpt4o-image/generate
  method: post
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


                Note:

                - Keep your API Key secure and do not share it with others

                - If you suspect your API Key has been compromised, reset it
                immediately in the management page
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
                    description: >-
                      (Optional, Deprecated) File URL, such as an image URL. If
                      fileUrl is provided, 4o image may create based on this
                      image. This parameter will be deprecated in the future,
                      please use filesUrl instead.
                    example: https://example.com/image.png
                    deprecated: true
              maskUrl:
                allOf:
                  - type: string
                    format: uri
                    description: >-
                      (Optional) Mask image URL. You can provide a mask to
                      indicate where the image should be edited. The black parts
                      in the mask will be replaced or modified, and other areas
                      will be filled with white. You can use text to describe
                      what you want the final edited image to look like, or
                      specifically what content you want to modify. The masked
                      image must have the same format and size (less than 25MB)
                      as the edited image. When the filesUrl contains more than
                      one image, this parameter is not available. The size of
                      the mask image must be consistent with the image in the
                      filesUrl.


                      Example:

                      ![Mask Example](/img/4o-gen-image-mask.png)


                      In the image above, the left side shows the original
                      image, the middle shows the mask image (white areas
                      indicate parts to be preserved, black areas indicate parts
                      to be modified), and the right side shows the final
                      generated image.
                    example: https://example.com/mask.png
              filesUrl:
                allOf:
                  - type: array
                    items:
                      type: string
                      format: uri
                    description: >-
                      (Optional) List of file URLs, such as image URLs. Maximum
                      5 images supported. Supported file formats: `.jfif`,
                      `.pjpeg`, `.jpeg`, `.pjp`, `.jpg`, `.png`, `.webp`
                    example:
                      - https://example.com/image1.png
                      - https://example.com/image2.jpg
              prompt:
                allOf:
                  - type: string
                    description: >-
                      (Optional) Prompt describing what you want the 4o image to
                      generate. Either fileUrl/filesUrl or prompt must be
                      provided
                    example: A beautiful sunset over the mountains
              size:
                allOf:
                  - type: string
                    description: >-
                      (Required) Image size ratio, must be one of the supported
                      formats
                    enum:
                      - '1:1'
                      - '3:2'
                      - '2:3'
                    example: '1:1'
              callBackUrl:
                allOf:
                  - type: string
                    format: uri
                    description: >-
                      The URL to receive 4o image generation task completion
                      updates. Optional but recommended for production use.


                      - System will POST task status and results to this URL
                      when 4o image generation completes

                      - Callback includes generated image URLs and task
                      information for all variations

                      - Your callback endpoint should accept POST requests with
                      JSON payload containing image generation results

                      - For detailed callback format and implementation guide,
                      see [4o Image Generation
                      Callbacks](./generate-4-o-image-callbacks)

                      - Alternatively, use the Get 4o Image Details endpoint to
                      poll task status
                    example: https://your-callback-url.com/callback
              isEnhance:
                allOf:
                  - type: boolean
                    description: >-
                      (Optional) Prompt enhancement option, Default is false. In
                      most cases, enabling this is unnecessary. However, for
                      specific scenarios like generating 3D images, enabling it
                      can produce a more refined effect. Use discretion.
                    example: false
              uploadCn:
                allOf:
                  - type: boolean
                    description: >-
                      (Optional) Specifies the server region for image upload.
                      Set to true to use servers in China, false to use
                      non-China servers. Choose based on your geographical
                      location for optimal upload speeds.
                    example: false
              nVariants:
                allOf:
                  - type: integer
                    description: >-
                      (Optional) Number of image variations to generate. Only
                      accepts values 1, 2, or 4. Default is 1.According to
                      policy changes on the official website, there may be
                      changes in the future.
                    enum:
                      - 1
                      - 2
                      - 4
                    example: 1
              enableFallback:
                allOf:
                  - type: boolean
                    description: >-
                      (Optional) Enable fallback mechanism. When set to true, if
                      the official GPT-4o image generation service is
                      unavailable or encounters exceptions, the system will
                      automatically switch to backup models (such as Flux) for
                      image generation, ensuring task continuity and
                      reliability. Default is false.
                    example: false
              fallbackModel:
                allOf:
                  - type: string
                    description: >-
                      (Optional) Specify which backup model to use when the main
                      model is unavailable. Takes effect when enableFallback is
                      true. Available values: GPT_IMAGE_1  or FLUX_MAX. Default
                      value is FLUX_MAX.
                    enum:
                      - GPT_IMAGE_1
                      - FLUX_MAX
                    default: FLUX_MAX
                    example: FLUX_MAX
            required: true
            requiredProperties:
              - size
            example:
              filesUrl:
                - https://example.com/image1.png
                - https://example.com/image2.png
              prompt: A beautiful sunset over the mountains
              size: '1:1'
              callBackUrl: https://your-callback-url.com/callback
              isEnhance: false
              uploadCn: false
              nVariants: 1
              enableFallback: false
              fallbackModel: FLUX_MAX
        examples:
          example:
            value:
              filesUrl:
                - https://example.com/image1.png
                - https://example.com/image2.png
              prompt: A beautiful sunset over the mountains
              size: '1:1'
              callBackUrl: https://your-callback-url.com/callback
              isEnhance: false
              uploadCn: false
              nVariants: 1
              enableFallback: false
              fallbackModel: FLUX_MAX
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
                      - 400
                      - 401
                      - 402
                      - 404
                      - 422
                      - 429
                      - 455
                      - 500
                      - 550
                    description: >-
                      Response Status Codes


                      - **200**: Success - Request has been processed
                      successfully  

                      - **400**: Format Error - The parameter is not in a valid
                      JSON format  

                      - **401**: Unauthorized - Authentication credentials are
                      missing or invalid  

                      - **402**: Insufficient Credits - Account does not have
                      enough credits to perform the operation  

                      - **404**: Not Found - The requested resource or endpoint
                      does not exist  

                      - **422**: Validation Error - The request parameters
                      failed validation checks  

                      - **429**: Rate Limited - Request limit has been exceeded
                      for this resource  

                      - **455**: Service Unavailable - System is currently
                      undergoing maintenance  

                      - **500**: Server Error - An unexpected error occurred
                      while processing the request  
                        - Build Failed - vocal removal generation failed  
                      - **550**: Connection Denied - Task was rejected due to a
                      full queue, likely caused by source site's issues. Please
                      contact the administrator to confirm.
              msg:
                allOf:
                  - type: string
                    description: Error message when code != 200
                    example: success
              data:
                allOf:
                  - type: object
                    properties:
                      taskId:
                        type: string
                        description: >-
                          Task ID, can be used with [Get 4o Image
                          Details](/4o-image-api/get-4-o-image-details) to query
                          task status
                        example: task12345
        examples:
          example:
            value:
              code: 200
              msg: success
              data:
                taskId: task12345
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


# Get 4o Image Details

> Query 4o Image generation task details using taskId, including generation status, parameters and results.

## OpenAPI

````yaml 4o-image-api/4o-image-api.json get /api/v1/gpt4o-image/record-info
paths:
  path: /api/v1/gpt4o-image/record-info
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


                Note:

                - Keep your API Key secure and do not share it with others

                - If you suspect your API Key has been compromised, reset it
                immediately in the management page
          cookie: {}
    parameters:
      path: {}
      query:
        taskId:
          schema:
            - type: string
              required: true
              description: Unique identifier of the 4o image generation task
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
                    description: >-
                      Response Status Codes


                      - **200**: Success - Request has been processed
                      successfully  

                      - **401**: Unauthorized - Authentication credentials are
                      missing or invalid  

                      - **402**: Insufficient Credits - Account does not have
                      enough credits to perform the operation  

                      - **404**: Not Found - The requested resource or endpoint
                      does not exist  

                      - **422**: Validation Error - The request parameters
                      failed validation checks  

                      - **429**: Rate Limited - Request limit has been exceeded
                      for this resource  

                      - **455**: Service Unavailable - System is currently
                      undergoing maintenance  

                      - **500**: Server Error - An unexpected error occurred
                      while processing the request  
                        - Build Failed - vocal removal generation failed
              msg:
                allOf:
                  - type: string
                    description: Error message when code != 200
                    example: success
              data:
                allOf:
                  - type: object
                    properties:
                      taskId:
                        type: string
                        description: Unique identifier of the 4o image generation task
                        example: task12345
                      paramJson:
                        type: string
                        description: Request parameters
                        example: >-
                          {"prompt":"A beautiful sunset over the
                          mountains","size":"1:1","isEnhance":false}
                      completeTime:
                        type: integer
                        format: int64
                        description: Task completion time
                        example: 1672574400000
                      response:
                        type: object
                        description: Final result
                        properties:
                          resultUrls:
                            type: array
                            items:
                              type: string
                            description: List of generated image URLs
                            example:
                              - https://example.com/result/image1.png
                      successFlag:
                        type: integer
                        format: int32
                        description: Generation status flag
                        example: 1
                      status:
                        type: string
                        description: >-
                          Generation status text, possible values: GENERATING-In
                          progress, SUCCESS-Successful, CREATE_TASK_FAILED-Task
                          creation failed, GENERATE_FAILED-Generation failed


                          - **200**: Success - Image generation completed
                          successfully  

                          - **400**: Bad Request  
                            - The image content in filesUrl violates content policy  
                            - Image size exceeds maximum of 26214400 bytes  
                            - We couldn't process the provided image file (code=invalid_image_format)  
                            - Your content was flagged by OpenAI as violating content policies  
                            - Failed to fetch the image. Kindly verify any access limits set by you or your service provider  
                          - **451**: Download Failed - Unable to download image
                          from the provided filesUrl  

                          - **500**: Internal Error  
                            - Failed to get user token  
                            - Please try again later  
                            - Failed to generate image  
                            - GPT 4O failed to edit the picture  
                            - null
                        enum:
                          - GENERATING
                          - SUCCESS
                          - CREATE_TASK_FAILED
                          - GENERATE_FAILED
                        example: SUCCESS
                      errorCode:
                        type: integer
                        format: int32
                        description: Error code
                        enum:
                          - 200
                          - 400
                          - 451
                          - 500
                      errorMessage:
                        type: string
                        description: Error message
                        example: ''
                      createTime:
                        type: integer
                        format: int64
                        description: Creation time
                        example: 1672561200000
                      progress:
                        type: string
                        description: >-
                          Progress, minimum value is "0.00", maximum value is
                          "1.00"
                        example: '1.00'
        examples:
          example:
            value:
              code: 200
              msg: success
              data:
                taskId: task12345
                paramJson: >-
                  {"prompt":"A beautiful sunset over the
                  mountains","size":"1:1","isEnhance":false}
                completeTime: 1672574400000
                response:
                  resultUrls:
                    - https://example.com/result/image1.png
                successFlag: 1
                status: SUCCESS
                errorCode: null
                errorMessage: ''
                createTime: 1672561200000
                progress: '1.00'
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



# Get Direct Download URL

> Convert an image URL to a direct download URL. This helps solve cross-domain issues when downloading images directly. The returned URL is valid for 20 minutes.

## OpenAPI

````yaml 4o-image-api/4o-image-api.json post /api/v1/gpt4o-image/download-url
paths:
  path: /api/v1/gpt4o-image/download-url
  method: post
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


                Note:

                - Keep your API Key secure and do not share it with others

                - If you suspect your API Key has been compromised, reset it
                immediately in the management page
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
              taskId:
                allOf:
                  - type: string
                    description: The task ID associated with the image generation
                    example: task12345
              url:
                allOf:
                  - type: string
                    format: uri
                    description: >-
                      The original image URL that needs to be converted to a
                      direct download URL
                    example: https://tempfile.aiquickdraw.com/v/xxxxxxx.png
            required: true
            requiredProperties:
              - taskId
              - url
            example:
              taskId: task12345
              url: https://tempfile.aiquickdraw.com/v/xxxxxxx.png
        examples:
          example:
            value:
              taskId: task12345
              url: https://tempfile.aiquickdraw.com/v/xxxxxxx.png
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
                      - 404
                      - 422
                      - 451
                      - 455
                      - 500
                    description: >-
                      Response Status Codes


                      - **200**: Success - Request has been processed
                      successfully  

                      - **401**: Unauthorized - Authentication credentials are
                      missing or invalid  

                      - **404**: Not Found - The requested resource or endpoint
                      does not exist  

                      - **422**: Validation Error  
                        - The request parameters failed validation checks  
                        - record is null  
                        - Temporarily supports records within 14 days  
                        - record result data is blank  
                        - record status is not success  
                        - record result data not exist  
                        - record result data is empty  
                      - **451**: Failed to fetch the image. Kindly verify any
                      access limits set by you or your service provider  

                      - **455**: Service Unavailable - System is currently
                      undergoing maintenance  

                      - **500**: Server Error - An unexpected error occurred
                      while processing the request
              msg:
                allOf:
                  - type: string
                    description: Error message when code != 200
                    example: success
              data:
                allOf:
                  - type: string
                    description: Direct download URL valid for 20 minutes
                    example: >-
                      https://xxxxxx.xxxxxxxx.r2.cloudflarestorage.com/v/xxxxxxx.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250415T101007Z&X-Amz-SignedHeaders=host&X-Amz-Expires=1200&X-Amz-Credential=2464206aa3e576aa7c035d889be3a84e%2F20250415%2Fapac%2Fs3%2Faws4_request&X-Amz-Signature=122ae8bef09110e620841ab2ef8061c1818e754fc201408a9d1c6847b36fd3df
        examples:
          example:
            value:
              code: 200
              msg: success
              data: >-
                https://xxxxxx.xxxxxxxx.r2.cloudflarestorage.com/v/xxxxxxx.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250415T101007Z&X-Amz-SignedHeaders=host&X-Amz-Expires=1200&X-Amz-Credential=2464206aa3e576aa7c035d889be3a84e%2F20250415%2Fapac%2Fs3%2Faws4_request&X-Amz-Signature=122ae8bef09110e620841ab2ef8061c1818e754fc201408a9d1c6847b36fd3df
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