// Sonic Testnet Payment Diagnostic Tool
import { createPublicClient, http, formatUnits, parseUnits } from 'viem'

const SONIC_TESTNET_RPC = 'https://rpc.blaze.soniclabs.com'

const sonicTestnet = {
  id: 57054,
  name: 'Sonic Blaze Testnet',
  network: 'sonic-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: { http: [SONIC_TESTNET_RPC] },
    public: { http: [SONIC_TESTNET_RPC] },
  },
  blockExplorers: {
    default: { name: 'Sonic Scan', url: 'https://testnet.sonicscan.org' },
  },
} as const

const publicClient = createPublicClient({
  chain: sonicTestnet,
  transport: http(SONIC_TESTNET_RPC)
})

export const TESTNET_TOKENS = {
  SSSTT: '0xc777Fa50186362fe0EF9CCD579b6385cE7CB49f1',
  USDC: '0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6',
  S_TOKEN: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
  CORAL: '0xAF93888cbD250300470A1618206e036E11470149'
}

export const TESTNET_CONTRACTS = {
  PAYMENT: '0x08388768EEd51B2693D30AC1071D4AB558220eDE'
}

export async function diagnoseWalletTokens(walletAddress: string) {
  console.log('🔍 Diagnosing wallet tokens for:', walletAddress)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // Check native S token balance
    const nativeBalance = await publicClient.getBalance({
      address: walletAddress as `0x${string}`
    })
    console.log('💎 Native S Balance:', formatUnits(nativeBalance, 18), 'S')

    // Check each token balance
    for (const [tokenName, tokenAddress] of Object.entries(TESTNET_TOKENS)) {
      try {
        const balance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }]
            },
            {
              name: 'decimals',
              type: 'function',
              stateMutability: 'view',
              inputs: [],
              outputs: [{ name: '', type: 'uint8' }]
            }
          ],
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`]
        })

        const decimals = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              name: 'decimals',
              type: 'function',
              stateMutability: 'view',
              inputs: [],
              outputs: [{ name: '', type: 'uint8' }]
            }
          ],
          functionName: 'decimals'
        })

        console.log(`🪙 ${tokenName} Balance:`, formatUnits(balance as bigint, decimals as number), tokenName)
      } catch (error) {
        console.log(`❌ ${tokenName} Error:`, error.message)
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎯 Testnet Faucet URLs:')
    console.log('💧 Sonic Faucet: https://faucet.soniclabs.com/')
    console.log('💧 USDC/Other tokens: Check Sonic Discord for faucet links')
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error)
  }
}

export async function testContractConnection() {
  console.log('🔗 Testing payment contract connection...')
  
  try {
    const code = await publicClient.getBytecode({
      address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`
    })
    
    if (code && code !== '0x') {
      console.log('✅ Payment contract is deployed and accessible')
      return true
    } else {
      console.log('❌ Payment contract not found or not deployed')
      return false
    }
  } catch (error) {
    console.error('❌ Contract connection failed:', error)
    return false
  }
}

