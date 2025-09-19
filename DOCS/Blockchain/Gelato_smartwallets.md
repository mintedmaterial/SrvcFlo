# Overview

Smart Wallets are an evolution of traditional crypto wallets that leverage Account Abstraction (e.g., EIP-4337, EIP-7702) to offer a more flexible, user-friendly, and secure experience. Unlike Externally Owned Accounts (EOAs), which rely solely on private keys, Smart Wallets are upgrade to existing EOA wallets to smart accounts.

## Why Smart Wallets?

Traditional EOAs come with several limitations:

* Manual gas fee management by users
* Complex onboarding with seed phrases
* Poor user experience, especially for newcomers
* No support for gasless or token-based fee payments

## Key Benefits

Smart Wallets address these challenges by introducing:

* Allow users to pay fees with ERC-20 tokens or let dApps sponsor gas
* Enable login via email, phone, or social accounts (through embedded wallets)
* Add features like account recovery, session keys, spending limits, and more
* Provide a unified experience across multiple EVM-compatible chains

## Gelato's Smart Wallet SDK Key Features

To make smart wallets easy to adopt and integrate, Gelato introduced the Smart Wallet SDK, offering native support for both EIP-7702 and ERC-4337 — all in a single, modular React SDK.

### Developer Benefits

With this SDK, developers can:

* Instantly upgrade EOAs to smart accounts using EIP-7702
* Build fully ERC-4337-compatible smart accounts without managing their own bundler or paymaster infrastructure
* Integrate embedded wallets with familiar Web2-style logins (email, phone, social)
* Support gas abstraction with ERC-20 fee payments and gas sponsorship
* Maintain a cross-chain native experience across supported EVM networks.

## New to EIP-7702 or ERC-4337?

<Columns cols={2}>
  <Card title="EIP-7702" icon="link" href="/Smart-Wallet-SDK/Introduction/Understanding-EIP-7702">
    Understand the EIP-7702 standard and how it works.
  </Card>

  <Card title="ERC-4337" icon="link" href="/Paymaster-&-Bundler/Introduction/Understanding-ERC-4337">
    Understand the ERC-4337 standard and how it works.
  </Card>
</Columns>

## Already familiar?

<Card title="How-To Guides" icon="link" href="/Smart-Wallet-SDK/How-To-Guides">
  Explore our How-To Guides to learn how to integrate Smart Wallets with support
  for both EIP-7702 and ERC-4337.
</Card>