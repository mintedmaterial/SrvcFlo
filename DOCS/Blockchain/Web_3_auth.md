npm install --save @web3auth/modal wagmi @tanstack/react-query

Web3Auth NextJS Quick Start

Integrate secure and seamless Web3 authentication into your NextJS app using Web3Auth.

Clone the NextJS Quick Start Application

npx degit Web3Auth/web3auth-examples/quick-starts/nextjs-quick-start w3a-quick-start


info
If you face any problem anytime, you can always find help in the Web3Auth Community.

Install Web3Auth

Install the Web3Auth package in your project.

Additionally, for blockchain calls, we're using wagmi and its dependency, @tanstack/react-query for this example.

npm
Yarn
pnpm
Bun
npm install --save @web3auth/modal wagmi @tanstack/react-query


Npm package monthly downloads 

Get your Client ID from the Web3Auth Dashboard

Visit the Web3Auth Dashboard and create a new project. Use the Client ID of the project to start your integration.

Configure Web3Auth

Create a basic config for Web3Auth and pass the clientId & web3AuthNetwork from your Web3Auth Dashboard Project Settings.

info
This is where you can also configure any major settings of your integration as well. Visit our configuration section of the sdk reference to learn more about the different options available.

Setup Web3Auth Provider

To enable the hooks across your application, you need to wrap your application with the Web3AuthProvider component. This involves using the configuration created in the previous step.

Setup Wagmi Provider

Since we're using wagmi for this example, we need to setup the WagmiProvider component. Please use the WagmiProvider component from @web3auth/modal/react/wagmi to wrap your application.

import { WagmiProvider } from "@web3auth/modal/react/wagmi";


Apart from that, the standard wagmi setup is being used. You do not need to create any wagmi config, since the Web3Auth config is being used directly. Refer to the wagmi docs for more information.

Logging in your User

Use the useWeb3AuthConnect hook to get access to the login functionality. The modal will prompt the user to login with their wallet and handle the authentication for you.

Making Blockchain Calls

Since Wagmi is configured in this application, you can directly use the wagmi hooks to make blockchain calls. We have demonstrated some commonly used hooks like useBalance, useAccount, useSignMessage, useSendTransaction and useSwitchChain.

info
You can refer to the wagmi docs for more information on the hooks.

Other Blockchains
Web3Auth supports all blockchains. Have a look at our Connect Blockchain section of the documentation and choose your blockchain to get started.

Log the user out

Use the useWeb3AuthDisconnect hook to log the user out. This will also delete the session information from the local storage of the browser.

info
There are multiple other hooks available in the Web3Auth React SDK. Visit our hooks section of the sdk reference to learn more about the different hooks available.

Layout.tsx

import React from "react";
import Provider from "../components/provider";
// IMP START - SSR
import { cookieToWeb3AuthState } from "@web3auth/modal";
import "./globals.css";

import { Inter } from "next/font/google";
import { headers } from "next/headers";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Web3Auth NextJS Quick Start",
  description: "Web3Auth NextJS Quick Start",
};

// eslint-disable-next-line no-undef
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const web3authInitialState = cookieToWeb3AuthState(headersList.get('cookie'));
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider web3authInitialState={web3authInitialState}>{children}</Provider>
      </body>
    </html>
  );
}



Page.tsx

"use client";

import React from "react";
import App from "../components/App";

export default function Home() {
  return <App />;
}


Provider.tsx

"use client";

import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { IWeb3AuthState, WEB3AUTH_NETWORK } from "@web3auth/modal";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const clientId = "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw"; // get from https://dashboard.web3auth.io

const queryClient = new QueryClient();
 
const web3AuthContextConfig: Web3AuthContextConfig = {
    web3AuthOptions: {
      clientId,
      web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
      ssr: true,
    }
  };

export default function Provider({ children, web3authInitialState }: 
  { children: React.ReactNode, web3authInitialState: IWeb3AuthState | undefined }) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig} initialState={web3authInitialState}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
        {children}
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}


App.tsx

import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import { SendTransaction } from "./wagmi/sendTransaction";
import { Balance } from "./wagmi/getBalance";
import { SwitchChain } from "./wagmi/switchNetwork";

