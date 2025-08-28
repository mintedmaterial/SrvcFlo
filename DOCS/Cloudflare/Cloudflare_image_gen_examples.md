An example of how our image generation should happen after successful transaction. We also do not want to reveal the models we use 

export default {
    async fetch(request, env) {
        const API_KEY = env.API_KEY;
        const url = new URL(request.url);
        const auth = request.headers.get("Authorization");

        // 🔐 Simple API key check
        if (auth !== `Bearer ${API_KEY}`) {
            return json({ error: "Unauthorized" }, 401);
        }

        // 🚫 Only allow POST requests to /
        if (request.method !== "POST" || url.pathname !== "/") {
            return json({ error: "Not allowed" }, 405);
        }

        try {
            const { prompt } = await request.json();

            if (!prompt) return json({ error: "Prompt is required" }, 400);

            // Choose model from the following list:
            // "@cf/blackforestlabs/ux-1-schnell"
            // "@cf/bytedance/stable-diffusion-xl-lightning"
            // "@cf/lykon/dreamshaper-8-lcm"
            // "@cf/runwayml/stable-diffusion-v1-5-img2img"
            // "@cf/runwayml/stable-diffusion-v1-5-inpainting"
            // "@cf/stabilityai/stable-diffusion-xl-base-1.0"

            // 🧠 Generate image from prompt
            const result = await env.AI.run(
                "@cf/stabilityai/stable-diffusion-xl-base-1.0",
                { prompt }
            );

            return new Response(result, {
                headers: { "Content-Type": "image/jpeg" },
            });
        } catch (err) {
            return json({ error: "Failed to generate image", details: err.message }, 500);
        }
    },
};

// 📦 Function to return JSON responses
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}


Free AI Image Generation API (100,000 Calls/Day) ⚡
GitHub stars License Cloudflare AI

🚀 Deploy your own free AI image generation API in minutes!

This project lets you deploy your own free AI image generation API using Cloudflare Workers, with up to 100,000 API calls per day. Generate stunning images from text prompts using powerful models like Stable Diffusion XL! 🎨

✨ Features
🆓 100,000 free API calls per day (Cloudflare Workers AI free tier)
⚡ Lightning-fast image generation from text prompts
🛠️ Easy to deploy - no coding experience required
🔒 Secure with API key authentication
🎯 Multiple AI models available



We may also need something for resizing the images for the Thread of generations. The user can download the full size image of course. But we should try and resize the image 1/2 for the Thread , show the users short wallet address or edited username , and the amount of upvotes they have 


Cloudflare Image Resizing
Simple API for URL generation.

Last version License Analytics

Setup
yarn add @awes-io/resize # yarn 
npm i @awes-io/resize # npm 
Basic use
import resize from '@awes-io/resize'

// get the image with width 640px
resize('https://example.com/images/example.jpg', 640)

// result: https://example.com/cdn-cgi/image/w=640,q=75/images/example.jpg
Method
// URL generation with parameters for resizing
resize(url, width = null, aspect = null, options = null)
Options
Name	Type	Default	Description
url	String	-	Link to the original image.
width	Number	null	(Optional) Width of the image, undefined by default.
aspect	String	null	(Optional) Aspect ratio for image, ie: 16x9, 4:3, etc.
options	Object	null	(Optional) domain, protocol, crop, prefix
options.options	Object	null	(Optional) List of options for modify parameters for image. More info: https://developers.cloudflare.com/images/about/
Cloudflare Image Resizing Documentation
https://developers.cloudflare.com/images/about/
Ensure to write proper commit message according to Git Commit convention



Text To Image App
Deploy to Cloudflare

Text To Image Template Preview

Generate images based on text prompts using Workers AI. In this example, going to the website will generate an image from the prompt "cyberpunk cat" using the @cf/stabilityai/stable-diffusion-xl-base-1.0 model. Be patient! Your image may take a few seconds to generate.

Getting Started
Outside of this repo, you can start a new project with this template using C3 (the create-cloudflare CLI):

npm create cloudflare@latest -- --template=cloudflare/templates/text-to-image-template
A live public deployment of this template is available at https://text-to-image-template.templates.workers.dev

Setup Steps
Install the project dependencies with a package manager of your choice:
npm install
Deploy the project!
npx wrangler deploy


---
title: stable-diffusion-v1-5-inpainting · Cloudflare Workers AI docs
description: Stable Diffusion Inpainting is a latent text-to-image diffusion
  model capable of generating photo-realistic images given any text input, with
  the extra capability of inpainting the pictures by using a mask.
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers-ai/models/stable-diffusion-v1-5-inpainting/
  md: https://developers.cloudflare.com/workers-ai/models/stable-diffusion-v1-5-inpainting/index.md
