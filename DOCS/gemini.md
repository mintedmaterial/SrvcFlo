Gemini API libraries

When building with the Gemini API, we recommend using the Google GenAI SDK. These are the official, production-ready libraries that we develop and maintain for the most popular languages. They are in General Availability and used in all our official documentation and examples.

Note: If you're using one of our legacy libraries, we strongly recommend you migrate to the Google GenAI SDK. Review the legacy libraries section for more information.
If you're new to the Gemini API, follow our quickstart guide to get started.

Language support and installation
The Google GenAI SDK is available for the Python, JavaScript/TypeScript, Go and Java languages. You can install each language's library using package managers, or visit their GitHub repos for further engagement:

Python
JavaScript
Go
Java
Library: @google/genai

GitHub Repository: googleapis/js-genai

Installation: npm install @google/genai

General availability
We started rolling out Google GenAI SDK, a new set of libraries to access Gemini API, in late 2024 when we launched Gemini 2.0.

As of May 2025, they reached General Availability (GA) across all supported platforms and are the recommended libraries to access the Gemini API. They are stable, fully supported for production use, and are actively maintained. They provide access to the latest features, and offer the best performance working with Gemini.

If you're using one of our legacy libraries, we strongly recommend you migrate so that you can access the latest features and get the best performance working with Gemini. Review the legacy libraries section for more information.

Legacy libraries and migration
If you are using one of our legacy libraries, we recommend that you migrate to the new libraries.

The legacy libraries don't provide access to recent features (such as Live API and Veo) and are on a deprecation path. They will stop receiving updates at the end of September 2025, the feature gaps will grow and potential bugs may no longer get fixed.

Each legacy library's support status varies, detailed in the following table:

Language	Legacy library	Support status	Recommended library
Python	google-generativeai	All support, including bug fixes, ends end of September 2025.	google-genai
JavaScript/TypeScript	@google/generativeai	All support, including bug fixes, ends end of September 2025.	@google/genai
Go	google.golang.org/generative-ai	All support, including bug fixes, ends end of September 2025.	google.golang.org/genai
Dart and Flutter	google_generative_ai	Not actively maintained	Use trusted community or third party libraries, like firebase_ai, or access using REST API
Swift	generative-ai-swift	Not actively maintained	Use Firebase AI Logic
Android	generative-ai-android	Not actively maintained	Use Firebase AI Logic
Note for Java developers: There was no legacy Google-provided Java SDK for the Gemini API, so no migration from a previous Google library is required. You can start directly with the new library in the Language support and installation section.

Prompt templates for code generation
Generative models (e.g., Gemini, Claude) and AI-powered IDEs (e.g., Cursor) may produce code for the Gemini API using outdated or deprecated libraries due to their training data cutoff. For the generated code to use the latest, recommended libraries, provide version and usage guidance directly in your prompts. You can use the templates below to provide the necessary context:

Python

JavaScript/TypeScript


veo-3.0-generate-preview


Image generation

You can generate images using the Gemini API with either Gemini's built-in multimodal capabilities or Imagen, Google's specialized image generation models. For most use cases, start with Gemini. Choose Imagen for specialized tasks where image quality is critical. See Choosing the right model section for more guidance.

All generated images include a SynthID watermark.

Before you begin
Ensure you use a supported model and version for image generation:

For Gemini, use Gemini 2.0 Flash Preview Image Generation.

For Imagen, use one of the Imagen models (Imagen 3, Imagen 4 or Imagen 4 Ultra).

Note that those models are only available on the Paid tier.
You can access both Gemini and Imagen models using the same libraries.

Note: Image generation may not be available in all regions and countries, review our Models page for more information.
Generate images using Gemini
Gemini can generate and process images conversationally. You can prompt Gemini with text, images, or a combination of both to achieve various image-related tasks, such as image generation and editing.

You must include responseModalities: ["TEXT", "IMAGE"] in your configuration. Image-only output is not supported with these models.

Image generation (text-to-image)
The following code demonstrates how to generate an image based on a descriptive prompt:

Python
JavaScript
Go
REST
Note: We've released the Google SDK for TypeScript and JavaScript in preview launch stage. Use this SDK for image generation features.

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  const contents =
    "Hi, can you create a 3d rendered image of a pig " +
    "with wings and a top hat flying over a happy " +
    "futuristic scifi city with lots of greenery?";

  // Set responseModalities to include "Image" so the model can generate  an image
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });
  for (const part of response.candidates[0].content.parts) {
    // Based on the part type, either show the text or save the image
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("gemini-native-image.png", buffer);
      console.log("Image saved as gemini-native-image.png");
    }
  }
}

