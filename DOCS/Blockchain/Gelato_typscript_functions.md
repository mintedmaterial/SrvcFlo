# Test & Deploy Typescript Functions

## Testing Typescript Functions

To test your Typescript Function locally, run:

```bash
npx w3f test path/to/web3-functions/index.ts --logs
```

or

```bash
npx hardhat w3f-run W3FNAME --logs
```

Example:

```bash
npx w3f test oracle/index.ts --logs
```

### Optional flags:

* `--logs` Show internal Web3 Function logs
* `--debug` Show Runtime debug messages
* `--chain-id [NETWORK]` Set the default runtime network & provider.

Example:

```bash
npx w3f test path/to/web3-functions/index.ts --logs --chain-id=<chain-id>
```

or

```bash
npx hardhat w3f-run web3-function --logs --network hardhat
```

Output:

```bash
Web3Function Build result:
 ✓ Schema: /Users/chuahsonglin/Documents/GitHub/Gelato/contract/w3f-template/web3-functions/oracle/schema.json
 ✓ Built file: /Users/chuahsonglin/Documents/GitHub/Gelato/contract/w3f-template/.tmp/index.js
 ✓ File size: 2.47mb
 ✓ Build time: 947.91ms

Web3Function user args validation:
 ✓ currency: ethereum
 ✓ oracle: 0x71B9B0F6C999CBbB0FeF9c92B80D54e4973214da

Web3Function running logs:
> Last oracle update: 0
> Next oracle update: 3600
> Updating price: 1898

Web3Function Result:
 ✓ Return value: {
  canExec: true,
  callData: [
    {
      to: '0x71B9B0F6C999CBbB0FeF9c92B80D54e4973214da',
      data: '0x8d6cc56d000000000000000000000000000000000000000000000000000000000000076a'
    }
  ]
}

Web3Function Runtime stats:
 ✓ Duration: 1.35s
 ✓ Memory: 113.55mb
 ✓ Storage: 0.03kb
 ✓ Rpc calls: 3
```

## Deploying Typescript Functions

To compile your Typescript Function and deploy it to IPFS, use

```bash
npx w3f deploy path/to/web3-functions/index.ts --chain-id=<chain-id>
```

or

```bash
npx hardhat w3f-deploy W3FNAME --network sepolia
```

Example:

```bash
npx w3f deploy oracle/index.ts --chain-id=11155111
```

Once uploaded, Gelato Nodes will pin the file on your behalf on IPFS. If the upload was successful, you should get the IPFS CID of your Typescript Function returned.

```bash
 ✓ Web3Function deployed to ipfs.
 ✓ CID: QmbQJC5XGpQUsAkLq6BqpvLtD8EPNDEaPqyFf4xK3TM6xj
```

<Note>
  This CID will be different for every new Typescript Function version that you will deploy.
</Note>

## Creating Typescript Function Task

<Note>
  Before creating Typescript function tasks, familiarize yourself with the available [Trigger Types](/Web3-Functions/Introduction/Trigger-types)!
</Note>

<img src="https://mintlify.s3.us-west-1.amazonaws.com/gelato-6540eeb1/images/create_ts_function_task.png" alt="Creating Typescript Function Task" />

1. **Selection of Function**
   * Navigate to the What to trigger section.
   * Within the Typescript Function subsection, find the IPFS CID input box.

2. **Function Details Input**
   * Input the CID you secured after deploying your Typescript function.
   * Upon entry, you should see a message like "Typescript Function code imported," signifying a successful connection.

3. **Network Configuration**
   * Scroll to the Network dropdown menu.
   * Choose the blockchain network where the Typescript function should work, e.g., "Sepolia."

4. **Task Configuration**
   * If your Typescript function needs secret variables or API keys, securely enter them in the Task Secrets section. For every secret:
     * **Key**: Define the name of the variable or key, e.g., "API\_KEY".
     * **Value**: Enter the associated secret value.
     * Click Save after each input to guarantee its safe storage.


# Event Trigger

