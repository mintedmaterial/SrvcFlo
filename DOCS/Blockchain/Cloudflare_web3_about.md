---
title: About · Cloudflare Web3 docs
description: When you create a gateway, Cloudflare automatically creates and
  adds specific DNS records to your Cloudflare account.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/web3/about/
  md: https://developers.cloudflare.com/web3/about/index.md
---
![alt text](image.png)

When you [create a gateway](https://developers.cloudflare.com/web3/how-to/manage-gateways/#create-a-gateway), Cloudflare automatically creates and adds specific [DNS records](https://developers.cloudflare.com/web3/reference/gateway-dns-records/) to your Cloudflare account.

When the hostname associated with your gateway receives requests, its DNS records route these requests to a Cloudflare Workers script.

![Cloudflare's Web3 gateways provide HTTP-accessible interfaces to the IPFS and Ethereum networks. For more details, continue reading.](https://developers.cloudflare.com/_astro/web3-gateway-flow-diagram.C8S74hHM_dA5CF.webp)

## Read operations

If the API call to the Worker is a read operation and the requested content is cached, the Workers script will respond with the requested information via HTTP to the client.

If the requested content is not cached, it will first be requested via API call to Cloudflare IPFS or Ethereum nodes, cached at the edge for future requests, and returned via HTTP response to the client.

## Write operations

*Only available for gateways to EVM-based chains, such as [Ethereum](https://developers.cloudflare.com/web3/how-to/use-ethereum-gateway).*

If the API call to the gateway is a write operation, the gateway will make an API call to one of the Cloudflare nodes, and the transaction is placed in the local mempool and propagated to peers.

A transaction ID is returned to the gateway, which is then returned to the client via HTTP response. Validators take transactions from the mempool and place them into a block to execute. The new block to add to the blockchain is validated, consensus is reached, and the block is added to the blockchain and propagated to the rest of the network.