main();
AI-generated image of a fantastical flying pig
AI-generated image of a fantastical flying pig
Image editing (text-and-image-to-image)
To perform image editing, add an image as input. The following example demonstrates uploading base64 encoded images. For multiple images and larger payloads, check the image input section.

Python
JavaScript
Go
REST
Note: We've released the Google SDK for TypeScript and JavaScript in preview launch stage. Use this SDK for image generation features.

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  // Load the image from the local file system
  const imagePath = "path/to/image.png";
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  // Prepare the content parts
  const contents = [
    { text: "Can you add a llama next to the image?" },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
  ];

  // Set responseModalities to include "Image" so the model can generate an image
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });
  for (const part of response.candidates[0].content.parts) {
    // Based on the part type, either show the text or save the image
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("gemini-native-image.png", buffer);
      console.log("Image saved as gemini-native-image.png");
    }
  }
}

main();
Other image generation modes
Gemini supports other image interaction modes based on prompt structure and context, including:

Text to image(s) and text (interleaved): Outputs images with related text.
Example prompt: "Generate an illustrated recipe for a paella."
Image(s) and text to image(s) and text (interleaved): Uses input images and text to create new related images and text.
Example prompt: (With an image of a furnished room) "What other color sofas would work in my space? can you update the image?"
Multi-turn image editing (chat): Keep generating / editing images conversationally.
Example prompts: [upload an image of a blue car.] , "Turn this car into a convertible.", "Now change the color to yellow."
Limitations
For best performance, use the following languages: EN, es-MX, ja-JP, zh-CN, hi-IN.
Image generation does not support audio or video inputs.
Image generation may not always trigger:
The model may output text only. Try asking for image outputs explicitly (e.g. "generate an image", "provide images as you go along", "update the image").
The model may stop generating partway through. Try again or try a different prompt.
When generating text for an image, Gemini works best if you first generate the text and then ask for an image with the text.
There are some regions/countries where Image generation is not available. See Models for more information.
Generate images using the Imagen models
This example demonstrates generating images with an Imagen model:

Python
JavaScript
Go
REST

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-preview-06-06',
    prompt: 'Robot holding a red skateboard',
    config: {
      numberOfImages: 4,
    },
  });

  let idx = 1;
  for (const generatedImage of response.generatedImages) {
    let imgBytes = generatedImage.image.imageBytes;
    const buffer = Buffer.from(imgBytes, "base64");
    fs.writeFileSync(`imagen-${idx}.png`, buffer);
    idx++;
  }
}

main();
AI-generated image of a robot holding a red skateboard
AI-generated image of a robot holding a red skateboard
Imagen configuration
Imagen supports English only prompts at this time and the following parameters:

Note: Naming conventions of parameters vary by programming language.
numberOfImages: The number of images to generate, from 1 to 4 (inclusive). The default is 4. For Imagen 4 Ultra, it defaults to 1 as only one image can be generated at a time.
aspectRatio: Changes the aspect ratio of the generated image. Supported values are "1:1", "3:4", "4:3", "9:16", and "16:9". The default is "1:1".
personGeneration: Allow the model to generate images of people. The following values are supported:

"dont_allow": Block generation of images of people.
"allow_adult": Generate images of adults, but not children. This is the default.
"allow_all": Generate images that include adults and children.
Note: The "allow_all" parameter value is not allowed in EU, UK, CH, MENA locations.
Choosing the right model
Choose Gemini when:

You need contextually relevant images that leverage world knowledge and reasoning.
Seamlessly blending text and images is important.
You want accurate visuals embedded within long text sequences.
You want to edit images conversationally while maintaining context.
Choose Imagen when:

Image quality, photorealism, artistic detail, or specific styles (e.g., impressionism, anime) are top priorities.
Performing specialized editing tasks like product background updates or image upscaling.
Infusing branding, style, or generating logos and product designs.
Imagen 4 should be your go-to model starting to generate images with Imagen. Choose Imagen 4 Ultra for advanced use-cases or when you need the best image quality. Note that Imagen 4 Ultra can only generate one image at a time.

Imagen prompt guide
This section of the Imagen guide shows you how modifying a text-to-image prompt can produce different results, along with examples of images you can create.

Prompt writing basics
Note: Maximum prompt length is 480 tokens.
A good prompt is descriptive and clear, and makes use of meaningful keywords and modifiers. Start by thinking of your subject, context, and style.