<Note>
  Watch Now: Learn more by watching our video [Web3 Function Triggers](https://www.youtube.com/watch?v=7UpqGsANsBQ), available on YouTube.
</Note>

## Event Context

For event triggered typescript functions, use the `Web3FunctionEventContext` instead of the regular `Web3FunctionContext` on your `onRun` handler.

The context will then include a `log` property containing your full event log that you can parse and process.

## Event Triggered Typescript Function example

### event/index.ts

```typescript
import { Interface } from "@ethersproject/abi";
import { Web3Function, Web3FunctionEventContext } from "@gelatonetwork/web3-functions-sdk";

const NFT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

Web3Function.onRun(async (context: Web3FunctionEventContext) => {
  // Get event log from Web3FunctionEventContext
  const { log } = context;
  
  // Parse your event from ABI
  const nft = new Interface(NFT_ABI);
  const event = nft.parseLog(log);

  // Handle event data
  const { from, to, tokenId } = event.args;
  console.log(`Transfer of NFT #${tokenId} from ${from} to ${to} detected`);
  
  return { canExec: false, message: `Event processed ${log.transactionHash}` };
});
```

## Testing locally

To test your event triggered typescript function, you can add a `log.json` file in your web3 function directory:

<img src="https://mintlify.s3.us-west-1.amazonaws.com/gelato-6540eeb1/images/event_directory.png" alt="Event Directory Structure" />

Copy in the `log.json` file the raw data of the event you want to test:

### event/log.json

```json
{
  "blockNumber": 48758053,
  "blockHash": "0x6794a56583329794f184d50862019ecf7b6d8ba6b3210f68ca4b91a8fa81817d",
  "transactionIndex": 29,
  "removed": false,
  "address": "0xb74de3F91e04d0920ff26Ac28956272E8d67404D",
  "data": "0x",
  "topics": [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x000000000000000000000000eec2ba9b9f0202c63bba29ea9a4ce5c23f9865fd",
    "0x0000000000000000000000000000000000000000000000000000000000001099"
  ],
  "transactionHash": "0x2c500a55f5c24d587e73805975d91395634a971dca5939f43d34d774d0f7147b",
  "logIndex": 343
}
```

The data in `log.json` will be injected in your event context in local runs via CLI:

```bash
npx w3f test event/index.ts --logs
```

```bash
Web3Function running logs:
> Transfer of NFT #4249 from 0x0000000000000000000000000000000000000000 to 0xeeC2ba9B9F0202c63bba29Ea9A4Ce5c23f9865FD detected

Web3Function Result:
 ✓ Return value: {"canExec":false,"message":"Event processed 0x2c500a55f5c24d587e73805975d9"}
```



# Getting Started

<Note>
  Watch Now: Learn more by watching our video [Supercharge your Web3 Function](https://www.youtube.com/watch?v=Qy-6eERrbKA), available on YouTube.
</Note>

## Installation

<CodeGroup>
  ```bash npm
  npm install @gelatonetwork/web3-functions-sdk
  ```

  ```bash yarn
  yarn add @gelatonetwork/web3-functions-sdk
  ```
</CodeGroup>

Or you can use the [template](https://github.com/gelatodigital/web3-functions-hardhat-template) directly from GitHub's UI.

## Configuration

Create a `.env` file in your project root with the following variables:

```env
PROVIDER_URLS=your_provider_rpc_url
PRIVATE_KEY=your_private_key  # Optional, only needed for CLI deployment
```

## TypeScript Function Example

This TypeScript function updates an oracle smart contract with data returned by Coingecko's price API at an interval. Check out more examples [here](https://github.com/gelatodigital/web3-functions-template/tree/master/web3-functions).

```typescript
import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Contract, ethers } from "ethers";
import ky from "ky"; // we recommend using ky as axios doesn't support fetch by default

