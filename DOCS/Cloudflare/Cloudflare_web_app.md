---
title: React + Vite · Cloudflare Workers docs
description: Create a React application and deploy it to Cloudflare Workers with
  Workers Assets.
lastUpdated: 2025-06-05T13:25:05.000Z
chatbotDeprioritize: false
tags: SPA
source_url:
  html: https://developers.cloudflare.com/workers/framework-guides/web-apps/react/
  md: https://developers.cloudflare.com/workers/framework-guides/web-apps/react/index.md
---

**Start from CLI** - scaffold a full-stack app with a React SPA, Cloudflare Workers API, and the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) for lightning-fast development.

* npm

  ```sh
  npm create cloudflare@latest -- my-react-app --framework=react
  ```

* yarn

  ```sh
  yarn create cloudflare my-react-app --framework=react
  ```

* pnpm

  ```sh
  pnpm create cloudflare@latest my-react-app --framework=react
  ```

***

**Or just deploy** - create a full-stack app using React, Hono API and Vite, with CI/CD and previews all set up for you.

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/deploy-to-workers\&repository=https://github.com/cloudflare/templates/tree/main/vite-react-template)

## What is React?

[React](https://react.dev/) is a framework for building user interfaces. It allows you to create reusable UI components and manage the state of your application efficiently. You can use React to build a single-page application (SPA), and combine it with a backend API running on Cloudflare Workers to create a full-stack application.

## Creating a full-stack app with React

1. **Create a new project with the create-cloudflare CLI (C3)**

   * npm

     ```sh
     npm create cloudflare@latest -- my-react-app --framework=react
     ```

   * yarn

     ```sh
     yarn create cloudflare my-react-app --framework=react
     ```

   * pnpm

     ```sh
     pnpm create cloudflare@latest my-react-app --framework=react
     ```

   How is this project set up?

   Below is a simplified file tree of the project.

   `wrangler.jsonc` is your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/). In this file:

   * `main` points to `worker/index.ts`. This is your Worker, which is going to act as your backend API.
   * `assets.not_found_handling` is set to `single-page-application`, which means that routes that are handled by your React SPA do not go to the Worker, and are thus free.
   * If you want to add bindings to resources on Cloudflare's developer platform, you configure them here. Read more about [bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/).

   `vite.config.ts` is set up to use the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/). This runs your Worker in the Cloudflare Workers runtime, ensuring your local development environment is as close to production as possible.

   `worker/index.ts` is your backend API, which contains a single endpoint, `/api/`, that returns a text response. At `src/App.tsx`, your React app calls this endpoint to get a message back and displays this.

2. **Develop locally with the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)**

   After creating your project, run the following command in your project directory to start a local development server.

   * npm

     ```sh
     npm run dev
     ```

   * yarn

     ```sh
     yarn run dev
     ```

   * pnpm

     ```sh
     pnpm run dev
     ```

   What's happening in local development?

   This project uses Vite for local development and build, and thus comes with all of Vite's features, including hot module replacement (HMR).

   In addition, `vite.config.ts` is set up to use the Cloudflare Vite plugin. This runs your application in the Cloudflare Workers runtime, just like in production, and enables access to local emulations of bindings.

3. **Deploy your project**

   Your project can be deployed to a `*.workers.dev` subdomain or a [Custom Domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), from your own machine or from any CI/CD system, including Cloudflare's own [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/).

   The following command will build and deploy your project. If you are using CI, ensure you update your ["deploy command"](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#build-settings) configuration appropriately.

   * npm

     ```sh
     npm run deploy
     ```

   * yarn

     ```sh
     yarn run deploy
     ```

   * pnpm

     ```sh
     pnpm run deploy
     ```

***

## Asset Routing

If you're using React as a SPA, you will want to set `not_found_handling = "single_page_application"` in your Wrangler configuration file.

By default, Cloudflare first tries to match a request path against a static asset path, which is based on the file structure of the uploaded asset directory. This is either the directory specified by `assets.directory` in your Wrangler config or, in the case of the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/), the output directory of the client build. Failing that, we invoke a Worker if one is present. If there is no Worker, or the Worker then uses the asset binding, Cloudflare will fallback to the behaviour set by [`not_found_handling`](https://developers.cloudflare.com/workers/static-assets/#routing-behavior).

Refer to the [routing documentation](https://developers.cloudflare.com/workers/static-assets/routing/) for more information about how routing works with static assets, and how to customize this behavior.

## Use bindings with React

Your new project also contains a Worker at `./worker/index.ts`, which you can use as a backend API for your React application. While your React application cannot directly access Workers bindings, it can interact with them through this Worker. You can make [`fetch()` requests](https://developers.cloudflare.com/workers/runtime-apis/fetch/) from your React application to the Worker, which can then handle the request and use bindings. Learn how to [configure Workers bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/).

With bindings, your application can be fully integrated with the Cloudflare Developer Platform, giving you access to compute, storage, AI and more.

[Bindings ](https://developers.cloudflare.com/workers/runtime-apis/bindings/)Access to compute, storage, AI and more.