Prompt with subject, context, and style emphasized
Image text: A sketch (style) of a modern apartment building (subject) surrounded by skyscrapers (context and background).
Subject: The first thing to think about with any prompt is the subject: the object, person, animal, or scenery you want an image of.

Context and background: Just as important is the background or context in which the subject will be placed. Try placing your subject in a variety of backgrounds. For example, a studio with a white background, outdoors, or indoor environments.

Style: Finally, add the style of image you want. Styles can be general (painting, photograph, sketches) or very specific (pastel painting, charcoal drawing, isometric 3D). You can also combine styles.

After you write a first version of your prompt, refine your prompt by adding more details until you get to the image that you want. Iteration is important. Start by establishing your core idea, and then refine and expand upon that core idea until the generated image is close to your vision.

photorealistic sample image 1
Prompt: A park in the spring next to a lake
photorealistic sample image 2
Prompt: A park in the spring next to a lake, the sun sets across the lake, golden hour
photorealistic sample image 3
Prompt: A park in the spring next to a lake, the sun sets across the lake, golden hour, red wildflowers
Imagen models can transform your ideas into detailed images, whether your prompts are short or long and detailed. Refine your vision through iterative prompting, adding details until you achieve the perfect result.

Short prompts let you generate an image quickly.

Imagen 3 short prompt example
Prompt: close-up photo of a woman in her 20s, street photography, movie still, muted orange warm tones
Longer prompts let you add specific details and build your image.

Imagen 3 long prompt example
Prompt: captivating photo of a woman in her 20s utilizing a street photography style. The image should look like a movie still with muted orange warm tones.
Additional advice for Imagen prompt writing:

Use descriptive language: Employ detailed adjectives and adverbs to paint a clear picture for Imagen.
Provide context: If necessary, include background information to aid the AI's understanding.
Reference specific artists or styles: If you have a particular aesthetic in mind, referencing specific artists or art movements can be helpful.
Use prompt engineering tools: Consider exploring prompt engineering tools or resources to help you refine your prompts and achieve optimal results.
Enhancing the facial details in your personal and group images: Specify facial details as a focus of the photo (for example, use the word "portrait" in the prompt).
Generate text in images
Imagen models can add text into images, opening up more creative image generation possibilities. Use the following guidance to get the most out of this feature:

Iterate with confidence: You might have to regenerate images until you achieve the look you want. Imagen's text integration is still evolving, and sometimes multiple attempts yield the best results.
Keep it short: Limit text to 25 characters or less for optimal generation.
Multiple phrases: Experiment with two or three distinct phrases to provide additional information. Avoid exceeding three phrases for cleaner compositions.

Imagen 3 generate text example
Prompt: A poster with the text "Summerland" in bold font as a title, underneath this text is the slogan "Summer never felt so good"
Guide Placement: While Imagen can attempt to position text as directed, expect occasional variations. This feature is continually improving.

Inspire font style: Specify a general font style to subtly influence Imagen's choices. Don't rely on precise font replication, but expect creative interpretations.

Font size: Specify a font size or a general indication of size (for example, small, medium, large) to influence the font size generation.

Prompt parameterization
To better control output results, you might find it helpful to parameterize the inputs into Imagen. For example, suppose you want your customers to be able to generate logos for their business, and you want to make sure logos are always generated on a solid color background. You also want to limit the options that the client can select from a menu.

In this example, you can create a parameterized prompt similar to the following:


A {logo_style} logo for a {company_area} company on a solid color background. Include the text {company_name}.
In your custom user interface, the customer can input the parameters using a menu, and their chosen value populates the prompt Imagen receives.

For example:

Prompt: A minimalist logo for a health care company on a solid color background. Include the text Journey.

Imagen 3 prompt parameterization example 1

Prompt: A modern logo for a software company on a solid color background. Include the text Silo.

Imagen 3 prompt parameterization example 2

Prompt: A traditional logo for a baking company on a solid color background. Include the text Seed.

Imagen 3 prompt parameterization example 3

Advanced prompt writing techniques
Use the following examples to create more specific prompts based on attributes like photography descriptors, shapes and materials, historical art movements, and image quality modifiers.

Photography
Prompt includes: "A photo of..."
To use this style, start with using keywords that clearly tell Imagen that you're looking for a photograph. Start your prompts with "A photo of. . .". For example:

photorealistic sample image 1
Prompt: A photo of coffee beans in a kitchen on a wooden surface
photorealistic sample image 2
Prompt: A photo of a chocolate bar on a kitchen counter
photorealistic sample image 3
Prompt: A photo of a modern building with water in the background
Image source: Each image was generated using its corresponding text prompt with the Imagen 3 model.

