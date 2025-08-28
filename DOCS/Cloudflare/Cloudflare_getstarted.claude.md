---
title: Getting started · Cloudflare Workers AI docs
description: "There are several options to build your Workers AI projects on
  Cloudflare. To get started, choose your preferred method:"
lastUpdated: 2025-04-03T16:21:18.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers-ai/get-started/
  md: https://developers.cloudflare.com/workers-ai/get-started/index.md
---

There are several options to build your Workers AI projects on Cloudflare. To get started, choose your preferred method:

* [Workers Bindings](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/)
* [REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)
* [Dashboard](https://developers.cloudflare.com/workers-ai/get-started/dashboard/)

Note

These examples are geared towards creating new Workers AI projects. For help adding Workers AI to an existing Worker, refer to [Workers Bindings](https://developers.cloudflare.com/workers-ai/configuration/bindings/).



---
title: Get started - Workers and Wrangler · Cloudflare Workers AI docs
description: Deploy your first Cloudflare Workers AI project using the CLI.
lastUpdated: 2025-04-03T16:21:18.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/
  md: https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/index.md
---

This guide will instruct you through setting up and deploying your first Workers AI project. You will use [Workers](https://developers.cloudflare.com/workers/), a Workers AI binding, and a large language model (LLM) to deploy your first AI-powered application on the Cloudflare global network.

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Install [`Node.js`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

Node.js version manager

Use a Node version manager like [Volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm) to avoid permission issues and change Node.js versions. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), discussed later in this guide, requires a Node version of `16.17.0` or later.

## 1. Create a Worker project

You will create a new Worker project using the `create-cloudflare` CLI (C3). [C3](https://github.com/cloudflare/workers-sdk/tree/main/packages/create-cloudflare) is a command-line tool designed to help you set up and deploy new applications to Cloudflare.

Create a new project named `hello-ai` by running:

* npm

  ```sh
  npm create cloudflare@latest -- hello-ai
  ```

* yarn

  ```sh
  yarn create cloudflare hello-ai
  ```

* pnpm

  ```sh
  pnpm create cloudflare@latest hello-ai
  ```

Running `npm create cloudflare@latest` will prompt you to install the [`create-cloudflare` package](https://www.npmjs.com/package/create-cloudflare), and lead you through setup. C3 will also install [Wrangler](https://developers.cloudflare.com/workers/wrangler/), the Cloudflare Developer Platform CLI.

For setup, select the following options:

* For *What would you like to start with?*, choose `Hello World example`.
* For *Which template would you like to use?*, choose `Worker only`.
* For *Which language do you want to use?*, choose `TypeScript`.
* For *Do you want to use git for version control?*, choose `Yes`.
* For *Do you want to deploy your application?*, choose `No` (we will be making some changes before deploying).

This will create a new `hello-ai` directory. Your new `hello-ai` directory will include:

* A `"Hello World"` [Worker](https://developers.cloudflare.com/workers/get-started/guide/#3-write-code) at `src/index.ts`.
* A [`wrangler.jsonc`](https://developers.cloudflare.com/workers/wrangler/configuration/) configuration file.

Go to your application directory:

```sh
cd hello-ai
```

## 2. Connect your Worker to Workers AI

You must create an AI binding for your Worker to connect to Workers AI. [Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) allow your Workers to interact with resources, like Workers AI, on the Cloudflare Developer Platform.

To bind Workers AI to your Worker, add the following to the end of your Wrangler file:

* wrangler.jsonc

  ```jsonc
  {
    "ai": {
      "binding": "AI"
    }
  }
  ```

* wrangler.toml

  ```toml
  [ai]
  binding = "AI"
  ```

Your binding is [available in your Worker code](https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/#bindings-in-es-modules-format) on [`env.AI`](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/).

You can also bind Workers AI to a Pages Function. For more information, refer to [Functions Bindings](https://developers.cloudflare.com/pages/functions/bindings/#workers-ai).

## 3. Run an inference task in your Worker

You are now ready to run an inference task in your Worker. In this case, you will use an LLM, [`llama-3.1-8b-instruct`](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct/), to answer a question.

Update the `index.ts` file in your `hello-ai` application directory with the following code:

* JavaScript

  ```js
  export default {
    async fetch(request, env) {
      const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt: "What is the origin of the phrase Hello, World",
      });


      return new Response(JSON.stringify(response));
    },
  };
  ```

* TypeScript

  ```ts
  export interface Env {
    // If you set another name in the Wrangler config file as the value for 'binding',
    // replace "AI" with the variable name you defined.
    AI: Ai;
  }


  export default {
    async fetch(request, env): Promise<Response> {
      const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt: "What is the origin of the phrase Hello, World",
      });


      return new Response(JSON.stringify(response));
    },
  } satisfies ExportedHandler<Env>;
  ```

Up to this point, you have created an AI binding for your Worker and configured your Worker to be able to execute the Llama 3.1 model. You can now test your project locally before you deploy globally.

## 4. Develop locally with Wrangler

While in your project directory, test Workers AI locally by running [`wrangler dev`](https://developers.cloudflare.com/workers/wrangler/commands/#dev):

```sh
npx wrangler dev
```

Workers AI local development usage charges

Using Workers AI always accesses your Cloudflare account in order to run AI models and will incur usage charges even in local development.

You will be prompted to log in after you run the `wrangler dev`. When you run `npx wrangler dev`, Wrangler will give you a URL (most likely `localhost:8787`) to review your Worker. After you go to the URL Wrangler provides, a message will render that resembles the following example:

```json
{
  "response": "Ah, a most excellent question, my dear human friend! *adjusts glasses*\n\nThe origin of the phrase \"Hello, World\" is a fascinating tale that spans several decades and multiple disciplines. It all began in the early days of computer programming, when a young man named Brian Kernighan was tasked with writing a simple program to demonstrate the basics of a new programming language called C.\nKernighan, a renowned computer scientist and author, was working at Bell Labs in the late 1970s when he created the program. He wanted to showcase the language's simplicity and versatility, so he wrote a basic \"Hello, World!\" program that printed the familiar greeting to the console.\nThe program was included in Kernighan and Ritchie's influential book \"The C Programming Language,\" published in 1978. The book became a standard reference for C programmers, and the \"Hello, World!\" program became a sort of \"Hello, World!\" for the programming community.\nOver time, the phrase \"Hello, World!\" became a shorthand for any simple program that demonstrated the basics"
}
```

## 5. Deploy your AI Worker

Before deploying your AI Worker globally, log in with your Cloudflare account by running:

```sh
npx wrangler login
```

You will be directed to a web page asking you to log in to the Cloudflare dashboard. After you have logged in, you will be asked if Wrangler can make changes to your Cloudflare account. Scroll down and select **Allow** to continue.

Finally, deploy your Worker to make your project accessible on the Internet. To deploy your Worker, run:

```sh
npx wrangler deploy
```

```sh
https://hello-ai.<YOUR_SUBDOMAIN>.workers.dev
```

Your Worker will be deployed to your custom [`workers.dev`](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) subdomain. You can now visit the URL to run your AI Worker.

By finishing this tutorial, you have created a Worker, connected it to Workers AI through an AI binding, and ran an inference task from the Llama 3 model.

## Related resources

* [Cloudflare Developers community on Discord](https://discord.cloudflare.com) - Submit feature requests, report bugs, and share your feedback directly with the Cloudflare team by joining the Cloudflare Discord server.
* [Models](https://developers.cloudflare.com/workers-ai/models/) - Browse the Workers AI models catalog.
* [AI SDK](https://developers.cloudflare.com/workers-ai/configuration/ai-sdk) - Learn how to integrate with an AI model.



---
title: Get started - REST API · Cloudflare Workers AI docs
description: Use the Cloudflare Workers AI REST API to deploy a large language model (LLM).
lastUpdated: 2025-01-16T15:52:34.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers-ai/get-started/rest-api/
  md: https://developers.cloudflare.com/workers-ai/get-started/rest-api/index.md
---

This guide will instruct you through setting up and deploying your first Workers AI project. You will use the Workers AI REST API to experiment with a large language model (LLM).

## Prerequisites

Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages) if you have not already.

## 1. Get API token and Account ID

You need your API token and Account ID to use the REST API.

To get these values:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com) and select your account.

2. Go to **AI** > **Workers AI**.

3. Select **Use REST API**.

4. Get your API token:

   1. Select **Create a Workers AI API Token**.
   2. Review the prefilled information.
   3. Select **Create API Token**.
   4. Select **Copy API Token**.
   5. Save that value for future use.

5. For **Get Account ID**, copy the value for **Account ID**. Save that value for future use.

Note

If you choose to [create an API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) instead of using the template, that token will need permissions for both `Workers AI - Read` and `Workers AI - Edit`.

## 2. Run a model via API

After creating your API token, authenticate and make requests to the API using your API token in the request.

You will use the [Execute AI model](https://developers.cloudflare.com/api/resources/ai/methods/run/) endpoint to run the [`@cf/meta/llama-3.1-8b-instruct`](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct/) model:

```bash
curl https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct \
  -H 'Authorization: Bearer {API_TOKEN}' \
  -d '{ "prompt": "Where did the phrase Hello World come from" }'
```

Replace the values for `{ACCOUNT_ID}` and `{API_token}`.

The API response will look like the following:

```json
{
  "result": {
    "response": "Hello, World first appeared in 1974 at Bell Labs when Brian Kernighan included it in the C programming language example. It became widely used as a basic test program due to simplicity and clarity. It represents an inviting greeting from a program to the world."
  },
  "success": true,
  "errors": [],
  "messages": []
}
```

This example execution uses the `@cf/meta/llama-3.1-8b-instruct` model, but you can use any of the models in the [Workers AI models catalog](https://developers.cloudflare.com/workers-ai/models/). If using another model, you will need to replace `{model}` with your desired model name.

By completing this guide, you have created a Cloudflare account (if you did not have one already) and an API token that grants Workers AI read permissions to your account. You executed the [`@cf/meta/llama-3.1-8b-instruct`](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct/) model using a cURL command from the terminal and received an answer to your prompt in a JSON response.

## Related resources

* [Models](https://developers.cloudflare.com/workers-ai/models/) - Browse the Workers AI models catalog.
* [AI SDK](https://developers.cloudflare.com/workers-ai/configuration/ai-sdk) - Learn how to integrate with an AI model.


---
title: Get started - Dashboard · Cloudflare Workers AI docs
description: Follow this guide to create a Workers AI application using the
  Cloudflare dashboard.
lastUpdated: 2025-02-24T12:10:39.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers-ai/get-started/dashboard/
  md: https://developers.cloudflare.com/workers-ai/get-started/dashboard/index.md
---

Follow this guide to create a Workers AI application using the Cloudflare dashboard.

## Prerequisites

Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages) if you have not already.

## Setup

To create a Workers AI application:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com) and select your account.
2. Go to **Compute (Workers)** and **Workers & Pages**.
3. Select **Create**.
4. Under **Start from a template**, select **LLM App**. After you select your template, an [AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/) will be created for you in the dashboard.
5. Review the provided code and select **Deploy**.
6. Preview your Worker at its provided [`workers.dev`](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) subdomain.

## Development

### Dashboard

Editing in the dashboard is helpful for simpler use cases.

Once you have created your Worker script, you can edit and deploy your Worker using the Cloudflare dashboard:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com) and select your account.
2. Select **Workers & Pages**.
3. Select your application.
4. Select **Edit Code**.

![Edit code directly within the Cloudflare dashboard](https://developers.cloudflare.com/_astro/workers-edit-code.CKxxvQSe_Z2kkiqb.webp)

### Wrangler CLI

To develop more advanced applications or [implement tests](https://developers.cloudflare.com/workers/testing/), start working in the Wrangler CLI.

1. Install [`npm`](https://docs.npmjs.com/getting-started).
2. Install [`Node.js`](https://nodejs.org/en/).

Node.js version manager

Use a Node version manager like [Volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm) to avoid permission issues and change Node.js versions. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), discussed later in this guide, requires a Node version of `16.17.0` or later.

1. Run the following command, replacing the value of `[<DIRECTORY>]` which the location you want to put your Worker Script.

* npm

  ```sh
  npm create cloudflare@latest -- [<DIRECTORY>] --type=pre-existing
  ```

* yarn

  ```sh
  yarn create cloudflare [<DIRECTORY>] --type=pre-existing
  ```

* pnpm

  ```sh
  pnpm create cloudflare@latest [<DIRECTORY>] --type=pre-existing
  ```

After you run this command - and work through the prompts - your local changes will not automatically sync with dashboard. So, once you download your script, continue using the CLI.


---
title: Get started - Dashboard · Cloudflare Workers AI docs
description: Follow this guide to create a Workers AI application using the
  Cloudflare dashboard.
lastUpdated: 2025-02-24T12:10:39.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers-ai/get-started/dashboard/
  md: https://developers.cloudflare.com/workers-ai/get-started/dashboard/index.md
---

Follow this guide to create a Workers AI application using the Cloudflare dashboard.

## Prerequisites

Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages) if you have not already.

## Setup

To create a Workers AI application:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com) and select your account.
2. Go to **Compute (Workers)** and **Workers & Pages**.
3. Select **Create**.
4. Under **Start from a template**, select **LLM App**. After you select your template, an [AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/) will be created for you in the dashboard.
5. Review the provided code and select **Deploy**.
6. Preview your Worker at its provided [`workers.dev`](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) subdomain.

## Development

### Dashboard

Editing in the dashboard is helpful for simpler use cases.

Once you have created your Worker script, you can edit and deploy your Worker using the Cloudflare dashboard:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com) and select your account.
2. Select **Workers & Pages**.
3. Select your application.
4. Select **Edit Code**.

![Edit code directly within the Cloudflare dashboard](https://developers.cloudflare.com/_astro/workers-edit-code.CKxxvQSe_Z2kkiqb.webp)

### Wrangler CLI

To develop more advanced applications or [implement tests](https://developers.cloudflare.com/workers/testing/), start working in the Wrangler CLI.

1. Install [`npm`](https://docs.npmjs.com/getting-started).
2. Install [`Node.js`](https://nodejs.org/en/).

Node.js version manager

Use a Node version manager like [Volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm) to avoid permission issues and change Node.js versions. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), discussed later in this guide, requires a Node version of `16.17.0` or later.

1. Run the following command, replacing the value of `[<DIRECTORY>]` which the location you want to put your Worker Script.

* npm

  ```sh
  npm create cloudflare@latest -- [<DIRECTORY>] --type=pre-existing
  ```

* yarn

  ```sh
  yarn create cloudflare [<DIRECTORY>] --type=pre-existing
  ```

* pnpm

  ```sh
  pnpm create cloudflare@latest [<DIRECTORY>] --type=pre-existing
  ```

After you run this command - and work through the prompts - your local changes will not automatically sync with dashboard. So, once you download your script, continue using the CLI.
