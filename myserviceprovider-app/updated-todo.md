TODO: 

ServiceFlow AI — fix credits & generation
Priority: High → Medium → Low

Immediate environment & dev setup (High)
 Activate the single central venv for development:
From project root run:
PowerShell: C:\Users\PC\ServiceApp\.venv\Scripts\Activate.ps1
If blocked: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser then re-run activation.
 Install missing Python packages into that venv:
pip install pymongo pypdf python-dotenv pymongo[srv]
Optionally add others used by repo (use pip freeze from working project or requirements.txt).
 Ensure env values exist in .env (or .dev.vars):
MONGODB_URI, CLOUDFLARE_*, NEXT_PUBLIC_* contract addresses, MINTER_PRIVATE_KEY / ADMIN_PRIVATE_KEY, SONIC_BACKEND_PRIVATE_KEY.
 Verify project runs without import errors: uv run --active python -m api.routes.playground
Reproduce & log failing flows (High)
 Reproduce credit minting from the frontend and capture:
Browser console errors, network requests, response bodies
Backend logs (server/Cloudflare worker), and transaction hashes
 Check frontend -> backend endpoints used by credit widget:
Files: myserviceprovider-app/components/credit-widget and app/api/credits/* routes (app/api/credits/mint/route.ts, app/api/purchase-credits/route.ts)
 Inspect on‑chain transaction attempts in Sonicscan (TX hash) and node logs.
Fix credit minting flow (High)
 Confirm contract addresses & ABIs used by frontend and server match deployed contracts:
Contracts: Contracts/SrvcfloCreditsNFTWithRoyalties.sol, Contracts/SrvcfloCreditsNFTMainnet.sol, Contracts/SrvcfloMultiCollectionStaking.sol
Ensure NEXT_PUBLIC_* env variables point to deployed addresses.
 Ensure backend has a signer with the minter private key for owner-only mint/mintWithMetadata calls:
Server/worker must call creditsContract.mint(...) or mint via paymentSplitter.processPaymentAndMintCredits(...) with proper signer.
Check MINTER_PRIVATE_KEY in server env and that server code uses it (see app/api/credits/mint/route.ts and app/api/generate/*).
 Verify ERC‑20 USDC approval flow in frontend before payment:
Check allowance for USDC; call approve before calling mint/purchase endpoints.
 Verify gas, nonce, and signer balances (S token) for the minter wallet.
Credit accounting & metadata update (High)
 Establish canonical flow:
User pays USDC or S to PaymentSplitter contract OR calls mint with off‑chain payment verification.
Backend (signer) mints ERC‑1155 credits (or increments ERC‑20 balance) to user address.
Save generation/credit metadata to MongoDB and optionally emit on‑chain events.
 If NFT minting must include generation metadata update:
Flow: user generates image → backend uploads image to IPFS/R2 → backend constructs metadata JSON → backend calls mintWithMetadata(creator, tokenId, amount, prompt, generationMethod, data) or setURI/update function as contract exposes.
Files to change/inspect: app/api/generate/*, src/openai-image-service.ts, src/gemini-video-service.ts, components/ai-generation.tsx.
 Implement a server/Cloudflare-worker uploader:
Upload image to Cloudflare R2 or IPFS (use nft.storage or Cloudflare IPFS gateway).
Get final URI, insert into metadata JSON (name, description, image, attributes).
Call contract mint/update with minter signer.
Secure private keys: store as Secrets in Cloudflare/Wrangler or server env.
Cloudflare workers & generation routing (High → Medium)
 Centralize generation routing in a single MCP/cloudflare worker:
Accept model param: cloudflare, openai, gemini, or mcp.
Attach standard system prompt / “ServiceFlow AI style” preprompt before user prompt.
Use provider-specific integrations in app/api/generate/* and src/*-service.ts.
 Upgrade OpenAI & Gemini usage:
Update src/openai-image-service.ts to call GPT-4.1 / 5 image/video APIs per new SDKs.
Update src/gemini-video-service.ts to accept reference images via keywords and pass them in request body.
 Make generated results consistent: always return base64 or hosted URL and standard metadata (model, creditsUsed, generationId).
Credit deduction & dev/app wallet bypass (High)
 Implement centralized isDevWallet(userAddress) function and ensure frontend/backends use it to bypass credit checks.
Confirm dev wallet list file: lib/dev-wallet-config or .dev.vars.
 Deduct credits only after generation success:
For NFT credits: call spending contract or mark on chain (if using ERC‑20 credits, call spendERC20Credits).
For NFT credits usage: burn or decrement supply on successful generation.
 Save record to MongoDB: collections users, generations, creditHistory (see app/api/generate/openai-image/route.ts for sample code).
MongoDB & persistence (Medium)
 Ensure MONGODB_URI is set and accessible to server & workers.
 Use pymongo (Python) or mongodb (Node) consistently across backends.
 Normalize DB: users, generations, creditHistory, collections.
 Add indexes on walletAddress, generationId.
IPFS / Metadata hosting (Medium)
 Choose host: Cloudflare R2 + Cloudflare IPFS gateway OR nft.storage/web3.storage.
 Implement image upload + pin + metadata JSON creation in worker or backend:
Path: app/api/generations/save or a new worker workers/upload-metadata.
 Add retry/pin logic and return the metadata URI to be used when invoking mintWithMetadata.
Staking rewards & yield (Medium → Low)
 Inspect SrvcfloMultiCollectionStaking.sol on Sonicscan; collect failing functions and tests.
On‑chain code: verify stake, claim, withdraw, event emissions.
 Implement off‑chain scheduler or on‑chain yield receiver:
Integrate with Silo or other protocol: backend deposits received funds into Silo market via trusted backend wallet. (Requires backend private key with deposit permission)
 Ensure reward split logic references NFT rank tiers. Add helper contract functions to query holder ranks.
Price worker & Beefy oracle (Medium)
 Update src/price-worker.js to use Beefy oracle data:
Add fetch to Beefy oracle endpoints (see Beefy_oracle.md).
Provide price in credits or USDC equivalence to frontend.
Tests, monitoring, and CI (Medium)
 Add unit tests for:
Credit minting endpoint
Generation endpoint (mock providers)
Mint + metadata flow (simulate IPFS upload)
 Add E2E tests using local signer and local Hardhat network.
 Add logs for each step and alerting for failing on‑chain txs.
Security & deployment (High)
 NEVER push private keys to repo. Use Cloudflare Secrets, environment variables, or a vault.
 Use Cloudflare Workers Secrets for worker operations requiring signing; prefer server-side calls for owner-only minting.
 Add rate limiting and anti-abuse on generation endpoints.
Debug checklist for credit widget not minting (Immediate)
 Confirm frontend calls app/api/credits/mint and logs response.
 Confirm backend receives request and returns txHash or error.
 If backend throws, capture full exception stacktrace.
 Check minter private key present and signer balance.
 Check target contract address and ABI match deployed contract.
 Check token allowances (USDC) and USDC transfer success.
 If tx submitted but fails, inspect revert reason (sonicscan or provider error).
Files to review / change (direct)
Frontend:
components/credit-widget (widget mint flow)
components/ai-generation.tsx, components/ai-generation-v2
Server / API:
app/api/generate/* (openai, cloudflare-free, mcp, credit-based)
app/api/credits/mint/route.ts
app/api/generations/save (or create)
Services:
src/openai-image-service.ts
src/gemini-video-service.ts
src/price-worker.js
Smart contracts:
Contracts/SrvcfloCreditsNFTWithRoyalties.sol
Contracts/SrvcfloCreditsNFTMainnet.sol
Contracts/SrvcfloMultiCollectionStaking.sol
Docs & config:
.env, .dev.vars, wrangler.toml, hardhat.config.js, DOCS/*