function App() {
  const { connect, isConnected, loading: connectLoading, error: connectError } = useWeb3AuthConnect();
  // IMP START - Logout
  const { disconnect, loading: disconnectLoading, error: disconnectError } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const { address, connector } = useAccount();

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
      console.log(...args);
    }
  }

  const loggedInView = (
    <div className="grid">
      <h2>Connected to {connector?.name}</h2>
      <div>{address}</div>
      <div className="flex-container">
        <div>
          <button onClick={() => uiConsole(userInfo)} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={() => disconnect()} className="card">
            Log Out
          </button>
          {disconnectLoading && <div className="loading">Disconnecting...</div>}
          {disconnectError && <div className="error">{disconnectError.message}</div>}
        </div>
      </div>
      <SendTransaction />
      <Balance />
      <SwitchChain />
    </div>
  );

  const unloggedInView = (
    <div className="grid">
      <button onClick={() => connect()} className="card">
        Login
      </button>
      {connectLoading && <div className="loading">Connecting...</div>}
      {connectError && <div className="error">{connectError.message}</div>}
    </div>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://web3auth.io/docs/sdk/pnp/web/modal" rel="noreferrer">
          Web3Auth{" "}
        </a>
        & Next.js Modal Quick Start
      </h1>

      {isConnected ? loggedInView : unloggedInView}
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>

      <footer className="footer">
        <a
          href="https://github.com/Web3Auth/web3auth-examples/tree/main/quick-starts/nextjs-quick-start"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;


package.json

{
  "name": "nextjs-quick-start",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.37.1",
    "@web3auth/modal": "^10.0.4",
    "next": "^15.3.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "wagmi": "^2.14.16"
  },
  "devDependencies": {
    "@types/elliptic": "^6.4.14",
    "@types/node": "20.4.1",
    "@types/react": "^19.1.5",
    "@types/react-dom": "^19.1.5",
    "eslint": "8.44.0",
    "eslint-config-next": "^15.3.2",
    "typescript": "5.1.6"
  }
}

getBalance.tsx

import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";

export function Balance() {
  const { address } = useAccount()

  const { data, isLoading, error } = useBalance({ address })

  return (
    <div>
      <h2>Balance</h2>
      <div>{data?.value !== undefined && `${formatUnits(data.value, data.decimals)} ${data.symbol}`} {isLoading && 'Loading...'} {error && 'Error: ' + error.message}</div>
    </div>
  )
}

sendTransaction.tsx

import { FormEvent } from "react";
import { useWaitForTransactionReceipt, useSendTransaction, BaseError } from "wagmi";
import { Hex, parseEther } from "viem";

export function SendTransaction() {
  const { data: hash, error, isPending, sendTransaction } = useSendTransaction()

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const to = formData.get('address') as Hex
    const value = formData.get('value') as string
    sendTransaction({ to, value: parseEther(value) })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  return (
    <div>
      <h2>Send Transaction</h2>
      <form onSubmit={submit}>
        <input name="address" placeholder="Address" required />
        <input
          name="value"
          placeholder="Amount (ETH)"
          type="number"
          step="0.000000001"
          required
        />
        <button disabled={isPending} type="submit" className="card">
          {isPending ? 'Confirming...' : 'Send'}
        </button>
      </form>
      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && 'Waiting for confirmation...'}
      {isConfirmed && 'Transaction confirmed.'}
      {error && (
        <div>Error: {(error as BaseError).shortMessage || error.message}</div>
      )}
    </div>
  )
}


switchNetwork.tsx

import { useChainId, useSwitchChain } from 'wagmi'

export function SwitchChain() {
  const chainId = useChainId()
  const { chains, switchChain, error } = useSwitchChain()

  return (
    <div>
      <h2>Switch Chain</h2>
      <h3>Connected to {chainId}</h3>
      {chains.map((chain) => (
        <button
          disabled={chainId === chain.id}
          key={chain.id}
          onClick={() => switchChain({ chainId: chain.id })}
          type="button"
          className="card"
        >
          {chain.name}
        </button>
      ))}

      {error?.message}
    </div>
  )
}


CREDENTIALS MOVED TO .env FILE
WEB3AUTH_CLIENT_ID=***
WEB3AUTH_CLIENT_SECRET=***