Photography modifiers
In the following examples, you can see several photography-specific modifiers and parameters. You can combine multiple modifiers for more precise control.

Camera Proximity - Close up, taken from far away


close up camera sample image
Prompt: A close-up photo of coffee beans
zoomed out camera sample image
Prompt: A zoomed out photo of a small bag of
coffee beans in a messy kitchen
Camera Position - aerial, from below

aerial photo sample image
Prompt: aerial photo of urban city with skyscrapers
a view from underneath sample image
Prompt: A photo of a forest canopy with blue skies from below
Lighting - natural, dramatic, warm, cold

natural lighting sample image
Prompt: studio photo of a modern arm chair, natural lighting
dramatic lighting sample image
Prompt: studio photo of a modern arm chair, dramatic lighting
Camera Settings - motion blur, soft focus, bokeh, portrait

motion blur sample image
Prompt: photo of a city with skyscrapers from the inside of a car with motion blur
soft focus sample image
Prompt: soft focus photograph of a bridge in an urban city at night
Lens types - 35mm, 50mm, fisheye, wide angle, macro

macro lens sample image
Prompt: photo of a leaf, macro lens
fisheye lens sample image
Prompt: street photography, new york city, fisheye lens
Film types - black and white, polaroid

polaroid photo sample image
Prompt: a polaroid portrait of a dog wearing sunglasses
black and white photo sample image
Prompt: black and white photo of a dog wearing sunglasses
Image source: Each image was generated using its corresponding text prompt with the Imagen 3 model.

Illustration and art
Prompt includes: "A painting of...", "A sketch of..."
Art styles vary from monochrome styles like pencil sketches, to hyper-realistic digital art. For example, the following images use the same prompt with different styles:

"An [art style or creation technique] of an angular sporty electric sedan with skyscrapers in the background"

art sample images
Prompt: A technical pencil drawing of an angular...
art sample images
Prompt: A charcoal drawing of an angular...
art sample images
Prompt: A color pencil drawing of an angular...
art sample images
Prompt: A pastel painting of an angular...
art sample images
Prompt: A digital art of an angular...
art sample images
Prompt: An art deco (poster) of an angular...
Image source: Each image was generated using its corresponding text prompt with the Imagen 2 model.

Shapes and materials
Prompt includes: "...made of...", "...in the shape of..."
One of the strengths of this technology is that you can create imagery that is otherwise difficult or impossible. For example, you can recreate your company logo in different materials and textures.

shapes and materials example image 1
Prompt: a duffle bag made of cheese
shapes and materials example image 2
Prompt: neon tubes in the shape of a bird
shapes and materials example image 3
Prompt: an armchair made of paper, studio photo, origami style
Image source: Each image was generated using its corresponding text prompt with the Imagen 3 model.

Historical art references
Prompt includes: "...in the style of..."
Certain styles have become iconic over the years. The following are some ideas of historical painting or art styles that you can try.

"generate an image in the style of [art period or movement] : a wind farm"

impressionism example image
Prompt: generate an image in the style of an impressionist painting: a wind farm
renaissance example image
Prompt: generate an image in the style of a renaissance painting: a wind farm
pop art example image
Prompt: generate an image in the style of pop art: a wind farm
Image source: Each image was generated using its corresponding text prompt with the Imagen 3 model.

Image quality modifiers
Certain keywords can let the model know that you're looking for a high-quality asset. Examples of quality modifiers include the following:

General Modifiers - high-quality, beautiful, stylized
Photos - 4K, HDR, Studio Photo
Art, Illustration - by a professional, detailed
The following are a few examples of prompts without quality modifiers and the same prompt with quality modifiers.

corn example image without modifiers
Prompt (no quality modifiers): a photo of a corn stalk
corn example image with modifiers
Prompt (with quality modifiers): 4k HDR beautiful
photo of a corn stalk taken by a
professional photographer
Image source: Each image was generated using its corresponding text prompt with the Imagen 3 model.

Aspect ratios
Imagen image generation lets you set five distinct image aspect ratios.

Square (1:1, default) - A standard square photo. Common uses for this aspect ratio include social media posts.
Fullscreen (4:3) - This aspect ratio is commonly used in media or film. It is also the dimensions of most old (non-widescreen) TVs and medium format cameras. It captures more of the scene horizontally (compared to 1:1), making it a preferred aspect ratio for photography.