const ORACLE_ABI = [
  "function lastUpdated() external view returns(uint256)",
  "function updatePrice(uint256)",
];

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, gelatoArgs, multiChainProvider } = context;
  const provider = multiChainProvider.default();

  // Retrieve Last oracle update time
  const oracleAddress = "0x71b9b0f6c999cbbb0fef9c92b80d54e4973214da";
  const oracle = new Contract(oracleAddress, ORACLE_ABI, provider);
  const lastUpdated = parseInt(await oracle.lastUpdated());
  console.log(`Last oracle update: ${lastUpdated}`);

  // Check if it's ready for a new update
  const nextUpdateTime = lastUpdated + 300; // 5 min
  const timestamp = (await provider.getBlock("latest")).timestamp;
  console.log(`Next oracle update: ${nextUpdateTime}`);
  if (timestamp < nextUpdateTime) {
    return { canExec: false, message: `Time not elapsed` };
  }

  // Get current price on coingecko
  const currency = "ethereum";
  const priceData: any = await ky
    .get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd`,
      { timeout: 5_000, retry: 0 }
    )
    .json();
  const price = Math.floor(priceData[currency].usd);
  console.log(`Updating price: ${price}`);

  // Return execution call data
  return {
    canExec: true,
    callData: [{
      to: oracleAddress,
      data: oracle.interface.encodeFunctionData("updatePrice", [price])
    }],
  };
});
```

Create your function `schema.json` to specify your runtime configuration:

```json
{
  "web3FunctionVersion": "2.0.0",
  "runtime": "js-1.0",
  "memory": 128,
  "timeout": 30,
  "userArgs": {}
}
```

Note: For now the configuration is fixed and cannot be changed.

## TypeScript Function Context

When writing the Web3 Function, it is very helpful to understand the context Gelato injects into the execution, providing additional features to widen the Web3 Functions applicability.

```typescript
Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, secrets, multiChainProvider, gelatoArgs } = context;
  const provider = multiChainProvider.default();
  ...
});
```

### User Arguments

Declare your expected userArgs in your schema.json, accepted types are string, string\[], number, number\[], boolean, boolean\[]:

```json
{
  "web3FunctionVersion": "2.0.0",
  "runtime": "js-1.0",
  "memory": 128,
  "timeout": 30,
  "userArgs": {
    "currency": "string",
    "oracle": "string"
  }
}
```

Access your userArgs from the Web3Function context:

```typescript
Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, gelatoArgs, secrets } = context;

  // User args:
  console.log('Currency:', userArgs.currency)
  console.log('Oracle:', userArgs.oracle)
  ...
});
```

In the same directory as your web3 function, create a file `userArgs.json` and fill in your userArgs to test your web3 function:

```json
{
  "currency": "ethereum",
  "oracle": "0x71B9B0F6C999CBbB0FeF9c92B80D54e4973214da"
}
```

Test out the Coingecko oracle web3 function:

```bash
npx w3f test path/to/web3-functions/oracle/index.ts --logs
```

### State / Storage

Web3Functions are stateless scripts, that will run in a new & empty memory context on every execution. If you need to manage some state variable, we provide a simple key/value store that you can access from your web3 function context.

See the above example to read & update values from your storage:

```typescript
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { storage, multiChainProvider } = context;
  const provider = multiChainProvider.default();

  // Use storage to retrieve previous state (stored values are always string)
  const lastBlockStr = (await storage.get("lastBlockNumber")) ?? "0";
  const lastBlock = parseInt(lastBlockStr);
  console.log(`Last block: ${lastBlock}`);

  const newBlock = await provider.getBlockNumber();
  console.log(`New block: ${newBlock}`);
  if (newBlock > lastBlock) {
    // Update storage to persist your current state (values must be cast to string)
    await storage.set("lastBlockNumber", newBlock.toString());
  }

  return {
    canExec: false,
    message: `Updated block number: ${newBlock.toString()}`,
  };
});
```

To populate the storage values in your testing, in the same directory as your web3 function, create a file `storage.json` and fill in the storage values:

```json
{
  "lastBlockNumber": "1000"
}
```

Test out the storage web3 function:

```bash
npx w3f test path/to/web3-functions/storage/index.ts --logs
```

### Secrets

In the same directory as your web3 function, create a `.env` file and fill up your secrets:

```env
COINGECKO_API=https://api.coingecko.com/api/v3
```

