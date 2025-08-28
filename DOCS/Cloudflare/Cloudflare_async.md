---
title: Store and sync state · Cloudflare Agents docs
description: Every Agent has built-in state management capabilities, including
  built-in storage and synchronization between the Agent and frontend
  applications.
lastUpdated: 2025-06-19T13:27:22.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/
  md: https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/index.md
---

Every Agent has built-in state management capabilities, including built-in storage and synchronization between the Agent and frontend applications.

State within an Agent is:

* Persisted across Agent restarts: data is permanently stored within an Agent.
* Automatically serialized/deserialized: you can store any JSON-serializable data.
* Immediately consistent within the Agent: read your own writes.
* Thread-safe for concurrent updates
* Fast: state is colocated wherever the Agent is running. Reads and writes do not need to traverse the network.

Agent state is stored in a SQL database that is embedded within each individual Agent instance: you can interact with it using the higher-level `this.setState` API (recommended), which allows you to sync state and trigger events on state changes, or by directly querying the database with `this.sql`.

#### State API

Every Agent has built-in state management capabilities. You can set and update the Agent's state directly using `this.setState`:

* JavaScript

  ```js
  import { Agent } from "agents";


  export class MyAgent extends Agent {
    // Update state in response to events
    async incrementCounter() {
      this.setState({
        ...this.state,
        counter: this.state.counter + 1,
      });
    }


    // Handle incoming messages
    async onMessage(message) {
      if (message.type === "update") {
        this.setState({
          ...this.state,
          ...message.data,
        });
      }
    }


    // Handle state updates
    onStateUpdate(state, source) {
      console.log("state updated", state);
    }
  }
  ```

* TypeScript

  ```ts
  import { Agent } from "agents";


  export class MyAgent extends Agent {
    // Update state in response to events
    async incrementCounter() {
      this.setState({
        ...this.state,
        counter: this.state.counter + 1,
      });
    }


    // Handle incoming messages
    async onMessage(message) {
      if (message.type === "update") {
        this.setState({
          ...this.state,
          ...message.data,
        });
      }
    }


    // Handle state updates
    onStateUpdate(state, source: "server" | Connection) {
      console.log("state updated", state);
    }
  }
  ```