aspect ratio example
Prompt: close up of a musician's fingers playing the piano, black and white film, vintage (4:3 aspect ratio)
aspect ratio example
Prompt: A professional studio photo of french fries for a high end restaurant, in the style of a food magazine (4:3 aspect ratio)
Portrait full screen (3:4) - This is the fullscreen aspect ratio rotated 90 degrees. This lets to capture more of the scene vertically compared to the 1:1 aspect ratio.

aspect ratio example
Prompt: a woman hiking, close of her boots reflected in a puddle, large mountains in the background, in the style of an advertisement, dramatic angles (3:4 aspect ratio)
aspect ratio example
Prompt: aerial shot of a river flowing up a mystical valley (3:4 aspect ratio)
Widescreen (16:9) - This ratio has replaced 4:3 and is now the most common aspect ratio for TVs, monitors, and mobile phone screens (landscape). Use this aspect ratio when you want to capture more of the background (for example, scenic landscapes).

aspect ratio example
Prompt: a man wearing all white clothing sitting on the beach, close up, golden hour lighting (16:9 aspect ratio)
Portrait (9:16) - This ratio is widescreen but rotated. This a relatively new aspect ratio that has been popularized by short form video apps (for example, YouTube shorts). Use this for tall objects with strong vertical orientations such as buildings, trees, waterfalls, or other similar objects.

aspect ratio example
Prompt: a digital render of a massive skyscraper, modern, grand, epic with a beautiful sunset in the background (9:16 aspect ratio)
Photorealistic images
Different versions of the image generation model might offer a mix of artistic and photorealistic output. Use the following wording in prompts to generate more photorealistic output, based on the subject you want to generate.

Note: Take these keywords as general guidance when you try to create photorealistic images. They aren't required to achieve your goal.
Use case	Lens type	Focal lengths	Additional details
People (portraits)	Prime, zoom	24-35mm	black and white film, Film noir, Depth of field, duotone (mention two colors)
Food, insects, plants (objects, still life)	Macro	60-105mm	High detail, precise focusing, controlled lighting
Sports, wildlife (motion)	Telephoto zoom	100-400mm	Fast shutter speed, Action or movement tracking
Astronomical, landscape (wide-angle)	Wide-angle	10-24mm	Long exposure times, sharp focus, long exposure, smooth water or clouds
Portraits
Use case	Lens type	Focal lengths	Additional details
People (portraits)	Prime, zoom	24-35mm	black and white film, Film noir, Depth of field, duotone (mention two colors)
Using several keywords from the table, Imagen can generate the following portraits:

portrait photography example	portrait photography example	portrait photography example	portrait photography example
Prompt: A woman, 35mm portrait, blue and grey duotones
Model: imagen-3.0-generate-002

portrait photography example	portrait photography example	portrait photography example	portrait photography example
Prompt: A woman, 35mm portrait, film noir
Model: imagen-3.0-generate-002

Objects
Use case	Lens type	Focal lengths	Additional details
Food, insects, plants (objects, still life)	Macro	60-105mm	High detail, precise focusing, controlled lighting
Using several keywords from the table, Imagen can generate the following object images:

object photography example	object photography example	object photography example	object photography example
Prompt: leaf of a prayer plant, macro lens, 60mm
Model: imagen-3.0-generate-002

object photography example	object photography example	object photography example	object photography example
Prompt: a plate of pasta, 100mm Macro lens
Model: imagen-3.0-generate-002

Motion
Use case	Lens type	Focal lengths	Additional details
Sports, wildlife (motion)	Telephoto zoom	100-400mm	Fast shutter speed, Action or movement tracking
Using several keywords from the table, Imagen can generate the following motion images:

motion photography example	motion photography example	motion photography example	motion photography example
Prompt: a winning touchdown, fast shutter speed, movement tracking
Model: imagen-3.0-generate-002

motion photography example	motion photography example	motion photography example	motion photography example
Prompt: A deer running in the forest, fast shutter speed, movement tracking
Model: imagen-3.0-generate-002

Wide-angle
Use case	Lens type	Focal lengths	Additional details
Astronomical, landscape (wide-angle)	Wide-angle	10-24mm	Long exposure times, sharp focus, long exposure, smooth water or clouds
Using several keywords from the table, Imagen can generate the following wide-angle images:

wide-angle photography example	wide-angle photography example	wide-angle photography example	wide-angle photography example
Prompt: an expansive mountain range, landscape wide angle 10mm
Model: imagen-3.0-generate-002

wide-angle photography example	wide-angle photography example	wide-angle photography example	wide-angle photography example
Prompt: a photo of the moon, astro photography, wide angle 10mm
Model: imagen-3.0-generate-002


