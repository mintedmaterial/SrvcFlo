---
title: Overview · Cloudflare Durable Objects docs
description: Durable Objects provide a building block for stateful applications
  and distributed systems.
lastUpdated: 2025-07-30T08:17:23.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/durable-objects/
  md: https://developers.cloudflare.com/durable-objects/index.md
---

Create AI agents, collaborative applications, real-time interactions like chat, and more without needing to coordinate state, have separate storage, or manage infrastructure.

Available on Free and Paid plans

Durable Objects provide a building block for stateful applications and distributed systems.

Use Durable Objects to build applications that need coordination among multiple clients, like collaborative editing tools, interactive chat, multiplayer games, live notifications, and deep distributed systems, without requiring you to build serialization and coordination primitives on your own.

[Get started](https://developers.cloudflare.com/durable-objects/get-started/)

Note

SQLite-backed Durable Objects are now available on the Workers Free plan with these [limits](https://developers.cloudflare.com/durable-objects/platform/pricing/).

[SQLite storage](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/) and corresponding [Storage API](https://developers.cloudflare.com/durable-objects/api/storage-api/) methods like `sql.exec` have moved from beta to general availability. New Durable Object classes should use wrangler configuration for [SQLite storage](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/#wrangler-configuration-for-sqlite-durable-objects).

### What are Durable Objects?

A Durable Object is a special kind of [Cloudflare Worker](https://developers.cloudflare.com/workers/) which uniquely combines compute with storage. Like a Worker, a Durable Object is automatically provisioned geographically close to where it is first requested, starts up quickly when needed, and shuts down when idle. You can have millions of them around the world. However, unlike regular Workers:

* Each Durable Object has a **globally-unique name**, which allows you to send requests to a specific object from anywhere in the world. Thus, a Durable Object can be used to coordinate between multiple clients who need to work together.
* Each Durable Object has some **durable storage** attached. Since this storage lives together with the object, it is strongly consistent yet fast to access.

Therefore, Durable Objects enable **stateful** serverless applications.

For more information, refer to the full [What are Durable Objects?](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/) page.

***

## Features

### In-memory State

Learn how Durable Objects coordinate connections among multiple clients or events.

[Use In-memory State](https://developers.cloudflare.com/durable-objects/reference/in-memory-state/)

### Storage API

Learn how Durable Objects provide transactional, strongly consistent, and serializable storage.

[Use Storage API](https://developers.cloudflare.com/durable-objects/api/storage-api/)

### WebSocket Hibernation

Learn how WebSocket Hibernation allows you to manage the connections of multiple clients at scale.

[Use WebSocket Hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/#websocket-hibernation-api)

### Durable Objects Alarms

Learn how to use alarms to trigger a Durable Object and perform compute in the future at customizable intervals.

[Use Durable Objects Alarms](https://developers.cloudflare.com/durable-objects/api/alarms/)

***

## Related products

**[Workers](https://developers.cloudflare.com/workers/)**

Cloudflare Workers provides a serverless execution environment that allows you to create new applications or augment existing ones without configuring or maintaining infrastructure.

**[D1](https://developers.cloudflare.com/d1/)**

D1 is Cloudflare's SQL-based native serverless database. Create a database by importing data or defining your tables and writing your queries within a Worker or through the API.

**[R2](https://developers.cloudflare.com/r2/)**

Cloudflare R2 Storage allows developers to store large amounts of unstructured data without the costly egress bandwidth fees associated with typical cloud storage services.

***

## More resources

[Built with Durable Objects](https://workers.cloudflare.com/built-with/collections/durable-objects/)

Browse what other developers are building with Durable Objects.

[Limits](https://developers.cloudflare.com/durable-objects/platform/limits/)

Learn about Durable Objects limits.

[Pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

Learn about Durable Objects pricing.

[Storage options](https://developers.cloudflare.com/workers/platform/storage-options/)

Learn more about storage and database options you can build with Workers.

[Developer Discord](https://discord.cloudflare.com)

Connect with the Workers community on Discord to ask questions, show what you are building, and discuss the platform with other developers.

[@CloudflareDev](https://x.com/cloudflaredev)

Follow @CloudflareDev on Twitter to learn about product announcements, and what is new in Cloudflare Developer Platform.



---
title: In-memory state in a Durable Object · Cloudflare Durable Objects docs
description: In-memory state means that each Durable Object has one active
  instance at any particular time. All requests sent to that Durable Object are
  handled by that same instance. You can store some state in memory.
lastUpdated: 2024-10-31T15:59:06.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/durable-objects/reference/in-memory-state/
  md: https://developers.cloudflare.com/durable-objects/reference/in-memory-state/index.md
---

In-memory state means that each Durable Object has one active instance at any particular time. All requests sent to that Durable Object are handled by that same instance. You can store some state in memory.

Variables in a Durable Object will maintain state as long as your Durable Object is not evicted from memory.

A common pattern is to initialize a Durable Object from [persistent storage](https://developers.cloudflare.com/durable-objects/api/storage-api/) and set instance variables the first time it is accessed. Since future accesses are routed to the same Durable Object, it is then possible to return any initialized values without making further calls to persistent storage.

```js
export class Counter {
  constructor(state, env) {
    this.state = state;
    // `blockConcurrencyWhile()` ensures no requests are delivered until
    // initialization completes.
    this.state.blockConcurrencyWhile(async () => {
      let stored = await this.state.storage.get("value");
      // After initialization, future reads do not need to access storage.
      this.value = stored || 0;
    });
  }


  // Handle HTTP requests from clients.
  async fetch(request) {
    // use this.value rather than storage
  }
}
```

A given instance of a Durable Object may share global memory with other instances defined in the same Worker code.

In the example above, using a global variable `value` instead of the instance variable `this.value` would be incorrect. Two different instances of `Counter` will each have their own separate memory for `this.value`, but might share memory for the global variable `value`, leading to unexpected results. Because of this, it is best to avoid global variables.

Built-in caching

The Durable Object's storage has a built-in in-memory cache of its own. If you use `get()` to retrieve a value that was read or written recently, the result will be instantly returned from cache. Instead of writing initialization code like above, you could use `get("value")` whenever you need it, and rely on the built-in cache to make this fast. Refer to the [Build a counter example](https://developers.cloudflare.com/durable-objects/examples/build-a-counter/) to learn more about this approach.

However, in applications with more complex state, explicitly storing state in your Object may be easier than making Storage API calls on every access. Depending on the configuration of your project, write your code in the way that is easiest for you.



---
title: Durable Objects migrations · Cloudflare Durable Objects docs
description: A migration is a mapping process from a class name to a runtime
  state. This process communicates the changes to the Workers runtime and
  provides the runtime with instructions on how to deal with those changes.
lastUpdated: 2025-05-21T09:44:01.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
  md: https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/index.md
---

A migration is a mapping process from a class name to a runtime state. This process communicates the changes to the Workers runtime and provides the runtime with instructions on how to deal with those changes.

To apply a migration, you need to:

1. Edit your `wrangler.toml / wrangler.json` file, as explained below.
2. Re-deploy your Worker using `npx wrangler deploy`.

You must initiate a migration process when you:

* Create a new Durable Object class.
* Rename a Durable Object class.
* Delete a Durable Object class.
* Transfer an existing Durable Objects class.

Note

Updating the code for an existing Durable Object class does not require a migration. To update the code for an existing Durable Object class, run [`npx wrangler deploy`](https://developers.cloudflare.com/workers/wrangler/commands/#deploy). This is true even for changes to how the code interacts with persistent storage. Because of [global uniqueness](https://developers.cloudflare.com/durable-objects/platform/known-issues/#global-uniqueness), you do not have to be concerned about old and new code interacting with the same storage simultaneously. However, it is your responsibility to ensure that the new code is backwards compatible with existing stored data.

## Create migration

The most common migration performed is a new class migration, which informs the runtime that a new Durable Object class is being uploaded. This is also the migration you need when creating your first Durable Object class.

To apply a Create migration:

1. Add the following lines to your `wrangler.toml / wrangler.json` file:

   * wrangler.jsonc

     ```jsonc
     {
       "migrations": [
         {
           "tag": "<v1>",
           "new_sqlite_classes": [
             "<NewDurableObjectClass>"
           ]
         }
       ]
     }
     ```

   * wrangler.toml

     ```toml
     [[migrations]]
     tag = "<v1>" # Migration identifier. This should be unique for each migration entry
     new_sqlite_classes = ["<NewDurableObjectClass>"] # Array of new classes
     # For SQLite storage backend use new_sqlite_classes=["<NewDurableObjectClass>"] instead
     ```

   The Create migration contains:

   * A `tag` to identify the migration.
   * The array `new_sqlite_classes`, which contains the new Durable Object class.

2. Ensure you reference the correct name of the Durable Object class in your Worker code.

3. Deploy the Worker.

Create migration example

To create a new Durable Object binding `DURABLE_OBJECT_A`, your `wrangler.toml / wrangler.json` file should look like the following:

* wrangler.jsonc

  ```jsonc
  {
    "durable_objects": {
      "bindings": [
        {
          "name": "DURABLE_OBJECT_A",
          "class_name": "DurableObjectAClass"
        }
      ]
    },
    "migrations": [
      {
        "tag": "v1",
        "new_sqlite_classes": [
          "DurableObjectAClass"
        ]
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  # Creating a new Durable Object class
  [[durable_objects.bindings]]
  name = "DURABLE_OBJECT_A"
  class_name = "DurableObjectAClass"


  # Add the lines below for a Create migration.


  [[migrations]]
  tag = "v1"
  new_sqlite_classes = ["DurableObjectAClass"]
  ```

### Create Durable Object class with key-value storage

Recommended SQLite-backed Durable Objects

Cloudflare recommends all new Durable Object namespaces use the [SQLite storage backend](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/#create-sqlite-backed-durable-object-class). These Durable Objects can continue to use storage [key-value API](https://developers.cloudflare.com/durable-objects/api/storage-api/#kv-api).

Additionally, SQLite-backed Durable Objects allow you to store more types of data (such as tables), and offers Point In Time Recovery API which can restore a Durable Object's embedded SQLite database contents (both SQL data and key-value data) to any point in the past 30 days.

The [key-value storage backend](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/#create-durable-object-class-with-key-value-storage) remains for backwards compatibility, and a migration path from KV storage backend to SQLite storage backend for existing Durable Object namespaces will be available in the future.

Use `new_classes` on the migration in your Worker's Wrangler file to create a Durable Object class with the key-value storage backend:

* wrangler.jsonc

  ```jsonc
  {
    "migrations": [
      {
        "tag": "v1",
        "new_classes": [
          "MyDurableObject"
        ]
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  [[migrations]]
  tag = "v1" # Should be unique for each entry
  new_classes = ["MyDurableObject"] # Array of new classes
  ```

Note

Durable Objects are available both on Workers Free and Workers Paid plans.

* **Workers Free plan**: Only Durable Objects with [SQLite storage backend](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/#wrangler-configuration-for-sqlite-backed-durable-objects) are available.
* **Workers Paid plan**: Durable Objects with either SQLite storage backend or [key-value storage backend](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/#create-durable-object-class-with-key-value-storage) are available.

If you wish to downgrade from a Workers Paid plan to a Workers Free plan, you must first ensure that you have deleted all Durable Object namespaces with the key-value storage backend.

## Delete migration

Running a Delete migration will delete all Durable Objects associated with the deleted class, including all of their stored data.

* Do not run a Delete migration on a class without first ensuring that you are not relying on the Durable Objects within that Worker anymore, that is, first remove the binding from the Worker.
* Copy any important data to some other location before deleting.
* You do not have to run a Delete migration on a class that was renamed or transferred.

To apply a Delete migration:

1. Remove the binding for the class you wish to delete from the `wrangler.toml / wrangler.json` file.

2. Remove references for the class you wish to delete from your Worker code.

3. Add the following lines to your `wrangler.toml / wrangler.json` file.

   * wrangler.jsonc

     ```jsonc
     {
       "migrations": [
         {
           "tag": "<v2>",
           "deleted_classes": [
             "<ClassToDelete>"
           ]
         }
       ]
     }
     ```

   * wrangler.toml

     ```toml
     [[migrations]]
     tag = "<v2>" # Migration identifier. This should be unique for each migration entry
     deleted_classes = ["<ClassToDelete>"] # Array of deleted class names
     ```

   The Delete migration contains:

   * A `tag` to identify the migration.
   * The array `deleted_classes`, which contains the deleted Durable Object classes.

4. Deploy the Worker.

Delete migration example

To delete a Durable Object binding `DEPRECATED_OBJECT`, your `wrangler.toml / wrangler.json` file should look like the following:

* wrangler.jsonc

  ```jsonc
  {
    "migrations": [
      {
        "tag": "v3",
        "deleted_classes": [
          "DeprecatedObjectClass"
        ]
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  # Remove the binding for the DeprecatedObjectClass DO
  #[[durable_objects.bindings]]
  #name = "DEPRECATED_OBJECT"
  #class_name = "DeprecatedObjectClass"


  [[migrations]]
  tag = "v3" # Should be unique for each entry
  deleted_classes = ["DeprecatedObjectClass"] # Array of deleted classes
  ```

## Rename migration

Rename migrations are used to transfer stored Durable Objects between two Durable Object classes in the same Worker code file.

To apply a Rename migration:

1. Update the previous class name to the new class name by editing your `wrangler.toml / wrangler.json` file in the following way:

   * wrangler.jsonc

     ```jsonc
     {
       "durable_objects": {
         "bindings": [
           {
             "name": "<MY_DURABLE_OBJECT>",
             "class_name": "<UpdatedDurableObject>"
           }
         ]
       },
       "migrations": [
         {
           "tag": "<v3>",
           "renamed_classes": [
             {
               "from": "<OldDurableObject>",
               "to": "<UpdatedDurableObject>"
             }
           ]
         }
       ]
     }
     ```

   * wrangler.toml

     ```toml
     [[durable_objects.bindings]]
     name = "<MY_DURABLE_OBJECT>"
     class_name = "<UpdatedDurableObject>" # Update the class name to the new class name


     [[migrations]]
     tag = "<v3>" # Migration identifier. This should be unique for each migration entry
     renamed_classes = [{from = "<OldDurableObject>", to = "<UpdatedDurableObject>" }] # Array of rename directives
     ```

   The Rename migration contains:

   * A `tag` to identify the migration.

   * The `renamed_classes` array, which contains objects with `from` and `to` properties.

     * `from` property is the old Durable Object class name.
     * `to` property is the renamed Durable Object class name.

2. Reference the new Durable Object class name in your Worker code.

3. Deploy the Worker.

Rename migration example

To rename a Durable Object class, from `OldName` to `UpdatedName`, your `wrangler.toml / wrangler.json` file should look like the following:

* wrangler.jsonc

  ```jsonc
  {
    "durable_objects": {
      "bindings": [
        {
          "name": "MY_DURABLE_OBJECT",
          "class_name": "UpdatedName"
        }
      ]
    },
    "migrations": [
      {
        "tag": "v3",
        "renamed_classes": [
          {
            "from": "OldName",
            "to": "UpdatedName"
          }
        ]
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  # Before deleting the `DeprecatedClass` remove the binding for the `DeprecatedClass`.
  # Update the binding for the `DurableObjectExample` to the new class name `UpdatedName`.
  [[durable_objects.bindings]]
  name = "MY_DURABLE_OBJECT"
  class_name = "UpdatedName"


  # Renaming classes
  [[migrations]]
  tag = "v3"
  renamed_classes = [{from = "OldName", to = "UpdatedName" }] # Array of rename directives
  ```

## Transfer migration

Transfer migrations are used to transfer stored Durable Objects between two Durable Object classes in different Worker code files.

If you want to transfer stored Durable Objects between two Durable Object classes in the same Worker code file, use [Rename migrations](#rename-migration) instead.

Note

Do not run a [Create migration](#create-migration) for the destination class before running a Transfer migration. The Transfer migration will create the destination class for you.

To apply a Transfer migration:

1. Edit your `wrangler.toml / wrangler.json` file in the following way:

   * wrangler.jsonc

     ```jsonc
     {
       "durable_objects": {
         "bindings": [
           {
             "name": "<MY_DURABLE_OBJECT>",
             "class_name": "<DestinationDurableObjectClass>"
           }
         ]
       },
       "migrations": [
         {
           "tag": "<v4>",
           "transferred_classes": [
             {
               "from": "<SourceDurableObjectClass>",
               "from_script": "<SourceWorkerScript>",
               "to": "<DestinationDurableObjectClass>"
             }
           ]
         }
       ]
     }
     ```

   * wrangler.toml

     ```toml
     [[durable_objects.bindings]]
     name = "<MY_DURABLE_OBJECT>"
     class_name = "<DestinationDurableObjectClass>"


     [[migrations]]
     tag = "<v4>" # Migration identifier. This should be unique for each migration entry
     transferred_classes = [{from = "<SourceDurableObjectClass>", from_script = "<SourceWorkerScript>", to = "<DestinationDurableObjectClass>" }]
     ```

   The Transfer migration contains:

   * A `tag` to identify the migration.

   * The `transferred_class` array, which contains objects with `from`, `from_script`, and `to` properties.

     * `from` property is the name of the source Durable Object class.
     * `from_script` property is the name of the source Worker script.
     * `to` property is the name of the destination Durable Object class.

2. Ensure you reference the name of the new, destination Durable Object class in your Worker code.

3. Deploy the Worker.

Transfer migration example

You can transfer stored Durable Objects from `DurableObjectExample` to `TransferredClass` from a Worker script named `OldWorkerScript`. The configuration of the `wrangler.toml / wrangler.json` file for your new Worker code (destination Worker code) would look like this:

* wrangler.jsonc

  ```jsonc
  {
    "durable_objects": {
      "bindings": [
        {
          "name": "MY_DURABLE_OBJECT",
          "class_name": "TransferredClass"
        }
      ]
    },
    "migrations": [
      {
        "tag": "v4",
        "transferred_classes": [
          {
            "from": "DurableObjectExample",
            "from_script": "OldWorkerScript",
            "to": "TransferredClass"
          }
        ]
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  # destination worker
  [[durable_objects.bindings]]
  name = "MY_DURABLE_OBJECT"
  class_name = "TransferredClass"


  # Transferring class


  [[migrations]]
  tag = "v4"
  transferred_classes = [{from = "DurableObjectExample", from_script = "OldWorkerScript", to = "TransferredClass" }]
  ```

## Migration Wrangler configuration

* Migrations are performed through the `[[migrations]]` configurations key in your `wrangler.toml` file or `migration` key in your `wrangler.json` file.

* Migrations require a migration tag, which is defined by the `tag` property in each migration entry.

* Migration tags are treated like unique names and are used to determine which migrations have already been applied. Once a given Worker code has a migration tag set on it, all future Worker code deployments must include a migration tag.

* The migration list is an ordered array of tables, specified as a key in your Wrangler configuration file.

* You can define the migration for each environment, as well as at the top level.

  * Top-level migration is specified at the top-level `migrations` key in the Wrangler configuration file.

  * Environment-level migration is specified by a `migrations` key inside the `env` key of the Wrangler configuration file (`[env.<environment_name>.migrations]`).

    * Example Wrangler file:

    ```jsonc
    {
    // top-level default migrations
    "migrations": [{ ... }],
    "env": {
    "staging": {
      // migration override for staging
      "migrations": [{...}]
      }
     }
    }
    ```

  * If a migration is only specified at the top-level, but not at the environment-level, the environment will inherit the top-level migration.

  * Migrations at at the environment-level override migrations at the top level.

* All migrations are applied at deployment. Each migration can only be applied once per [environment](https://developers.cloudflare.com/durable-objects/reference/environments/).

* Each migration in the list can have multiple directives, and multiple migrations can be specified as your project grows in complexity.

Important

* The destination class (the class that stored Durable Objects are being transferred to) for a Rename or Transfer migration must be exported by the deployed Worker.

* You should not create the destination Durable Object class before running a Rename or Transfer migration. The migration will create the destination class for you.

* After a Rename or Transfer migration, requests to the destination Durable Object class will have access to the source Durable Object's stored data.

* After a migration, any existing bindings to the original Durable Object class (for example, from other Workers) will automatically forward to the updated destination class. However, any Workers bound to the updated Durable Object class must update their Durable Object binding configuration in the `wrangler` configuration file for their next deployment.

Note

Note that `.toml` files do not allow line breaks in inline tables (the `{key = "value"}` syntax), but line breaks in the surrounding inline array are acceptable.

You cannot enable a SQLite storage backend on an existing, deployed Durable Object class, so setting `new_sqlite_classes` on later migrations will fail with an error. Automatic migration of deployed classes from their key-value storage backend to SQLite storage backend will be available in the future.

Important

Durable Object migrations are atomic operations and cannot be gradually deployed. To provide early feedback to developers, new Worker versions with new migrations cannot be uploaded. Refer to [Gradual deployments for Durable Objects](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/#gradual-deployments-for-durable-objects) for more information.



---
title: Data security · Cloudflare Durable Objects docs
description: "This page details the data security properties of Durable Objects, including:"
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/durable-objects/reference/data-security/
  md: https://developers.cloudflare.com/durable-objects/reference/data-security/index.md
---

This page details the data security properties of Durable Objects, including:

* Encryption-at-rest (EAR).
* Encryption-in-transit (EIT).
* Cloudflare's compliance certifications.

## Encryption at Rest

All Durable Object data, including metadata, is encrypted at rest. Encryption and decryption are automatic, do not require user configuration to enable, and do not impact the effective performance of Durable Objects.

Encryption keys are managed by Cloudflare and securely stored in the same key management systems we use for managing encrypted data across Cloudflare internally.

Encryption at rest is implemented using the Linux Unified Key Setup (LUKS) disk encryption specification and [AES-256](https://www.cloudflare.com/learning/ssl/what-is-encryption/), a widely tested, highly performant and industry-standard encryption algorithm.

## Encryption in Transit

Data transfer between a Cloudflare Worker, and/or between nodes within the Cloudflare network and Durable Objects is secured using the same [Transport Layer Security](https://www.cloudflare.com/learning/ssl/transport-layer-security-tls/) (TLS/SSL).

API access via the HTTP API or using the [wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) command-line interface is also over TLS/SSL (HTTPS).

## Compliance

To learn more about Cloudflare's adherence to industry-standard security compliance certifications, visit the Cloudflare [Trust Hub](https://www.cloudflare.com/trust-hub/compliance-resources/).


---
title: Data location · Cloudflare Durable Objects docs
description: Jurisdictions are used to create Durable Objects that only run and
  store data within a region to comply with local regulations such as the GDPR
  or FedRAMP.
lastUpdated: 2025-05-30T16:32:37.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/durable-objects/reference/data-location/
  md: https://developers.cloudflare.com/durable-objects/reference/data-location/index.md
---

## Restrict Durable Objects to a jurisdiction

Jurisdictions are used to create Durable Objects that only run and store data within a region to comply with local regulations such as the [GDPR](https://gdpr-info.eu/) or [FedRAMP](https://blog.cloudflare.com/cloudflare-achieves-fedramp-authorization/).

Workers may still access Durable Objects constrained to a jurisdiction from anywhere in the world. The jurisdiction constraint only controls where the Durable Object itself runs and persists data. Consider using [Regional Services](https://developers.cloudflare.com/data-localization/regional-services/) to control the regions from which Cloudflare responds to requests.

Logging

A [`DurableObjectId`](https://developers.cloudflare.com/durable-objects/api/id) will be logged outside of the specified jurisdiction for billing and debugging purposes.

Durable Objects can be restricted to a specific jurisdiction by creating a [`DurableObjectNamespace`](https://developers.cloudflare.com/durable-objects/api/namespace/) restricted to a jurisdiction. All [Durable Object ID methods](https://developers.cloudflare.com/durable-objects/api/id/) are valid on IDs within a namespace restricted to a jurisdiction.

```js
const euSubnamespace = env.MY_DURABLE_OBJECT.jurisdiction("eu");
const euId = euSubnamespace.newUniqueId();
```

* It is possible to have the same name represent different IDs in different jurisdictions.

  ```js
  const euId1 = env.MY_DURABLE_OBJECT.idFromName("my-name");
  const euId2 = env.MY_DURABLE_OBJECT.jurisdiction("eu").idFromName("my-name");
  console.assert(!euId1.equal(euId2), "This should always be true");
  ```

* You will run into an error if the jurisdiction on your [`DurableObjectNamespace`](https://developers.cloudflare.com/durable-objects/api/namespace/) and the jurisdiction on [`DurableObjectId`](https://developers.cloudflare.com/durable-objects/api/id) are different.

* You will not run into an error if the [`DurableObjectNamespace`](https://developers.cloudflare.com/durable-objects/api/namespace/) is not associated with a jurisdiction.

* All [Durable Object ID methods](https://developers.cloudflare.com/durable-objects/api/id/) are valid on IDs within a namespace restricted to a jurisdiction.

  ```js
  const euSubnamespace = env.MY_DURABLE_OBJECT.jurisdiction("eu");
  const euId = euSubnamespace.idFromName(name);
  const stub = env.MY_DURABLE_OBJECT.get(euId);
  ```

Use `DurableObjectNamespace.jurisdiction`

When specifying a jurisdiction, Cloudflare recommends you first create a namespace restricted to a jurisdiction, using `const euSubnamespace = env.MY_DURABLE_OBJECT.jurisdiction("eu")`.

Note that it is also possible to specify a jurisdiction by creating an individual [`DurableObjectId`](https://developers.cloudflare.com/durable-objects/api/id) restricted to a jurisdiction, using `const euId = env.MY_DURABLE_OBJECT.newUniqueId({ jurisdiction: "eu" })`.

**However, Cloudflare does not recommend this approach.**

### Supported locations

| Parameter | Location |
| - | - |
| eu | The European Union |
| fedramp | FedRAMP-compliant data centers |

## Provide a location hint

Durable Objects, as with any stateful API, will often add response latency as requests must be forwarded to the data center where the Durable Object, or state, is located.

Durable Objects do not currently change locations after they are created1. By default, a Durable Object is instantiated in a data center close to where the initial `get()` request is made. This may not be in the same data center that the `get()` request is made from, but in most cases, it will be in close proximity.

Initial requests to Durable Objects

It can negatively impact latency to pre-create Durable Objects prior to the first client request or when the first client request is not representative of where the majority of requests will come from. It is better for latency to create Durable Objects in response to actual production traffic or provide explicit location hints.

Location hints are the mechanism provided to specify the location that a Durable Object should be located regardless of where the initial `get()` request comes from.

To manually create Durable Objects in another location, provide an optional `locationHint` parameter to `get()`. Only the first call to `get()` for a particular Object will respect the hint.

```js
let durableObjectStub = OBJECT_NAMESPACE.get(id, { locationHint: "enam" });
```

Warning

Hints are a best effort and not a guarantee. Unlike with jurisdictions, Durable Objects will not necessarily be instantiated in the hinted location, but instead instantiated in a data center selected to minimize latency from the hinted location.

### Supported locations

| Parameter | Location |
| - | - |
| wnam | Western North America |
| enam | Eastern North America |
| sam | South America 2 |
| weur | Western Europe |
| eeur | Eastern Europe |
| apac | Asia-Pacific |
| oc | Oceania |
| afr | Africa 2 |
| me | Middle East 2 |

1 Dynamic relocation of existing Durable Objects is planned for the future.

2 Durable Objects currently do not spawn in this location. Instead, the Durable Object will spawn in a nearby location which does support Durable Objects. For example, Durable Objects hinted to South America spawn in Eastern North America instead.

## Additional resources

* You can find our more about where Durable Objects are located using the website: [Where Durable Objects Live](https://where.durableobjects.live/).



---
title: Environments · Cloudflare Durable Objects docs
description: Environments provide isolated spaces where your code runs with
  specific dependencies and configurations. This can be useful for a number of
  reasons, such as compatibility testing or version management. Using different
  environments can help with code consistency, testing, and production
  segregation, which reduces the risk of errors when deploying code.
lastUpdated: 2025-06-18T17:02:32.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/durable-objects/reference/environments/
  md: https://developers.cloudflare.com/durable-objects/reference/environments/index.md
---

Environments provide isolated spaces where your code runs with specific dependencies and configurations. This can be useful for a number of reasons, such as compatibility testing or version management. Using different environments can help with code consistency, testing, and production segregation, which reduces the risk of errors when deploying code.

## Wrangler environments

[Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) allows you to deploy the same Worker application with different configuration for each [environment](https://developers.cloudflare.com/workers/wrangler/environments/).

If you are using Wrangler environments, you must specify any [Durable Object bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) you wish to use on a per-environment basis.

Durable Object bindings are not inherited. For example, you can define an environment named `staging` as below:

* wrangler.jsonc

  ```jsonc
  {
    "env": {
      "staging": {
        "durable_objects": {
          "bindings": [
            {
              "name": "EXAMPLE_CLASS",
              "class_name": "DurableObjectExample"
            }
          ]
        }
      }
    }
  }
  ```

* wrangler.toml

  ```toml
  [env.staging]
  durable_objects.bindings = [
    {name = "EXAMPLE_CLASS", class_name = "DurableObjectExample"}
  ]
  ```

Because Wrangler appends the [environment name](https://developers.cloudflare.com/workers/wrangler/environments/) to the top-level name when publishing, for a Worker named `worker-name` the above example is equivalent to:

* wrangler.jsonc

  ```jsonc
  {
    "env": {
      "staging": {
        "durable_objects": {
          "bindings": [
            {
              "name": "EXAMPLE_CLASS",
              "class_name": "DurableObjectExample",
              "script_name": "worker-name-staging"
            }
          ]
        }
      }
    }
  }
  ```

* wrangler.toml

  ```toml
  [env.staging]
  durable_objects.bindings = [
    {name = "EXAMPLE_CLASS", class_name = "DurableObjectExample", script_name = "worker-name-staging"}
  ]
  ```

`"EXAMPLE_CLASS"` in the staging environment is bound to a different Worker code name compared to the top-level `"EXAMPLE_CLASS"` binding, and will therefore access different Durable Objects with different persistent storage.

If you want an environment-specific binding that accesses the same Objects as the top-level binding, specify the top-level Worker code name explicitly using `script_name`:

* wrangler.jsonc

  ```jsonc
  {
    "env": {
      "another": {
        "durable_objects": {
          "bindings": [
            {
              "name": "EXAMPLE_CLASS",
              "class_name": "DurableObjectExample",
              "script_name": "worker-name"
            }
          ]
        }
      }
    }
  }
  ```

* wrangler.toml

  ```toml
  [env.another]
  durable_objects.bindings = [
    {name = "EXAMPLE_CLASS", class_name = "DurableObjectExample", script_name = "worker-name"}
  ]
  ```

### Migration environments

You can define a Durable Object migration for each environment, as well as at the top level. Migrations at at the environment-level override migrations at the top level.

For more information, refer to [Migration Wrangler Configuration](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/#migration-wrangler-configuration).

## Local development

Local development sessions create a standalone, local-only environment that mirrors the production environment, so that you can test your Worker and Durable Objects before you deploy to production.

An existing Durable Object binding of `DB` would be available to your Worker when running locally.

Refer to Workers [Local development](https://developers.cloudflare.com/workers/development-testing/bindings-per-env/).

## Remote development

KV-backed Durable Objects support remote development using the dashboard playground. The dashboard playground uses a browser version of Visual Studio Code, allowing you to rapidly iterate on your Worker entirely in your browser.

To start remote development:

1. Log in to your Cloudflare dashboard, and go to [**Workers & Pages** > **Overview**](https://dash.cloudflare.com/?to=/:account/workers-and-pages).
2. Select an existing Worker.
3. Select the **Edit code** icon located on the upper-right of the screen.

Warning

Remote development is only available for KV-backed Durable Objects. SQLite-backed Durable Objects do not support remote development.


---
title: Gradual deployments · Cloudflare Workers docs
description: Incrementally deploy code changes to your Workers with gradual deployments.
lastUpdated: 2025-04-24T21:22:15.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/
  md: https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/index.md
---

Gradual Deployments give you the ability to incrementally deploy new [versions](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/#versions) of Workers by splitting traffic across versions.

![Gradual Deployments](https://developers.cloudflare.com/_astro/gradual-deployments.C6F9MQ6U_Z1KFl3a.webp)

Using gradual deployments, you can:

* Gradually shift traffic to a newer version of your Worker.
* Monitor error rates and exceptions across versions using [analytics and logs](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/#observability) tooling.
* [Roll back](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/) to a previously stable version if you notice issues when deploying a new version.

## Use gradual deployments

The following section guides you through an example usage of gradual deployments. You will choose to use either [Wrangler](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/#via-wrangler) or the [Cloudflare dashboard](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/#via-the-cloudflare-dashboard) to:

* Create a new Worker.
* Publish a new version of that Worker without deploying it.
* Create a gradual deployment between the two versions.
* Progress the deployment of the new version to 100% of traffic.

### Via Wrangler

Note

Minimum required Wrangler version: 3.40.0. Versions before 3.73.0 require you to specify a `--x-versions` flag.

#### 1. Create and deploy a new Worker

Create a new `"Hello World"` Worker using the [`create-cloudflare` CLI (C3)](https://developers.cloudflare.com/pages/get-started/c3/) and deploy it.

```sh
npm create cloudflare@latest <NAME> -- --type=hello-world
```

Answer `yes` or `no` to using TypeScript. Answer `yes` to deploying your application. This is the first version of your Worker.

#### 2. Create a new version of the Worker

To create a new version of the Worker, edit the Worker code by changing the `Response` content to your desired text and upload the Worker by using the [`wrangler versions upload`](https://developers.cloudflare.com/workers/wrangler/commands/#upload) command.

```sh
npx wrangler versions upload
```

This will create a new version of the Worker that is not automatically deployed.

#### 3. Create a new deployment

Use the [`wrangler versions deploy`](https://developers.cloudflare.com/workers/wrangler/commands/#deploy-2) command to create a new deployment that splits traffic between two versions of the Worker. Follow the interactive prompts to create a deployment with the versions uploaded in [step #1](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/#1-create-and-deploy-a-new-worker) and [step #2](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/#2-create-a-new-version-of-the-worker). Select your desired percentages for each version.

```sh
npx wrangler versions deploy
```

#### 4. Test the split deployment

Run a cURL command on your Worker to test the split deployment.

```bash
for j in {0..10}
do
    curl -s https://$WORKER_NAME.$SUBDOMAIN.workers.dev
done
```

You should see 10 responses. Responses will reflect the content returned by the versions in your deployment. Responses will vary depending on the percentages configured in [step #3](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/#3-create-a-new-deployment).

You can test also target a specific version using [version overrides](#version-overrides).

#### 5. Set your new version to 100% deployment

Run `wrangler versions deploy` again and follow the interactive prompts. Select the version uploaded in [step 2](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/#2-create-a-new-version-of-the-worker) and set it to 100% deployment.

```sh
npx wrangler versions deploy
```

### Via the Cloudflare dashboard

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/workers) and select your account.
2. Go to **Workers & Pages**.
3. Select **Create application** > **Hello World** template > deploy your Worker.
4. Once the Worker is deployed, go to the online code editor through **Edit code**. Edit the Worker code (change the `Response` content) and upload the Worker.
5. To save changes, select the **down arrow** next to **Deploy** > **Save**. This will create a new version of your Worker.
6. Create a new deployment that splits traffic between the two versions created in step 3 and 5 by going to **Deployments** and selecting **Deploy Version**.
7. cURL your Worker to test the split deployment.

```bash
for j in {0..10}
do
    curl -s https://$WORKER_NAME.$SUBDOMAIN.workers.dev
done
```

You should see 10 responses. Responses will reflect the content returned by the versions in your deployment. Responses will vary depending on the percentages configured in step #6.

## Version affinity

By default, the percentages configured when using gradual deployments operate on a per-request basis — a request has a X% probability of invoking one of two versions of the Worker in the [deployment](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/#deployments).

You may want requests associated with a particular identifier (such as user, session, or any unique ID) to be handled by a consistent version of your Worker to prevent version skew. Version skew occurs when there are multiple versions of an application deployed that are not forwards/backwards compatible. You can configure version affinity to prevent the Worker's version from changing back and forth on a per-request basis.

You can do this by setting the `Cloudflare-Workers-Version-Key` header on the incoming request to your Worker. For example:

```sh
curl -s https://example.com -H 'Cloudflare-Workers-Version-Key: foo'
```

For a given [deployment](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/#deployments), all requests with a version key set to `foo` will be handled by the same version of your Worker. The specific version of your Worker that the version key `foo` corresponds to is determined by the percentages you have configured for each Worker version in your deployment.

You can set the `Cloudflare-Workers-Version-Key` header both when making an external request from the Internet to your Worker, as well as when making a subrequest from one Worker to another Worker using a [service binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/).

### Setting `Cloudflare-Workers-Version-Key` using Ruleset Engine

You may want to extract a version key from certain properties of your request such as the URL, headers or cookies. You can configure a [Ruleset Engine](https://developers.cloudflare.com/ruleset-engine/) rule on your zone to do this. This allows you to specify version affinity based on these properties without having to modify the external client that makes the request.

For example, if your worker serves video assets under the URI path `/assets/` and you wanted requests to each unique asset to be handled by a consistent version, you could define the following [request header transform rule](https://developers.cloudflare.com/rules/transform/request-header-modification/):

Text in **Expression Editor**:

```txt
starts_with(http.request.uri.path, "/asset/")
```

Selected operation under **Modify request header**: *Set dynamic*

**Header name**: `Cloudflare-Workers-Version-Key`

**Value**: `regex_replace(http.request.uri.path, "/asset/(.*)", "${1}")`

## Version overrides

You can use version overrides to send a request to a specific version of your Worker in your gradual deployment.

To specify a version override in your request, you can set the `Cloudflare-Workers-Version-Overrides` header on the request to your Worker. For example:

```sh
curl -s https://example.com -H 'Cloudflare-Workers-Version-Overrides: my-worker-name="dc8dcd28-271b-4367-9840-6c244f84cb40"'
```

`Cloudflare-Workers-Version-Overrides` is a [Dictionary Structured Header](https://www.rfc-editor.org/rfc/rfc8941#name-dictionaries).

The dictionary can contain multiple key-value pairs. Each key indicates the name of the Worker the override should be applied to. The value indicates the version ID that should be used and must be a [String](https://www.rfc-editor.org/rfc/rfc8941#name-strings).

A version override will only be applied if the specified version is in the current deployment. The versions in the current deployment can be found using the [`wrangler deployments list`](https://developers.cloudflare.com/workers/wrangler/commands/#list-6) command or on the [Workers Dashboard](https://dash.cloudflare.com/?to=/:account/workers) under Worker > Deployments > Active Deployment.

Verifying that the version override was applied

There are a number of reasons why a request's version override may not be applied. For example:

* The deployment containing the specified version may not have propagated yet.
* The header value may not be a valid [Dictionary](https://www.rfc-editor.org/rfc/rfc8941#name-dictionaries).

In the case that a request's version override is not applied, the request will be routed according to the percentages set in the gradual deployment configuration.

To make sure that the request's version override was applied correctly, you can [observe](#observability) the version of your Worker that was invoked. You could even automate this check by using the [runtime binding](#runtime-binding) to return the version in the Worker's response.

### Example

You may want to test a new version in production before gradually deploying it to an increasing proportion of external traffic.

In this example, your deployment is initially configured to route all traffic to a single version:

| Version ID | Percentage |
| - | - |
| db7cd8d3-4425-4fe7-8c81-01bf963b6067 | 100% |

Create a new deployment using [`wrangler versions deploy`](https://developers.cloudflare.com/workers/wrangler/commands/#deploy-2) and specify 0% for the new version whilst keeping the previous version at 100%.

| Version ID | Percentage |
| - | - |
| dc8dcd28-271b-4367-9840-6c244f84cb40 | 0% |
| db7cd8d3-4425-4fe7-8c81-01bf963b6067 | 100% |

Now test the new version with a version override before gradually progressing the new version to 100%:

```sh
curl -s https://example.com -H 'Cloudflare-Workers-Version-Overrides: my-worker-name="dc8dcd28-271b-4367-9840-6c244f84cb40"'
```

## Gradual deployments for Durable Objects

To provide [global uniqueness](https://developers.cloudflare.com/durable-objects/platform/known-issues/#global-uniqueness), only one version of each [Durable Object](https://developers.cloudflare.com/durable-objects/) can run at a time. This means that gradual deployments work slightly differently for Durable Objects.

When you create a new gradual deployment for a Worker with Durable Objects, each Durable Object is assigned a Worker version based on the percentages you configured in your [deployment](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/#deployments). This version will not change until you create a new deployment.

![Gradual Deployments Durable Objects](https://developers.cloudflare.com/_astro/durable-objects.D92CiuSQ_Z1KD3Vq.webp)

### Example

This example assumes that you have previously created 3 Durable Objects and [derived their IDs from the names](https://developers.cloudflare.com/durable-objects/api/namespace/#idfromname) "foo", "bar" and "baz".

Your Worker is currently on a version that we will call version "A" and you want to gradually deploy a new version "B" of your Worker.

Here is how the versions of your Durable Objects might change as you progress your gradual deployment:

| Deployment config | "foo" | "bar" | "baz" |
| - | - | - | - |
| Version A: 100%  | A | A | A |
| Version B: 20% Version A: 80% | B | A | A |
| Version B: 50% Version A: 50% | B | B | A |
| Version B: 100%  | B | B | B |

This is only an example, so the versions assigned to your Durable Objects may be different. However, the following is guaranteed:

* For a given deployment, requests to each Durable Object will always use the same Worker version.
* When you specify each version in the same order as the previous deployment and increase the percentage of a version, Durable Objects which were previously assigned that version will not be assigned a different version. In this example, Durable Object "foo" would never revert from version "B" to version "A".
* The Durable Object will only be [reset](https://developers.cloudflare.com/durable-objects/observability/troubleshooting/#durable-object-reset-because-its-code-was-updated) when it is assigned a different version, so each Durable Object will only be reset once in this example.

Note

Typically, a Worker bundle will define both the Durable Object class and a Worker that interacts with it. In this case, you cannot deploy changes to your Durable Object and its Worker independently.

You should ensure that API changes between your Durable Object and its Worker are [forwards and backwards compatible](https://developers.cloudflare.com/durable-objects/platform/known-issues/#code-updates) whether you are using gradual deployments or not. However, using gradual deployments will make it even more likely that different versions of your Durable Objects and its Worker will interact with each other.

### Migrations

Versions of Worker bundles containing new Durable Object migrations cannot be uploaded. This is because Durable Object migrations are atomic operations. Durable Object migrations can be deployed with the following command:

```sh
npx wrangler versions deploy
```

To limit the blast radius of Durable Object migration deployments, migrations should be deployed independently of other code changes.

To understand why Durable Object migrations are atomic operations, consider the hypothetical example of gradually deploying a delete migration. If a delete migration were applied to 50% of Durable Object instances, then Workers requesting those Durable Object instances would fail because they would have been deleted.

To do this without producing errors, a version of the Worker which does not depend on any Durable Object instances would have to have already been rolled out. Then, you can deploy a delete migration without affecting any traffic and there is no reason to do so gradually.

## Observability

When using gradual deployments, you may want to attribute Workers invocations to a specific version in order to get visibility into the impact of deploying new versions.

### Logpush

A new `ScriptVersion` object is available in [Workers Logpush](https://developers.cloudflare.com/workers/observability/logs/logpush/). `ScriptVersion` can only be added through the Logpush API right now. Sample API call:

```bash
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/logpush/jobs' \
-H 'Authorization: Bearer <TOKEN>' \
-H 'Content-Type: application/json' \
-d '{
"name": "workers-logpush",
"output_options": {
    "field_names": ["Event", "EventTimestampMs", "Outcome", "Logs", "ScriptName", "ScriptVersion"],
},
"destination_conf": "<DESTINATION_URL>",
"dataset": "workers_trace_events",
"enabled": true
}'| jq .
```

`ScriptVersion` is an object with the following structure:

```json
scriptVersion: {
    id: "<UUID>",
    message: "<MESSAGE>",
    tag: "<TAG>"
}
```

### Runtime binding

Use the [Version metadata binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/) in to access version ID or version tag in your Worker.

## Limits

### Deployments limit

You can only create a new deployment with the last 10 uploaded versions of your Worker.



---
title: Workers Sites configuration · Cloudflare Workers docs
description: Workers Sites require the latest version of Wrangler.
lastUpdated: 2025-02-12T13:41:31.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers/configuration/sites/configuration/
  md: https://developers.cloudflare.com/workers/configuration/sites/configuration/index.md
---

Use Workers Static Assets Instead

You should use [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) to host full-stack applications instead of Workers Sites. It has been deprecated in Wrangler v4, and the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) does not support Workers Sites. Do not use Workers Sites for new projects.

Workers Sites require the latest version of [Wrangler](https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler).

## Wrangler configuration file

There are a few specific configuration settings for Workers Sites in your Wrangler file:

* `bucket` required

  * The directory containing your static assets, path relative to your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/). Example: `bucket = "./public"`.

* `include` optional

  * A list of gitignore-style patterns for files or directories in `bucket` you exclusively want to upload. Example: `include = ["upload_dir"]`.

* `exclude` optional

  * A list of gitignore-style patterns for files or directories in `bucket` you want to exclude from uploads. Example: `exclude = ["ignore_dir"]`.

To learn more about the optional `include` and `exclude` fields, refer to [Ignoring subsets of static assets](#ignoring-subsets-of-static-assets).

Note

If your project uses [environments](https://developers.cloudflare.com/workers/wrangler/environments/), make sure to place `site` above any environment-specific configuration blocks.

Example of a [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):

* wrangler.jsonc

  ```jsonc
  {
    "name": "docs-site-blah",
    "site": {
      "bucket": "./public"
    },
    "env": {
      "production": {
        "name": "docs-site",
        "route": "https://example.com/docs*"
      },
      "staging": {
        "name": "docs-site-staging",
        "route": "https://staging.example.com/docs*"
      }
    }
  }
  ```

* wrangler.toml

  ```toml
  name = "docs-site-blah"


  [site]
  bucket = "./public"


  [env.production]
  name = "docs-site"
  route = "https://example.com/docs*"


  [env.staging]
  name = "docs-site-staging"
  route = "https://staging.example.com/docs*"
  ```

## Storage limits

For very exceptionally large pages, Workers Sites might not work for you. There is a 25 MiB limit per page or file.

## Ignoring subsets of static assets

Workers Sites require [Wrangler](https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler) - make sure to use the [latest version](https://developers.cloudflare.com/workers/wrangler/install-and-update/#update-wrangler).

There are cases where users may not want to upload certain static assets to their Workers Sites. In this case, Workers Sites can also be configured to ignore certain files or directories using logic similar to [Cargo's optional include and exclude fields](https://doc.rust-lang.org/cargo/reference/manifest.html#the-exclude-and-include-fields-optional).

This means that you should use gitignore semantics when declaring which directory entries to include or ignore in uploads.

### Exclusively including files/directories

If you want to include only a certain set of files or directories in your `bucket`, you can add an `include` field to your `[site]` section of your Wrangler file:

* wrangler.jsonc

  ```jsonc
  {
    "site": {
      "bucket": "./public",
      "include": [
        "included_dir"
      ]
    }
  }
  ```

* wrangler.toml

  ```toml
  [site]
  bucket = "./public"
  include = ["included_dir"] # must be an array.
  ```

Wrangler will only upload files or directories matching the patterns in the `include` array.

### Excluding files/directories

If you want to exclude files or directories in your `bucket`, you can add an `exclude` field to your `[site]` section of your Wrangler file:

* wrangler.jsonc

  ```jsonc
  {
    "site": {
      "bucket": "./public",
      "exclude": [
        "excluded_dir"
      ]
    }
  }
  ```

* wrangler.toml

  ```toml
  [site]
  bucket = "./public"
  exclude = ["excluded_dir"] # must be an array.
  ```

Wrangler will ignore files or directories matching the patterns in the `exclude` array when uploading assets to Workers KV.

### Include > exclude

If you provide both `include` and `exclude` fields, the `include` field will be used and the `exclude` field will be ignored.

### Default ignored entries

Wrangler will always ignore:

* `node_modules`
* Hidden files and directories
* Symlinks

#### More about include/exclude patterns

Learn more about the standard patterns used for include and exclude in the [gitignore documentation](https://git-scm.com/docs/gitignore).
