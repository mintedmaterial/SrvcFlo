Tokenomics Design Overview
Tokens:
$SERV: Governance and value-capture token, low velocity, used for staking, voting, and fee capture.
$FLO: High-velocity utility token for operational payments (e.g., AI task execution, computational resources).
ServiceFlow iNFTs: AI agents (NFTs minted via GeneratedArtNFT.sol) that can be staked to earn $FLO rewards and influence platform operations.
Bandit Kidz NFTs: External NFT collection whose stakers receive $FLO rewards from image generation and platform revenue.
Key Features:
User Tiers: Free (3–5 actions/day), Standard ($0.25/input), Pro ($0.50–$3.00/input), Premium ($0.75–$5.00/output).
Monthly Subscriptions: $20, $60, $120 for full access to the ServiceFlow platform.
Token Allocation: 30% to app team, 5–10% presale, airdrops to Bandit Kidz and 5 other communities, 15% monthly to leaderboard winners, 20% $FLO to Bandit Kidz stakers.
USD-to-Token Conversion: Dynamic pricing to maintain stable USD costs for users.
Staking and Rewards:
ServiceFlow iNFTs: Staked to earn $FLO from platform fees, tied to AI agent performance.
Bandit Kidz NFTs: Staked to earn $FLO from image generation and platform revenue.
$SERV stakers: Earn discounts and governance rights.
Fee Distribution: Platform fees split to $SERV buybacks, leaderboard rewards, Bandit Kidz stakers, and ServiceFlow iNFT stakers.

1. Token Design and Functionality
$SERV Token
Purpose: Governance, staking, and long-term value capture.
Total Supply: Fixed at 1 billion $SERV to control inflation and align with governance needs.
Mechanisms:
Staking:
Users, AI agents (via ServiceFlow iNFTs), and infrastructure providers stake $SERV to participate in the network (e.g., validate nodes, access discounts).
Staked $SERV reduces circulating supply, creating deflationary pressure.
Example: Staking 10,000 $SERV grants a 10–20% discount on $FLO fees.
Governance:
$SERV holders vote on protocol upgrades, treasury allocation, and AI ethics via a DAO.
Quadratic voting ensures fairness (e.g., 10,000 $SERV = 100 votes).
Fee Capture:
20% of $FLO transaction fees are used to buy back and burn $SERV, reducing supply.
Example: If a user spends 1,000 $FLO, 50 $FLO is converted to $SERV and burned.
Lockup/Vesting:
Team (30%, 300M $SERV): 4-year vesting, 12-month cliff.
Presale (7.5%, 75M $SERV): 2-year vesting, 6-month cliff for DEX liquidity.
Airdrops (5%, 50M $SERV): Distributed to Bandit Kidz and 5 communities (8.33M per community), targeting top holders.
$FLO Token
Purpose: Operational payments for AI tasks, computational resources, and workflow steps.
Total Supply: Uncapped, minted dynamically based on demand to manage velocity and inflation.
Mechanisms:
AI Task Payments:
Users pay $FLO based on tier:
Free: 3–5 actions/day (low compute, e.g., 1,000 gas units/action).
Standard: $0.25/input (~0.25 $FLO at $1/$FLO).
Pro: $0.50–$3.00/input (~0.50–3.00 $FLO).
Premium: $0.75–$5.00/output (~0.75–5.00 $FLO Formatted: $FLO).
Example: A Premium user pays 2 $FLO for a $2 artwork output.
Resource Payments:
AI agents pay $FLO to infrastructure providers for compute/storage (e.g., 0.1 $FLO per 1,000 gas units).
Workflow Fees:
Each AI workflow step incurs a 0.01 $FLO fee to monetize intermediate actions.
Issuance:
$FLO minted dynamically to maintain ~$1 price, with AI-driven algorithms adjusting supply based on demand.
Example: If $FLO price rises to $1.50, a $0.25 input costs ~0.167 $FLO.
USD-to-Token Conversion
Oracle Integration: Use Chainlink on Sonic Labs to peg $FLO to ~$1 USD.
Dynamic Pricing:
Example: If $FLO = $1.50, a $0.25 Standard input costs ~0.167 $FLO.
Monthly Subscriptions:
$20/month (Standard): ~20 $FLO.
$60/month (Pro): ~60 $FLO.
$120/month (Premium): ~120 $FLO.
Users pay in $FLO (converted via payment gateway) or USD, with the contract minting equivalent $FLO.
ServiceFlow iNFTs
Purpose: Represent AI agents with unique capabilities (e.g., art generation, data analysis).
Mechanisms:
Minting: Created via GeneratedArtNFT.sol (mintGeneratedArt function).
Staking: iNFTs can be staked to earn $FLO rewards based on agent performance (e.g., number of tasks completed).
Reputation: Staked iNFTs gain reputation scores based on user ratings, increasing $FLO rewards.
Example: An iNFT generating 100 artworks/month earns 10% of the $FLO fees (e.g., 20 $FLO from 200 $FLO).
Bandit Kidz NFTs
Purpose: External NFT collection whose stakers earn $FLO from image generation and platform revenue.
Mechanisms:
Staking: Holders stake Bandit Kidz NFTs to earn 20% of $FLO fees from image generation and platform revenue.
Reward Split: Separate from iNFT rewards, focusing on monetization of NFT-related activities.
Example: If 100,000 $FLO in fees are collected monthly, 20,000 $FLO goes to Bandit Kidz stakers.