Generate videos with Veo 3

Veo 3 is Google's state-of-the-art model for generating high-fidelity, 8-second 720p videos from a text prompt, featuring stunning realism and natively generated audio. Veo 3 excels at a wide range of visual and cinematic styles. Choose an example below to see how to generate a video with dialogue, cinematic realism, or creative animation.

Dialogue & Sound Effects Cinematic Realism Creative Animation

Python
JavaScript
Go
REST

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const prompt = `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`;

let operation = await ai.models.generateVideos({
    model: "veo-3.0-generate-preview",
    prompt: prompt,
});

// Poll the operation status until the video is ready
while (!operation.done) {
    console.log("Waiting for video generation to complete...")
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({
        operation: operation,
    });
}

// Download the generated video
ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: "dialogue_example.mp4",
});
console.log(`Generated video saved to dialogue_example.mp4`);

Generating videos from images
The following code demonstrates generating an image using Imagen, then using that image as the starting frame for the video.

Note: Veo 3 image to video is coming soon! You can use Veo 2 (no audio) until then.
Python
JavaScript
Go

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const prompt = "Panning wide shot of a calico kitten sleeping in the sunshine";

// Step 1: Generate an image with Imagen
const imagenResponse = await ai.models.generateImages({
  model: "imagen-3.0-generate-002",
  prompt: prompt,
});

// Step 2: Generate video with Veo 2 using the image
let operation = await ai.models.generateVideos({
  model: "veo-2.0-generate-001", // Use Veo 2
  prompt: prompt,
  image: {
    imageBytes: imagenResponse.generatedImages[0].image.imageBytes,
    mimeType: "image/png",
  },
});

// Poll the operation status until the video is ready
while (!operation.done) {
  console.log("Waiting for video generation to complete...")
  await new Promise((resolve) => setTimeout(resolve, 10000));
  operation = await ai.operations.getVideosOperation({
    operation: operation,
  });
}

// Download the video
ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: "veo2_with_image_input.mp4",
});
console.log(`Generated video saved to veo2_with_image_input.mp4`);
Video generation parameters and specifications
These are the parameters you can set in your API request to control the video generation process.

Parameter	Description	Veo 3 (Preview)	Veo 2 (Stable)
prompt	The text description for the video. Supports audio cues.	string	string
negativePrompt	Text describing what to avoid in the video.	string	string
image	An initial image to animate.	Not Supported	Image object
aspectRatio	The video's aspect ratio.	"16:9"	"16:9", "9:16"
personGeneration	Controls the generation of people.	"allow_all"	"allow_all", "allow_adult", "dont_allow"
You can customize your video generation by setting parameters in your request. For example you can specify negativePrompt to guide the model.

Python
JavaScript
Go
REST

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

let operation = await ai.models.generateVideos({
  model: "veo-3.0-generate-preview",
  prompt: "A cinematic shot of a majestic lion in the savannah.",
  config: {
    aspectRatio: "16:9",
    negativePrompt: "cartoon, drawing, low quality"
  },
});

// Poll the operation status until the video is ready
while (!operation.done) {
  console.log("Waiting for video generation to complete...")
  await new Promise((resolve) => setTimeout(resolve, 10000));
  operation = await ai.operations.getVideosOperation({
    operation: operation,
  });
}

// Download the generated video
ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: "parameters_example.mp4",
});
console.log(`Generated video saved to parameters_example.mp4`);
Handling Asynchronous Operations
Video generation is a computationally intensive task. When you send a request, the API starts a long-running job and immediately returns an operation object. You must then poll until the video is ready, which is indicated by the done status being true.

The core of this process is a polling loop, which periodically checks the job's status.

Python
JavaScript

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

// After starting the job, you get an operation object
let operation = await ai.models.generateVideos({
  model: "veo-3.0-generate-preview",
  prompt: "A cinematic shot of a majestic lion in the savannah.",
});

// Alternatively, you can use the operation.name to get the operation
// operation = types.GenerateVideosOperation(name=operation.name)

// This loop checks the job status every 10 seconds
while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Refresh the operation object to get the latest status
    operation = await ai.operations.getVideosOperation({ operation });
}