export async function testContractFunction(userAddress: string, prompt: string = "Test generation") {
  console.log('🧪 Testing contract function calls...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // First check SSStt token balance and allowance
    console.log('📊 Checking SSStt token status...')
    
    const sssttBalance = await publicClient.readContract({
      address: TESTNET_TOKENS.SSSTT as `0x${string}`,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ],
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`]
    })
    
    const sssttAllowance = await publicClient.readContract({
      address: TESTNET_TOKENS.SSSTT as `0x${string}`,
      abi: [
        {
          name: 'allowance',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
          ],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ],
      functionName: 'allowance',
      args: [userAddress as `0x${string}`, TESTNET_CONTRACTS.PAYMENT as `0x${string}`]
    })
    
    console.log('💰 SSStt Balance:', formatUnits(sssttBalance as bigint, 18))
    console.log('✅ SSStt Allowance:', formatUnits(sssttAllowance as bigint, 18))
    
    // Test if we can read contract functions first
    console.log('📖 Testing read functions...')
    
    // Test getUserStats
    try {
      const userStats = await publicClient.readContract({
        address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
        abi: [
          {
            name: 'getUserStats',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'user', type: 'address' }],
            outputs: [
              { name: 'generations', type: 'uint256' },
              { name: 'credits', type: 'uint256' }
            ]
          }
        ],
        functionName: 'getUserStats',
        args: [userAddress as `0x${string}`]
      })
      console.log('✅ getUserStats works:', userStats)
    } catch (error) {
      console.log('❌ getUserStats failed:', error.message)
    }

    // Test payWithSSStt simulation
    console.log('🎯 Testing payWithSSStt simulation...')
    try {
      const simulation = await publicClient.simulateContract({
        address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
        abi: [
          {
            name: 'payWithSSStt',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'prompt', type: 'string' },
              { name: 'generationType', type: 'string' }
            ],
            outputs: []
          }
        ],
        functionName: 'payWithSSStt',
        args: [prompt, 'image'],
        account: userAddress as `0x${string}`
      })
      console.log('✅ payWithSSStt simulation successful:', simulation)
      return true
    } catch (error) {
      console.log('❌ payWithSSStt simulation failed:', error.message)
      console.log('Full error details:', error)
      
      // Analyze the specific error
      if (error.message.includes('transferFrom')) {
        console.log('💡 Transfer issue detected - checking allowance requirement')
        console.log('💡 Contract expects pre-approved tokens via approve() first')
        
        if ((sssttAllowance as bigint) < parseUnits('1', 18)) {
          console.log('🚨 INSUFFICIENT ALLOWANCE! Need to approve tokens first')
          console.log('Required: 1 SSStt, Current allowance:', formatUnits(sssttAllowance as bigint, 18))
        }
      }
      
      if (error.message.includes('Simulation Not Supported')) {
        console.log('💡 Sonic testnet simulation limitation detected')
        console.log('💡 Try direct transaction execution instead of simulation')
      }
      
      return false
    }

  } catch (error) {
    console.error('❌ Contract function test failed:', error)
    return false
  }
}

export async function checkPaymentHistory(userAddress: string) {
  console.log('💳 Checking payment contract history...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // Check user stats (generations and credits)
    const userStats = await publicClient.readContract({
      address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
      abi: [
        {
          name: 'getUserStats',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'user', type: 'address' }],
          outputs: [
            { name: 'generations', type: 'uint256' },
            { name: 'credits', type: 'uint256' }
          ]
        }
      ],
      functionName: 'getUserStats',
      args: [userAddress as `0x${string}`]
    })
    
    console.log('👤 User Generation Stats:')
    console.log('  • Total Generations:', userStats[0].toString())
    console.log('  • Available Credits:', userStats[1].toString())
    
    // Check contract balances
    console.log('\n💰 Contract Token Balances:')
    
    for (const [tokenName, tokenAddress] of Object.entries(TESTNET_TOKENS)) {
      try {
        const balance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }]
            }
          ],
          functionName: 'balanceOf',
          args: [TESTNET_CONTRACTS.PAYMENT as `0x${string}`]
        })
        
        console.log(`  • ${tokenName} in contract:`, formatUnits(balance as bigint, 18))
      } catch (error) {
        console.log(`  • ${tokenName} balance check failed:`, error.message)
      }
    }
    
    // Get recent events (PaymentReceived, GenerationRequested)
    console.log('\n📊 Checking recent contract events...')
    
    try {
      // Get the latest block number
      const latestBlock = await publicClient.getBlockNumber()
      const fromBlock = latestBlock - BigInt(1000) // Last ~1000 blocks
      
      // Get PaymentReceived events
      const paymentEvents = await publicClient.getLogs({
        address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
        event: {
          type: 'event',
          name: 'PaymentReceived',
          inputs: [
            { name: 'payer', type: 'address', indexed: true },
            { name: 'token', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256' },
            { name: 'generationType', type: 'string' }
          ]
        },
        fromBlock,
        toBlock: 'latest'
      })
      
      console.log(`💳 Found ${paymentEvents.length} recent payment events`)
      paymentEvents.slice(-5).forEach((event, index) => {
        console.log(`  Payment ${index + 1}:`, {
          payer: event.args?.payer,
          token: event.args?.token,
          amount: event.args?.amount ? formatUnits(event.args.amount, 18) : 'unknown'
        })
      })
      
      // Get GenerationRequested events
      const generationEvents = await publicClient.getLogs({
        address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
        event: {
          type: 'event',
          name: 'GenerationRequested',
          inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'prompt', type: 'string' },
            { name: 'generationType', type: 'string' },
            { name: 'generationId', type: 'uint256' }
          ]
        },
        fromBlock,
        toBlock: 'latest'
      })
      
      console.log(`🎨 Found ${generationEvents.length} recent generation requests`)
      generationEvents.slice(-5).forEach((event, index) => {
        console.log(`  Generation ${index + 1}:`, {
          user: event.args?.user,
          generationId: event.args?.generationId?.toString(),
          type: event.args?.generationType
        })
      })
      
    } catch (error) {
      console.log('❌ Event querying failed:', error.message)
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    console.error('❌ Payment history check failed:', error)
  }
}

export async function testGenerationFlow(userAddress: string) {
  console.log('🔄 Testing complete generation flow...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // 1. Check if user has SSStt tokens
    const sssttBalance = await publicClient.readContract({
      address: TESTNET_TOKENS.SSSTT as `0x${string}`,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ],
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`]
    })
    
    console.log('💰 User SSStt Balance:', formatUnits(sssttBalance as bigint, 18))
    
    if ((sssttBalance as bigint) < parseUnits('1', 18)) {
      console.log('❌ Insufficient SSStt tokens for generation')
      console.log('💡 Get tokens from: https://faucet.soniclabs.com/')
      return
    }
    
    // 2. Check allowance
    const allowance = await publicClient.readContract({
      address: TESTNET_TOKENS.SSSTT as `0x${string}`,
      abi: [
        {
          name: 'allowance',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
          ],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ],
      functionName: 'allowance',
      args: [userAddress as `0x${string}`, TESTNET_CONTRACTS.PAYMENT as `0x${string}`]
    })
    
    console.log('✅ Current Allowance:', formatUnits(allowance as bigint, 18))
    
    if ((allowance as bigint) < parseUnits('1', 18)) {
      console.log('⚠️  Need to approve tokens first')
      console.log('💡 Call approve() on SSStt token contract with amount: 1000000000000000000 (1 SSStt)')
      console.log('💡 Spender address:', TESTNET_CONTRACTS.PAYMENT)
    } else {
      console.log('✅ Sufficient allowance available')
    }
    
    // 3. Test contract payment function
    console.log('\n🧪 Testing payWithSSStt call...')
    
    try {
      const simulation = await publicClient.simulateContract({
        address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
        abi: [
          {
            name: 'payWithSSStt',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'prompt', type: 'string' },
              { name: 'generationType', type: 'string' }
            ],
            outputs: []
          }
        ],
        functionName: 'payWithSSStt',
        args: ['Test diagnostic generation', 'image'],
        account: userAddress as `0x${string}`
      })
      
      console.log('✅ payWithSSStt simulation successful!')
      console.log('💡 Transaction should work when executed')
      
    } catch (error) {
      console.log('❌ payWithSSStt simulation failed:', error.message)
      
      if (error.message.includes('Simulation Not Supported')) {
        console.log('💡 Sonic testnet limitation - try direct execution')
      }
    }
    
  } catch (error) {
    console.error('❌ Generation flow test failed:', error)
  }
}