---

r

# stable-diffusion-v1-5-inpainting Beta

Text-to-Image • runwayml

@cf/runwayml/stable-diffusion-v1-5-inpainting

Stable Diffusion Inpainting is a latent text-to-image diffusion model capable of generating photo-realistic images given any text input, with the extra capability of inpainting the pictures by using a mask.

| Model Info | |
| - | - |
| Terms and License | [link](https://github.com/runwayml/stable-diffusion/blob/main/LICENSE) |
| More information | [link](https://huggingface.co/runwayml/stable-diffusion-inpainting) |
| Beta | Yes |
| Unit Pricing | $0.00 per step |

## Usage

Workers - TypeScript

```ts
export interface Env {
  AI: Ai;
}


export default {
  async fetch(request, env): Promise<Response> {


    // Picture of a dog
    const exampleInputImage = await fetch(
      "https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog.png"
    );


    // Mask of dog
    const exampleMask = await fetch(
      "https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog-mask.png"
    );


    const inputs = {
      prompt: "Change to a lion",
      image: [...new Uint8Array(await exampleInputImage.arrayBuffer())],
      mask: [...new Uint8Array(await exampleMask.arrayBuffer())],
    };


    const response =
      await env.AI.run(
        "@cf/runwayml/stable-diffusion-v1-5-inpainting",
        inputs
      );


    return new Response(response, {
      headers: {
        "content-type": "image/png",
      },
    });
  },
} satisfies ExportedHandler<Env>;
```

curl

```sh
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/runwayml/stable-diffusion-v1-5-inpainting  \
  -X POST  \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"  \
  -d '{ "prompt": "cyberpunk cat" }'
```

## Parameters

\* indicates a required field

### Input

* `prompt` string required min 1

  A text description of the image you want to generate

* `negative_prompt` string

  Text describing elements to avoid in the generated image

* `height` integer min 256 max 2048

  The height of the generated image in pixels

* `width` integer min 256 max 2048

  The width of the generated image in pixels

* `image` array

  For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit unsigned integer values

  * `items` number

    A value between 0 and 255

* `image_b64` string

  For use with img2img tasks. A base64-encoded string of the input image

* `mask` array

  An array representing An array of integers that represent mask image data for inpainting constrained to 8-bit unsigned integer values

  * `items` number

    A value between 0 and 255

* `num_steps` integer default 20 max 20

  The number of diffusion steps; higher values can improve quality but take longer

* `strength` number default 1

  A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lower values make the output closer to the input image

* `guidance` number default 7.5

  Controls how closely the generated image should adhere to the prompt; higher values make the image more aligned with the prompt

* `seed` integer

  Random seed for reproducibility of the image generation

### Output

The binding returns a `ReadableStream` with the image in PNG format.

## API Schemas

The following schemas are based on JSON Schema

* Input

  ```json
  {
      "type": "object",
      "properties": {
          "prompt": {
              "type": "string",
              "minLength": 1,
              "description": "A text description of the image you want to generate"
          },
          "negative_prompt": {
              "type": "string",
              "description": "Text describing elements to avoid in the generated image"
          },
          "height": {
              "type": "integer",
              "minimum": 256,
              "maximum": 2048,
              "description": "The height of the generated image in pixels"
          },
          "width": {
              "type": "integer",
              "minimum": 256,
              "maximum": 2048,
              "description": "The width of the generated image in pixels"
          },
          "image": {
              "type": "array",
              "description": "For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit unsigned integer values",
              "items": {
                  "type": "number",
                  "description": "A value between 0 and 255"
              }
          },
          "image_b64": {
              "type": "string",
              "description": "For use with img2img tasks. A base64-encoded string of the input image"
          },
          "mask": {
              "type": "array",
              "description": "An array representing An array of integers that represent mask image data for inpainting constrained to 8-bit unsigned integer values",
              "items": {
                  "type": "number",
                  "description": "A value between 0 and 255"
              }
          },
          "num_steps": {
              "type": "integer",
              "default": 20,
              "maximum": 20,
              "description": "The number of diffusion steps; higher values can improve quality but take longer"
          },
          "strength": {
              "type": "number",
              "default": 1,
              "description": "A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lower values make the output closer to the input image"
          },
          "guidance": {
              "type": "number",
              "default": 7.5,
              "description": "Controls how closely the generated image should adhere to the prompt; higher values make the image more aligned with the prompt"
          },
          "seed": {
              "type": "integer",
              "description": "Random seed for reproducibility of the image generation"
          }
      },
      "required": [
          "prompt"
      ]
  }
  ```

* Output

  ```json
  {
      "type": "string",
      "contentType": "image/png",
      "format": "binary",
      "description": "The generated image in PNG format"
  }
  ```


---
title: dreamshaper-8-lcm · Cloudflare Workers AI docs
description: Stable Diffusion model that has been fine-tuned to be better at
  photorealism without sacrificing range.
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers-ai/models/dreamshaper-8-lcm/
  md: https://developers.cloudflare.com/workers-ai/models/dreamshaper-8-lcm/index.md
---

l

# dreamshaper-8-lcm Beta

Text-to-Image • lykon

@cf/lykon/dreamshaper-8-lcm

Stable Diffusion model that has been fine-tuned to be better at photorealism without sacrificing range.

| Model Info | |
| - | - |
| More information | [link](https://huggingface.co/Lykon/DreamShaper) |
| Beta | Yes |

## Usage

Workers - TypeScript

```ts
export interface Env {
  AI: Ai;
}


export default {
  async fetch(request, env): Promise<Response> {


    const inputs = {
      prompt: "cyberpunk cat",
    };


    const response = await env.AI.run(
      "@cf/lykon/dreamshaper-8-lcm",
      inputs
    );


    return new Response(response, {
      headers: {
        "content-type": "image/jpg",
      },
    });
  },
} satisfies ExportedHandler<Env>;
```

curl

```sh
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/lykon/dreamshaper-8-lcm  \
  -X POST  \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"  \
  -d '{ "prompt": "cyberpunk cat" }'
```

## Parameters

\* indicates a required field

### Input

* `prompt` string required min 1

  A text description of the image you want to generate

* `negative_prompt` string

  Text describing elements to avoid in the generated image

* `height` integer min 256 max 2048

  The height of the generated image in pixels

* `width` integer min 256 max 2048

  The width of the generated image in pixels

* `image` array

  For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit unsigned integer values

  * `items` number

    A value between 0 and 255

* `image_b64` string

  For use with img2img tasks. A base64-encoded string of the input image

* `mask` array

  An array representing An array of integers that represent mask image data for inpainting constrained to 8-bit unsigned integer values

  * `items` number

    A value between 0 and 255

* `num_steps` integer default 20 max 20

  The number of diffusion steps; higher values can improve quality but take longer

* `strength` number default 1

  A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lower values make the output closer to the input image

* `guidance` number default 7.5

  Controls how closely the generated image should adhere to the prompt; higher values make the image more aligned with the prompt

* `seed` integer

  Random seed for reproducibility of the image generation

### Output

The binding returns a `ReadableStream` with the image in PNG format.

## API Schemas

The following schemas are based on JSON Schema

* Input

  ```json
  {
      "type": "object",
      "properties": {
          "prompt": {
              "type": "string",
              "minLength": 1,
              "description": "A text description of the image you want to generate"
          },
          "negative_prompt": {
              "type": "string",
              "description": "Text describing elements to avoid in the generated image"
          },
          "height": {
              "type": "integer",
              "minimum": 256,
              "maximum": 2048,
              "description": "The height of the generated image in pixels"
          },
          "width": {
              "type": "integer",
              "minimum": 256,
              "maximum": 2048,
              "description": "The width of the generated image in pixels"
          },
          "image": {
              "type": "array",
              "description": "For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit unsigned integer values",
              "items": {
                  "type": "number",
                  "description": "A value between 0 and 255"
              }
          },
          "image_b64": {
              "type": "string",
              "description": "For use with img2img tasks. A base64-encoded string of the input image"
          },
          "mask": {
              "type": "array",
              "description": "An array representing An array of integers that represent mask image data for inpainting constrained to 8-bit unsigned integer values",
              "items": {
                  "type": "number",
                  "description": "A value between 0 and 255"
              }
          },
          "num_steps": {
              "type": "integer",
              "default": 20,
              "maximum": 20,
              "description": "The number of diffusion steps; higher values can improve quality but take longer"
          },
          "strength": {
              "type": "number",
              "default": 1,
              "description": "A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lower values make the output closer to the input image"
          },
          "guidance": {
              "type": "number",
              "default": 7.5,
              "description": "Controls how closely the generated image should adhere to the prompt; higher values make the image more aligned with the prompt"
          },
          "seed": {
              "type": "integer",
              "description": "Random seed for reproducibility of the image generation"
          }
      },
      "required": [
          "prompt"
      ]
  }
  ```

* Output

  ```json
  {
      "type": "string",
      "contentType": "image/png",
      "format": "binary",
      "description": "The generated image in PNG format"
  }
  ```


---
title: stable-diffusion-xl-base-1.0 · Cloudflare Workers AI docs
description: Diffusion-based text-to-image generative model by Stability AI.
  Generates and modify images based on text prompts.
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-base-1.0/
  md: https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-base-1.0/index.md
---

![Stability.ai logo](https://developers.cloudflare.com/_astro/stabilityai.CWXCgVjU.svg)

# stable-diffusion-xl-base-1.0 Beta

Text-to-Image • Stability.ai

@cf/stabilityai/stable-diffusion-xl-base-1.0

Diffusion-based text-to-image generative model by Stability AI. Generates and modify images based on text prompts.

| Model Info | |
| - | - |
| Terms and License | [link](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md) |
| More information | [link](https://stability.ai/stable-diffusion) |
| Beta | Yes |
| Unit Pricing | $0.00 per step |

## Usage

Workers - TypeScript

```ts
export interface Env {
  AI: Ai;
}


export default {
  async fetch(request, env): Promise<Response> {


    const inputs = {
      prompt: "cyberpunk cat",
    };


    const response = await env.AI.run(
      "@cf/stabilityai/stable-diffusion-xl-base-1.0",
      inputs
    );


    return new Response(response, {
      headers: {
        "content-type": "image/jpg",
      },
    });
  },
} satisfies ExportedHandler<Env>;
```

curl

```sh
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0  \
  -X POST  \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"  \
  -d '{ "prompt": "cyberpunk cat" }'
```

## Parameters

\* indicates a required field

### Input

* `prompt` string required min 1

  A text description of the image you want to generate

* `negative_prompt` string

  Text describing elements to avoid in the generated image

* `height` integer min 256 max 2048

  The height of the generated image in pixels

* `width` integer min 256 max 2048

  The width of the generated image in pixels

* `image` array

  For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit unsigned integer values

  * `items` number

    A value between 0 and 255

* `image_b64` string

  For use with img2img tasks. A base64-encoded string of the input image

* `mask` array

  An array representing An array of integers that represent mask image data for inpainting constrained to 8-bit unsigned integer values

  * `items` number

    A value between 0 and 255

* `num_steps` integer default 20 max 20

  The number of diffusion steps; higher values can improve quality but take longer

* `strength` number default 1

  A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lower values make the output closer to the input image

* `guidance` number default 7.5

  Controls how closely the generated image should adhere to the prompt; higher values make the image more aligned with the prompt

* `seed` integer

  Random seed for reproducibility of the image generation

### Output

The binding returns a `ReadableStream` with the image in PNG format.

## API Schemas

The following schemas are based on JSON Schema

* Input

  ```json
  {
      "type": "object",
      "properties": {
          "prompt": {
              "type": "string",
              "minLength": 1,
              "description": "A text description of the image you want to generate"
          },
          "negative_prompt": {
              "type": "string",
              "description": "Text describing elements to avoid in the generated image"
          },
          "height": {
              "type": "integer",
              "minimum": 256,
              "maximum": 2048,
              "description": "The height of the generated image in pixels"
          },
          "width": {
              "type": "integer",
              "minimum": 256,
              "maximum": 2048,
              "description": "The width of the generated image in pixels"
          },
          "image": {
              "type": "array",
              "description": "For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit unsigned integer values",
              "items": {
                  "type": "number",
                  "description": "A value between 0 and 255"
              }
          },
          "image_b64": {
              "type": "string",
              "description": "For use with img2img tasks. A base64-encoded string of the input image"
          },
          "mask": {
              "type": "array",
              "description": "An array representing An array of integers that represent mask image data for inpainting constrained to 8-bit unsigned integer values",
              "items": {
                  "type": "number",
                  "description": "A value between 0 and 255"
              }
          },
          "num_steps": {
              "type": "integer",
              "default": 20,
              "maximum": 20,
              "description": "The number of diffusion steps; higher values can improve quality but take longer"
          },
          "strength": {
              "type": "number",
              "default": 1,
              "description": "A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lower values make the output closer to the input image"
          },
          "guidance": {
              "type": "number",
              "default": 7.5,
              "description": "Controls how closely the generated image should adhere to the prompt; higher values make the image more aligned with the prompt"
          },
          "seed": {
              "type": "integer",
              "description": "Random seed for reproducibility of the image generation"
          }
      },
      "required": [
          "prompt"
      ]
  }
  ```

* Output

  ```json
  {
      "type": "string",
      "contentType": "image/png",
      "format": "binary",
      "description": "The generated image in PNG format"
  }
  ```