Access your secrets from the Web3Function context:

```typescript
// Get api from secrets
const coingeckoApi = await context.secrets.get("COINGECKO_API");
if (!coingeckoApi) {
  return { canExec: false, message: `COINGECKO_API not set in secrets` };
}
```

Test your web3 function using secrets:

```bash
npx w3f test path/to/web3-functions/secrets/index.ts --logs
```

When deploying a task, you will be able to set your web3 function secrets on our UI or using the SDK:

```typescript
import hre from "hardhat";
import { AutomateSDK, Web3Function } from "@gelatonetwork/automate-sdk";

const { ethers, w3f } = hre;

const adBoardW3f = w3f.get("advertising-board");

const [deployer] = await ethers.getSigners();
const chainId = (await ethers.provider.getNetwork()).chainId;

const automate = new AutomateSDK(chainId, deployer);
const web3Function = new Web3Function(chainId, deployer);

// Deploy Web3Function on IPFS
console.log("Deploying Web3Function on IPFS...");
const cid = await adBoardW3f.deploy();
console.log(`Web3Function IPFS CID: ${cid}`);

// Create task using automate sdk
console.log("Creating automate task...");

const { taskId, tx } = await automate.createBatchExecTask({
  name: "Web3Function - Ad Board",
  web3FunctionHash: cid,
  web3FunctionArgs: {},
});

await tx.wait();
console.log(`Task created, taskId: ${taskId} (tx hash: ${tx.hash})`);
console.log(
  `> https://app.gelato.cloud/functions/${taskId}?type=overview&chainId=${chainId}&functions=true`
);

// Set task specific secrets
const secrets = adBoardW3f.getSecrets();
if (Object.keys(secrets).length > 0) {
  await web3Function.secrets.set(secrets, taskId);
  console.log(`Secrets set`);
}
```

### Multichain Provider

The `multichainProvider` allows us to instantiate RPC providers for every network Gelato is deployed on.

```typescript
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider } = context;

  // multichainProvider.default() will instantiate
  // the provider of the chain the W3F is deployed
  const provider = multiChainProvider.default();
 
  // passing the chainId as follows, we can instantiate
  // a rpc provider for that network
  const polygonProvider = multiChainProvider.chainId(137);
  
  // This method fetches the number of remaining RPC calls,
  // allowing dynamic adaptations based on the user's plan limits.
  const remainingCalls = await multiChainProvider.nbRpcCallsRemaining();
  ...
});
```

When testing locally, we can provide the different providers by including them in `.env` at the root folder:

```env
PROVIDER_URLS=RPC1,RPC2
```

#### Interoperability with Other Libraries

Although `multiChainProvider` is designed to work seamlessly within the Gelato Web3 Functions SDK, it is possible to extract the underlying RPC URL and use it with other client libraries. This flexibility is valuable for developers who prefer or require features from other libraries, such as `viem`.

Here's an example of how to utilize the RPC URL from `multiChainProvider` with the `viem` library:

```typescript
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider } = context;
  const provider = multiChainProvider.default();
  const url = provider.connection.url;

  // Initialize viem client with the extracted URL
  const rpc = createPublicClient({
    chain: polygon,
    transport: http(url),
  });
  
  // Now you can use the viem client for your operations
  // ...
});
```

### Gelato Arguments

Gelato injects the `chainId`, the `gasPrice`, and the `taskId` into the context.

* **chainId:** The unique number identifying the blockchain network where the function is running.
* **gasPrice:** The cost of executing transactions on the blockchain.
* **taskId:** A string that uniquely identifies the task.

```typescript
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { gelatoArgs } = context;

  // chainId: number
  const chainId = gelatoArgs.chainId;

  // gasPrice: BigNumber
  const gasPrice = gelatoArgs.gasPrice;
  
  // taskId: string
  const taskId = gelatoArgs.taskId;
  ...
});
```


# Event Trigger

<Note>
  Watch Now: Learn more by watching our video [Web3 Function Triggers](https://www.youtube.com/watch?v=7UpqGsANsBQ), available on YouTube.
</Note>

## Event Context

For event triggered typescript functions, use the `Web3FunctionEventContext` instead of the regular `Web3FunctionContext` on your `onRun` handler.

The context will then include a `log` property containing your full event log that you can parse and process.

## Event Triggered Typescript Function example

### event/index.ts

```typescript
import { Interface } from "@ethersproject/abi";
import { Web3Function, Web3FunctionEventContext } from "@gelatonetwork/web3-functions-sdk";