export async function checkPriceOracleIssue() {
  console.log('🔮 Checking Price Oracle Configuration...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // Check if oracle is active
    const isOracleActive = await publicClient.readContract({
      address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
      abi: [
        {
          name: 'isOracleActive',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'bool' }]
        }
      ],
      functionName: 'isOracleActive'
    })
    
    console.log('🔮 Oracle Active:', isOracleActive)
    
    // Get payment costs for different tokens
    const paymentCosts = await publicClient.readContract({
      address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
      abi: [
        {
          name: 'getPaymentCosts',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'generationType', type: 'string' }],
          outputs: [
            { name: 'sssttCost', type: 'uint256' },
            { name: 'coralCost', type: 'uint256' },
            { name: 'sCost', type: 'uint256' },
            { name: 'usdcCost', type: 'uint256' }
          ]
        }
      ],
      functionName: 'getPaymentCosts',
      args: ['image']
    })
    
    console.log('💰 Payment Costs for Image Generation:')
    console.log('  • SSStt Cost:', formatUnits(paymentCosts[0], 18))
    console.log('  • CORAL Cost:', formatUnits(paymentCosts[1], 18))
    console.log('  • S Token Cost:', formatUnits(paymentCosts[2], 18))
    console.log('  • USDC Cost:', formatUnits(paymentCosts[3], 6))
    
    // Check if we can get service pricing
    const servicePricing = await publicClient.readContract({
      address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
      abi: [
        {
          name: 'getServicePricing',
          type: 'function',
          stateMutability: 'pure',
          inputs: [],
          outputs: [
            { name: 'imageGenerationUSD', type: 'uint256' },
            { name: 'videoGenerationUSD', type: 'uint256' }
          ]
        }
      ],
      functionName: 'getServicePricing'
    })
    
    console.log('💵 USD Service Pricing:')
    console.log('  • Image Generation:', (Number(servicePricing[0]) / 1e6).toFixed(2), 'USD')
    console.log('  • Video Generation:', (Number(servicePricing[1]) / 1e6).toFixed(2), 'USD')
    
    if (isOracleActive) {
      console.log('⚠️  Oracle is active but may not work properly on testnet')
      console.log('💡 This could cause transaction simulation failures')
      console.log('💡 Consider deploying contract with oracle address = 0x0 for testnet')
    } else {
      console.log('✅ Oracle is inactive - using fallback pricing (good for testnet)')
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    console.error('❌ Price oracle check failed:', error.message)
    console.log('💡 This might indicate the oracle is causing contract call failures')
  }
}

