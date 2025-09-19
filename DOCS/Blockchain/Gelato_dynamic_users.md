# Use Dynamic Signers

> Learn how to integrate Dynamic as wallet provider with the Gelato Smart Wallets React SDK

## Template & Examples

<Card title="Smart Wallet React SDK Example" icon="github" href="https://github.com/gelatodigital/smartwallet/tree/master/examples/react-vite">
  Check out the full example code for integrating Dynamic as wallet provider with the Gelato Smart Wallets React SDK.
</Card>

### Setup Instructions

<Steps>
  <Step title="Clone the Repository">
    ```bash
    git clone https://github.com/gelatodigital/smartwallet
    cd smartwallet/examples/react-vite
    ```
  </Step>

  <Step title="Set Up Environment Variables">
    ```bash
    cp .env.example .env
    ```
  </Step>

  <Step title="Generate a API Key">
    Create a API Key using the [Gelato App](https://app.gelato.cloud/).
    Paste the key into your `.env` file. Check out the How-To Guides [here](/Smart-Wallet-SDK/How-To-Guides/Create-a-Api-Key).
  </Step>

  <Step title="Generate a Dynamic Environment ID">
    Generate the Dynamic Environment ID by following the steps in the How-To Guides [here](/Smart-Wallet-SDK/Embedded-Wallets/Create-Dynamic's-Environment-Id), then paste the ID into your `.env` file.
  </Step>

  <Step title="Install Dependencies">
    ```bash
    pnpm install
    ```
  </Step>

  <Step title="Start the development server">
    ```bash
    pnpm dev
    ```

    Open your browser and navigate to `http://localhost:5173`
  </Step>
</Steps>

Not using templates? Prefer a step-by-step approach? Up next: How-To Guides for implementing the Smart Wallet React SDK use cases step-by-step.

## Installation

<CodeGroup>
  ```bash npm
  npm install @gelatonetwork/smartwallet-react-sdk viem
  ```

  ```bash yarn
  yarn add @gelatonetwork/smartwallet-react-sdk viem
  ```

  ```bash pnpm
  pnpm install @gelatonetwork/smartwallet-react-sdk viem
  ```
</CodeGroup>

<Card title="Gelato Smart Wallets React SDK" icon="link" href="https://www.npmjs.com/package/@gelatonetwork/smartwallet-react-sdk">
  Check out the NPM package for the Gelato Smart Wallets React SDK.
</Card>

## Getting Started

<Steps>
  <Step title="Importing Dependencies">
    ```typescript
    import {
      GelatoSmartWalletContextProvider,
      useGelatoSmartWalletProviderContext,
      GelatoSmartWalletConnectButton,
      dynamic,
      wagmi,
    } from "@gelatonetwork/smartwallet-react-sdk";

    import { sponsored, native, erc20 } from "@gelatonetwork/smartwallet";
    import { baseSepolia } from "viem/chains";
    import { http } from "wagmi";
    ```
  </Step>

  <Step title="Setting up Smart Wallet Context Provider">
    To create a API Key, visit the [Gelato App](https://app.gelato.cloud/) and navigate to the `Paymaster & Bundler > API Keys` section. Create a new API Key, select the required networks, and copy the generated API Key.
    For detailed instructions, [click here](/Smart-Wallet-SDK/How-To-Guides/Create-a-Api-Key) to learn more about creating a API Key.

    ```typescript
    <GelatoSmartWalletContextProvider
      settings={{
        scw: {
          type: "gelato" // use gelato, kernel, safe, or custom
        }
        apiKey: process.env.GELATO_API_KEY as string,
        waas: dynamic(
          process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID as string
        ),
        wagmi: wagmi({
          chains: [baseSepolia],
          transports: {
            [baseSepolia.id]: http(),
          },
        }),
      }}
    >
      {children}
    </GelatoSmartWalletContextProvider>
    ```
  </Step>

  <Step title="Setting up Connect Button">
    You can customize the appearance of your connect button here. This button triggers the wallet connectors widget configured for the UI.

    ```typescript
    const children = (
      <div className="mt-2 text-white">Get Started!</div>
    ) as React.ReactElement;

    export const Login = () => (
      <GelatoSmartWalletConnectButton>{children}</GelatoSmartWalletConnectButton>
    );
    ```
  </Step>

  <Step title="Fetching Smart Wallet Client">
    Use this client directly to execute transactions with different gas payment methods. Additionally, a logout option is available to disconnect your connected wallet.

    ```typescript
    const {
      gelato: { client },
      switchNetwork,
      logout,
    } = useGelatoSmartWalletProviderContext();
    ```
  </Step>

  <Step title="Sending Transactions">
    You can send transactions using different gas payment methods as shown below. Additionally, you can add multiple transactions to the calls array to batch them and send them on-chain in a single request.

    <Tabs>
      <Tab title="Sponsored">
        ```typescript
        const results = await client.execute({
          payment: sponsored(),
          calls: [
            {
              to: "0xa8851f5f279eD47a292f09CA2b6D40736a51788E",
              data: "0xd09de08a",
              value: 0n
            }
          ]
        });

        console.log("userOp hash:", results?.id);
        const txHash = await results?.wait();
        console.log("transaction hash", txHash);
        ```
      </Tab>

      <Tab title="ERC-20">
        ```typescript
        const token = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // USDC (Base Sepolia)
        const results = await client.execute({
          payment: erc20(token),
          calls: [
            {
              to: "0xa8851f5f279eD47a292f09CA2b6D40736a51788E",
              data: "0xd09de08a",
              value: 0n
            }
          ]
        });

        console.log("userOp hash:", results?.id);
        const txHash = await results?.wait();
        console.log("transaction hash", txHash);
        ```
      </Tab>

      <Tab title="Native">
        ```typescript
        const results = await client.execute({
          payment: native(),
          calls: [
            {
              to: "0xa8851f5f279eD47a292f09CA2b6D40736a51788E",
              data: "0xd09de08a",
              value: 0n
            }
          ]
        });

        console.log("userOp hash:", results?.id);
        const txHash = await results?.wait();
        console.log("transaction hash", txHash);
        ```
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Additional Resources

* Check out the complete example React app demonstrating the integration of Dynamic as the wallet provider [here](https://github.com/gelatodigital/how-tos-2-smartwallet-react-sdk-example).