const NFT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

Web3Function.onRun(async (context: Web3FunctionEventContext) => {
  // Get event log from Web3FunctionEventContext
  const { log } = context;
  
  // Parse your event from ABI
  const nft = new Interface(NFT_ABI);
  const event = nft.parseLog(log);

  // Handle event data
  const { from, to, tokenId } = event.args;
  console.log(`Transfer of NFT #${tokenId} from ${from} to ${to} detected`);
  
  return { canExec: false, message: `Event processed ${log.transactionHash}` };
});
```

## Testing locally

To test your event triggered typescript function, you can add a `log.json` file in your web3 function directory:

<img src="https://mintlify.s3.us-west-1.amazonaws.com/gelato-6540eeb1/images/event_directory.png" alt="Event Directory Structure" />

Copy in the `log.json` file the raw data of the event you want to test:

### event/log.json

```json
{
  "blockNumber": 48758053,
  "blockHash": "0x6794a56583329794f184d50862019ecf7b6d8ba6b3210f68ca4b91a8fa81817d",
  "transactionIndex": 29,
  "removed": false,
  "address": "0xb74de3F91e04d0920ff26Ac28956272E8d67404D",
  "data": "0x",
  "topics": [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x000000000000000000000000eec2ba9b9f0202c63bba29ea9a4ce5c23f9865fd",
    "0x0000000000000000000000000000000000000000000000000000000000001099"
  ],
  "transactionHash": "0x2c500a55f5c24d587e73805975d91395634a971dca5939f43d34d774d0f7147b",
  "logIndex": 343
}
```

The data in `log.json` will be injected in your event context in local runs via CLI:

```bash
npx w3f test event/index.ts --logs
```

```bash
Web3Function running logs:
> Transfer of NFT #4249 from 0x0000000000000000000000000000000000000000 to 0xeeC2ba9B9F0202c63bba29Ea9A4Ce5c23f9865FD detected

Web3Function Result:
 ✓ Return value: {"canExec":false,"message":"Event processed 0x2c500a55f5c24d587e73805975d9"}
```



# Private Typescript Functions

When you deploy a Typescript Function the code is stored and pinned on IPFS making it accessible to everyone. If you would prefer to conceal your code, one approach is to store your code in a private Github Gist. Subsequently, this code can be retrieved and executed through a Web3 Function.

<Note>
  This approach introduces a dependency on Github's availability. We aim to directly support private Web3 Function deployments in the future.
</Note>

## Private Typescript Function example

This Typescript Function fetches `onRun.js` (Github gist containing concealed code) with its gist id and executes it during runtime. Check out the example on [GitHub](https://github.com/gelatodigital/web3-functions-template/blob/master/web3-functions/private/README.md) here.

<Warning>
  The code in `onRun.js` must be in JavaScript
</Warning>

```typescript private-w3f/index.ts
import {
  Web3Function,
  Web3FunctionContext,
  Web3FunctionResult,
} from "@gelatonetwork/web3-functions-sdk";
import { Octokit } from "octokit";