export async function checkCurrentContract() {
  console.log('🔍 Checking current deployed contract type...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // Check if contract has oracle functions (oracle-based contract)
    try {
      const isOracleActive = await publicClient.readContract({
        address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
        abi: [
          {
            name: 'isOracleActive',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'isOracleActive'
      })
      console.log('🔮 This is an ORACLE-BASED contract (SonicPaymentTestnet.sol)')
      console.log('⚠️  Oracle active:', isOracleActive)
      console.log('💡 This explains the "Simulation Not Supported" errors!')
      return 'oracle-based'
    } catch (error) {
      // If oracle function doesn't exist, it might be the fixed-pricing contract
      console.log('🏗️  Contract does not have oracle functions')
    }
    
    // Check if it has fixed pricing constants (fixed-pricing contract)
    try {
      const sssttCost = await publicClient.readContract({
        address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
        abi: [
          {
            name: 'SSSTT_COST',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ],
        functionName: 'SSSTT_COST'
      })
      console.log('✅ This is a FIXED-PRICING contract (SonicPaymentTestnetWithNFT.sol)')
      console.log('💰 SSStt Cost:', formatUnits(sssttCost as bigint, 18))
      return 'fixed-pricing'
    } catch (error) {
      console.log('❌ Could not determine contract type:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Contract check failed:', error)
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  return 'unknown'
}

export async function verifyContractDeployment() {
  console.log('🏗️  Verifying Contract Deployment...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // Check if contract is deployed
    const code = await publicClient.getBytecode({
      address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`
    })
    
    if (!code || code === '0x') {
      console.log('❌ Contract not deployed at address:', TESTNET_CONTRACTS.PAYMENT)
      return false
    }
    
    console.log('✅ Contract is deployed')
    console.log('📍 Contract Address:', TESTNET_CONTRACTS.PAYMENT)
    
    // Check owner
    try {
      const owner = await publicClient.readContract({
        address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
        abi: [
          {
            name: 'owner',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'address' }]
          }
        ],
        functionName: 'owner'
      })
      console.log('👑 Contract Owner:', owner)
    } catch (error) {
      console.log('❌ Could not get contract owner:', error.message)
    }
    
    // Check supported tokens
    try {
      const supportedTokens = await publicClient.readContract({
        address: TESTNET_CONTRACTS.PAYMENT as `0x${string}`,
        abi: [
          {
            name: 'getSupportedTokens',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [
              { name: 'ssstt', type: 'address' },
              { name: 'coral', type: 'address' },
              { name: 'sToken', type: 'address' },
              { name: 'usdc', type: 'address' }
            ]
          }
        ],
        functionName: 'getSupportedTokens'
      })
      
      console.log('🪙 Supported Tokens:')
      console.log('  • SSStt:', supportedTokens[0])
      console.log('  • CORAL:', supportedTokens[1])
      console.log('  • S Token:', supportedTokens[2])
      console.log('  • USDC:', supportedTokens[3])
      
      // Verify token addresses match our config
      const addressesMatch = 
        supportedTokens[0].toLowerCase() === TESTNET_TOKENS.SSSTT.toLowerCase() &&
        supportedTokens[2].toLowerCase() === TESTNET_TOKENS.S_TOKEN.toLowerCase() &&
        supportedTokens[3].toLowerCase() === TESTNET_TOKENS.USDC.toLowerCase()
      
      if (addressesMatch) {
        console.log('✅ Token addresses match configuration')
      } else {
        console.log('⚠️  Token address mismatch detected!')
        console.log('Expected vs Contract:')
        console.log('SSStt:', TESTNET_TOKENS.SSSTT, 'vs', supportedTokens[0])
        console.log('S Token:', TESTNET_TOKENS.S_TOKEN, 'vs', supportedTokens[2])
        console.log('USDC:', TESTNET_TOKENS.USDC, 'vs', supportedTokens[3])
      }
      
    } catch (error) {
      console.log('❌ Could not get supported tokens:', error.message)
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return true
    
  } catch (error) {
    console.error('❌ Contract verification failed:', error)
    return false
  }
}