2. Incentive Alignment
Users
Free Tier:
3–5 actions/day, capped at low compute intensity.
Earn 0.1 $FLO/action for rating iNFT performance.
Paid Tiers:
High-volume users (e.g., Premium) get 5–10% $FLO cashback for >100 $FLO/month.
Example: A Premium user spending 200 $FLO gets 10–20 $FLO back.
Staking Discounts:
Users staking 10,000+ $SERV get 10–20% off $FLO fees.
Example: A Pro user staking 10,000 $SERV pays 0.4 $FLO instead of 0.5 $FLO/input.
Leaderboard Winners (15% Monthly Rewards)
Mechanism:
15% of monthly $FLO fees distributed to top users based on activity (e.g., inputs/outputs).
Example: If 100,000 $FLO fees are collected, 15,000 $FLO is split among top 100 users.
Smart Contract:
Add to GeneratedArtNFT.sol:
mapping(address => uint256) public userActivity;
function updateActivity(address user, uint256 actions) internal {
    userActivity[user] += actions;
}
function distributeLeaderboardRewards(address[] memory topUsers, uint256[] memory rewards) external onlyOwner {
    for (uint256 i = 0; i < topUsers.length; i++) {
        IERC20(floToken).transfer(topUsers[i], rewards[i]);
    }
}

ServiceFlow iNFT Stakers
Mechanism:
Staked iNFTs earn 10% of $FLO fees from their specific tasks (e.g., art generation).
Reputation-based rewards: High-rated iNFTs (via user feedback) earn up to 15% of task fees.
Example: An iNFT generating 200 $FLO in fees earns 20–30 $FLO.
Smart Contract:
Add staking logic to GeneratedArtNFT.sol:
mapping(uint256 => address) public iNFTStakers;
function stakeINFT(uint256 tokenId) external {
    require(ownerOf(tokenId) == msg.sender, "Not iNFT owner");
    iNFTStakers[tokenId] = msg.sender;
    safeTransferFrom(msg.sender, address(this), tokenId);
}
function distributeINFTRewards(uint256[] memory tokenIds, uint256[] memory rewards) external onlyOwner {
    for (uint256 i = 0; i < tokenIds.length; i++) {
        IERC20(floToken).transfer(iNFTStakers[tokenIds[i]], rewards[i]);
    }
}

Bandit Kidz NFT Stakers (20% $FLO Rewards)
Mechanism:
Stakers earn 20% of $FLO fees from image generation and platform revenue (distinct from iNFT rewards).
Rewards proportional to staked NFTs.
Example: If 100,000 $FLO fees are collected, 20,000 $FLO is distributed to stakers.
Smart Contract:
Separate staking contract for Bandit Kidz NFTs:
contract BanditKidzStaking {
    IERC721 public banditKidzNFT;
    IERC20 public floToken;
    mapping(address => uint256) public stakedNFTs;

    function stake(uint256[] memory tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            banditKidzNFT.transferFrom(msg.sender, address(this), tokenIds[i]);
            stakedNFTs[msg.sender]++;
        }
    }

    function distributeRewards(address[] memory stakers, uint256 totalReward) external onlyOwner {
        uint256 totalStaked;
        for (uint256 i = 0; i < stakers.length; i++) {
            totalStaked += stakedNFTs[stakers[i]];
        }
        for (uint256 i = 0; i < stakers.length; i++) {
            uint256 reward = (totalReward * stakedNFTs[stakers[i]]) / totalStaked;
            floToken.transfer(stakers[i], reward);
        }
    }
}


