# Spec Requirements Document

> Spec: Agent UI Debug and Auth System Implementation
> Created: 2025-08-27
> Status: Planning

## Overview

Implement a comprehensive ServiceFlow AI development pipeline including agent debugging, ThirdWeb authentication, testnet deployment, team hosting, and mainnet restructuring for iNFT agents with ERC-7857 integration. This multi-phase implementation will establish the foundation for advanced trading features and marketplace functionality.

## User Stories

### Team Developer Authentication Flow

As a ServiceFlow team member holding Bandit Kidz NFTs, I want to authenticate with ThirdWeb wallet integration so that I can access restricted agent-ui tools and test token consumption flows during testnet deployment.

Team members authenticate using their existing Bandit Kidz NFT holdings (0x45bc8a938e487fde4f31a7e051c2b63627f6f966) for access to agent-ui debugging tools, testnet token distribution, and development features. The system validates NFT ownership and provides appropriate access levels for testing and development workflows.

### User iNFT Agent Creation

As a crypto user, I want to mint ERC-7857 iNFT agents for 50 S tokens (25 S for additional agents) so that I can create specialized AI agents for social media, image generation, and ecosystem monitoring with voting capabilities.

Users connect wallets, pay in S tokens, mint iNFT agents using ERC-7857 factory contracts, customize agent parameters, deploy to dedicated threads for community voting, and earn rewards based on agent performance and community engagement.

### Testnet Token Distribution

As a development team lead, I want to distribute testnet FLO tokens to existing holders and supply dev wallet (0x0f4CBe532E34E4Dfcb648Adf145010b38ed5E8e8) so that team members can test authentication flows and token consumption during development phases.

System creates testnet version of FLOAIToken.sol, airdrops to current holders based on mainnet balances, provides adequate supply to dev wallet for testing, and implements consumption tracking for agent operations and iNFT minting.

## Spec Scope

1. **Agent UI Debugging System** - Debug and enhance existing agents in /agent-ui/Agents with improved error handling, logging, and performance monitoring
2. **ThirdWeb Authentication Integration** - Implement wallet authentication using ThirdWeb user/server wallets, pregenerated wallets, and EIP-7702 account abstraction
3. **Testnet Token Distribution** - Deploy testnet FLOAIToken.sol and distribute to existing holders with dev wallet funding for comprehensive testing
4. **Team Deployment Infrastructure** - Host agent-ui and app for team access during testnet phases with secure authentication and monitoring
5. **App Restructuring for Mainnet** - Reorganize /myserviceprovider-app structure for presale, marketplace, and iNFT agent systems using ERC-7857 standards
6. **iNFT Agent Factory System** - Implement factory contracts for minting specialized ERC-7857 agents with voting threads and ERC-721 collections
7. **Token Flow Implementation** - Create dashboard functions for minting agents, presale participation, token purchasing, and marketplace interactions
8. **Data Pipeline Foundation** - Establish monitoring agents and workflows as preparation for advanced trading features

## Out of Scope

- Advanced trading feature implementation (Phase 3 priority)
- Mainnet deployment and production launch
- Complex multi-chain integrations beyond Sonic ecosystem
- Advanced governance features beyond basic token voting
- Comprehensive mobile application development

## Expected Deliverable

1. **Fully debugged agent-ui system** with enhanced error handling, logging, and team authentication via ThirdWeb and NFT ownership validation
2. **Testnet environment** with distributed FLO tokens, working authentication flows, and comprehensive team testing capabilities
3. **Restructured myserviceprovider-app** ready for mainnet presale with iNFT agent minting, voting threads, marketplace integration, and token flow dashboards

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-27-agent-ui-debug-auth-system/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-27-agent-ui-debug-auth-system/sub-specs/technical-spec.md
- Database Schema: @.agent-os/specs/2025-08-27-agent-ui-debug-auth-system/sub-specs/database-schema.md
- API Specification: @.agent-os/specs/2025-08-27-agent-ui-debug-auth-system/sub-specs/api-spec.md
- Tests Specification: @.agent-os/specs/2025-08-27-agent-ui-debug-auth-system/sub-specs/tests.md