If you're using TypeScript, you can also provide a type for your Agent's state by passing in a type as a [type parameter](https://www.typescriptlang.org/docs/handbook/2/generics.html#using-type-parameters-in-generic-constraints) as the *second* type parameter to the `Agent` class definition.

* JavaScript

  ```js
  import { Agent } from "agents";


  // Define a type for your Agent's state
  // Pass in the type of your Agent's state
  export class MyAgent extends Agent {
    // This allows this.setState and the onStateUpdate method to
    // be typed:
    async onStateUpdate(state) {
      console.log("state updated", state);
    }


    async someOtherMethod() {
      this.setState({
        ...this.state,
        price: this.state.price + 10,
      });
    }
  }
  ```

* TypeScript

  ```ts
  import { Agent } from "agents";


  interface Env {}


  // Define a type for your Agent's state
  interface FlightRecord {
    id: string;
    departureIata: string;
    arrival: Date;
    arrivalIata: string;
    price: number;
  }


  // Pass in the type of your Agent's state
  export class MyAgent extends Agent<Env, FlightRecord> {
    // This allows this.setState and the onStateUpdate method to
    // be typed:
     async onStateUpdate(state: FlightRecord) {
      console.log("state updated", state);
    }


    async someOtherMethod() {
      this.setState({
        ...this.state,
        price: this.state.price + 10,
      });
    }
  }
  ```

### Set the initial state for an Agent

You can also set the initial state for an Agent via the `initialState` property on the `Agent` class:

* JavaScript

  ```js
  class MyAgent extends Agent {
    // Set a default, initial state
    initialState = {
      counter: 0,
      text: "",
      color: "#3B82F6",
    };


    doSomething() {
      console.log(this.state); // {counter: 0, text: "", color: "#3B82F6"}, if you haven't set the state yet
    }
  }
  ```

* TypeScript

  ```ts
  type State = {
    counter: number;
    text: string;
    color: string;
  };


  class MyAgent extends Agent<Env, State> {
    // Set a default, initial state
    initialState = {
      counter: 0,
      text: "",
      color: "#3B82F6",
    };


    doSomething() {
      console.log(this.state); // {counter: 0, text: "", color: "#3B82F6"}, if you haven't set the state yet
    }
  }
  ```

Any initial state is synced to clients connecting via [the `useAgent` hook](#synchronizing-state).

### Synchronizing state

Clients can connect to an Agent and stay synchronized with its state using the React hooks provided as part of `agents/react`.

A React application can call `useAgent` to connect to a named Agent over WebSockets at

* JavaScript

  ```js
  import { useState } from "react";
  import { useAgent } from "agents/react";


  function StateInterface() {
    const [state, setState] = useState({ counter: 0 });


    const agent = useAgent({
      agent: "thinking-agent",
      name: "my-agent",
      onStateUpdate: (newState) => setState(newState),
    });


    const increment = () => {
      agent.setState({ counter: state.counter + 1 });
    };


    return (
      <div>
        <div>Count: {state.counter}</div>
        <button onClick={increment}>Increment</button>
      </div>
    );
  }
  ```

* TypeScript

  ```ts
  import { useState } from "react";
  import { useAgent } from "agents/react";


  function StateInterface() {
    const [state, setState] = useState({ counter: 0 });


    const agent = useAgent({
      agent: "thinking-agent",
      name: "my-agent",
      onStateUpdate: (newState) => setState(newState),
    });


    const increment = () => {
      agent.setState({ counter: state.counter + 1 });
    };


    return (
      <div>
        <div>Count: {state.counter}</div>
        <button onClick={increment}>Increment</button>
      </div>
    );
  }
  ```

The state synchronization system:

* Automatically syncs the Agent's state to all connected clients
* Handles client disconnections and reconnections gracefully
* Provides immediate local updates
* Supports multiple simultaneous client connections

Common use cases:

* Real-time collaborative features
* Multi-window/tab synchronization
* Live updates across multiple devices
* Maintaining consistent UI state across clients
* When new clients connect, they automatically receive the current state from the Agent, ensuring all clients start with the latest data.

### SQL API

Every individual Agent instance has its own SQL (SQLite) database that runs *within the same context* as the Agent itself. This means that inserting or querying data within your Agent is effectively zero-latency: the Agent doesn't have to round-trip across a continent or the world to access its own data.

You can access the SQL API within any method on an Agent via `this.sql`. The SQL API accepts template literals, and

* JavaScript

  ```js
  export class MyAgent extends Agent {
    async onRequest(request) {
      let userId = new URL(request.url).searchParams.get("userId");


      // 'users' is just an example here: you can create arbitrary tables and define your own schemas
      // within each Agent's database using SQL (SQLite syntax).
      let user = await this.sql`SELECT * FROM users WHERE id = ${userId}`;
      return Response.json(user);
    }
  }
  ```

* TypeScript

  ```ts
  export class MyAgent extends Agent<Env> {
    async onRequest(request: Request) {
      let userId = new URL(request.url).searchParams.get('userId');


      // 'users' is just an example here: you can create arbitrary tables and define your own schemas
      // within each Agent's database using SQL (SQLite syntax).
      let user = await this.sql`SELECT * FROM users WHERE id = ${userId}`
      return Response.json(user)
    }
  }
  ```

You can also supply a [TypeScript type argument](https://www.typescriptlang.org/docs/handbook/2/generics.html#using-type-parameters-in-generic-constraints) to the query, which will be used to infer the type of the result:

```ts
type User = {
  id: string;
  name: string;
  email: string;
};


export class MyAgent extends Agent<Env> {
  async onRequest(request: Request) {
    let userId = new URL(request.url).searchParams.get('userId');
    // Supply the type parameter to the query when calling this.sql
    // This assumes the results returns one or more User rows with "id", "name", and "email" columns
    const user = await this.sql<User>`SELECT * FROM users WHERE id = ${userId}`;
    return Response.json(user)
  }
}
```

You do not need to specify an array type (`User[]` or `Array<User>`) as `this.sql` will always return an array of the specified type.

Providing a type parameter does not validate that the result matches your type definition. In TypeScript, properties (fields) that do not exist or conform to the type you provided will be dropped. If you need to validate incoming events, we recommend a library such as [zod](https://zod.dev/) or your own validator logic.

Note

Learn more about the zero-latency SQL storage that powers both Agents and Durable Objects [on our blog](https://blog.cloudflare.com/sqlite-in-durable-objects/).

The SQL API exposed to an Agent is similar to the one [within Durable Objects](https://developers.cloudflare.com/durable-objects/api/storage-api/#sql-api): Durable Object SQL methods available on `this.ctx.storage.sql`. You can use the same SQL queries with the Agent's database, create tables, and query data, just as you would with Durable Objects or [D1](https://developers.cloudflare.com/d1/).

### Use Agent state as model context

You can combine the state and SQL APIs in your Agent with its ability to [call AI models](https://developers.cloudflare.com/agents/api-reference/using-ai-models/) to include historical context within your prompts to a model. Modern Large Language Models (LLMs) often have very large context windows (up to millions of tokens), which allows you to pull relevant context into your prompt directly.

For example, you can use an Agent's built-in SQL database to pull history, query a model with it, and append to that history ahead of the next call to the model:

* JavaScript

  ```js
  export class ReasoningAgent extends Agent {
    async callReasoningModel(prompt) {
      let result = this
        .sql`SELECT * FROM history WHERE user = ${prompt.userId} ORDER BY timestamp DESC LIMIT 1000`;
      let context = [];
      for await (const row of result) {
        context.push(row.entry);
      }


      const client = new OpenAI({
        apiKey: this.env.OPENAI_API_KEY,
      });


      // Combine user history with the current prompt
      const systemPrompt = prompt.system || "You are a helpful assistant.";
      const userPrompt = `${prompt.user}\n\nUser history:\n${context.join("\n")}`;


      try {
        const completion = await client.chat.completions.create({
          model: this.env.MODEL || "o3-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });


        // Store the response in history
        this
          .sql`INSERT INTO history (timestamp, user, entry) VALUES (${new Date()}, ${prompt.userId}, ${completion.choices[0].message.content})`;


        return completion.choices[0].message.content;
      } catch (error) {
        console.error("Error calling reasoning model:", error);
        throw error;
      }
    }
  }
  ```

* TypeScript

  ```ts
  export class ReasoningAgent extends Agent<Env> {
    async callReasoningModel(prompt: Prompt) {
      let result = this.sql<History>`SELECT * FROM history WHERE user = ${prompt.userId} ORDER BY timestamp DESC LIMIT 1000`;
      let context = [];
      for await (const row of result) {
        context.push(row.entry);
      }


      const client = new OpenAI({
        apiKey: this.env.OPENAI_API_KEY,
      });


      // Combine user history with the current prompt
      const systemPrompt = prompt.system || 'You are a helpful assistant.';
      const userPrompt = `${prompt.user}\n\nUser history:\n${context.join('\n')}`;


      try {
        const completion = await client.chat.completions.create({
          model: this.env.MODEL || 'o3-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });


        // Store the response in history
        this
          .sql`INSERT INTO history (timestamp, user, entry) VALUES (${new Date()}, ${prompt.userId}, ${completion.choices[0].message.content})`;


        return completion.choices[0].message.content;
      } catch (error) {
        console.error('Error calling reasoning model:', error);
        throw error;
      }
    }
  }
  ```

This works because each instance of an Agent has its *own* database, the state stored in that database is private to that Agent: whether it's acting on behalf of a single user, a room or channel, or a deep research tool. By default, you don't have to manage contention or reach out over the network to a centralized database to retrieve and store state.

### Next steps

* Review the [API documentation](https://developers.cloudflare.com/agents/api-reference/agents-api/) for the Agents class to learn how to define them.
* [Build a chat Agent](https://developers.cloudflare.com/agents/getting-started/build-a-chat-agent/) using the Agents SDK and deploy it to Workers.
* Learn more [using WebSockets](https://developers.cloudflare.com/agents/api-reference/websockets/) to build interactive Agents and stream data back from your Agent.
* [Orchestrate asynchronous workflows](https://developers.cloudflare.com/agents/api-reference/run-workflows) from your Agent by combining the Agents SDK and [Workflows](https://developers.cloudflare.com/workflows).
