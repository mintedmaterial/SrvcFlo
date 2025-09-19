# Sponsor Gas for your users

export const SponsorGasPlayground = () => {
  const [state, setState] = useState("initial");
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [userOpId, setUserOpId] = useState("");
  const [balance, setBalance] = useState("");
  const [privateKey, setPrivateKey] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [status, setStatus] = useState("");
  const baseAPIUrl = "https://gelato-docs.vercel.app";
  const [refreshing, setRefreshing] = useState(false);
  const handleCreateAccount = async () => {
    setIsLoading(true);
    setStatus("");
    try {
      const response = await fetch(`${baseAPIUrl}/api/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setPrivateKey(data.privateKey);
      setAddress(data.address);
      const bal = await fetchBalance(data.privateKey);
      setBalance(bal);
      setState("account-created");
    } catch (e) {
      setStatus("Error creating account");
    }
    setIsLoading(false);
  };
  const fetchBalance = async privKey => {
    try {
      const response = await fetch(`${baseAPIUrl}/api/fetch-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          privateKey: privKey
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.balance;
    } catch (e) {
      return "0.00";
    }
  };
  const handleSendTransaction = async () => {
    setIsLoading(true);
    setStatus("");
    try {
      const response = await fetch(`${baseAPIUrl}/api/send-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          privateKey
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setUserOpId(data.gelatoId);
      setTransactionHash(data.txHash);
      setState("transaction-sent");
      setStatus(`Transaction sent! Gelato ID: ${data.gelatoId}`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
    setIsLoading(false);
  };
  const truncateAddress = addr => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  const handleCopy = async text => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 1200);
    } catch {}
  };
  const handleRefreshBalance = async () => {
    setRefreshing(true);
    try {
      const newBalance = await fetchBalance(privateKey);
      setBalance(newBalance);
    } catch (e) {
      console.error("Error refreshing balance:", e);
    }
    setRefreshing(false);
  };
  const WalletIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>;
  const SendIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>;
  const ExternalLinkIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>;
  const LoaderIcon = () => <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>;
  const ChevronRightIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>;
  const CopyIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>;
  const RefreshIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l4.36 4.36A9 9 0 0 0 20.49 15" />
    </svg>;
  return <div className="min-h-[100dvh] sm:min-h-screen bg-gray-50 dark:bg-black relative overflow-hidden flex items-center justify-center p-2 sm:p-4 lg:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-black dark:via-gray-900 dark:to-black opacity-80"></div>

      <div className="w-full max-w-3xl relative z-10 px-1 sm:px-2 lg:px-4 mx-auto py-4 sm:py-0">
        {state !== "initial" && <div className="bg-white dark:bg-black/60 rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-white flex items-center justify-center text-white dark:text-gray-900 shadow-lg flex-shrink-0 mx-auto sm:mx-0">
              <WalletIcon />
            </div>
            <div className="flex-1 flex flex-col gap-1.5 sm:gap-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                <span className="font-mono text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                  {truncateAddress(address)}
                </span>
                <button onClick={() => handleCopy(address)} className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                  <CopyIcon />
                </button>
                {copyStatus && <span className="text-emerald-500 text-xs">{copyStatus}</span>}
              </div>
              <div className="flex items-center justify-center sm:justify-between text-xs sm:text-sm">
                <span className="text-gray-500 dark:text-gray-400">Balance:</span>
                <div className="flex items-center gap-2 ml-2 sm:ml-0">
                  <span className="font-mono font-medium text-gray-900 dark:text-white">
                    {balance} ETH
                  </span>
                  <button onClick={handleRefreshBalance} disabled={refreshing} className={`p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className={refreshing ? 'animate-spin' : ''}>
                      <RefreshIcon />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>}

        <div className="bg-white dark:bg-black/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-12 xl:p-16 border border-gray-200 dark:border-gray-800 shadow-xl">
          {state === "initial" && <div className="text-center">
              <div className="mb-6 sm:mb-8 lg:mb-10">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 lg:mb-4">
                  Sponsor Gas Playground
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 px-1 sm:px-2 mb-4 sm:mb-6">
                  Experience gasless transactions with Smart Wallet SDK
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-2xl mx-auto">
                  <div className="bg-gray-50 dark:bg-black/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-800">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-white rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">Secure</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Enterprise-grade security</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-black/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-800">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-white rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">Fast</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Instant transactions</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-black/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-800">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-white rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">Gasless</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">No gas fees required</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 sm:mb-8 lg:mb-10 pt-2 sm:pt-4 lg:pt-6">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 lg:mb-8">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-white blur-lg opacity-70"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-white flex items-center justify-center text-white dark:text-gray-900">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center">
                      <WalletIcon />
                    </div>
                  </div>
                </div>

                <button onClick={handleCreateAccount} disabled={isLoading} className={`inline-flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm sm:text-base lg:text-lg font-semibold transition-all hover:transform hover:scale-105 hover:shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {isLoading ? <>
                      <LoaderIcon />
                      <span className="hidden sm:inline">Creating Account...</span>
                      <span className="sm:hidden">Creating...</span>
                    </> : <>
                      Create Account
                      <ChevronRightIcon />
                    </>}
                </button>
                
                <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <p>Powered by Gelato Smart Wallet SDK</p>
                </div>
              </div>
            </div>}

          {state === "account-created" && <div className="text-center">
              <div className="mb-6 sm:mb-8 lg:mb-10">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 sm:mb-4 lg:mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-white blur-lg opacity-70"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-white flex items-center justify-center text-white dark:text-gray-900">
                    <WalletIcon />
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 lg:mb-4">
                  Account Created Successfully!
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 px-1 sm:px-2">
                  Your smart wallet is ready for gasless transactions
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-black/40 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 mb-6 sm:mb-8 lg:mb-12 border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 text-left">
                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 block">
                      Wallet Address
                    </label>
                    <p className="font-mono text-xs sm:text-sm p-2 sm:p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white break-all">
                      {address}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 block">
                      Network
                    </label>
                    <p className="flex items-center p-2 sm:p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Base Sepolia
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={handleSendTransaction} disabled={isLoading} className={`inline-flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm sm:text-base lg:text-lg font-semibold transition-all hover:transform hover:scale-105 hover:shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {isLoading ? <>
                    <LoaderIcon />
                    <span className="hidden sm:inline">Sending Transaction...</span>
                    <span className="sm:hidden">Sending...</span>
                  </> : <>
                    <SendIcon />
                    Send Transaction
                  </>}
              </button>
            </div>}

          {state === "transaction-sent" && <div className="text-center">
              <div className="mb-6 sm:mb-8 lg:mb-10">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 sm:mb-4 lg:mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-white blur-lg opacity-70"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-white flex items-center justify-center text-white dark:text-gray-900">
                    <SendIcon />
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 lg:mb-4">
                  Transaction Sent!
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 px-1 sm:px-2">
                  Your gasless transaction has been submitted to the network
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-black/40 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 mb-6 sm:mb-8 lg:mb-12 border border-gray-200 dark:border-gray-800">
                <div className="text-left">
                  <label className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                    Transaction Hash
                  </label>
                  <div className="flex items-center p-2 sm:p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="font-mono text-xs sm:text-sm text-gray-900 dark:text-white break-all flex-1">
                      {transactionHash}
                    </p>
                    <button onClick={() => window.open(`https://sepolia.basescan.org/tx/${transactionHash}`, "_blank")} className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors ml-2 sm:ml-3 flex-shrink-0">
                      <ExternalLinkIcon />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6 lg:mb-8">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-center">
                  <button onClick={() => window.open(`https://relay.gelato.digital/tasks/status/${userOpId}`, "_blank")} className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900">
                    <ExternalLinkIcon />
                    <span className="hidden sm:inline">UserOp Status</span>
                    <span className="sm:hidden">UserOp</span>
                  </button>
                  <button onClick={() => window.open(`https://sepolia.basescan.org/tx/${transactionHash}`, "_blank")} className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900">
                    <ExternalLinkIcon />
                    <span className="hidden sm:inline">Transaction Status</span>
                    <span className="sm:hidden">Tx Status</span>
                  </button>
                </div>
              </div>

              <button onClick={() => setState("account-created")} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-xs sm:text-sm lg:text-base">
                Send Another Transaction
              </button>
            </div>}
        </div>
      </div>
    </div>;
};

Sponsoring gas for users is one of the most effective ways to enhance the user experience in dApps. With the Gelato Smart Wallet SDK, developers can easily set up sponsored transactions for their applications in just a few simple steps, enabling seamless onboarding and interaction without requiring users to hold native tokens.

## Getting Started

<Steps>
  <Step title="Importing Dependencies">
    ```typescript
    import { createGelatoSmartWalletClient, sponsored } from "@gelatonetwork/smartwallet";
    import { gelato, kernel, safe } from "@gelatonetwork/smartwallet/accounts";
    import { createWalletClient, createPublicClient, http, type Hex } from "viem";
    import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
    ```
  </Step>

  <Step title="Setup Smart Account">
    You can set up a Smart Account as per your needs. In the case of `Gelato`, the Gelato Smart Account address will be the same as your EOA, enabling EIP-7702 features.
    <br /><br />When using a `Kernel` Account, you have the option to use EIP-7702 and ERC-4337 together. Setting `eip7702` parameter to true will make your EOA the sender address. However, if you want to utilize existing Kernel accounts only with ERC-4337 features, set it to false.
    <br /><br />For a `Safe` Account, it defaults to the ERC-4337 standard. You can either use an already deployed Safe Account or create a new one, while enhancing the experience with Gelato's best-in-class infrastructure.

    <Tabs>
      <Tab title="Gelato Smart Account">
        ```typescript
        const privateKey = (process.env.PRIVATE_KEY ?? generatePrivateKey()) as Hex;
        const owner = privateKeyToAccount(privateKey);

        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const account = await gelato({
          owner,
          client: publicClient,
        });
        ```
      </Tab>

      <Tab title="Kernel Account">
        ```typescript
        const privateKey = (process.env.PRIVATE_KEY ?? generatePrivateKey()) as Hex;
        const owner = privateKeyToAccount(privateKey);

        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const account = await kernel({
          owner,
          client: publicClient,
          eip7702: false, // set to true if you want to use EIP-7702 with ERC-4337
        });
        ```
      </Tab>

      <Tab title="Safe Account">
        ```typescript
        const privateKey = (process.env.PRIVATE_KEY ?? generatePrivateKey()) as Hex;
        const owner = privateKeyToAccount(privateKey);

        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const account = await safe({
          client: publicClient,
          owners: [owner],
          version: "1.4.1",
        });
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Setup Wallet Client">
    Quickly get started by creating a wallet client using `createWalletClient` from `viem` with local account for your specified network. Checkout supported networks [here](/Smart-Wallet-SDK/Additional-Resources/Supported-networks).

    ```typescript
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    });
    ```
  </Step>

  <Step title="Creating a Smart Wallet Client">
    To create a API Key, visit the [Gelato App](https://app.gelato.cloud/) and navigate to the `Paymaster & Bundler > API Keys` section. Create a new API Key, select the required networks, and copy the generated API Key.
    <br /><br />For detailed instructions, click [here](/Smart-Wallet-SDK/How-To-Guides/Create-a-Api-Key) to learn more about creating a API Key.

    ```typescript
    const smartWalletClient = createGelatoSmartWalletClient(client, { apiKey });
    ```
  </Step>

  <Step title="Sending Transactions">
    To send sponsored transactions, select Sponsored as the payment method:

    ```typescript
    const results = await smartWalletClient.execute({
      payment: sponsored(apiKey),
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
  </Step>

  <Step title="Batch Multiple Transactions">
    You can batch multiple transactions to be sent on-chain at once by adding them to the calls array:

    ```typescript
    const results = await smartWalletClient.execute({
      payment: sponsored(),
      calls: [
        {
          to: "0xa8851f5f279eD47a292f09CA2b6D40736a51788E",
          data: "0xd09de08a",
          value: 0n
        },
        {
          to: "0xa8851f5f279eD47a292f09CA2b6D40736a51788E",
          data: "0xd09de08a",
          value: 0n
        },
        {
          to: "0xa8851f5f279eD47a292f09CA2b6D40736a51788E",
          data: "0xd09de08a",
          value: 0n
        }
      ]
    });
    ```
  </Step>
</Steps>

## Sponsor Gas Playground

<SponsorGasPlayground />

## Additional Resources

* Check out the full implementation of sponsored transactions using [Gelato Wallets](https://github.com/gelatodigital/how-tos-1-smartwallet-sdk-examples/blob/master/sponsored/src/index.ts), [Kernel Wallets](https://github.com/gelatodigital/how-tos-1-smartwallet-sdk-examples/blob/master/kernel-sponsored/src/index.ts), and [Safe Wallets](https://github.com/gelatodigital/how-tos-1-smartwallet-sdk-examples/blob/master/safe-sponsored/src/index.ts).