// Once done, the result is in operation.response
// ... process and download your video ...
Model Features
Feature	Description	Veo 3 (Preview)	Veo 2 (Stable)
Audio	Natively generates audio with video.	✔️ Always on	❌ Silent only
Input Modalities	The type of input used for generation.	Text-to-Video	Text-to-Video, Image-to-Video
Resolution	The output resolution of the video.	720p	720p
Frame Rate	The output frame rate of the video.	24fps	24fps
Video Duration	Length of the generated video.	8 seconds	5-8 seconds
Videos per Request	Number of videos generated per request.	1	1 or 2
Status & Details	Model availability and further details.	Preview	Stable
Check out the Models, Pricing, and Rate limits pages for more usage limitations for Veo.

Veo prompt guide
This section contains examples of videos you can create using Veo, and shows you how to modify prompts to produce distinct results.

Safety filters
Veo applies safety filters across Gemini to help ensure that generated videos and uploaded photos don't contain offensive content. Prompts that violate our terms and guidelines are blocked.

Prompting for Audio (Veo 3)
With Veo 3, you can provide cues for sound effects, ambient noise, and dialogue. The model captures the nuance of these cues to generate a synchronized soundtrack.

Dialogue: Use quotes for specific speech. (Example: "This must be the key," he murmured.)
Sound Effects (SFX): Explicitly describe sounds. (Example: tires screeching loudly, engine roaring.)
Ambient Noise: Describe the environment's soundscape. (Example: A faint, eerie hum resonates in the background.)
These videos demonstrate prompting Veo 3's audio generation with increasing levels of detail.

Prompt	Generated output
More detail (Dialogue and Ambience)
A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. "This must be the key," he murmured, tracing the pattern. "What does it mean though?" she asked, puzzled, tilting her head. Damp stone, intricate carvings, hidden symbols. A faint, eerie hum resonates in the background.	Treasure hunters in a cave.
Less detail (Dialogue)
Camping (Stop Motion): Camper: "I'm one with nature now!" Bear: "Nature would prefer some personal space".	Treasure hunters in a cave.
Try out these prompts yourself to hear the audio! Try Veo 3

Prompt writing basics
Good prompts are descriptive and clear. To get the most out of Veo, start with identifying your core idea, refine your idea by adding keywords and modifiers, and incorporate video-specific terminology into your prompts.

The following elements should be included in your prompt:

Subject: The object, person, animal, or scenery that you want in your video, such as cityscape, nature, vehicles, or puppies.
Action: What the subject is doing (for example, walking, running, or turning their head).
Style: Specify creative direction using specific film style keywords, such as sci-fi, horror film, film noir, or animated styles like cartoon.
Camera positioning and motion: [Optional] Control the camera's location and movement using terms like aerial view, eye-level, top-down shot, dolly shot, or worms eye.
Composition: [Optional] How the shot is framed, such as wide shot, close-up, single-shot or two-shot.
Focus and lens effects: [Optional] Use terms like shallow focus, deep focus, soft focus, macro lens, and wide-angle lens to achieve specific visual effects.
Ambiance: [Optional] How the color and light contribute to the scene, such as blue tones, night, or warm tones.
More tips for writing prompts
Use descriptive language: Use adjectives and adverbs to paint a clear picture for Veo.
Enhance the facial details: Specify facial details as a focus of the photo like using the word portrait in the prompt.
For more comprehensive prompting strategies, visit Introduction to prompt design.

Example prompts and output
This section presents several prompts, highlighting how descriptive details can elevate the outcome of each video.

Icicles
This video demonstrates how you can use the elements of prompt writing basics in your prompt.

Prompt	Generated output
Close up shot (composition) of melting icicles (subject) on a frozen rock wall (context) with cool blue tones (ambiance), zoomed in (camera motion) maintaining close-up detail of water drips (action).	Dripping icicles with a blue background.
Man on the phone
These videos demonstrate how you can revise your prompt with increasingly specific details to get Veo to refine the output to your liking.

Prompt	Generated output
Less detail
The camera dollies to show a close up of a desperate man in a green trench coat. He's making a call on a rotary-style wall phone with a green neon light. It looks like a movie scene.	Man talking on the phone.
More detail
A close-up cinematic shot follows a desperate man in a weathered green trench coat as he dials a rotary phone mounted on a gritty brick wall, bathed in the eerie glow of a green neon sign. The camera dollies in, revealing the tension in his jaw and the desperation etched on his face as he struggles to make the call. The shallow depth of field focuses on his furrowed brow and the black rotary phone, blurring the background into a sea of neon colors and indistinct shadows, creating a sense of urgency and isolation.	Man talking on the phone
Snow leopard
Prompt	Generated output
Simple prompt:
A cute creature with snow leopard-like fur is walking in winter forest, 3D cartoon style render.	Snow leopard is lethargic.
Detailed prompt:
Create a short 3D animated scene in a joyful cartoon style. A cute creature with snow leopard-like fur, large expressive eyes, and a friendly, rounded form happily prances through a whimsical winter forest. The scene should feature rounded, snow-covered trees, gentle falling snowflakes, and warm sunlight filtering through the branches. The creature's bouncy movements and wide smile should convey pure delight. Aim for an upbeat, heartwarming tone with bright, cheerful colors and playful animation.	Snow leopard is running faster.
Examples by writing elements
These examples show you how to refine your prompts by each basic element.

