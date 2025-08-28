---
title: Cloudflare Workers KV · Cloudflare Workers KV docs
description: Workers KV is a data storage that allows you to store and retrieve
  data globally. With Workers KV, you can build dynamic and performant APIs and
  websites that support high read volumes with low latency.
lastUpdated: 2025-07-02T08:12:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/kv/
  md: https://developers.cloudflare.com/kv/index.md
---

Create a global, low-latency, key-value data storage.

Available on Free and Paid plans

Workers KV is a data storage that allows you to store and retrieve data globally. With Workers KV, you can build dynamic and performant APIs and websites that support high read volumes with low latency.

For example, you can use Workers KV for:

* Caching API responses.
* Storing user configurations / preferences.
* Storing user authentication details.

Access your Workers KV namespace from Cloudflare Workers using [Workers Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) or from your external application using the REST API:

* Workers Binding API

  * index.ts

    ```ts
    export default {
      async fetch(request, env, ctx): Promise<Response> {
        // write a key-value pair
        await env.KV.put('KEY', 'VALUE');


        // read a key-value pair
        const value = await env.KV.get('KEY');


        // list all key-value pairs
        const allKeys = await env.KV.list();


        // delete a key-value pair
        await env.KV.delete('KEY');


        // return a Workers response
        return new Response(
          JSON.stringify({
            value: value,
            allKeys: allKeys,
          }),
        );
      },


    } satisfies ExportedHandler<{ KV: KVNamespace }>;
    ```

  * wrangler.jsonc

    ```json
    {
      "$schema": "node_modules/wrangler/config-schema.json",
      "name": "<ENTER_WORKER_NAME>",
      "main": "src/index.ts",
      "compatibility_date": "2025-02-04",
      "observability": {
        "enabled": true
      },


      "kv_namespaces": [
        {
          "binding": "KV",
          "id": "<YOUR_BINDING_ID>"
        }
      ]
    }
    ```

  See the full [Workers KV binding API reference](https://developers.cloudflare.com/kv/api/read-key-value-pairs/).

* REST API

  * cURL

    ```plaintext
    curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NAMESPACE_ID/values/$KEY_NAME \
        -X PUT \
        -H 'Content-Type: multipart/form-data' \
        -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
        -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
        -d '{
          "value": "Some Value"
        }'


    curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NAMESPACE_ID/values/$KEY_NAME \
        -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
        -H "X-Auth-Key: $CLOUDFLARE_API_KEY"
    ```

  * TypeScript

    ```ts
    const client = new Cloudflare({
      apiEmail: process.env['CLOUDFLARE_EMAIL'], // This is the default and can be omitted
      apiKey: process.env['CLOUDFLARE_API_KEY'], // This is the default and can be omitted
    });


    const value = await client.kv.namespaces.values.update('<KV_NAMESPACE_ID>', 'KEY', {
      account_id: '<ACCOUNT_ID>',
      value: 'VALUE',
    });


    const value = await client.kv.namespaces.values.get('<KV_NAMESPACE_ID>', 'KEY', {
      account_id: '<ACCOUNT_ID>',
    });


    const value = await client.kv.namespaces.values.delete('<KV_NAMESPACE_ID>', 'KEY', {
      account_id: '<ACCOUNT_ID>',
    });


    // Automatically fetches more pages as needed.
    for await (const namespace of client.kv.namespaces.list({ account_id: '<ACCOUNT_ID>' })) {
      console.log(namespace.id);
    }
    ```

  See the full Workers KV [REST API and SDK reference](https://developers.cloudflare.com/api/resources/kv/) for details on using REST API from external applications, with pre-generated SDK's for external TypeScript, Python, or Go applications.

* index.ts

  ```ts
  export default {
    async fetch(request, env, ctx): Promise<Response> {
      // write a key-value pair
      await env.KV.put('KEY', 'VALUE');


      // read a key-value pair
      const value = await env.KV.get('KEY');


      // list all key-value pairs
      const allKeys = await env.KV.list();


      // delete a key-value pair
      await env.KV.delete('KEY');


      // return a Workers response
      return new Response(
        JSON.stringify({
          value: value,
          allKeys: allKeys,
        }),
      );
    },


  } satisfies ExportedHandler<{ KV: KVNamespace }>;
  ```

* wrangler.jsonc

  ```json
  {
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "<ENTER_WORKER_NAME>",
    "main": "src/index.ts",
    "compatibility_date": "2025-02-04",
    "observability": {
      "enabled": true
    },


    "kv_namespaces": [
      {
        "binding": "KV",
        "id": "<YOUR_BINDING_ID>"
      }
    ]
  }
  ```

* cURL

  ```plaintext
  curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NAMESPACE_ID/values/$KEY_NAME \
      -X PUT \
      -H 'Content-Type: multipart/form-data' \
      -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
      -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
      -d '{
        "value": "Some Value"
      }'


  curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NAMESPACE_ID/values/$KEY_NAME \
      -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
      -H "X-Auth-Key: $CLOUDFLARE_API_KEY"
  ```

* TypeScript

  ```ts
  const client = new Cloudflare({
    apiEmail: process.env['CLOUDFLARE_EMAIL'], // This is the default and can be omitted
    apiKey: process.env['CLOUDFLARE_API_KEY'], // This is the default and can be omitted
  });


  const value = await client.kv.namespaces.values.update('<KV_NAMESPACE_ID>', 'KEY', {
    account_id: '<ACCOUNT_ID>',
    value: 'VALUE',
  });


  const value = await client.kv.namespaces.values.get('<KV_NAMESPACE_ID>', 'KEY', {
    account_id: '<ACCOUNT_ID>',
  });


  const value = await client.kv.namespaces.values.delete('<KV_NAMESPACE_ID>', 'KEY', {
    account_id: '<ACCOUNT_ID>',
  });


  // Automatically fetches more pages as needed.
  for await (const namespace of client.kv.namespaces.list({ account_id: '<ACCOUNT_ID>' })) {
    console.log(namespace.id);
  }
  ```

[Get started](https://developers.cloudflare.com/kv/get-started/)

***

## Features

### Key-value storage

Learn how Workers KV stores and retrieves data.

[Use Key-value storage](https://developers.cloudflare.com/kv/get-started/)

### Wrangler

The Workers command-line interface, Wrangler, allows you to [create](https://developers.cloudflare.com/workers/wrangler/commands/#init), [test](https://developers.cloudflare.com/workers/wrangler/commands/#dev), and [deploy](https://developers.cloudflare.com/workers/wrangler/commands/#publish) your Workers projects.

[Use Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Bindings

Bindings allow your Workers to interact with resources on the Cloudflare developer platform, including [R2](https://developers.cloudflare.com/r2/), [Durable Objects](https://developers.cloudflare.com/durable-objects/), and [D1](https://developers.cloudflare.com/d1/).

[Use Bindings](https://developers.cloudflare.com/kv/concepts/kv-bindings/)

***

## Related products

**[R2](https://developers.cloudflare.com/r2/)**

Cloudflare R2 Storage allows developers to store large amounts of unstructured data without the costly egress bandwidth fees associated with typical cloud storage services.

**[Durable Objects](https://developers.cloudflare.com/durable-objects/)**

Cloudflare Durable Objects allows developers to access scalable compute and permanent, consistent storage.

**[D1](https://developers.cloudflare.com/d1/)**

Built on SQLite, D1 is Cloudflare’s first queryable relational database. Create an entire database by importing data or defining your tables and writing your queries within a Worker or through the API.

***

### More resources

[Limits](https://developers.cloudflare.com/kv/platform/limits/)

Learn about KV limits.

[Pricing](https://developers.cloudflare.com/kv/platform/pricing/)

Learn about KV pricing.

[Discord](https://discord.com/channels/595317990191398933/893253103695065128)

Ask questions, show off what you are building, and discuss the platform with other developers.

[Twitter](https://x.com/cloudflaredev)

Learn about product announcements, new tutorials, and what is new in Cloudflare Developer Platform.



---
title: Cloudflare Workers KV · Cloudflare Workers KV docs
description: Workers KV is a data storage that allows you to store and retrieve
  data globally. With Workers KV, you can build dynamic and performant APIs and
  websites that support high read volumes with low latency.
lastUpdated: 2025-07-02T08:12:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/kv/
  md: https://developers.cloudflare.com/kv/index.md
---

Create a global, low-latency, key-value data storage.

Available on Free and Paid plans

Workers KV is a data storage that allows you to store and retrieve data globally. With Workers KV, you can build dynamic and performant APIs and websites that support high read volumes with low latency.

For example, you can use Workers KV for:

* Caching API responses.
* Storing user configurations / preferences.
* Storing user authentication details.

Access your Workers KV namespace from Cloudflare Workers using [Workers Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) or from your external application using the REST API:

* Workers Binding API

  * index.ts

    ```ts
    export default {
      async fetch(request, env, ctx): Promise<Response> {
        // write a key-value pair
        await env.KV.put('KEY', 'VALUE');


        // read a key-value pair
        const value = await env.KV.get('KEY');


        // list all key-value pairs
        const allKeys = await env.KV.list();


        // delete a key-value pair
        await env.KV.delete('KEY');


        // return a Workers response
        return new Response(
          JSON.stringify({
            value: value,
            allKeys: allKeys,
          }),
        );
      },


    } satisfies ExportedHandler<{ KV: KVNamespace }>;
    ```

  * wrangler.jsonc

    ```json
    {
      "$schema": "node_modules/wrangler/config-schema.json",
      "name": "<ENTER_WORKER_NAME>",
      "main": "src/index.ts",
      "compatibility_date": "2025-02-04",
      "observability": {
        "enabled": true
      },


      "kv_namespaces": [
        {
          "binding": "KV",
          "id": "<YOUR_BINDING_ID>"
        }
      ]
    }
    ```

  See the full [Workers KV binding API reference](https://developers.cloudflare.com/kv/api/read-key-value-pairs/).

* REST API

  * cURL

    ```plaintext
    curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NAMESPACE_ID/values/$KEY_NAME \
        -X PUT \
        -H 'Content-Type: multipart/form-data' \
        -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
        -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
        -d '{
          "value": "Some Value"
        }'


    curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NAMESPACE_ID/values/$KEY_NAME \
        -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
        -H "X-Auth-Key: $CLOUDFLARE_API_KEY"
    ```

  * TypeScript

    ```ts
    const client = new Cloudflare({
      apiEmail: process.env['CLOUDFLARE_EMAIL'], // This is the default and can be omitted
      apiKey: process.env['CLOUDFLARE_API_KEY'], // This is the default and can be omitted
    });


    const value = await client.kv.namespaces.values.update('<KV_NAMESPACE_ID>', 'KEY', {
      account_id: '<ACCOUNT_ID>',
      value: 'VALUE',
    });


    const value = await client.kv.namespaces.values.get('<KV_NAMESPACE_ID>', 'KEY', {
      account_id: '<ACCOUNT_ID>',
    });


    const value = await client.kv.namespaces.values.delete('<KV_NAMESPACE_ID>', 'KEY', {
      account_id: '<ACCOUNT_ID>',
    });


    // Automatically fetches more pages as needed.
    for await (const namespace of client.kv.namespaces.list({ account_id: '<ACCOUNT_ID>' })) {
      console.log(namespace.id);
    }
    ```

  See the full Workers KV [REST API and SDK reference](https://developers.cloudflare.com/api/resources/kv/) for details on using REST API from external applications, with pre-generated SDK's for external TypeScript, Python, or Go applications.

* index.ts

  ```ts
  export default {
    async fetch(request, env, ctx): Promise<Response> {
      // write a key-value pair
      await env.KV.put('KEY', 'VALUE');


      // read a key-value pair
      const value = await env.KV.get('KEY');


      // list all key-value pairs
      const allKeys = await env.KV.list();


      // delete a key-value pair
      await env.KV.delete('KEY');


      // return a Workers response
      return new Response(
        JSON.stringify({
          value: value,
          allKeys: allKeys,
        }),
      );
    },


  } satisfies ExportedHandler<{ KV: KVNamespace }>;
  ```

* wrangler.jsonc

  ```json
  {
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "<ENTER_WORKER_NAME>",
    "main": "src/index.ts",
    "compatibility_date": "2025-02-04",
    "observability": {
      "enabled": true
    },


    "kv_namespaces": [
      {
        "binding": "KV",
        "id": "<YOUR_BINDING_ID>"
      }
    ]
  }
  ```

* cURL

  ```plaintext
  curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NAMESPACE_ID/values/$KEY_NAME \
      -X PUT \
      -H 'Content-Type: multipart/form-data' \
      -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
      -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
      -d '{
        "value": "Some Value"
      }'


  curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NAMESPACE_ID/values/$KEY_NAME \
      -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
      -H "X-Auth-Key: $CLOUDFLARE_API_KEY"
  ```

* TypeScript

  ```ts
  const client = new Cloudflare({
    apiEmail: process.env['CLOUDFLARE_EMAIL'], // This is the default and can be omitted
    apiKey: process.env['CLOUDFLARE_API_KEY'], // This is the default and can be omitted
  });


  const value = await client.kv.namespaces.values.update('<KV_NAMESPACE_ID>', 'KEY', {
    account_id: '<ACCOUNT_ID>',
    value: 'VALUE',
  });


  const value = await client.kv.namespaces.values.get('<KV_NAMESPACE_ID>', 'KEY', {
    account_id: '<ACCOUNT_ID>',
  });


  const value = await client.kv.namespaces.values.delete('<KV_NAMESPACE_ID>', 'KEY', {
    account_id: '<ACCOUNT_ID>',
  });


  // Automatically fetches more pages as needed.
  for await (const namespace of client.kv.namespaces.list({ account_id: '<ACCOUNT_ID>' })) {
    console.log(namespace.id);
  }
  ```

[Get started](https://developers.cloudflare.com/kv/get-started/)

***

## Features

### Key-value storage

Learn how Workers KV stores and retrieves data.

[Use Key-value storage](https://developers.cloudflare.com/kv/get-started/)

### Wrangler

The Workers command-line interface, Wrangler, allows you to [create](https://developers.cloudflare.com/workers/wrangler/commands/#init), [test](https://developers.cloudflare.com/workers/wrangler/commands/#dev), and [deploy](https://developers.cloudflare.com/workers/wrangler/commands/#publish) your Workers projects.

[Use Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Bindings

Bindings allow your Workers to interact with resources on the Cloudflare developer platform, including [R2](https://developers.cloudflare.com/r2/), [Durable Objects](https://developers.cloudflare.com/durable-objects/), and [D1](https://developers.cloudflare.com/d1/).

[Use Bindings](https://developers.cloudflare.com/kv/concepts/kv-bindings/)

***

## Related products

**[R2](https://developers.cloudflare.com/r2/)**

Cloudflare R2 Storage allows developers to store large amounts of unstructured data without the costly egress bandwidth fees associated with typical cloud storage services.

**[Durable Objects](https://developers.cloudflare.com/durable-objects/)**

Cloudflare Durable Objects allows developers to access scalable compute and permanent, consistent storage.

**[D1](https://developers.cloudflare.com/d1/)**

Built on SQLite, D1 is Cloudflare’s first queryable relational database. Create an entire database by importing data or defining your tables and writing your queries within a Worker or through the API.

***

### More resources

[Limits](https://developers.cloudflare.com/kv/platform/limits/)

Learn about KV limits.

[Pricing](https://developers.cloudflare.com/kv/platform/pricing/)

Learn about KV pricing.

[Discord](https://discord.com/channels/595317990191398933/893253103695065128)

Ask questions, show off what you are building, and discuss the platform with other developers.

[Twitter](https://x.com/cloudflaredev)

Learn about product announcements, new tutorials, and what is new in Cloudflare Developer Platform.


---
title: Getting started · Cloudflare Workers KV docs
description: Workers KV provides low-latency, high-throughput global storage to
  your Cloudflare Workers applications. Workers KV is ideal for storing user
  configuration data, routing data, A/B testing configurations and
  authentication tokens, and is well suited for read-heavy workloads.
lastUpdated: 2025-05-21T09:55:16.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/kv/get-started/
  md: https://developers.cloudflare.com/kv/get-started/index.md
---

Workers KV provides low-latency, high-throughput global storage to your [Cloudflare Workers](https://developers.cloudflare.com/workers/) applications. Workers KV is ideal for storing user configuration data, routing data, A/B testing configurations and authentication tokens, and is well suited for read-heavy workloads.

This guide instructs you through:

* Creating a KV namespace.
* Writing key-value pairs to your KV namespace from a Cloudflare Worker.
* Reading key-value pairs from a KV namespace.

You can perform these tasks through the Wrangler CLI or through the Cloudflare dashboard.

## Quick start

If you want to skip the setup steps and get started quickly, click on the button below.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/docs-examples/tree/update/kv/kv/kv-get-started)

This creates a repository in your GitHub account and deploys the application to Cloudflare Workers. Use this option if you are familiar with Cloudflare Workers, and wish to skip the step-by-step guidance.

You may wish to manually follow the steps if you are new to Cloudflare Workers.

## Prerequisites

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Install [`Node.js`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

Node.js version manager

Use a Node version manager like [Volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm) to avoid permission issues and change Node.js versions. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), discussed later in this guide, requires a Node version of `16.17.0` or later.

## 1. Create a Worker project

New to Workers?

Refer to [How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/) to learn about the Workers serverless execution model works. Go to the [Workers Get started guide](https://developers.cloudflare.com/workers/get-started/guide/) to set up your first Worker.

* CLI

  Create a new Worker to read and write to your KV namespace.

  1. Create a new project named `kv-tutorial` by running:

     * npm

       ```sh
       npm create cloudflare@latest -- kv-tutorial
       ```

     * yarn

       ```sh
       yarn create cloudflare kv-tutorial
       ```

     * pnpm

       ```sh
       pnpm create cloudflare@latest kv-tutorial
       ```

     For setup, select the following options:

     * For *What would you like to start with?*, choose `Hello World example`.
     * For *Which template would you like to use?*, choose `Worker only`.
     * For *Which language do you want to use?*, choose `TypeScript`.
     * For *Do you want to use git for version control?*, choose `Yes`.
     * For *Do you want to deploy your application?*, choose `No` (we will be making some changes before deploying).

     This creates a new `kv-tutorial` directory, illustrated below.

     Your new `kv-tutorial` directory includes:

     * A `"Hello World"` [Worker](https://developers.cloudflare.com/workers/get-started/guide/#3-write-code) in `index.ts`.
     * A [`wrangler.jsonc`](https://developers.cloudflare.com/workers/wrangler/configuration/) configuration file. `wrangler.jsonc` is how your `kv-tutorial` Worker accesses your kv database.

  2. Change into the directory you just created for your Worker project:

     ```sh
     cd kv-tutorial
     ```

     Note

     If you are familiar with Cloudflare Workers, or initializing projects in a Continuous Integration (CI) environment, initialize a new project non-interactively by setting `CI=true` as an [environmental variable](https://developers.cloudflare.com/workers/configuration/environment-variables/) when running `create cloudflare@latest`.

     For example: `CI=true npm create cloudflare@latest kv-tutorial --type=simple --git --ts --deploy=false` creates a basic "Hello World" project ready to build on.

* Dashboard

  1. Log in to your Cloudflare dashboard and select your account.
  2. Go to [your account > **Workers & Pages** > **Overview**](https://dash.cloudflare.com/?to=/:account/workers-and-pages).
  3. Select **Create**.
  4. Select **Create Worker**.
  5. Name your Worker. For this tutorial, name your Worker `kv-tutorial`.
  6. Select **Deploy**.

* npm

  ```sh
  npm create cloudflare@latest -- kv-tutorial
  ```

* yarn

  ```sh
  yarn create cloudflare kv-tutorial
  ```

* pnpm

  ```sh
  pnpm create cloudflare@latest kv-tutorial
  ```

## 2. Create a KV namespace

A [KV namespace](https://developers.cloudflare.com/kv/concepts/kv-namespaces/) is a key-value database replicated to Cloudflare's global network.

* CLI

  You can use [Wrangler](https://developers.cloudflare.com/workers/wrangler/) to create a new KV namespace. You can also use it to perform operations such as put, list, get, and delete within your KV namespace.

  Note

  KV operations are scoped to your account.

  To create a KV namespace via Wrangler:

  1. Open your terminal and run the following command:

     ```sh
     npx wrangler kv namespace create <BINDING_NAME>
     ```

     The `npx wrangler kv namespace create <BINDING_NAME>` subcommand takes a new binding name as its argument. A KV namespace is created using a concatenation of your Worker's name (from your Wrangler file) and the binding name you provide. A `<BINDING_ID>` is randomly generated for you.

     For this tutorial, use the binding name `USERS_NOTIFICATION_CONFIG`.

     ```sh
     npx wrangler kv namespace create 
     ```

     ```sh
     🌀 Creating namespace with title "USERS_NOTIFICATION_CONFIG"
     ✨ Success!
     Add the following to your configuration file in your kv_namespaces array:
     {
       "kv_namespaces": [
         {
           "binding": "USERS_NOTIFICATION_CONFIG",
           "id": "<BINDING_ID>"
         }
       ]
     }
     ```

* Dashboard

  1. Go to [**Storage & Databases** > **KV**](https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces).
  2. Select **Create a namespace**.
  3. Enter a name for your namespace. For this tutorial, use `kv_tutorial_namespace`.
  4. Select **Add**.

## 3. Bind your Worker to your KV namespace

You must create a binding to connect your Worker with your KV namespace. [Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) allow your Workers to access resources, like KV, on the Cloudflare developer platform.

Bindings

A binding is how your Worker interacts with external resources such as [KV namespaces](https://developers.cloudflare.com/kv/concepts/kv-namespaces/). A binding is a runtime variable that the Workers runtime provides to your code. You can declare a variable name in your Wrangler file that binds to these resources at runtime, and interact with them through this variable. Every binding's variable name and behavior is determined by you when deploying the Worker.

Refer to [Environment](https://developers.cloudflare.com/kv/reference/environments/) for more information.

To bind your KV namespace to your Worker:

* CLI

  1. In your Wrangler file, add the following with the values generated in your terminal from [step 2](https://developers.cloudflare.com/kv/get-started/#2-create-a-kv-namespace):

     * wrangler.jsonc

       ```jsonc
       {
         "kv_namespaces": [
           {
             "binding": "USERS_NOTIFICATION_CONFIG",
             "id": "<BINDING_ID>"
           }
         ]
       }
       ```

     * wrangler.toml

       ```toml
       [[kv_namespaces]]
       binding = "USERS_NOTIFICATION_CONFIG"
       id = "<BINDING_ID>"
       ```

     Binding names do not need to correspond to the namespace you created. Binding names are only a reference. Specifically:

     * The value (string) you set for `binding` is used to reference this KV namespace in your Worker. For this tutorial, this should be `USERS_NOTIFICATION_CONFIG`.
     * The binding must be [a valid JavaScript variable name](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#variables). For example, `binding = "MY_KV"` or `binding = "routingConfig"` would both be valid names for the binding.
     * Your binding is available in your Worker at `env.<BINDING_NAME>` from within your Worker. For this tutorial, the binding is available at `env.USERS_NOTIFICATION_CONFIG`.

* Dashboard

  1. Go to [**Workers & Pages** > **Overview**](https://dash.cloudflare.com/?to=/:account/workers-and-pages).
  2. Select the `kv-tutorial` Worker you created in [step 1](https://developers.cloudflare.com/kv/get-started/#1-create-a-worker-project).
  3. Select **Settings**.
  4. Scroll to **Bindings**, then select **Add**.
  5. Select **KV namespace**.
  6. Name your binding (`BINDING_NAME`) in **Variable name**, then select the KV namespace (`kv_tutorial_namespace`) you created in [step 2](https://developers.cloudflare.com/kv/get-started/#2-create-a-kv-namespace) from the dropdown menu.
  7. Select **Deploy** to deploy your binding.

* wrangler.jsonc

  ```jsonc
  {
    "kv_namespaces": [
      {
        "binding": "USERS_NOTIFICATION_CONFIG",
        "id": "<BINDING_ID>"
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  [[kv_namespaces]]
  binding = "USERS_NOTIFICATION_CONFIG"
  id = "<BINDING_ID>"
  ```

## 4. Interact with your KV namespace

You can interact with your KV namespace via [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) or directly from your [Workers](https://developers.cloudflare.com/workers/) application.

### 4.1. Write a value

* CLI

  To write a value to your empty KV namespace using Wrangler:

  1. Run the `wrangler kv key put` subcommand in your terminal, and input your key and value respectively. `<KEY>` and `<VALUE>` are values of your choice.

     ```sh
     npx wrangler kv key put --binding=<BINDING_NAME> "<KEY>" "<VALUE>"
     ```

     In this tutorial, you will add a key `user_1` with value `enabled` to the KV namespace you created in [step 2](https://developers.cloudflare.com/kv/get-started/#2-create-a-kv-namespace).

     ```sh
     npx wrangler kv key put --binding=USERS_NOTIFICATION_CONFIG "user_1" "enabled"
     ```

     ```sh
     Writing the value "enabled" to key "user_1" on namespace <BINDING_ID>.
     ```

  Using `--namespace-id`

  Instead of using `--binding`, you can also use `--namespace-id` to specify which KV namespace should receive the operation:

  ```sh
  npx wrangler kv key put --namespace-id=<BINDING_ID> "<KEY>" "<VALUE>"
  ```

  ```sh
  Writing the value "<VALUE>" to key "<KEY>" on namespace <BINDING_ID>.
  ```

  Storing values in remote KV namespace

  By default, the values are written locally. To create a key and a value in your remote KV namespace, add the `--remote` flag at the end of the command:

  ```sh
  npx wrangler kv key put --namespace-id=xxxxxxxxxxxxxxxx "<KEY>" "<VALUE>" 
  ```

* Dashboard

  1. Go to [**Storage & Databases** > **KV**](https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces).
  2. Select the KV namespace you created (`kv_tutorial_namespace`), then select **View**.
  3. Select **KV Pairs**.
  4. Enter a `<KEY>` of your choice.
  5. Enter a `<VALUE>` of your choice.
  6. Select **Add entry**.

### 4.2. Get a value

* CLI

  To access the value from your KV namespace using Wrangler:

  1. Run the `wrangler kv key get` subcommand in your terminal, and input your key value:

     ```sh
     npx wrangler kv key get --binding=<BINDING_NAME> "<KEY>"
     ```

     In this tutorial, you will get the value of the key `user_1` from the KV namespace you created in [step 2](https://developers.cloudflare.com/kv/get-started/#2-create-a-kv-namespace).

     Note

     To view the value directly within the terminal, you use the `--text` flag.

     ```sh
     npx wrangler kv key get --binding=USERS_NOTIFICATION_CONFIG "user_1" --text
     ```

     Similar to the `put` command, the `get` command can also be used to access a KV namespace in two ways - with `--binding` or `--namespace-id`:

  Warning

  Exactly **one** of `--binding` or `--namespace-id` is required.

  Refer to the [`kv bulk` documentation](https://developers.cloudflare.com/kv/reference/kv-commands/#kv-bulk) to write a file of multiple key-value pairs to a given KV namespace.

* Dashboard

  You can view key-value pairs directly from the dashboard.

  1. Go to your account > **Storage & Databases** > **KV**.
  2. Go to the KV namespace you created (`kv_tutorial_namespace`), then select **View**.
  3. Select **KV Pairs**.

## 5. Access your KV namespace from your Worker

* CLI

  Note

  When using [`wrangler dev`](https://developers.cloudflare.com/workers/wrangler/commands/#dev) to develop locally, Wrangler defaults to using a local version of KV to avoid interfering with any of your live production data in KV. This means that reading keys that you have not written locally returns null.

  To have `wrangler dev` connect to your Workers KV namespace running on Cloudflare's global network, call `wrangler dev --remote` instead. This uses the `preview_id` of the KV binding configuration in the Wrangler file. Refer to the [KV binding docs](https://developers.cloudflare.com/kv/concepts/kv-bindings/#use-kv-bindings-when-developing-locally) for more information.

  1. In your Worker script, add your KV binding in the `Env` interface. If you have bootstrapped your project with JavaScript, this step is not required.

     ```ts
     interface Env {
       USERS_NOTIFICATION_CONFIG: KVNamespace;
       // ... other binding types
     }
     ```

  2. Use the `put()` method on `USERS_NOTIFICATION_CONFIG` to create a new key-value pair. You will add a new key `user_2` with value `disabled` to your KV namespace.

     ```ts
     let value = await env.USERS_NOTIFICATION_CONFIG.put("user_2", "disabled");
     ```

  3. Use the KV `get()` method to fetch the data you stored in your KV namespace. You will fetch the value of the key `user_2` from your KV namespace.

     ```ts
     let value = await env.USERS_NOTIFICATION_CONFIG.get("user_2");
     ```

  Your Worker code should look like this:

  * JavaScript

    ```js
    export default {
      async fetch(request, env, ctx) {
        try {
          await env.USER_NOTIFICATION.put("user_2", "disabled");
          const value = await env.USER_NOTIFICATION.get("user_2");
          if (value === null) {
            return new Response("Value not found", { status: 404 });
          }
          return new Response(value);
        } catch (err) {
          console.error(`KV returned error:`, err);
          const errorMessage =
            err instanceof Error
              ? err.message
              : "An unknown error occurred when accessing KV storage";
          return new Response(errorMessage, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      },
    };
    ```

  * TypeScript

    ```ts
    export interface Env {
      USER_NOTIFICATION: KVNamespace;
    }


    export default {
      async fetch(request, env, ctx): Promise<Response> {
        try {
          await env.USER_NOTIFICATION.put("user_2", "disabled");
          const value = await env.USER_NOTIFICATION.get("user_2");
          if (value === null) {
            return new Response("Value not found", { status: 404 });
          }
          return new Response(value);
        } catch (err) {
          console.error(`KV returned error:`, err);
          const errorMessage =
            err instanceof Error
              ? err.message
              : "An unknown error occurred when accessing KV storage";
          return new Response(errorMessage, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      },
    } satisfies ExportedHandler<Env>;
    ```

  The code above:

  1. Writes a key to your KV namespace using KV's `put()` method.
  2. Reads the same key using KV's `get()` method.
  3. Checks if the key is null, and returns a `404` response if it is.
  4. If the key is not null, it returns the value of the key.
  5. Uses JavaScript's [`try...catch`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/try...catch) exception handling to catch potential errors. When writing or reading from any service, such as Workers KV or external APIs using `fetch()`, you should expect to handle exceptions explicitly.

* Dashboard

  1. Go to **Workers & Pages** > **Overview**.

  2. Go to the `kv-tutorial` Worker you created.

  3. Select **Edit Code**.

  4. Clear the contents of the `workers.js` file, then paste the following code.

     * JavaScript

       ```js
       export default {
         async fetch(request, env, ctx) {
           try {
             await env.USER_NOTIFICATION.put("user_2", "disabled");
             const value = await env.USER_NOTIFICATION.get("user_2");
             if (value === null) {
               return new Response("Value not found", { status: 404 });
             }
             return new Response(value);
           } catch (err) {
             console.error(`KV returned error:`, err);
             const errorMessage =
               err instanceof Error
                 ? err.message
                 : "An unknown error occurred when accessing KV storage";
             return new Response(errorMessage, {
               status: 500,
               headers: { "Content-Type": "text/plain" },
             });
           }
         },
       };
       ```

     * TypeScript

       ```ts
       export interface Env {
         USER_NOTIFICATION: KVNamespace;
       }


       export default {
         async fetch(request, env, ctx): Promise<Response> {
           try {
             await env.USER_NOTIFICATION.put("user_2", "disabled");
             const value = await env.USER_NOTIFICATION.get("user_2");
             if (value === null) {
               return new Response("Value not found", { status: 404 });
             }
             return new Response(value);
           } catch (err) {
             console.error(`KV returned error:`, err);
             const errorMessage =
               err instanceof Error
                 ? err.message
                 : "An unknown error occurred when accessing KV storage";
             return new Response(errorMessage, {
               status: 500,
               headers: { "Content-Type": "text/plain" },
             });
           }
         },
       } satisfies ExportedHandler<Env>;
       ```

     The code above:

     1. Writes a key to `BINDING_NAME` using KV's `put()` method.
     2. Reads the same key using KV's `get()` method, and returns an error if the key is null (or in case the key is not set, or does not exist).
     3. Uses JavaScript's [`try...catch`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) exception handling to catch potential errors. When writing or reading from any service, such as Workers KV or external APIs using `fetch()`, you should expect to handle exceptions explicitly.

     The browser should simply return the `VALUE` corresponding to the `KEY` you have specified with the `get()` method.

  5. Select **Save**.

* JavaScript

  ```js
  export default {
    async fetch(request, env, ctx) {
      try {
        await env.USER_NOTIFICATION.put("user_2", "disabled");
        const value = await env.USER_NOTIFICATION.get("user_2");
        if (value === null) {
          return new Response("Value not found", { status: 404 });
        }
        return new Response(value);
      } catch (err) {
        console.error(`KV returned error:`, err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unknown error occurred when accessing KV storage";
        return new Response(errorMessage, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    },
  };
  ```

* TypeScript

  ```ts
  export interface Env {
    USER_NOTIFICATION: KVNamespace;
  }


  export default {
    async fetch(request, env, ctx): Promise<Response> {
      try {
        await env.USER_NOTIFICATION.put("user_2", "disabled");
        const value = await env.USER_NOTIFICATION.get("user_2");
        if (value === null) {
          return new Response("Value not found", { status: 404 });
        }
        return new Response(value);
      } catch (err) {
        console.error(`KV returned error:`, err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unknown error occurred when accessing KV storage";
        return new Response(errorMessage, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    },
  } satisfies ExportedHandler<Env>;
  ```

* JavaScript

  ```js
  export default {
    async fetch(request, env, ctx) {
      try {
        await env.USER_NOTIFICATION.put("user_2", "disabled");
        const value = await env.USER_NOTIFICATION.get("user_2");
        if (value === null) {
          return new Response("Value not found", { status: 404 });
        }
        return new Response(value);
      } catch (err) {
        console.error(`KV returned error:`, err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unknown error occurred when accessing KV storage";
        return new Response(errorMessage, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    },
  };
  ```

* TypeScript

  ```ts
  export interface Env {
    USER_NOTIFICATION: KVNamespace;
  }


  export default {
    async fetch(request, env, ctx): Promise<Response> {
      try {
        await env.USER_NOTIFICATION.put("user_2", "disabled");
        const value = await env.USER_NOTIFICATION.get("user_2");
        if (value === null) {
          return new Response("Value not found", { status: 404 });
        }
        return new Response(value);
      } catch (err) {
        console.error(`KV returned error:`, err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unknown error occurred when accessing KV storage";
        return new Response(errorMessage, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    },
  } satisfies ExportedHandler<Env>;
  ```

## 6. Deploy your Worker

Deploy your Worker to Cloudflare's global network.

* CLI

  1. Run the following command to deploy KV to Cloudflare's global network:

     ```sh
     npm run deploy
     ```

  2. Visit the URL for your newly created Workers KV application.

     For example, if the URL of your new Worker is `kv-tutorial.<YOUR_SUBDOMAIN>.workers.dev`, accessing `https://kv-tutorial.<YOUR_SUBDOMAIN>.workers.dev/` sends a request to your Worker that writes (and reads) from Workers KV.

* Dashboard

  1. Go to **Workers & Pages** > **Overview**.

  2. Select your `kv-tutorial` Worker.

  3. Select **Deployments**.

  4. From the **Version History** table, select **Deploy version**.

  5. From the **Deploy version** page, select **Deploy**.

     This deploys the latest version of the Worker code to production.

## Summary

By finishing this tutorial, you have:

1. Created a KV namespace
2. Created a Worker that writes and reads from that namespace
3. Deployed your project globally.

## Next steps

If you have any feature requests or notice any bugs, share your feedback directly with the Cloudflare team by joining the [Cloudflare Developers community on Discord](https://discord.cloudflare.com).

* Learn more about the [KV API](https://developers.cloudflare.com/kv/api/).
* Understand how to use [Environments](https://developers.cloudflare.com/kv/reference/environments/) with Workers KV.
* Read the Wrangler [`kv` command documentation](https://developers.cloudflare.com/kv/reference/kv-commands/).