import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.split(" ")[1];
    // Get public key from request body
    const { appPubKey } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    if (!appPubKey) {
      return NextResponse.json({ error: "No appPubKey provided" }, { status: 400 });
    }

    // Verify JWT using Web3Auth JWKS
    const jwks = jose.createRemoteJWKSet(new URL("https://api-auth.web3auth.io/jwks"));
    const { payload } = await jose.jwtVerify(idToken, jwks, { algorithms: ["ES256"] });

    // Find matching wallet in JWT
    const wallets = (payload as any).wallets || [];
    const normalizedAppKey = appPubKey.toLowerCase().replace(/^0x/, "");

    const isValid = wallets.some((wallet: any) => {
      if (wallet.type !== "web3auth_app_key") return false;

      const walletKey = wallet.public_key.toLowerCase();

      // Direct key comparison for ed25519 keys
      if (walletKey === normalizedAppKey) return true;

      // Handle compressed secp256k1 keys
      if (
        wallet.curve === "secp256k1" &&
        walletKey.length === 66 &&
        normalizedAppKey.length === 128
      ) {
        const compressedWithoutPrefix = walletKey.substring(2);
        return normalizedAppKey.startsWith(compressedWithoutPrefix);
      }

      return false;
    });

    if (isValid) {
      return NextResponse.json({ name: "Verification Successful" }, { status: 200 });
    } else {
      return NextResponse.json({ name: "Verification Failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("Social login verification error:", error);
    return NextResponse.json({ error: "Verification error" }, { status: 500 });
  }
}



import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.split(" ")[1];
    // Get address from request body
    const { address } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    if (!address) {
      return NextResponse.json({ error: "No address provided" }, { status: 400 });
    }

    // Verify JWT using AuthJS JWKS
    const jwks = jose.createRemoteJWKSet(new URL("https://authjs.web3auth.io/jwks"));
    const { payload } = await jose.jwtVerify(idToken, jwks, { algorithms: ["ES256"] });

    // Find matching wallet in JWT
    const wallets = (payload as any).wallets || [];
    const addressToCheck = Array.isArray(address) ? address[0] : address;
    const normalizedAddress = addressToCheck.toLowerCase();

    const isValid = wallets.some((wallet: any) => {
      return (
        wallet.type === "ethereum" &&
        wallet.address &&
        wallet.address.toLowerCase() === normalizedAddress
      );
    });

    if (isValid) {
      return NextResponse.json({ name: "Verification Successful" }, { status: 200 });
    } else {
      return NextResponse.json({ name: "Verification Failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("External wallet verification error:", error);
    return NextResponse.json({ error: "Verification error" }, { status: 500 });
  }
}



const {
  token,
  getIdentityToken,
  loading: idTokenLoading,
  error: idTokenError,
} = useIdentityToken();

const validateIdToken = async () => {
  const idToken = await getIdentityToken();

  let res;
  if (connectorName === "auth") {
    // Social login: send public key
    const pubKey = await web3Auth?.provider?.request({ method: "public_key" });
    console.log("pubKey:", pubKey);
    res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ appPubKey: pubKey }),
    });
  } else {
    // External wallet: send address
    const address = await web3Auth?.provider?.request({ method: "eth_accounts" });
    res = await fetch("/api/login-external", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ address }),
    });
  }

  // Handle response
  if (res.status === 200) {
    toast.success("JWT Verification Successful");
    uiConsole(`Logged in Successfully!`, userInfo);
  } else {
    toast.error("JWT Verification Failed");
    await disconnect();
  }

  return res.status;
};

import { useIdentityToken } from "@web3auth/modal/react";

