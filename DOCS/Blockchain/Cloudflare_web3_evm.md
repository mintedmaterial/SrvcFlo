---
title: Ethereum network · Cloudflare Web3 docs
description: >-
  The Ethereum network is a distributed consensus platform that allows users to

  write and compute smart contracts in a distributed manner. Smart contracts are

  essentially Turing complete programs that are available at a unique address of

  the network. When the smart contract is run as part of a transaction, the
  result

  and the current state of the contract are stored in a verifiable consensus
  that

  is agreed upon by the entire network of nodes.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/web3/ethereum-gateway/concepts/ethereum/
  md: https://developers.cloudflare.com/web3/ethereum-gateway/concepts/ethereum/index.md
---

The Ethereum network is a distributed consensus platform that allows users to write and compute smart contracts in a distributed manner. Smart contracts are essentially Turing complete programs that are available at a unique address of the network. When the smart contract is run as part of a transaction, the result and the current state of the contract are stored in a verifiable consensus that is agreed upon by the entire network of nodes.

## Smart contracts

When a user wants to run a smart contract on some desired inputs, they provide currency known as ETH with their command. This currency is allocated to a specific set of nodes that contribute to adding the transaction to the distributed consensus.

If the smart contract involves moving monetary amounts to different individuals in the network then this is also recorded in the consensus. As such, this consensus represents the current state of the network along with exactly how much Ethereum currency is owned by each individual.

## Addressing

All transactions on the network are stored in 'blocks' that make up the entire consensus. In brief, the consensus is a single sequence of blocks with increasing unique identifiers that represent all the transactions in the entire history of the Ethereum platform.

Each block also has a unique hash identifier (a long hexadecimal string like `0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3q`) that can be used to retrieve and inspect the block. Each transaction within a block also has a unique hash identifier that can be used to retrieve individual transactions. When any new transaction is uploaded to the consensus as part of a block, this update is sent around the entire network and anyone can read the nature of the transaction that took place. This makes the entire state of the network accountable.

## Read and write content

To read content, a user needs to interact with a working Ethereum node. Such nodes can be run locally on a user's machine as daemons (such as: <https://github.com/ethereum/go-ethereum/>). When the user access to such a node it can use the official JSONRPC API to send queries to the network, and learn about specific aspects of the consensus.

Writing content is just as simple, and can be done using a [single JSON command](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sendrawtransaction). However, writing transactions also requires supplying a certain amount of currency along with a secret key for an [Ethereum wallet](https://www.ethereum.org/use/#_3-what-is-a-wallet-and-which-one-should-i-use) that holds that currency. If this can be provided, then the write transaction is sent to the wider network and added to the consensus.

## Connect your website to the gateway

If you want to be able to access the Ethereum network accessible from a custom domain name, you can do that by [creating a new Ethereum Gateway](https://developers.cloudflare.com/web3/how-to/manage-gateways/#create-a-gateway).

## Related resources

If you’re interested in learning more, you can read the official [RPC documentation](https://github.com/ethereum/wiki/wiki/JSON-RPC), along with the official documentation [provided by Ethereum](https://www.ethereum.org/use/).



---
title: Node types · Cloudflare Web3 docs
description: "There are three widely known Ethereum nodes that are used: Full
  nodes, Archive nodes, and Light nodes."
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/web3/ethereum-gateway/concepts/node-types/
  md: https://developers.cloudflare.com/web3/ethereum-gateway/concepts/node-types/index.md
---

There are three widely known Ethereum nodes that are used: Full nodes, Archive nodes, and Light nodes.

## Full nodes

Full nodes store all the blockchain’s data and participate in block validation. Validating the blockchain includes keeping track of new blocks and computing and maintaining state changes. Full nodes, once fully synced with the network, can query all Ethereum blockchain data.

## Light nodes

A light node is much smaller than a full node and does not participate in block validation in the same way. The node can query the Ethereum network but does not store the state of the chain. Because of this limitation, it relies on peering with full nodes to get accurate chain data.

## Archive nodes

An archive node is a full node that additionally maintains storage of historical blockchain states. While a full node can calculate a historical state, an archive node readily has the information in local storage and has better performance for these types of requests.

## Nodes at Cloudflare

Cloudflare's Ethereum Gateway provides access to full and archive nodes.

The archive nodes serve requests for the following [RPC state methods](https://ethereum.org/en/developers/docs/apis/json-rpc/#state_methods) when the block number parameter is before the most recent 128 blocks or the default block parameter is set to “earliest”:

* [eth\_getBalance](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getbalance)
* [eth\_getCode](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getcode)
* [eth\_getTransactionCount](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gettransactioncount)
* [eth\_getStorageAt](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getstorageat)
* [eth\_call](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_call)