// import dependencies used in onRun.js
import { ethers } from "ethers";
import ky from "ky";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { secrets } = context;

  const gistId = (await secrets.get("GIST_ID")) as string;

  const octokit = new Octokit();

  let onRunScript: string | undefined;

  // fetch onRun.js from private github gist
  try {
    const gistDetails = await octokit.rest.gists.get({
      gist_id: gistId,
    });

    const files = gistDetails.data.files;

    if (!files) throw new Error(`No files in gist`);

    for (const file of Object.values(files)) {
      if (file?.filename === "onRun.js" && file.content) {
        onRunScript = file.content;
        break;
      }
    }

    if (!onRunScript) throw new Error(`No onRun.js`);
  } catch (err) {
    return {
      canExec: false,
      message: `Error fetching gist: ${err.message}`,
    };
  }

  // run onRun.js
  try {
    /**
     * context are passed into onRun.js.
     * onRun.js will have access to all userArgs, secrets & storage
     */
    const onRunFunction = new Function("context", "ky", "ethers", onRunScript);
    const onRunResult: Web3FunctionResult = await onRunFunction(
      context,
      ky,
      ethers
    );

    if (onRunResult) {
      return onRunResult;
    } else {
      return { canExec: false, message: `No result returned` };
    }
  } catch (err) {
    console.log(err);
    return {
      canExec: false,
      message: `Error running gist: ${err.message}`,
    };
  }
});
```

## Writing onRun.js

Check out an example of a GitHub gist with `onRun.js` [here](https://gist.github.com/brandonchuah/0c58ee8ce55bc7af5f42a2d75c27433c).

### 1. onRun.js file structure

`onRun.js` should return a promise.

```javascript onRun.js
return (async () => {
  // ... your code here
})();
```

### 2. Using dependencies

Dependencies that are used in `onRun.js` should be imported into the Web3 Function `index.ts` file, not in `onRun.js`.

```typescript
// import dependencies used in onRun.js
import { ethers } from "ethers";
import ky from "ky";
```

### 3. Accessing Web3 Function Context

Web3 Function context which includes, secrets, userArgs, multiChainProvider can be accessed normally in `onRun.js`.

```javascript
return (async () => {
    const {secrets, userArgs, multiChainProvider} = context
})();
```

### 4. Return Web3 Function result

Results returned in `onRun.js` will be bubbled up and returned in the private Web3 Function.

```javascript
return {
  canExec: true,
  callData: [
    {
      to: oracleAddress,
      data: oracle.interface.encodeFunctionData("updatePrice", [price]),
    },
  ],
}
```

## Creating private Typescript Function task

### Secrets (strict)

* `GIST_ID` (Github gist id to fetch `onRun.js` from)

<Warning>
  Make sure to store your GitHub gist id as a secret.
</Warning>

### Arguments (not strict)

Since GitHub gists are editable, you can have a userArgs to be a JSON string so that arguments can be editable without re-deploying a web3 function with a different schema.

```json private-w3f/schema.json
{
  "web3FunctionVersion": "2.0.0",
  "runtime": "js-1.0",
  "memory": 128,
  "timeout": 30,
  "userArgs": {
    "args": "string"
  }
}
```

Example args when creating your task:

```json
{
  "args": "{\"currency\":\"ethereum\",\"oracle\":\"0x71B9B0F6C999CBbB0FeF9c92B80D54e4973214da\"}"
}
```

# Callbacks

Callbacks can be used to manage the outcome of your transaction submission. This advanced feature enables your functions to adapt based on the execution status, whether successful or not, thus providing a robust way to handle different scenarios that may occur during task execution. Let's explore the two types of callbacks available:

## Callback Function Example:

```typescript
import {
  Web3Function,
  Web3FunctionContext,
  Web3FunctionFailContext,
  Web3FunctionSuccessContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";
import ky from "ky"; // Using ky for HTTP requests

const ORACLE_ABI = [
  "function lastUpdated() external view returns(uint256)",
  "function updatePrice(uint256)",
];

// Callback for successful execution
Web3Function.onSuccess(async (context: Web3FunctionSuccessContext) => {
  const { transactionHash } = context;
  //onSuccess Logic goes here
});

// Callback for handling failures
Web3Function.onFail(async (context: Web3FunctionFailContext) => {
  const { reason, transactionHash, callData } = context;
  //onFail Logic goes here
});

// Main function logic
Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, multiChainProvider } = context;

  // Core logic goes here to prepare callData
  
  
  return {
    canExec: false,
    message: "Nothing to execute yet"
  };
});
```

## Types of Callbacks

### onSuccess Callback

This callback gets invoked after a successful on-chain execution. It's especially useful for tracking successful transactions or for further processing after a task completes.

```typescript
Web3Function.onSuccess(async (context: Web3FunctionSuccessContext) => {
  const { transactionHash } = context;
  console.log("onSuccess: txHash: ", transactionHash);
});
```

The `Web3FunctionSuccessContext` offers access to the `transactionHash`, allowing you to reference and track the successful transaction within your application.

### onFail Callback

Triggered when an on-chain execution encounters issues such as:

* **InsufficientFunds**: When the account executing the function does not have enough balance to cover the transaction fees.
* **SimulationFailed**: If the execution simulation (a pre-run of the transaction) fails, indicating that the actual transaction might also fail.
* **ExecutionReverted**: When the actual transaction is executed on the blockchain but is reverted due to a condition in the smart contract code or because it runs out of gas.

This callback is crucial for handling errors and implementing fallback logic.

```typescript
Web3Function.onFail(async (context: Web3FunctionFailContext) => {
  const { reason } = context;

  if (reason === "ExecutionReverted") {
    console.log(`onFail: ${reason} txHash: ${context.transactionHash}`);
  } else if (reason === "SimulationFailed") {
    console.log(
      `onFail: ${reason} callData: ${JSON.stringify(context.callData)}`
    );
  } else {
    console.log(`onFail: ${reason}`);
  }
});
```

In the context of the `onFail` callback:

* `reason`: This is a string indicating why the failure occurred.
* `transactionHash`: Provided when the reason for failure is `ExecutionReverted`, this is the unique identifier of the reverted transaction.
* `callData`: Available when the reason is `SimulationFailed`, this is the data that was used during the function run, which can be useful for debugging the failure.

## Testing Your Callbacks

You can test your callbacks locally using specific flags during the test execution. This helps in ensuring that your callbacks function as intended before deployment.

### For onFail Callback:

```bash
yarn test src/web3-functions/callbacks/index.ts --logs --onFail
```

```bash
Web3Function building...