Subject and Context
Specify the main focus (subject) and the background or environment (context).

Prompt	Generated output
An architectural rendering of a white concrete apartment building with flowing organic shapes, seamlessly blending with lush greenery and futuristic elements	Placeholder.
A satellite floating through outer space with the moon and some stars in the background.	Satellite floating in the atmosphere.
Action
Specify what the subject is doing (e.g., walking, running, or turning their head).

Prompt	Generated output
A wide shot of a woman walking along the beach, looking content and relaxed towards the horizon at sunset.	Sunset is absolutely beautiful.
Style
Add keywords to steer the generation toward a specific aesthetic (e.g., surreal, vintage, futuristic, film noir).

Prompt	Generated output
Film noir style, man and woman walk on the street, mystery, cinematic, black and white.	Film noir style is absolutely beautiful.
Camera motion and Composition
Specify how the camera moves (POV shot, aerial view, tracking drone view) and how the shot is framed (wide shot, close-up, low angle).

Prompt	Generated output
A POV shot from a vintage car driving in the rain, Canada at night, cinematic.	Sunset is absolutely beautiful.
Extreme close-up of a an eye with city reflected in it.	Sunset is absolutely beautiful.
Ambiance
Color palettes and lighting influence the mood. Try terms like "muted orange warm tones," "natural light," "sunrise," or "cool blue tones."

Prompt	Generated output
A close-up of a girl holding adorable golden retriever puppy in the park, sunlight.	A puppy in a young girl's arms.
Cinematic close-up shot of a sad woman riding a bus in the rain, cool blue tones, sad mood.	A woman riding on a bus that feels sad.
Use reference images to generate videos
You can bring images to life by using Veo's image-to-video capability.

Prompt	Generated output
Input Image (Generated by Imagen)
Bunny with a chocolate candy bar.	Bunny is running away.
Output Video (Generated by Veo 2)
Bunny runs away.	Bunny is running away.
Negative prompts
Negative prompts specify elements you don't want in the video.

❌ Don't use instructive language like no or don't. (e.g., "No walls").
✅ Do describe what you don't want to see. (e.g., "wall, frame").
Prompt	Generated output
Without Negative Prompt:
Generate a short, stylized animation of a large, solitary oak tree with leaves blowing vigorously in a strong wind... [truncated]	Tree with using words.
With Negative Prompt:
[Same prompt]

Negative prompt: urban background, man-made structures, dark, stormy, or threatening atmosphere.	Tree with no negative words.
Aspect ratios
Veo allows you to specify the aspect ratio for your video.

Prompt	Generated output
Widescreen (16:9)
Create a video with a tracking drone view of a man driving a red convertible car in Palm Springs, 1970s, warm sunlight, long shadows.	A man driving a red convertible car in Palm Springs, 1970s style.
Portrait (9:16 - Veo 2 only)
Create a video highlighting the smooth motion of a majestic Hawaiian waterfall within a lush rainforest. Focus on realistic water flow, detailed foliage, and natural lighting to convey tranquility. Capture the rushing water, misty atmosphere, and dappled sunlight filtering through the dense canopy. Use smooth, cinematic camera movements to showcase the waterfall and its surroundings. Aim for a peaceful, realistic tone, transporting the viewer to the serene beauty of the Hawaiian rainforest.	A majestic Hawaiian waterfall in a lush rainforest.
Limitations
Request latency: Min: 11 seconds; Max: 6 minutes (during peak hours).
Regional Limitations: personGeneration: "allow_all" (the default in Veo 3) and Image-to-video personGeneration (Veo 2) are not allowed in EU, UK, CH, MENA locations.
Video Retention: Generated videos are stored on the server for 2 days, after which they are removed. To save a local copy, you must download your video within 2 days of generation.
Watermarking: Videos created by Veo are watermarked using SynthID, our tool for watermarking and identifying AI-generated content.
Safety: Generated videos are passed through safety filters and memorization checking processes that help mitigate privacy, copyright and bias risks.