AI Agents and Developers
Agent Rewards:
iNFTs (representing agents) earn 70% of $FLO task fees, with 30% to developers.
Example: A 2 $FLO task pays 1.4 $FLO to the iNFT and 0.6 $FLO to the developer.
Ethical AI Incentives:
High-rated iNFTs (via user ratings) earn 5% bonus $FLO.
Staked $SERV slashed for unethical behavior (DAO-enforced).
Infrastructure Providers
Resource Payments:
Earn 0.1 $FLO per 1,000 gas units for compute/storage.
Staking:
Stake $SERV to run nodes, with higher stakes increasing workflow assignments.

3. Token Allocation
Total $SERV Supply: 1 billion
App Team (30%): 300M $SERV, 4-year vesting, 12-month cliff.
Presale (7.5%): 75M $SERV, 2-year vesting, 6-month cliff.
Airdrops (5%): 50M $SERV to Bandit Kidz and 5 communities (8.33M each).
Treasury (27.5%): 275M $SERV for grants, R&D, marketing.
Public Sale (15%): 150M $SERV for community purchase.
Leaderboard Rewards (15%): Funded from $FLO fees, converted to $SERV.
Bandit Kidz Stakers (20%): Funded from $FLO fees.
$FLO Supply: Uncapped, dynamically minted, with 5% of fees burned as $SERV.

4. Platform Fee Distribution
Total $FLO Fees (e.g., 100,000 $FLO/month):
5% to $SERV Buyback/Burn: 5,000 $FLO converted to $SERV and burned.
15% to Leaderboard: 15,000 $FLO to top users.
20% to Bandit Kidz Stakers: 20,000 $FLO based on staked NFTs.
10% to ServiceFlow iNFT Stakers: 10,000 $FLO based on iNFT performance.
50% to Treasury: 50,000 $FLO for ecosystem development.
Smart Contract:
Add to GeneratedArtNFT.sol:
function distributeFees(uint256 totalFees) external onlyOwner {
    uint256 servBuyback = totalFees * 5 / 100;
    uint256 leaderboard = totalFees * 15 / 100;
    uint256 banditKidz = totalFees * 20 / 100;
    uint256 iNFTs = totalFees * 10 / 100;
    uint256 treasury = totalFees * 50 / 100;
    IERC20(floToken).transfer(servBuybackAddress, servBuyback);
    IERC20(floToken).transfer(treasuryAddress, treasury);
    // Call BanditKidzStaking.distributeRewards(banditKidzStakers, banditKidz);
    // Call distributeINFTRewards(iNFTsTokens, iNFTs);
    // Call distributeLeaderboardRewards(topUsers, leaderboard);
}


5. Dynamic and Adaptive Mechanisms
Algorithmic Fee Adjustment:
AI adjusts $FLO fees based on network congestion (e.g., +10% during high demand).
Dynamic Issuance:
"Integrate to match demand" means dynamically minting $FLO tokens to meet the network's operational needs (e.g., user transactions, AI task payments). The issuance adjusts based on demand to keep $FLO's price stable at ~$1 USD, ensuring predictable costs for users.
"Burn excess to control speed" refers to burning (destroying) excess $FLO tokens to manage token velocity (the rate at which tokens circulate). This prevents oversupply, which could devalue $FLO or cause inflation, maintaining economic stability.
Anti-Dumping:
AI monitors $SERV dumps (>1% supply in 24 hours) if funding available auto buy supply..

6. Governance and Treasury
DAO:
$SERV holders vote on proposals with quadratic voting.
Treasury:
Funded by 50% of $FLO fees and 275M $SERV.
Supports grants, marketing, infrastructure.
AI-Curated Proposals:
AI analyzes on-chain data to suggest governance actions.

7. Example User Flow
Free User:
5 actions/day, earns 0.5 $FLO for ratings.
Premium User:
Pays 120 $FLO/month, generates 100 artworks (100 $FLO), gets 10 $FLO cashback.
Stakes 10,000 $SERV, reducing fees by 20% (80 $FLO effective cost).
ServiceFlow iNFT Staker:
Stakes iNFT generating 200 $FLO, earns 20–30 $FLO.
Bandit Kidz Staker:
Stakes 10 NFTs, earns 200 $FLO from 20,000 $FLO pool.
Leaderboard Winner:
Top user with 1,000 actions earns 1,500 $FLO.

8. Sustainability and Scalability
Deflationary Pressure: $SERV buybacks/burns reduce supply.
Stable Pricing: $FLO pegged to ~$1 via oracles.
Scalability: Sonic Labs supports high-volume tasks.
Incentives: Airdrops and rewards drive adoption.