function IdentityTokenButton() {
  const { getIdentityToken, loading, error, token } = useIdentityToken();

  return (
    <div>
      <button onClick={() => getIdentityToken()} disabled={loading}>
        {loading ? "Authenticating..." : "Get Identity Token"}
      </button>
      {token && <div>Token: {token}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}


Web3Auth Identity Token
The Identity Token (ID Token) issued by Web3Auth is a JSON Web Token (JWT) that contains verified identity claims about the authenticated user. This token is signed using Web3Auth's private key and cannot be spoofed, allowing developers to trust the identity information presented by the client.

Once a user successfully authenticates via Web3Auth, the platform issues an ID token which can then be used to authorize client-to-server requests or verify ownership of associated wallet addresses.

Purpose of the ID Token
User Identity Verification: Ensures that the client user is indeed who they claim to be.
Secure Backend Requests: The token should be passed in API requests to validate sessions server-side.
Wallet Ownership Proof: Includes public wallet keys to prove a user owns a particular wallet.
When making a backend request from the frontend, the client must include this ID token to ensure the backend can verify the authenticated user.

ID Token Format
Web3Auth tokens are ES256-signed JWTs containing various identity claims about the user.

A sample decoded token is shown below:

Sample ID Token
{
  "iat": 1747727490,
  "aud": "BJp5VGbuhg_mUA.....7B0SseDPBWabmYmEFXpfu8CGWSw",
  "nonce": "030cb3f1ab9593d987b17cb....38afe331561105213",
  "iss": "https://api-auth.web3auth.io",
  "wallets": [
    {
      "public_key": "5771379329ae0f3b76........82f17373a13d8683561",
      "type": "web3auth_app_key",
      "curve": "ed25519"
    },
    {
      "public_key": "020fda199e933b24a74...........6c9cc67a13c23d",
      "type": "web3auth_app_key",
      "curve": "secp256k1"
    }
  ],
  "email": "shahbaz@web3auth.io",
  "name": "Mohammad Shahbaz Alam",
  "profileImage": "https://lh3.googleusercontent.com/a/AcJD_Fs0...._xzcWYzT=s96-c",
  "authConnection": "web3auth",
  "userId": "shahbaz@web3auth.io",
  "groupedAuthConnectionId": "web3auth-google-sapphire-mainnet",
  "exp": 1747813890
}

NOTE
If the Return user data in identity token setting is disabled on the Web3Auth Dashboard, personally identifiable information (PII) such as email, name, and profileImage will be omitted from the token.

Getting the ID Token
To retrieve the ID token on the client-side, use the getIdentityToken() method. This is typically called after the user logs in.

React SDK
Vue SDK
JavaScript SDK
import { useIdentityToken } from "@web3auth/modal/react";

function IdentityTokenButton() {
  const { getIdentityToken, loading, error, token } = useIdentityToken();

  return (
    <div>
      <button onClick={() => getIdentityToken()} disabled={loading}>
        {loading ? "Authenticating..." : "Get Identity Token"}
      </button>
      {token && <div>Token: {token}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}


Verifying the ID Token
To validate an ID token server-side, use Web3Auth's JWKS endpoint or project-specific verification key. This process ensures the JWT was issued by Web3Auth and its contents have not been tampered with.

Using JWKS Endpoint
Social Login
External Wallets
Frontend Call
App.tsx
const {
  token,
  getIdentityToken,
  loading: idTokenLoading,
  error: idTokenError,
} = useIdentityToken();

const validateIdToken = async () => {
  const idToken = await getIdentityToken();

  let res;
  if (connectorName === "auth") {
    // Social login: send public key
    const pubKey = await web3Auth?.provider?.request({ method: "public_key" });
    console.log("pubKey:", pubKey);
    res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ appPubKey: pubKey }),
    });
  } else {
    // External wallet: send address
    const address = await web3Auth?.provider?.request({ method: "eth_accounts" });
    res = await fetch("/api/login-external", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ address }),
    });
  }

  // Handle response
  if (res.status === 200) {
    toast.success("JWT Verification Successful");
    uiConsole(`Logged in Successfully!`, userInfo);
  } else {
    toast.error("JWT Verification Failed");
    await disconnect();
  }

  return res.status;
};


Using Verification Key
To manually verify the token, use your Verification Key available on the Project Settings page in the Web3Auth Dashboard.

jose
jsonwebtoken
npm install jsonwebtoken


Example (JWT Verification using jsonwebtoken)
const verificationKey = "insert-your-web3auth-verification-key".replace(/\\n/g, "\n");

const idToken = "insert-the-users-id-token";

try {
  const decoded = jwt.verify(idToken, verificationKey, {
    issuer: "https://api-auth.web3auth.io",
    audience: "your-project-client-id",
  });
  console.log(decoded);
} catch (error) {
  console.error(error);
}


The replace operation above ensures that any instances of '\n' in the stringified public key are replaced with actual newlines, per the PEM-encoded format.

info
If the token is valid, the payload will contain identity claims (e.g., userId). If invalid, an error is thrown.

Things to Remember
The iss field in the token must be https://api-auth.web3auth.io.
The aud field must match your Project Client ID.
The exp field must be in the future.
The iat field must be in the past.