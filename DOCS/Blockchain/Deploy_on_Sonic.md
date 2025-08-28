# Build on Sonic

Sonic offers developers robust infrastructure with 400,000 transactions per second and sub-second finality, ensuring your apps are both fast and scalable.

With full EVM compatibility and support for Solidity and Vyper, Sonic seamlessly integrates with common developer tools such as Chainlink, Safe, Pyth, Alchemy, and more. Additionally, Sonic provides the incentives, such as [Fee Monetization](../funding/fee-monetization), necessary to innovate and thrive in the ecosystem.

Test your contracts on the Blaze testnet first (see [Getting Started](build-on-sonic/getting-started)), then deploy to the mainnet when ready. Dive in and explore how you can leverage Sonic's powerful features to bring your ideas to life.

{% hint style="info" %}
To meet other builders and receive support, join the [official Sonic builders group](https://t.me/SonicBuilders).
{% endhint %}



# Deploy Contracts

At the software level, deploying to Sonic is the same as deploying to any other EVM network.

The only difference is which network you connect to. Use [https://rpc.blaze.soniclabs.com](https://rpc.blaze.soniclabs.com) as the connection endpoint for the Blaze testnet or [https://rpc.soniclabs.com](https://rpc.soniclabs.com) for the mainnet.

For the Blaze testnet, you can use the [Sonic Blaze dashboard](https://testnet.soniclabs.com/account) to obtain an initial amount of S to execute transactions on the testnet.

Here are example configurations for Hardhat to deploy on the Sonic mainnet or Blaze testnet:

{% tabs %}
{% tab title="Sonic Mainnet" %}
```solidity
require("@nomicfoundation/hardhat-toolbox");

// Replace this private key with your Sonic account private key
const SONIC_PRIVATE_KEY = "YOUR SONIC TEST ACCOUNT PRIVATE KEY";

module.exports = {
  solidity: "0.8.26",
  networks: {
    sonic: {
      url: "https://rpc.soniclabs.com",
      accounts: [SONIC_PRIVATE_KEY]
    }
  }
};
```


{% endtab %}

{% tab title="Blaze Testnet" %}
```solidity
require("@nomicfoundation/hardhat-toolbox");

// Replace this private key with your Sonic account private key
const SONIC_PRIVATE_KEY = "YOUR SONIC TEST ACCOUNT PRIVATE KEY";

module.exports = {
  solidity: "0.8.26",
  networks: {
    sonic: {
      url: "https://rpc.blaze.soniclabs.com",
      accounts: [SONIC_PRIVATE_KEY]
    }
  }
};
```


{% endtab %}
{% endtabs %}

To deploy, execute `npx hardhat run scripts/deploy.js --network sonic`.&#x20;

{% hint style="info" %}
Please note that the **Sonic Blaze testnet** is a testing playground designed to showcase technology capabilities. The data stored on the network might eventually be deleted, with or without notice.
{% endhint %}


Main Net

require("@nomicfoundation/hardhat-toolbox");

// Replace this private key with your Sonic account private key
const SONIC_PRIVATE_KEY = "YOUR SONIC TEST ACCOUNT PRIVATE KEY";

module.exports = {
  solidity: "0.8.26",
  networks: {
    sonic: {
      url: "https://rpc.soniclabs.com",
      accounts: [SONIC_PRIVATE_KEY]
    }
  }
};


# Verify Contracts

Verifying your smart contract makes its source code publicly visible and auditable on the block explorer, creating transparency and trust. Here are the recommended methods to verify contracts on the [Sonic mainnet explorer](https://sonicscan.org/) and the [Sonic Blaze testnet explorer](https://testnet.sonicscan.org/).

— [Method 1: Hardhat Verification](#method-1.-hardhat-verification-recommended)\
— [Method 2: Programmatic Verification\
](#method-2-programmatic-verification)— [Method 3: Manual Verification](#method-3-manual-verification)\
— [Method 4: Flattened Source](#method-4-flattened-source)\
— [Troubleshooting](#troubleshooting)

## Method 1. Hardhat Verification (_Recommended_)

The most streamlined way to verify contracts is using Hardhat with hardhat-toolbox:

1. Install Hardhat toolbox:

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

2. Configure `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.26",
  networks: {
    sonic: {
      url: "https://rpc.soniclabs.com",
      chainId: 146,
      accounts: [SONIC_PRIVATE_KEY]
    },
    sonicTestnet: {
      url: "https://rpc.blaze.soniclabs.com",
      chainId: 57054,
      accounts: [SONIC_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      sonic: "YOUR_SONICSCAN_API_KEY",
      sonicTestnet: "YOUR_SONICSCAN_TESTNET_API_KEY" 
    },
    customChains: [
      {
        network: "sonic",
        chainId: 146,
        urls: {
          apiURL: "https://api.sonicscan.org/api",
          browserURL: "https://sonicscan.org"
        }
      },
      {
        network: "sonicTestnet",
        chainId: 57054,
        urls: {
          apiURL: "https://api-testnet.sonicscan.org/api",
          browserURL: "https://testnet.sonicscan.org"
        }
      }
    ]
  }
};
```

3. Store your SonicScan API key in a `.env` file:

```
API_KEY=your_sonicscan_api_key
```

4. Verify your contract:

```bash
# For mainnet
npx hardhat verify --network sonic DEPLOYED_CONTRACT_ADDRESS [CONSTRUCTOR_ARGUMENTS]

# For testnet
npx hardhat verify --network sonicTestnet DEPLOYED_CONTRACT_ADDRESS [CONSTRUCTOR_ARGUMENTS]
```

## Method 2: Programmatic Verification

For automated deployments, you can verify contracts programmatically in your deployment scripts:

```javascript
async function main() {
  // Deploy contract
  const Contract = await ethers.getContractFactory("YourContract");
  const contract = await Contract.deploy(constructorArg1, constructorArg2);
  await contract.waitForDeployment();
  
  console.log("Contract deployed to:", await contract.getAddress());
  
  // Wait for some block confirmations
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // Verify the contract
  await hre.run("verify:verify", {
    address: await contract.getAddress(),
    constructorArguments: [constructorArg1, constructorArg2]
  });
}
```

## Method 3: Manual Verification

If automated methods fail, you can verify manually through the explorer interface:

1. Go to the [Sonic explorer](https://sonicscan.org/) (or the [testnet explorer](https://testnet.sonicscan.org/))
2. Navigate to your contract address
3. Click the _Contract_ tab and _Verify & Publish_
4. Fill in the verification details:
   * Contract address
   * Compiler type (single file recommended)
   * Compiler version (must match deployment)
   * Open-source license
   * Optimization settings (if used during deployment)
5. If your contract has constructor arguments:
   * Generate ABI-encoded arguments at e.g. [HashEx](https://abi.hashex.org/)
   * Paste them in the Constructor Arguments field
6. Complete the captcha and submit

## Method 4: Flattened Source

For contracts with complex dependencies that fail standard verification:

1. Install Hardhat flattener:

```bash
npm install --save-dev hardhat-flattener
```

2. Flatten your contract:

```bash
npx hardhat flatten contracts/YourContract.sol > flattened.sol
```

3. Clean up the flattened file:
   * Keep only one SPDX license identifier
   * Keep only one pragma statement
   * Use this file for manual verification

## Troubleshooting

Common verification issues to check:

* Compiler version must match deployment exactly
* Optimization settings must match deployment
* Constructor arguments must be correctly ABI-encoded
* Library addresses must be provided if used
* Source code must match deployed bytecode exactly
* Flattened files should not have duplicate SPDX/pragma statements



# Tooling and Infra

Explore the tooling and infrastructure platforms currently available on Sonic below. This list is regularly updated as new projects integrate the Sonic chain.

***

<details>

<summary>Explorers</summary>

* [Arkham](https://intel.arkm.com/)
* [SonicScan](https://sonicscan.org/)

</details>

<details>

<summary>RPCs</summary>

*   [Sonic Labs](https://www.soniclabs.com/)

    * [**https://rpc.soniclabs.com**](https://rpc.soniclabs.com)
    * wss://rpc.soniclabs.com


*   [Ankr](https://www.ankr.com/)

    *   [https://rpc.ankr.com/sonic\_mainnet](https://rpc.ankr.com/sonic_mainnet)

        wss://[rpc.ankr.com/sonic\_mainnet](http://rpc.ankr.com/sonic_mainnet)


*   [Alchemy](https://www.alchemy.com/)

    * Sign up for a private RPC.


*   [dRPC](https://drpc.org/chainlist/sonic)

    * [https://sonic.drpc.org](https://sonic.drpc.org)\
      wss://sonic.drpc.org


* [thirdweb](https://thirdweb.com/sonic)
  * [https://146.rpc.thirdweb.com/${THIRDWEB\_API\_KEY}](https://146.rpc.thirdweb.com/$%7BTHIRDWEB_API_KEY%7D)

</details>

<details>

<summary>Subgraphs</summary>

*   [Alchemy](https://www.alchemy.com/subgraphs)

    * Sign up on the website (_free for Sonic users_).


*   [Sentio](https://docs.sentio.xyz/docs/supported-networks#sonic)


*   [The Graph](https://thegraph.com/)

    * [Follow the official guide](https://thegraph.com/docs/en/quick-start/).


* [SQD](https://www.sqd.dev/)
  * [https://v2.archive.subsquid.io/network/sonic-mainnet](https://v2.archive.subsquid.io/network/sonic-mainnet)

</details>

<details>

<summary>Oracles</summary>

*   [API3](https://market.api3.org/sonic)

    * 0x709944a48cAf83535e43471680fDA4905FB3920a


*   [Band Protocol](https://www.bandprotocol.com/standard-dataset)

    * 0x506085050Ea5494Fe4b89Dd5BEa659F506F470Cc


*   [Chainlink (Data Streams)](https://chain.link/data-streams)


*   [Chainlink (Data Feeds)](https://chain.link/data-feeds)


*   [Pyth Network (Price Feed](https://www.pyth.network/price-feeds)[)](https://www.pyth.network/price-feeds)

    * 0x2880aB155794e7179c9eE2e38200202908C17B43


*   [RedStone](https://app.redstone.finance/app/feeds/?page=1\&sortBy=popularity\&sortDesc=false\&perPage=32\&networks=146)


* [Stork Network](https://www.stork.network/)
  * 0xacC0a0cF13571d30B4b8637996F5D6D774d4fd62

</details>

<details>

<summary>Interoperability</summary>

*   [LayerZero](https://layerzero.network/)

    * 0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7



- [Reactive Network](https://reactive.network/)

</details>

<details>

<summary>Development Tools</summary>

* [Sentio Explorer](https://app.sentio.xyz/explorer)
* [Tenderly](https://tenderly.co/)
* [thirdweb](https://thirdweb.com/sonic)

</details>

<details>

<summary>Automation/VRF</summary>

*   [Gelato](https://www.gelato.network/web3-functions)

    * [Follow the official documentation](https://docs.gelato.network/web3-services/web3-functions).


* [Pyth Network (Entropy)](https://www.pyth.network/entropy)
  * 0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320

</details>



# Tooling and Infra

Explore the tooling and infrastructure platforms currently available on Sonic below. This list is regularly updated as new projects integrate the Sonic chain.

***

<details>

<summary>Explorers</summary>

* [Arkham](https://intel.arkm.com/)
* [SonicScan](https://sonicscan.org/)

</details>

<details>

<summary>RPCs</summary>

*   [Sonic Labs](https://www.soniclabs.com/)

    * [**https://rpc.soniclabs.com**](https://rpc.soniclabs.com)
    * wss://rpc.soniclabs.com


*   [Ankr](https://www.ankr.com/)

    *   [https://rpc.ankr.com/sonic\_mainnet](https://rpc.ankr.com/sonic_mainnet)

        wss://[rpc.ankr.com/sonic\_mainnet](http://rpc.ankr.com/sonic_mainnet)


*   [Alchemy](https://www.alchemy.com/)

    * Sign up for a private RPC.


*   [dRPC](https://drpc.org/chainlist/sonic)

    * [https://sonic.drpc.org](https://sonic.drpc.org)\
      wss://sonic.drpc.org


* [thirdweb](https://thirdweb.com/sonic)
  * [https://146.rpc.thirdweb.com/${THIRDWEB\_API\_KEY}](https://146.rpc.thirdweb.com/$%7BTHIRDWEB_API_KEY%7D)

</details>

<details>

<summary>Subgraphs</summary>

*   [Alchemy](https://www.alchemy.com/subgraphs)

    * Sign up on the website (_free for Sonic users_).


*   [Sentio](https://docs.sentio.xyz/docs/supported-networks#sonic)


*   [The Graph](https://thegraph.com/)

    * [Follow the official guide](https://thegraph.com/docs/en/quick-start/).


* [SQD](https://www.sqd.dev/)
  * [https://v2.archive.subsquid.io/network/sonic-mainnet](https://v2.archive.subsquid.io/network/sonic-mainnet)

</details>

<details>

<summary>Oracles</summary>

*   [API3](https://market.api3.org/sonic)

    * 0x709944a48cAf83535e43471680fDA4905FB3920a


*   [Band Protocol](https://www.bandprotocol.com/standard-dataset)

    * 0x506085050Ea5494Fe4b89Dd5BEa659F506F470Cc


*   [Chainlink (Data Streams)](https://chain.link/data-streams)


*   [Chainlink (Data Feeds)](https://chain.link/data-feeds)


*   [Pyth Network (Price Feed](https://www.pyth.network/price-feeds)[)](https://www.pyth.network/price-feeds)

    * 0x2880aB155794e7179c9eE2e38200202908C17B43


*   [RedStone](https://app.redstone.finance/app/feeds/?page=1\&sortBy=popularity\&sortDesc=false\&perPage=32\&networks=146)


* [Stork Network](https://www.stork.network/)
  * 0xacC0a0cF13571d30B4b8637996F5D6D774d4fd62

</details>

<details>

<summary>Interoperability</summary>

*   [LayerZero](https://layerzero.network/)

    * 0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7



- [Reactive Network](https://reactive.network/)

</details>

<details>

<summary>Development Tools</summary>

* [Sentio Explorer](https://app.sentio.xyz/explorer)
* [Tenderly](https://tenderly.co/)
* [thirdweb](https://thirdweb.com/sonic)

</details>

<details>

<summary>Automation/VRF</summary>

*   [Gelato](https://www.gelato.network/web3-functions)

    * [Follow the official documentation](https://docs.gelato.network/web3-services/web3-functions).


* [Pyth Network (Entropy)](https://www.pyth.network/entropy)
  * 0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320

</details>



# Tooling and Infra

Explore the tooling and infrastructure platforms currently available on Sonic below. This list is regularly updated as new projects integrate the Sonic chain.

***

<details>

<summary>Explorers</summary>

* [Arkham](https://intel.arkm.com/)
* [SonicScan](https://sonicscan.org/)

</details>

<details>

<summary>RPCs</summary>

*   [Sonic Labs](https://www.soniclabs.com/)

    * [**https://rpc.soniclabs.com**](https://rpc.soniclabs.com)
    * wss://rpc.soniclabs.com


*   [Ankr](https://www.ankr.com/)

    *   [https://rpc.ankr.com/sonic\_mainnet](https://rpc.ankr.com/sonic_mainnet)

        wss://[rpc.ankr.com/sonic\_mainnet](http://rpc.ankr.com/sonic_mainnet)


*   [Alchemy](https://www.alchemy.com/)

    * Sign up for a private RPC.


*   [dRPC](https://drpc.org/chainlist/sonic)

    * [https://sonic.drpc.org](https://sonic.drpc.org)\
      wss://sonic.drpc.org


* [thirdweb](https://thirdweb.com/sonic)
  * [https://146.rpc.thirdweb.com/${THIRDWEB\_API\_KEY}](https://146.rpc.thirdweb.com/$%7BTHIRDWEB_API_KEY%7D)

</details>

<details>

<summary>Subgraphs</summary>

*   [Alchemy](https://www.alchemy.com/subgraphs)

    * Sign up on the website (_free for Sonic users_).


*   [Sentio](https://docs.sentio.xyz/docs/supported-networks#sonic)


*   [The Graph](https://thegraph.com/)

    * [Follow the official guide](https://thegraph.com/docs/en/quick-start/).


* [SQD](https://www.sqd.dev/)
  * [https://v2.archive.subsquid.io/network/sonic-mainnet](https://v2.archive.subsquid.io/network/sonic-mainnet)

</details>

<details>

<summary>Oracles</summary>

*   [API3](https://market.api3.org/sonic)

    * 0x709944a48cAf83535e43471680fDA4905FB3920a


*   [Band Protocol](https://www.bandprotocol.com/standard-dataset)

    * 0x506085050Ea5494Fe4b89Dd5BEa659F506F470Cc


*   [Chainlink (Data Streams)](https://chain.link/data-streams)


*   [Chainlink (Data Feeds)](https://chain.link/data-feeds)


*   [Pyth Network (Price Feed](https://www.pyth.network/price-feeds)[)](https://www.pyth.network/price-feeds)

    * 0x2880aB155794e7179c9eE2e38200202908C17B43


*   [RedStone](https://app.redstone.finance/app/feeds/?page=1\&sortBy=popularity\&sortDesc=false\&perPage=32\&networks=146)


* [Stork Network](https://www.stork.network/)
  * 0xacC0a0cF13571d30B4b8637996F5D6D774d4fd62

</details>

<details>

<summary>Interoperability</summary>

*   [LayerZero](https://layerzero.network/)

    * 0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7



- [Reactive Network](https://reactive.network/)

</details>

<details>

<summary>Development Tools</summary>

* [Sentio Explorer](https://app.sentio.xyz/explorer)
* [Tenderly](https://tenderly.co/)
* [thirdweb](https://thirdweb.com/sonic)

</details>

<details>

<summary>Automation/VRF</summary>

*   [Gelato](https://www.gelato.network/web3-functions)

    * [Follow the official documentation](https://docs.gelato.network/web3-services/web3-functions).


* [Pyth Network (Entropy)](https://www.pyth.network/entropy)
  * 0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320

</details>


# Contract Addresses

Below is a list of all important contract addresses relevant to the Sonic network.

{% tabs %}
{% tab title="Sonic Mainnet" %}
**Tokens:**

* [Wrapped S (wS)](https://sonicscan.org/address/0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38)
  * 0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38
* [Wrapped Ether (WETH)](https://sonicscan.org/address/0x50c42dEAcD8Fc9773493ED674b675bE577f2634b)
  * 0x50c42dEAcD8Fc9773493ED674b675bE577f2634b
* [USDC](https://sonicscan.org/address/0x29219dd400f2Bf60E5a23d13Be72B486D4038894)
  * 0x29219dd400f2Bf60E5a23d13Be72B486D4038894
* [EURC (Bridged)](https://sonicscan.org/address/0xe715cba7b5ccb33790cebff1436809d36cb17e57)
  * 0xe715cba7b5ccb33790cebff1436809d36cb17e57
* [USDT (Bridged)](https://sonicscan.org/token/0x6047828dc181963ba44974801ff68e538da5eaf9)
  * 0x6047828dc181963ba44974801ff68e538da5eaf9

#### Core Contracts:

* [SFC](https://sonicscan.org/address/0xFC00FACE00000000000000000000000000000000)
  * 0xFC00FACE00000000000000000000000000000000
* [Multicall3](https://sonicscan.org/address/0xcA11bde05977b3631167028862bE2a173976CA11)
  * 0xcA11bde05977b3631167028862bE2a173976CA11
* [FTM to S Upgrade Portal (Opera)](https://ftmscan.com/address/0x3561607590e28e0848ba3B67074C676D6D1C9953)
  * 0x3561607590e28e0848ba3B67074C676D6D1C9953
* [FTM to S Upgrade Portal (Sonic)](https://sonicscan.org/address/0x3561607590e28e0848ba3B67074C676D6D1C9953)
  * 0x3561607590e28e0848ba3B67074C676D6D1C9953

#### Gateway Infrastructure (on Sonic):

* [MPTProofVerifier](https://sonicscan.org/address/0xD2f1e904dAf7446686F8057b7dfeb068c75D29A9)
  * 0xD2f1e904dAf7446686F8057b7dfeb068c75D29A9
* [StateOracle](https://sonicscan.org/address/0x836664B0c0CB29B7877bCcF94159CC996528F2C3)
  * 0x836664B0c0CB29B7877bCcF94159CC996528F2C3
* [ValidatorsRegistry](https://sonicscan.org/address/0x12727D4169a42A9b5E3ECB11A6d2c95553d3f447)
  * 0x12727D4169a42A9b5E3ECB11A6d2c95553d3f447
* [MessageBus](https://sonicscan.org/address/0xB5B371B75f9850dDD6CCB6C436DB54972a925308)
  * 0xB5B371B75f9850dDD6CCB6C436DB54972a925308
* [TokenPairs](https://sonicscan.org/address/0x134E4c207aD5A13549DE1eBF8D43c1f49b00ba94)
  * 0x134E4c207aD5A13549DE1eBF8D43c1f49b00ba94
  * [Implementation](https://sonicscan.org/address/0xE34e6851a4a3763e1d27aa7ac5980d2D33C2d315): 0xE34e6851a4a3763e1d27aa7ac5980d2D33C2d315
* [Bridge](https://sonicscan.org/address/0x9Ef7629F9B930168b76283AdD7120777b3c895b3)
  * 0x9Ef7629F9B930168b76283AdD7120777b3c895b3
  * [Implementation](https://sonicscan.org/address/0x0B3fe0c10C050270a9bc34271987989B6CF2107C): 0x0B3fe0c10C050270a9bc34271987989B6CF2107C
* [UpdateManager](https://sonicscan.org/address/0x1D3c99DA3CEF5C26f02a86dC7D685efa40176bb7)
  * 0x1D3c99DA3CEF5C26f02a86dC7D685efa40176bb7
  * [Implementation](https://sonicscan.org/address/0x1071405A4736535C545580064039A235827ee6D4): 0x1071405A4736535C545580064039A235827ee6D4

#### Gateway Infrastructure (on Ethereum):

* [MPTProofVerifier](https://etherscan.io/address/0x921B147a90Ef738BBb7c2c89D88ea9d8Af3e9306)
  * 0x921B147a90Ef738BBb7c2c89D88ea9d8Af3e9306
* [StateOracle](https://etherscan.io/address/0xB7e8CC3F5FeA12443136f0cc13D81F109B2dEd7f)
  * 0xB7e8CC3F5FeA12443136f0cc13D81F109B2dEd7f
* [ValidatorsRegistry](https://etherscan.io/address/0x72965045A6691E5A74299D1e878f303264D4D910)
  * 0x72965045A6691E5A74299D1e878f303264D4D910
* [TokenPairs](https://etherscan.io/address/0xf2b1510c2709072C88C5b14db90Ec3b6297193e4)
  * 0xf2b1510c2709072C88C5b14db90Ec3b6297193e4
  * [Implementation](https://etherscan.io/address/0x0c40Ae1c82401EA741953D3f026ADc07BE9e7943): 0x0c40Ae1c82401EA741953D3f026ADc07BE9e7943
* [TokenDeposit](https://etherscan.io/address/0xa1E2481a9CD0Cb0447EeB1cbc26F1b3fff3bec20)
  * 0xa1E2481a9CD0Cb0447EeB1cbc26F1b3fff3bec20
  * [Implementation](https://etherscan.io/address/0x4cbd824685F1E21B119F230B54d65C5a7D2a5330): 0x4cbd824685F1E21B119F230B54d65C5a7D2a5330
* [DirectExitAdministrator](https://etherscan.io/address/0x7390251Bf35AA7eA7C196fc4750bd5d6c5918329)
  * 0x7390251Bf35AA7eA7C196fc4750bd5d6c5918329
* [UpdateManager](https://etherscan.io/address/0xB0bECf0fBfE431D42bA0FbD8dFBFbB0DCFd62Da4)
  * 0xB0bECf0fBfE431D42bA0FbD8dFBFbB0DCFd62Da4
  * [Implementation](https://etherscan.io/address/0x13bd43A6BE5795D4A4E3Efc4baC21Cd36Ae9e68A): 0x13bd43A6BE5795D4A4E3Efc4baC21Cd36Ae9e68A
{% endtab %}

{% tab title="Blaze Testnet" %}
#### Tokens:

* [Wrapped S (wS)](https://testnet.sonicscan.org/address/0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38)
  * 0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38
* [USDC](https://testnet.sonicscan.org/token/0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6)
  * 0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6

#### Contracts:

* [Multicall3](https://testnet.sonicscan.org/address/0xcA11bde05977b3631167028862bE2a173976CA11)
  * 0xcA11bde05977b3631167028862bE2a173976CA11
{% endtab %}
{% endtabs %}



Network paramters

# Network Parameters

```
{
  "Name": "sonic",
  "NetworkID": 146,
  "Dag": {
    "MaxParents": 12,
    "MaxFreeParents": 6,
    "MaxExtraData": 128
  },
  "Emitter": {
    "Interval": 100000000,
    "StallThreshold": 30000000000,
    "StalledInterval": 60000000000
  },
  "Epochs": {
    "MaxEpochGas": 15000000000,
    "MaxEpochDuration": 600000000000
  },
  "Blocks": {
    "MaxBlockGas": 1000000000,
    "MaxEmptyBlockSkipPeriod": 3000000000
  },
  "Economy": {
    "BlockMissedSlack": 50,
    "Gas": {
      "MaxEventGas": 100000000,
      "EventGas": 28000,
      "ParentGas": 2400,
      "ExtraDataGas": 25,
      "BlockVotesBaseGas": 1024,
      "BlockVoteGas": 512,
      "EpochVoteGas": 1536,
      "MisbehaviourProofGas": 71536
    },
    "MinGasPrice": 0,
    "MinBaseFee": 1000000000,
    "ShortGasPower": {
      "AllocPerSec": 2000000000,
      "MaxAllocPeriod": 5000000000,
      "StartupAllocPeriod": 1000000000,
      "MinStartupGas": 560000
    },
    "LongGasPower": {
      "AllocPerSec": 1000000000,
      "MaxAllocPeriod": 5000000000,
      "StartupAllocPeriod": 1000000000,
      "MinStartupGas": 560000
    }
  },
  "Upgrades": {
    "Berlin": true,
    "London": true,
    "Llr": false,
    "Sonic": true
  }
}
```


# integrating Staking

# Network Parameters

```
{
  "Name": "sonic",
  "NetworkID": 146,
  "Dag": {
    "MaxParents": 12,
    "MaxFreeParents": 6,
    "MaxExtraData": 128
  },
  "Emitter": {
    "Interval": 100000000,
    "StallThreshold": 30000000000,
    "StalledInterval": 60000000000
  },
  "Epochs": {
    "MaxEpochGas": 15000000000,
    "MaxEpochDuration": 600000000000
  },
  "Blocks": {
    "MaxBlockGas": 1000000000,
    "MaxEmptyBlockSkipPeriod": 3000000000
  },
  "Economy": {
    "BlockMissedSlack": 50,
    "Gas": {
      "MaxEventGas": 100000000,
      "EventGas": 28000,
      "ParentGas": 2400,
      "ExtraDataGas": 25,
      "BlockVotesBaseGas": 1024,
      "BlockVoteGas": 512,
      "EpochVoteGas": 1536,
      "MisbehaviourProofGas": 71536
    },
    "MinGasPrice": 0,
    "MinBaseFee": 1000000000,
    "ShortGasPower": {
      "AllocPerSec": 2000000000,
      "MaxAllocPeriod": 5000000000,
      "StartupAllocPeriod": 1000000000,
      "MinStartupGas": 560000
    },
    "LongGasPower": {
      "AllocPerSec": 1000000000,
      "MaxAllocPeriod": 5000000000,
      "StartupAllocPeriod": 1000000000,
      "MinStartupGas": 560000
    }
  },
  "Upgrades": {
    "Berlin": true,
    "London": true,
    "Llr": false,
    "Sonic": true
  }
}
```


# Programmatic Gateway

---
description: >-
  This page explains how to use the Sonic Gateway in your application or script
  to transfer ERC-20 assets from Ethereum to Sonic and back.
---

# Programmatic Gateway

## Sonic Bridge: Programmatic Usage Guide

### Contract Addresses

```javascript
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
```

### Setup

```javascript
// Network RPC endpoints
const ETHEREUM_RPC = "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY";
const SONIC_RPC = "https://rpc.soniclabs.com";

// Initialize providers
const ethProvider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC);
const sonicProvider = new ethers.providers.JsonRpcProvider(SONIC_RPC);

// Initialize signer with your private key
const PRIVATE_KEY = "your-private-key";
const ethSigner = new ethers.Wallet(PRIVATE_KEY, ethProvider);
const sonicSigner = new ethers.Wallet(PRIVATE_KEY, sonicProvider);
```

### Bridge Operations

#### 1. Ethereum to Sonic Transfer

```javascript
async function bridgeToSonic(tokenAddress, amount) {
    // 1. Check if token is supported
    const tokenPairs = new ethers.Contract(ETH_CONTRACTS.TOKEN_PAIRS, TOKEN_PAIRS_ABI, ethProvider);
    const mintedToken = await tokenPairs.originalToMinted(tokenAddress);
    if (mintedToken === ethers.constants.AddressZero) {
        throw new Error("Token not supported");
    }

    // 2. Approve token spending
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, ethSigner);
    const approveTx = await token.approve(ETH_CONTRACTS.TOKEN_DEPOSIT, amount);
    await approveTx.wait();

    // 3. Deposit tokens
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
```

#### 2. Claim Tokens on Sonic

```javascript
async function waitForStateUpdate(depositBlockNumber) {
    const stateOracle = new ethers.Contract(SONIC_CONTRACTS.STATE_ORACLE, STATE_ORACLE_ABI, sonicProvider);
    
    while (true) {
        const currentBlockNum = await stateOracle.lastBlockNum();
        if (currentBlockNum >= depositBlockNumber) {
            return currentBlockNum;
        }
        await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
    }
}

async function generateProof(depositId, blockNum) {
    // Generate storage slot for deposit
    const storageSlot = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8'], [depositId, 7])
    );
    
    // Get proof from Ethereum node
    const proof = await ethProvider.send("eth_getProof", [
        ETH_CONTRACTS.TOKEN_DEPOSIT,
        [storageSlot],
        ethers.utils.hexValue(blockNum) // important to use current stateOracle.lastBlockNum
    ]);
    
    // Encode proof in required format
    return ethers.utils.RLP.encode([
        ethers.utils.RLP.encode(proof.accountProof),
        ethers.utils.RLP.encode(proof.storageProof[0].proof)
    ]);
}

async function claimOnSonic(depositBlockNumber, depositId, tokenAddress, amount) {
    // 1. Wait for state oracle update
    console.log("Waiting for state oracle update to block ", depositBlockNumber);
    const blockNum = await waitForStateUpdate(depositBlockNumber);
    
    // 2. Generate proof
    console.log("Generating proof...");
    const proof = await generateProof(depositId, blockNum);
    
    // 3. Claim tokens with proof
    console.log("Claiming tokens...");
    const bridge = new ethers.Contract(SONIC_CONTRACTS.BRIDGE, BRIDGE_ABI, sonicSigner);
    const tx = await bridge.claim(depositId, tokenAddress, amount, proof);
    const receipt = await tx.wait();

    return receipt.transactionHash;
}
```

#### 3. Sonic to Ethereum Transfer

```javascript
async function bridgeToEthereum(tokenAddress, amount) {
    // 1. Check if token is supported
    const tokenPairs = new ethers.Contract(SONIC_CONTRACTS.TOKEN_PAIRS, TOKEN_PAIRS_ABI, sonicProvider);
    const originalToken = await tokenPairs.mintedToOriginal(tokenAddress);
    if (originalToken === ethers.constants.AddressZero) {
        throw new Error("Token not supported");
    }
    
    // 2. Approve token spending
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, sonicSigner);
    const approveTx = await token.approve(SONIC_CONTRACTS.BRIDGE, amount);
    console.log("waiting... ", approveTx.hash);
    await approveTx.wait();

    // 3. Initiate withdrawal
    const bridge = new ethers.Contract(SONIC_CONTRACTS.BRIDGE, BRIDGE_ABI, sonicSigner);
    const tx = await bridge.withdraw(Date.now(), originalToken, amount);
    const receipt = await tx.wait();

    return {
        transactionHash: receipt.transactionHash,
        originalToken,
        blockNumber: receipt.blockNumber,
        withdrawalId: receipt.events.find(e => e.event === 'Withdrawal').args.id
    };
}
```

#### 4. Claim Tokens on Ethereum

```javascript
async function waitForEthStateUpdate(withdrawalBlockNumber) {
    const stateOracle = new ethers.Contract(ETH_CONTRACTS.STATE_ORACLE, STATE_ORACLE_ABI, ethProvider);
    
    while (true) {
        const currentBlockNum = await stateOracle.lastBlockNum();
        if (currentBlockNum >= withdrawalBlockNumber) {
            return currentBlockNum;
        }
        await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
    }
}

async function generateWithdrawalProof(withdrawalId, blockNum) {
    // Generate storage slot for withdrawal
    const storageSlot = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8'], [withdrawalId, 1])
    );
    
    // Get proof from Sonic node
    const proof = await sonicProvider.send("eth_getProof", [
        SONIC_CONTRACTS.BRIDGE,
        [storageSlot],
        ethers.utils.hexValue(blockNum) // important to use current stateOracle.lastBlockNum
    ]);
    
    // Encode proof in required format
    return ethers.utils.RLP.encode([
        ethers.utils.RLP.encode(proof.accountProof),
        ethers.utils.RLP.encode(proof.storageProof[0].proof)
    ]);
}

async function claimOnEthereum(withdrawalBlockNumber, withdrawalId, tokenAddress, amount) {
    // 1. Wait for state oracle update
    console.log("Waiting for state oracle update to block ", withdrawalBlockNumber);
    const blockNum = await waitForEthStateUpdate(withdrawalBlockNumber);
    
    // 2. Generate proof
    console.log("Generating proof...");
    const proof = await generateWithdrawalProof(withdrawalId, blockNum);
    
    // 3. Claim tokens with proof
    console.log("Claim tokens with proof...");
    const deposit = new ethers.Contract(ETH_CONTRACTS.TOKEN_DEPOSIT, TOKEN_DEPOSIT_ABI, ethSigner);
    const tx = await deposit.claim(withdrawalId, tokenAddress, amount, proof);
    const receipt = await tx.wait();

    return receipt.transactionHash;
}
```

### Complete Example

```javascript
async function bridgeUSDC() {
    try {
        // USDC details
        const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        const amount = ethers.utils.parseUnits("100", 6); // USDC has 6 decimals

        // 1. Bridge USDC to Sonic
        console.log("Initiating bridge to Sonic...");
        const deposit = await bridgeToSonic(USDC_ADDRESS, amount);
        console.log(`Deposit successful: ${deposit.transactionHash}`);

        // 2. Claim USDC on Sonic
        console.log("Waiting for state update and claiming on Sonic...");
        const claimTx = await claimOnSonic(deposit.blockNumber, deposit.depositId, USDC_ADDRESS, amount);
        console.log(`Claim successful: ${claimTx}`);

        // Later: Bridge back to Ethereum
        console.log("Initiating bridge back to Ethereum...");
        const withdrawal = await bridgeToEthereum(deposit.mintedToken, amount);
        console.log(`Withdrawal initiated: ${withdrawal.transactionHash}`);

        // Claim on Ethereum
        console.log("Waiting for state update and claiming on Ethereum...");
        const finalClaim = await claimOnEthereum(
            withdrawal.blockNumber,
            withdrawal.withdrawalId,
            withdrawal.originalToken,
            amount
        );
        console.log(`Final claim successful: ${finalClaim}`);
    } catch (error) {
        console.error("Bridge operation failed:", error.message);
        throw error;
    }
}
```

### Required ABIs

```javascript
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

### Important Notes

1. **State Updates**
   * Ethereum → Sonic: Monitor StateOracle.lastBlockNum until it's >= deposit block
   * Sonic → Ethereum: Monitor StateOracle.lastBlockNum until it's >= withdrawal block
2. **Proofs**
   * Required for all claim operations
   * Generated using eth\_getProof RPC call with correct storage slots
   * Must be RLP encoded in format: `RLP.encode([RLP.encode(accountProof), RLP.encode(storageProof)])`
   * Storage slots are calculated using:
     * Deposits: `keccak256(abi.encode(depositId, uint8(7)))`
     * Withdrawals: `keccak256(abi.encode(withdrawalId, uint8(1)))`
3. **Gas Fees**
   * Keep enough ETH/S for gas on both networks
   * Claim operations typically cost more gas due to proof verification
4. **Security**
   * Never share private keys
   * Always verify contract addresses
   * Test with small amounts first
   * Use the same private key for both networks
5. **Monitoring**
   * Monitor transaction status on both networks
   * Keep transaction hashes for reference
   * Verify successful claims before proceeding
   * Monitor StateOracle updates for claim timing



# Gas Pricing

---
description: >-
  This page explains how to use the Sonic Gateway in your application or script
  to transfer ERC-20 assets from Ethereum to Sonic and back.
---

# Programmatic Gateway

## Sonic Bridge: Programmatic Usage Guide

### Contract Addresses

```javascript
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
```

### Setup

```javascript
// Network RPC endpoints
const ETHEREUM_RPC = "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY";
const SONIC_RPC = "https://rpc.soniclabs.com";

// Initialize providers
const ethProvider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC);
const sonicProvider = new ethers.providers.JsonRpcProvider(SONIC_RPC);

// Initialize signer with your private key
const PRIVATE_KEY = "your-private-key";
const ethSigner = new ethers.Wallet(PRIVATE_KEY, ethProvider);
const sonicSigner = new ethers.Wallet(PRIVATE_KEY, sonicProvider);
```

### Bridge Operations

#### 1. Ethereum to Sonic Transfer

```javascript
async function bridgeToSonic(tokenAddress, amount) {
    // 1. Check if token is supported
    const tokenPairs = new ethers.Contract(ETH_CONTRACTS.TOKEN_PAIRS, TOKEN_PAIRS_ABI, ethProvider);
    const mintedToken = await tokenPairs.originalToMinted(tokenAddress);
    if (mintedToken === ethers.constants.AddressZero) {
        throw new Error("Token not supported");
    }

    // 2. Approve token spending
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, ethSigner);
    const approveTx = await token.approve(ETH_CONTRACTS.TOKEN_DEPOSIT, amount);
    await approveTx.wait();

    // 3. Deposit tokens
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
```

#### 2. Claim Tokens on Sonic

```javascript
async function waitForStateUpdate(depositBlockNumber) {
    const stateOracle = new ethers.Contract(SONIC_CONTRACTS.STATE_ORACLE, STATE_ORACLE_ABI, sonicProvider);
    
    while (true) {
        const currentBlockNum = await stateOracle.lastBlockNum();
        if (currentBlockNum >= depositBlockNumber) {
            return currentBlockNum;
        }
        await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
    }
}

async function generateProof(depositId, blockNum) {
    // Generate storage slot for deposit
    const storageSlot = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8'], [depositId, 7])
    );
    
    // Get proof from Ethereum node
    const proof = await ethProvider.send("eth_getProof", [
        ETH_CONTRACTS.TOKEN_DEPOSIT,
        [storageSlot],
        ethers.utils.hexValue(blockNum) // important to use current stateOracle.lastBlockNum
    ]);
    
    // Encode proof in required format
    return ethers.utils.RLP.encode([
        ethers.utils.RLP.encode(proof.accountProof),
        ethers.utils.RLP.encode(proof.storageProof[0].proof)
    ]);
}

async function claimOnSonic(depositBlockNumber, depositId, tokenAddress, amount) {
    // 1. Wait for state oracle update
    console.log("Waiting for state oracle update to block ", depositBlockNumber);
    const blockNum = await waitForStateUpdate(depositBlockNumber);
    
    // 2. Generate proof
    console.log("Generating proof...");
    const proof = await generateProof(depositId, blockNum);
    
    // 3. Claim tokens with proof
    console.log("Claiming tokens...");
    const bridge = new ethers.Contract(SONIC_CONTRACTS.BRIDGE, BRIDGE_ABI, sonicSigner);
    const tx = await bridge.claim(depositId, tokenAddress, amount, proof);
    const receipt = await tx.wait();

    return receipt.transactionHash;
}
```

#### 3. Sonic to Ethereum Transfer

```javascript
async function bridgeToEthereum(tokenAddress, amount) {
    // 1. Check if token is supported
    const tokenPairs = new ethers.Contract(SONIC_CONTRACTS.TOKEN_PAIRS, TOKEN_PAIRS_ABI, sonicProvider);
    const originalToken = await tokenPairs.mintedToOriginal(tokenAddress);
    if (originalToken === ethers.constants.AddressZero) {
        throw new Error("Token not supported");
    }
    
    // 2. Approve token spending
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, sonicSigner);
    const approveTx = await token.approve(SONIC_CONTRACTS.BRIDGE, amount);
    console.log("waiting... ", approveTx.hash);
    await approveTx.wait();

    // 3. Initiate withdrawal
    const bridge = new ethers.Contract(SONIC_CONTRACTS.BRIDGE, BRIDGE_ABI, sonicSigner);
    const tx = await bridge.withdraw(Date.now(), originalToken, amount);
    const receipt = await tx.wait();

    return {
        transactionHash: receipt.transactionHash,
        originalToken,
        blockNumber: receipt.blockNumber,
        withdrawalId: receipt.events.find(e => e.event === 'Withdrawal').args.id
    };
}
```

#### 4. Claim Tokens on Ethereum

```javascript
async function waitForEthStateUpdate(withdrawalBlockNumber) {
    const stateOracle = new ethers.Contract(ETH_CONTRACTS.STATE_ORACLE, STATE_ORACLE_ABI, ethProvider);
    
    while (true) {
        const currentBlockNum = await stateOracle.lastBlockNum();
        if (currentBlockNum >= withdrawalBlockNumber) {
            return currentBlockNum;
        }
        await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
    }
}

async function generateWithdrawalProof(withdrawalId, blockNum) {
    // Generate storage slot for withdrawal
    const storageSlot = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8'], [withdrawalId, 1])
    );
    
    // Get proof from Sonic node
    const proof = await sonicProvider.send("eth_getProof", [
        SONIC_CONTRACTS.BRIDGE,
        [storageSlot],
        ethers.utils.hexValue(blockNum) // important to use current stateOracle.lastBlockNum
    ]);
    
    // Encode proof in required format
    return ethers.utils.RLP.encode([
        ethers.utils.RLP.encode(proof.accountProof),
        ethers.utils.RLP.encode(proof.storageProof[0].proof)
    ]);
}

async function claimOnEthereum(withdrawalBlockNumber, withdrawalId, tokenAddress, amount) {
    // 1. Wait for state oracle update
    console.log("Waiting for state oracle update to block ", withdrawalBlockNumber);
    const blockNum = await waitForEthStateUpdate(withdrawalBlockNumber);
    
    // 2. Generate proof
    console.log("Generating proof...");
    const proof = await generateWithdrawalProof(withdrawalId, blockNum);
    
    // 3. Claim tokens with proof
    console.log("Claim tokens with proof...");
    const deposit = new ethers.Contract(ETH_CONTRACTS.TOKEN_DEPOSIT, TOKEN_DEPOSIT_ABI, ethSigner);
    const tx = await deposit.claim(withdrawalId, tokenAddress, amount, proof);
    const receipt = await tx.wait();

    return receipt.transactionHash;
}
```

### Complete Example

```javascript
async function bridgeUSDC() {
    try {
        // USDC details
        const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        const amount = ethers.utils.parseUnits("100", 6); // USDC has 6 decimals

        // 1. Bridge USDC to Sonic
        console.log("Initiating bridge to Sonic...");
        const deposit = await bridgeToSonic(USDC_ADDRESS, amount);
        console.log(`Deposit successful: ${deposit.transactionHash}`);

        // 2. Claim USDC on Sonic
        console.log("Waiting for state update and claiming on Sonic...");
        const claimTx = await claimOnSonic(deposit.blockNumber, deposit.depositId, USDC_ADDRESS, amount);
        console.log(`Claim successful: ${claimTx}`);

        // Later: Bridge back to Ethereum
        console.log("Initiating bridge back to Ethereum...");
        const withdrawal = await bridgeToEthereum(deposit.mintedToken, amount);
        console.log(`Withdrawal initiated: ${withdrawal.transactionHash}`);

        // Claim on Ethereum
        console.log("Waiting for state update and claiming on Ethereum...");
        const finalClaim = await claimOnEthereum(
            withdrawal.blockNumber,
            withdrawal.withdrawalId,
            withdrawal.originalToken,
            amount
        );
        console.log(`Final claim successful: ${finalClaim}`);
    } catch (error) {
        console.error("Bridge operation failed:", error.message);
        throw error;
    }
}
```

### Required ABIs

```javascript
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

### Important Notes

1. **State Updates**
   * Ethereum → Sonic: Monitor StateOracle.lastBlockNum until it's >= deposit block
   * Sonic → Ethereum: Monitor StateOracle.lastBlockNum until it's >= withdrawal block
2. **Proofs**
   * Required for all claim operations
   * Generated using eth\_getProof RPC call with correct storage slots
   * Must be RLP encoded in format: `RLP.encode([RLP.encode(accountProof), RLP.encode(storageProof)])`
   * Storage slots are calculated using:
     * Deposits: `keccak256(abi.encode(depositId, uint8(7)))`
     * Withdrawals: `keccak256(abi.encode(withdrawalId, uint8(1)))`
3. **Gas Fees**
   * Keep enough ETH/S for gas on both networks
   * Claim operations typically cost more gas due to proof verification
4. **Security**
   * Never share private keys
   * Always verify contract addresses
   * Test with small amounts first
   * Use the same private key for both networks
5. **Monitoring**
   * Monitor transaction status on both networks
   * Keep transaction hashes for reference
   * Verify successful claims before proceeding
   * Monitor StateOracle updates for claim timing