Web3Function Build result:
 ✓ Schema: web3-functions\oracle-callback\schema.json
 ✓ Built file: C:\Users\aniru\OneDrive\Desktop\Gelato_internship\w3f-example\web3-functions-hardhat-template\.tmp\index.js
 ✓ File size: 0.64mb
 ✓ Build time: 150.48ms

Web3Function user args validation:
 ✓ currency: ethereum
 ✓ oracle: 0x71B9B0F6C999CBbB0FeF9c92B80D54e4973214da

Web3Function running logs:
> userArgs:  undefined
> onFail: SimulationFailed callData: [{"to":"0x0000000000000000000000000000000000000000","data":"0x00000000"}]

Web3Function onFail result:
 ✓ Success

Web3Function Runtime stats:
 ✓ Duration: 0.20s
 ✓ Memory: 0.00mb
 ✓ Storage: 0.04kb
 ✓ Network: 0 req [ DL: 0.00kb / UL:  0.00kb]
 ✓ Rpc calls: 0
Done in 1.33s.
```

### For onSuccess Callback:

```bash
npx test src/web3-functions/callbacks/index.ts --logs --onSuccess
```

```bash
Web3Function Build result:
 ✓ Schema: web3-functions\oracle-callback\schema.json
 ✓ Built file: C:\Users\aniru\OneDrive\Desktop\Gelato_internship\w3f-example\web3-functions-hardhat-template\.tmp\index.js
 ✓ File size: 0.64mb
 ✓ Build time: 143.00ms

Web3Function user args validation:
 ✓ currency: ethereum
 ✓ oracle: 0x71B9B0F6C999CBbB0FeF9c92B80D54e4973214da

Web3Function running logs:
> userArgs:  undefined
> onSuccess: txHash:  undefined

Web3Function onSuccess result:
 ✓ Success

Web3Function Runtime stats:
 ✓ Duration: 0.19s
 ✓ Memory: 0.00mb
 ✓ Storage: 0.04kb
 ✓ Network: 0 req [ DL: 0.00kb / UL:  0.00kb]
 ✓ Rpc calls: 0
Done in 1.47s.
```