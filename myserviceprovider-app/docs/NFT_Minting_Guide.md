# NFT Minting Functionality for ServiceFlow AI

## Overview

ServiceFlow AI now supports minting AI-generated images as NFTs on the Sonic blockchain. This feature allows paid users to turn their generated artwork into collectible NFTs with on-chain metadata and provenance.

## Features

### 🎨 NFT Minting Options
- **Paid Generations Only**: NFT minting is available for all paid generation types (USDC, wS Token, SSStt, CORAL)
- **Image Generations Only**: Currently supports image generations (video NFT support planned)
- **Optional Feature**: Users can choose to mint as NFT with a checkbox during payment
- **Additional Cost**: 50% additional cost for NFT minting (e.g., 1 USDC + 0.5 USDC for NFT = 1.5 USDC total)

### 🔗 On-Chain Metadata
- **Prompt Preservation**: The original prompt is stored on-chain
- **Generation Data**: Model used, timestamp, creator address, payment method
- **Image Data**: Base64 encoded image or IPFS hash stored in metadata
- **OpenSea Compatible**: Metadata follows OpenSea standards for marketplace compatibility

### 💰 Cost Structure
- **SSStt**: 1.0 SSStt (generation) + 0.5 SSStt (NFT) = 1.5 SSStt total
- **USDC**: 1.0 USDC (generation) + 0.5 USDC (NFT) = 1.5 USDC total  
- **wS Token**: 3.0 wS (generation) + 1.5 wS (NFT) = 4.5 wS total (testnet)
- **CORAL**: 1.0 CORAL (generation) + 0.5 CORAL (NFT) = 1.5 CORAL total

## Smart Contracts

### GeneratedArtNFT.sol
- **ERC-721 compliant**: Standard NFT contract with custom metadata
- **Generation Tracking**: Stores prompt, image data, model, timestamp, creator
- **Authorized Minters**: Only authorized contracts (payment contract) can mint
- **Metadata URI**: Supports custom metadata URIs and fallback generation data

### SonicPaymentTestnetWithNFT.sol
- **Enhanced Payment Contract**: Extends original payment contract with NFT functionality
- **NFT Minting Functions**: `payWithTokenAndMintNFT` functions for each supported token
- **Cost Calculation**: Automatically calculates generation + NFT costs
- **Event Tracking**: Emits NFT minting events with token ID and generation ID

## Contract Addresses (Testnet)

```javascript
// Environment Variables to Set
NEXT_PUBLIC_NFT_CONTRACT_TESTNET=0x[NFT_CONTRACT_ADDRESS]
NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_TESTNET=0x[ENHANCED_PAYMENT_CONTRACT_ADDRESS]
```

## Deployment

### Prerequisites
1. Hardhat configured for Sonic Testnet
2. Deployer wallet with sufficient S tokens for gas
3. Environment variables set for existing contracts

### Deploy Script
```bash
npx hardhat run scripts/deploy-nft-contracts.js --network sonic-testnet
```

### Deployment Steps
1. Deploy `GeneratedArtNFT` contract
2. Deploy `SonicPaymentTestnetWithNFT` contract with NFT contract address
3. Authorize payment contract to mint NFTs
4. Verify contract linkage
5. Update environment variables

## Frontend Integration

### UI Components
- **NFT Checkbox**: Appears for image generations only
- **Cost Display**: Shows additional NFT minting cost
- **Payment Buttons**: Updated to use NFT minting functions when checkbox is selected
- **Generation History**: Shows NFT badge with token ID for minted NFTs

### User Flow
1. User creates image generation prompt
2. User checks "Mint as NFT" checkbox (optional)
3. User selects payment method
4. System calculates total cost (generation + NFT if selected)
5. User approves token spending (ERC-20 tokens)
6. System executes payment + NFT minting transaction
7. AI generates image with premium model
8. NFT is minted with on-chain metadata
9. User receives both generated image and NFT

### Payment Functions
```typescript
// Regular payment functions
handlePayWithUSDC()
handlePayWithSSStt()
handlePayWithSToken()
handlePayWithCORAL()

// NFT minting payment functions  
handlePayWithUSDCAndMintNFT()
handlePayWithSSSttAndMintNFT()
handlePayWithSTokenAndMintNFT()
handlePayWithCORALAndMintNFT()
```

## API Endpoints

### NFT Metadata Generation
- **Endpoint**: `POST /api/nft/metadata`
- **Purpose**: Generate OpenSea-compatible metadata for NFTs
- **Input**: Token ID, prompt, image data, model, creator, payment method
- **Output**: Formatted metadata JSON and base64 data URI

### NFT Metadata Retrieval
- **Endpoint**: `GET /api/nft/metadata?tokenId={id}`
- **Purpose**: Retrieve metadata for existing NFTs
- **Output**: OpenSea-compatible metadata JSON

## Testing

### Test Scenarios
1. **Regular Generation**: Verify normal generations still work without NFT minting
2. **NFT Minting**: Test each payment method with NFT minting enabled
3. **Cost Calculation**: Verify correct total costs are calculated and charged
4. **Metadata Generation**: Test metadata API endpoints
5. **Contract Authorization**: Verify only authorized minters can mint NFTs

### Testnet Testing
1. Get testnet tokens from Sonic faucet
2. Connect wallet to Sonic Testnet
3. Generate images with and without NFT minting
4. Verify NFTs appear in wallet and on block explorer
5. Check metadata is properly formatted and accessible

## Revenue Distribution

NFT minting fees follow the same distribution as regular payments:
- **25%** → BanditKidz Staking Contract
- **50%** → Dev Wallet (AI costs and overhead)
- **15%** → Leaderboard Winners (if threshold met)
- **10%** → Contract Treasury

## Future Enhancements

### IPFS Integration
- Upload images to IPFS for permanent storage
- Upload metadata to IPFS for decentralized access
- Update contract to use IPFS URIs instead of base64 data

### Video NFT Support
- Extend NFT minting to video generations
- Handle larger file sizes and streaming metadata
- Implement video-specific metadata standards

### Marketplace Integration
- Direct OpenSea listing capabilities
- Custom marketplace for ServiceFlow AI NFTs
- Royalty configuration for secondary sales

### Advanced Features
- Batch NFT minting for multiple generations
- Custom NFT collection creation
- Rarity traits based on generation parameters
- NFT staking and utility features

## Troubleshooting

### Common Issues
1. **Insufficient Balance**: Ensure users have enough tokens for generation + NFT costs
2. **Network Mismatch**: Verify user is connected to Sonic Testnet
3. **Contract Authorization**: Ensure payment contract is authorized to mint NFTs
4. **Metadata Errors**: Check metadata generation API is working correctly

### Error Messages
- "Insufficient balance for NFT minting": User needs more tokens
- "NFT contract not set": NFT contract address not configured
- "Not authorized to mint": Payment contract not authorized
- "Invalid network configuration": Network or contract configuration issue

## Security Considerations

### Contract Security
- Only authorized minters can mint NFTs
- Payment verification before minting
- Proper access controls on admin functions
- Emergency withdrawal functions for contract owner

### Metadata Security
- Validate all input data before generating metadata
- Sanitize user prompts in metadata
- Ensure image data is properly encoded
- Rate limiting on metadata API endpoints

### Frontend Security
- Validate user inputs before contract calls
- Proper error handling for failed transactions
- Secure token approval flows
- Protection against front-running attacks