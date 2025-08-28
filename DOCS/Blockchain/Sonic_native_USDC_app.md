# Native USDC

## Quick-Start Guide

### Overview

USDC by Circle enables the seamless transfer of digital dollars on Sonic using a smart contract. This guide walks you through building a simple React app that lets users connect their wallet and send USDC on the [Sonic Blaze testnet](https://testnet.soniclabs.com/).

***

### 1. Prerequisites

**Development Environment**

* Node.js 16 + (includes `npm`)
* MetaMask browser extension

**Funding Your Wallet**

* Native gas token (`S` on Sonic Blaze) for transaction fees
* USDC test tokens — use the **CCTP V2 Sample App** to bridge USDC from another testnet

***

### 2. Project Setup

Step 1: Create a new project

```bash
mkdir usdc-transfer-app
cd usdc-transfer-app
npm init -y
```

Step 2: Install dependencies

```bash
npm install react@latest react-dom@latest \
  @types/react@latest @types/react-dom@latest \
  @vitejs/plugin-react@latest typescript@latest \
  vite@latest viem@latest
```

Step 3: Verify `package.json`&#x20;

```jsonc
{
  "name": "usdc-transfer-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@vitejs/plugin-react": "^4.4.1",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "typescript": "^5.8.3",
    "viem": "^2.28.0",
    "vite": "^6.3.2"
  }
}
```

Step 4: Add the `scripts` section (if needed)&#x20;

```jsonc
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

Step 5: Run the dev server

```bash
npm run dev
```

***

### 3. Configure Blockchain Clients

Create **`src/clients.ts`**:

```ts
import { http, createPublicClient, createWalletClient, custom } from 'viem';
import { sonicBlazeTestnet } from 'viem/chains';

declare global {
  interface Window {
    ethereum: any;
  }
}

export const publicClient = createPublicClient({
  chain: sonicBlazeTestnet,
  transport: http(),
});

export const walletClient = createWalletClient({
  chain: sonicBlazeTestnet,
  transport: custom(window.ethereum),
});
```

***

### 4. Define USDC Contract Details

Create **`src/constants.ts`**:

```ts
export const USDC_CONTRACT_ADDRESS =
  '0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6';

export const USDC_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to',    type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
];
```

***

### 5. Implement Wallet Connection & USDC Transfer

Create **`src/App.tsx`**:

```tsx
import React, { useEffect, useState } from 'react';
import { publicClient, walletClient } from './clients';
import { USDC_CONTRACT_ADDRESS, USDC_ABI } from './constants';
import {
  type Address,
  type Hash,
  type TransactionReceipt,
} from 'viem';

function USDCApp() {
  const [account, setAccount] = useState<Address>();
  const [balance, setBalance] = useState<string>();
  const [hash, setHash] = useState<Hash>();
  const [receipt, setReceipt] = useState<TransactionReceipt>();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Fetch USDC balance
  const fetchBalance = async (address: Address) => {
    const raw = await publicClient.readContract({
      address: USDC_CONTRACT_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address],
    }) as bigint;
    setBalance((Number(raw) / 1e6).toFixed(2));
  };

  // Connect wallet
  const connect = async () => {
    const [addr] = await walletClient.requestAddresses();
    setAccount(addr);
    fetchBalance(addr);
  };

  // Transfer USDC
  const transferUSDC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !recipient || !amount) return;
    try {
      setIsTransferring(true);

      const value = BigInt(Math.floor(Number(amount) * 1e6));
      const { request } = await publicClient.simulateContract({
        account,
        address: USDC_CONTRACT_ADDRESS,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [recipient as Address, value],
      });

      const txHash = await walletClient.writeContract(request);
      setHash(txHash);

      const rcpt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      setReceipt(rcpt);

      await fetchBalance(account);  // refresh balance
      setRecipient('');
      setAmount('');
    } catch (err) {
      console.error('Transfer failed:', err);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div>
      <h1>USDC Transfer Sample App</h1>

      {account ? (
        <>
          <p><strong>Connected wallet:</strong> {account}</p>
          <p><strong>USDC balance:</strong> {balance ?? 'Fetching…'} USDC</p>

          <form onSubmit={transferUSDC} style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 10 }}>
              <label>
                Recipient&nbsp;address&nbsp;
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="0x..."
                  style={{ marginLeft: 10, width: 300 }}
                />
              </label>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>
                Amount&nbsp;(USDC)&nbsp;
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{ marginLeft: 10 }}
                />
              </label>
            </div>

            <button type="submit" disabled={isTransferring}>
              {isTransferring ? 'Transferring…' : 'Transfer USDC'}
            </button>
          </form>

          {hash && (
            <p style={{ marginTop: 20 }}>
              <strong>Transaction hash:</strong> {hash}
            </p>
          )}

          {receipt && (
            <p style={{ marginTop: 10 }}>
              <strong>Transaction status:</strong>{' '}
              {receipt.status === 'success' ? 'Success' : 'Failed'}
            </p>
          )}
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}

export default USDCApp;
```

***

### 6. Configure the Entry Point

Create **`src/main.tsx`**:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import USDCApp from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <USDCApp />
  </React.StrictMode>,
);
```

***

### 7. Create `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>USDC Transfer Sample App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

***

### 8. Start the Application

```bash
npm run dev
```

Open [**http://localhost:5173**](http://localhost:5173/) in your browser and start transferring USDC on the Sonic Blaze testnet!
