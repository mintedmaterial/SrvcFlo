## **For Developers**

Everything you need to start building on Sonic.

### **4.1. Getting Started**

### **4.1.1. Quick Start: Your First Contract**

Deploying to Sonic is identical to any other EVM chain.

**1. Set up your Hardhat project:**

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox

```

**2. Configure `hardhat.config.js`:**

```jsx
require("@nomicfoundation/hardhat-toolbox");

// Replace with your private key
const SONIC_PRIVATE_KEY = "YOUR_PRIVATE_KEY";

module.exports = {
  solidity: "0.8.26",
  networks: {
    sonic: {
      url: "<https://rpc.soniclabs.com>",
      accounts: [SONIC_PRIVATE_KEY]
    }
  }
};

```

**3. Deploy your contract:**

```bash
npx hardhat run scripts/deploy.js --network sonic

```

### **4.1.2. Testnet & Faucet**

Before deploying to mainnet, test your application on the **Blaze Testnet**.

**Blaze Network Details:**

- **Network Name:** Sonic Blaze Testnet
- **RPC URL:** `https://rpc.blaze.soniclabs.com`
- **Chain ID:** 57054
- **Currency Symbol:** S
- **Explorer URL:** `https://testnet.sonicscan.org`
- **Faucet:** Get testnet `S` from the [Sonic Blaze Dashboard](https://testnet.soniclabs.com/account).

### **4.1.3. Verifying Contracts**

Make your source code public and build trust by verifying your contracts on SonicScan.

1. **Install Hardhat Etherscan plugin:**`npm install --save-dev @nomicfoundation/hardhat-verify`
2. **Add the following to `hardhat.config.js`:**
    
    ```jsx
    require("@nomicfoundation/hardhat-toolbox");
    // Other requires and config...
    
    module.exports = {
      // ...
      etherscan: {
        apiKey: {
          sonic: "YOUR_SONICSCAN_API_KEY", // Get key from sonicscan.org
          sonicTestnet: "YOUR_SONICSCAN_TESTNET_API_KEY"
        },
        customChains: [
          {
            network: "sonic",
            chainId: 146,
            urls: {
              apiURL: "<https://api.sonicscan.org/api>",
              browserURL: "<https://sonicscan.org>"
            }
          },
          {
            network: "sonicTestnet",
            chainId: 57054,
            urls: {
              apiURL: "<https://api-testnet.sonicscan.org/api>",
              browserURL: "<https://testnet.sonicscan.org>"
            }
          }
        ]
      }
    };
    
    ```
    
3. **Run the verification command:**
    
    ```bash
    npx hardhat verify --network sonic YOUR_CONTRACT_ADDRESS "Constructor" "Args"
    
    ```
    
    For more verification methods, see the [full verification guide](https://www.notion.so/soniclabs/verify-contracts).
    

### **4.2. Core Concepts**

### **4.2.1. Transaction Lifecycle**

1. **Submission:** A transaction is submitted to an RPC node.
2. **TxPool:** The transaction enters the transaction pool, where it is validated.
3. **Inclusion:** Validators pick transactions from the pool to include in new event blocks.
4. **Confirmation:** The event is propagated through the DAG and reaches consensus.
5. **Finality:** The transaction is included in a finalized block on the main chain, typically in under a second.

**Nonce Gap Handling:**
The Sonic transaction pool has limits for non-executable transactions (those with a future nonce).

- **Per Account:** A single account can have a maximum of 32 queued transactions with gapped nonces.
- **Global:** The pool-wide limit for queued transactions is 256.
If a transaction with `nonce: 3` is submitted after transactions with `nonce: 4, 5, 6`, etc., have already been queued, the submission of `nonce: 3` will make the subsequent transactions executable and they will be processed in order.

### **4.2.2. Gas & Fees**

- **Fee Model:** Sonic uses a Base Fee + Priority Fee model similar to Ethereum's EIP-1559.
- **Fee Distribution:** Unlike Ethereum, the Base Fee is **not burned**. Instead, 90% of all transaction fees are sent to the FeeM Treasury for developers, and 10% are distributed to validators.
- **Gas Power:** Each validator has a "gas power" budget that refills over time, based on their stake. This prevents any single validator from congesting the network. If a validator runs out of gas power, they may temporarily be unable to emit events containing large transactions, resulting in a `Not enough gas power to emit event` warning.

### **4.2.3. Gas Estimation (`eth_estimateGas`)**

While `eth_estimateGas` is fully supported, its estimates can sometimes be inaccurate for complex transactions whose gas usage depends on the current on-chain state.

- **The Problem:** The state of the chain can change between the time of gas estimation and the time of transaction execution. For contracts like a `UniswapV3Pool`, a change in the pool's state can alter the execution path and, consequently, the gas required.
- **The Symptom:** This can lead to random `out of gas` transaction reversions.
- **The Solution:** For transactions with state-dependent gas costs, it is best practice to add a buffer (e.g., 20-30%) to the estimated gas limit to ensure successful execution. Unused gas is refunded.

### **4.3. Building dApps**

### **4.3.1. USDC Transfer Tutorial**

This guide walks you through building a simple React app that lets users connect their wallet and send native USDC on the Sonic network using `viem`.

### **1. Prerequisites**

- **Development Environment:** Node.js 16+ (includes npm), MetaMask browser extension.
- **Funding Your Wallet:** You'll need `S` on Sonic Blaze for gas and USDC test tokens.

### **2. Project Setup**

```bash
mkdir usdc-transfer-app
cd usdc-transfer-app
npm init -y
npm install react@latest react-dom@latest \\
  @types/react@latest @types/react-dom@latest \\
  @vitejs/plugin-react@latest typescript@latest \\
  vite@latest viem@latest

```

### **3. Configure Blockchain Clients (`src/clients.ts`)**

```tsx
import { http, createPublicClient, createWalletClient, custom } from 'viem';
import { defineChain } from 'viem';

export const sonicBlazeTestnet = defineChain({
  id: 57054,
  name: 'Sonic Blaze Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: { http: ['<https://rpc.blaze.soniclabs.com>'] },
  },
  blockExplorers: {
    default: { name: 'SonicScan', url: '<https://testnet.sonicscan.org>' },
  },
});

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

### **4. Define USDC Contract Details (`src/constants.ts`)**

```tsx
export const USDC_CONTRACT_ADDRESS = '0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6'; // Example address on Blaze
export const USDC_ABI = [
  {
    constant: false,
    inputs: [ { name: '_to', type: 'address' }, { name: '_value', type: 'uint256' } ],
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

### **5. Implement React App (`src/App.tsx`)**

```tsx
import React, { useState } from 'react';
import { publicClient, walletClient } from './clients';
import { USDC_CONTRACT_ADDRESS, USDC_ABI } from './constants';
import { type Address, type Hash, type TransactionReceipt, formatUnits, parseUnits } from 'viem';

function USDCApp() {
  const [account, setAccount] = useState<Address>();
  const [balance, setBalance] = useState<string>();
  const [hash, setHash] = useState<Hash>();
  const [receipt, setReceipt] = useState<TransactionReceipt>();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const fetchBalance = async (address: Address) => {
    const raw = await publicClient.readContract({
      address: USDC_CONTRACT_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address],
    }) as bigint;
    setBalance(formatUnits(raw, 6)); // USDC typically has 6 decimals
  };

  const connect = async () => {
    const [addr] = await walletClient.requestAddresses();
    setAccount(addr);
    fetchBalance(addr);
  };

  const transferUSDC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !recipient || !amount) return;
    try {
      setIsTransferring(true);
      const value = parseUnits(amount, 6); // USDC typically has 6 decimals
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
      await fetchBalance(account);
      setRecipient('');
      setAmount('');
    } catch (err) {
      console.error('Transfer failed:', err);
      alert(`Transfer failed: ${err.message}`);
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
          {hash && <p style={{ marginTop: 20 }}><strong>Transaction hash:</strong> {hash}</p>}
          {receipt && <p style={{ marginTop: 10 }}><strong>Transaction status:</strong>{' '}{receipt.status === 'success' ? 'Success' : 'Failed'}</p>}
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
export default USDCApp;

```##### **6. Configure Entry Point (`src/main.tsx`) & `index.html`**

**`src/main.tsx`:**```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import USDCApp from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <USDCApp />
  </React.StrictMode>,
);

```

**`index.html`:**

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

### **7. Start the Application**

```bash
npm run dev

```

### **4.3.2. Building on the Gateway**

You can programmatically interact with the Sonic Gateway to automate asset transfers.

### **Important Note on Proof Generation**

When generating proofs with `eth_getProof`, you **must** use the block number provided by the `StateOracle.lastBlockNum()` on the destination chain, not `"latest"`. Using `"latest"` will result in an `Invalid root hash` error because the oracle may not have processed the latest block containing your deposit.

### **Full Example**

### **Setup**

```jsx
// Ethereum (L1)
const ETH_CONTRACTS = {
    TOKEN_DEPOSIT: "0xa1E2481a9CD0Cb0447EeB1cbc26F1b3fff3bec20",
    TOKEN_PAIRS: "0xf2b1510c2709072C88C5b14db90Ec3b6297193e4",
    STATE_ORACLE: "0xB7e8CC3F5FeA12443136f0cc13D81F109B2dEd7f"
};

// Sonic (L2)
const SONIC_CONTRACTS = {
    BRIDGE: "0x9Ef7629F9B930168b76283AdD7120777b3c895b3",
    TOKEN_PAIRS: "0x134E4c207aD5A13549DE1eBF8D43c1f49b00ba94",
    STATE_ORACLE: "0x836664B0c0CB29B7877bCcF94159CC996528F2C3"
};

// Network RPC endpoints
const ETHEREUM_RPC = "<https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY>";
const SONIC_RPC = "<https://rpc.soniclabs.com>";

// Initialize providers
const ethProvider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC);
const sonicProvider = new ethers.providers.JsonRpcProvider(SONIC_RPC);

// Initialize signer with your private key
const PRIVATE_KEY = "your-private-key";
const ethSigner = new ethers.Wallet(PRIVATE_KEY, ethProvider);
const sonicSigner = new ethers.Wallet(PRIVATE_KEY, sonicProvider);

```

### **Bridge Operations**

```jsx
// 1. Ethereum to Sonic Transfer
async function bridgeToSonic(tokenAddress, amount) {
    const tokenPairs = new ethers.Contract(ETH_CONTRACTS.TOKEN_PAIRS, TOKEN_PAIRS_ABI, ethProvider);
    const mintedToken = await tokenPairs.originalToMinted(tokenAddress);
    if (mintedToken === ethers.constants.AddressZero) {
        throw new Error("Token not supported");
    }
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, ethSigner);
    const approveTx = await token.approve(ETH_CONTRACTS.TOKEN_DEPOSIT, amount);
    await approveTx.wait();
    const deposit = new ethers.Contract(ETH_CONTRACTS.TOKEN_DEPOSIT, TOKEN_DEPOSIT_ABI, ethSigner);
    const tx = await deposit.deposit(Date.now(), tokenAddress, amount);
    const receipt = await tx.wait();
    return {
        transactionHash: receipt.transactionHash,
        mintedToken,
        blockNumber: receipt.blockNumber,
        depositId: receipt.events.find(e => e.event === 'Deposit').args.id
    };
}

// 2. Claim Tokens on Sonic
async function claimOnSonic(depositBlockNumber, depositId, tokenAddress, amount) {
    console.log("Waiting for state oracle update to block ", depositBlockNumber);
    const blockNum = await waitForStateUpdate(depositBlockNumber);
    console.log("Generating proof...");
    const proof = await generateProof(depositId, blockNum);
    console.log("Claiming tokens...");
    const bridge = new ethers.Contract(SONIC_CONTRACTS.BRIDGE, BRIDGE_ABI, sonicSigner);
    const tx = await bridge.claim(depositId, tokenAddress, amount, proof);
    const receipt = await tx.wait();
    return receipt.transactionHash;
}

// Helper function to wait for state update
async function waitForStateUpdate(depositBlockNumber) {
    const stateOracle = new ethers.Contract(SONIC_CONTRACTS.STATE_ORACLE, STATE_ORACLE_ABI, sonicProvider);
    while (true) {
        const currentBlockNum = await stateOracle.lastBlockNum();
        if (currentBlockNum >= depositBlockNumber) {
            return currentBlockNum;
        }
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

// Helper function to generate proofs
async function generateProof(depositId, blockNum) {
    const storageSlot = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8'], [depositId, 7])
    );
    const proof = await ethProvider.send("eth_getProof", [
        ETH_CONTRACTS.TOKEN_DEPOSIT,
        [storageSlot],
        ethers.utils.hexValue(blockNum) // Correctly use the specific block number
    ]);
    return ethers.utils.RLP.encode([
        ethers.utils.RLP.encode(proof.accountProof),
        ethers.utils.RLP.encode(proof.storageProof[0].proof)
    ]);
}

```

### **Required ABIs**

```jsx
const STATE_ORACLE_ABI = [
    "function lastBlockNum() external view returns (uint256)",
    "function lastState() external view returns (bytes32)"
];
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];
const TOKEN_PAIRS_ABI = [
    "function originalToMinted(address) external view returns (address)",
    "function mintedToOriginal(address) external view returns (address)"
];
const TOKEN_DEPOSIT_ABI = [
    "function deposit(uint96 uid, address token, uint256 amount) external",
    "function claim(uint256 id, address token, uint256 amount, bytes calldata proof) external",
    "event Deposit(uint256 indexed id, address indexed owner, address token, uint256 amount)"
];
const BRIDGE_ABI = [
    "function withdraw(uint96 uid, address token, uint256 amount) external",
    "function claim(uint256 id, address token, uint256 amount, bytes calldata proof) external",
    "event Withdrawal(uint256 indexed id, address indexed owner, address token, uint256 amount)"
];

```

### **4.3.3. Integrating Staking**

You can build applications on top of Sonic's staking system, such as liquid staking tokens or vaults. All staking operations are managed by the **SFC (Special Fee Contract)**.

- **SFC Address:** `0xFC00FACE00000000000000000000000000000000`
- **Key Functions:**
    - `delegate(validatorID)`: Delegate stake to a validator.
    - `undelegate(validatorID, wrID, amount)`: Begin the withdrawal process.
    - `withdraw(validatorID, wrID)`: Claim unlocked stake after the withdrawal period.
    - `pendingRewards(delegator, validatorID)`: Check claimable rewards.
    - `claimRewards(validatorID)`: Claim pending rewards.
- **Constants:** Economic parameters like withdrawal period and reward rates are available by calling the `constsAddress()` on the SFC to get the `ConstantsManager` contract address.
- **See the [API & SDK Reference](https://www.notion.so/New-Proposed-Sonic-Documentation-20d178962bd280279aeceae1832ee8c2?pvs=21) for the full SFC ABI.**

### **4.4. Fee Monetization (FeeM)**

Earn a sustainable revenue stream directly from the network fees your dApp generates.

- **How it Works:** Sonic's off-chain oracles trace transaction execution, including internal calls, and attribute gas consumption to registered project contracts. 90% of the fees generated are sent to the FeeM treasury.
- **How to Apply:** Visit the [FeeM dashboard](https://sonic.soniclabs.com/feem), connect your wallet, and follow the registration steps. You will need to provide project metadata and register your smart contracts.
- **Claiming Revenue:** Claim your accumulated rewards from the FeeM dashboard. Rewards are updated every epoch.
- **Factories & Proxies:**
    - **Self-Registration:** The recommended approach is to have your contracts call `selfRegister(projectId)` on the `ContractsRegistrar` during their initialization.
    - **Proxy Patterns:** If your app uses proxies that `DELEGATECALL` to a central implementation contract, you generally only need to register the implementation contract, as the gas fees will be attributed to it.

### **4.5. Tooling & Resources**

- **RPC Providers:**
    - **Sonic Labs:** `https://rpc.soniclabs.com` (load-balanced) & `wss://rpc.soniclabs.com` (persistent)
    - **Ankr:** `https://rpc.ankr.com/sonic_mainnet`
    - **Alchemy:** Sign up for a private RPC.
    - **dRPC:** `https://sonic.drpc.org`
    - **thirdweb:** `https://146.rpc.thirdweb.com/${THIRDWEB_API_KEY}`
    
    > Best Practice: For sequences of dependent transactions (e.g., complex contract deployments), use a wss:// endpoint or a private RPC to ensure you have a "sticky" session with a single node. This prevents state inconsistencies that can occur when eth_estimateGas and eth_sendRawTransaction are routed to different nodes behind a load balancer.
    > 
- **SDKs & Libraries:** Sonic is compatible with standard Ethereum libraries like Ethers.js, Viem, Web3.js, [Web3.py](http://web3.py/), etc.