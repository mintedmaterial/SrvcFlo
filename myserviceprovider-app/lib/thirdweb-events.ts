// lib/thirdweb-events.ts
import { getContract, getContractEvents, prepareEvent } from "thirdweb";
import { client, sonicTestnet } from "@/components/thirdweb-provider";

// Contract addresses from environment
export const CONTRACTS = {
  BANDIT_KIDZ_NFT: process.env.NEXT_PUBLIC_SONIC_BANDIT_KIDZ_NFT || "0x6988c29f8c0051d261f288c2c497a592e2d1061f",
  CREDITS_TOKEN: process.env.NEXT_PUBLIC_SONIC_CREDITS_TOKEN || "0xfbc680cb5fd3fa2dc4addd5f644f614a21c6dc45",
  PAYMENT_SPLITTER: process.env.NEXT_PUBLIC_SONIC_PAYMENT_SPLITTER || "0x611bd5513b633bc1c636f34bf449794ba5703242",
  PAYMENT_CONTRACT: process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT,
  STAKING_CONTRACT: process.env.NEXT_PUBLIC_SONIC_STAKING_CONTRACT,
  VOTING_CONTRACT: process.env.NEXT_PUBLIC_SONIC_VOTING_CONTRACT,
};

// Get contract instances
export const getContractInstance = (address: string) => {
  return getContract({
    client,
    chain: sonicTestnet,
    address,
  });
};

// Event definitions for our contracts
export const EVENTS = {
  // Payment Contract Events
  PAYMENT_RECEIVED: prepareEvent({
    signature: "event PaymentReceived(address indexed payer, address indexed token, uint256 amount, string generationType)"
  }),
  
  GENERATION_REQUESTED: prepareEvent({
    signature: "event GenerationRequested(address indexed user, string prompt, string generationType, uint256 generationId)"
  }),
  
  GENERATION_COMPLETED: prepareEvent({
    signature: "event GenerationCompleted(address indexed user, uint256 generationId, string resultUrl)"
  }),
  
  CREDITS_ADDED: prepareEvent({
    signature: "event CreditsAdded(address indexed user, uint256 amount)"
  }),
  
  // Voting Contract Events
  GENERATION_SUBMITTED: prepareEvent({
    signature: "event GenerationSubmitted(string indexed generationId, address indexed creator, uint256 weeklyContestId)"
  }),
  
  VOTE_CAST: prepareEvent({
    signature: "event VoteCast(address indexed voter, string indexed generationId, uint256 votingPower)"
  }),
  
  WEEKLY_CONTEST_STARTED: prepareEvent({
    signature: "event WeeklyContestStarted(uint256 indexed contestId, string title, uint256 startTime, uint256 endTime)"
  }),
  
  WEEKLY_CONTEST_ENDED: prepareEvent({
    signature: "event WeeklyContestEnded(uint256 indexed contestId, address[] winners)"
  }),
  
  LEADERBOARD_UPDATED: prepareEvent({
    signature: "event LeaderboardUpdated(address indexed user, uint256 newPoints, uint256 newRank)"
  }),
  
  // Staking Contract Events
  STAKED: prepareEvent({
    signature: "event Staked(address indexed user, uint256 indexed tokenId, uint256 timestamp)"
  }),
  
  UNSTAKED: prepareEvent({
    signature: "event Unstaked(address indexed user, uint256 indexed tokenId, uint256 timestamp)"
  }),
  
  DISTRIBUTION_ADDED: prepareEvent({
    signature: "event DistributionAdded(uint256 indexed distributionId, uint256 amount, address token, uint256 totalStaked)"
  }),
  
  REWARDS_CLAIMED: prepareEvent({
    signature: "event RewardsClaimed(address indexed user, uint256 indexed distributionId, uint256 amount, address token)"
  }),
  
  // ERC20 Transfer Events
  TRANSFER: prepareEvent({
    signature: "event Transfer(address indexed from, address indexed to, uint256 value)"
  }),
  
  // ERC721 Transfer Events
  NFT_TRANSFER: prepareEvent({
    signature: "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  }),
};

// Event listener functions
export class ContractEventListener {
  static async getPaymentEvents(userAddress?: string, fromBlock?: number) {
    if (!CONTRACTS.PAYMENT_CONTRACT) return [];
    
    const contract = getContractInstance(CONTRACTS.PAYMENT_CONTRACT);
    
    try {
      const events = await getContractEvents({
        contract,
        events: [
          EVENTS.PAYMENT_RECEIVED,
          EVENTS.GENERATION_REQUESTED,
          EVENTS.GENERATION_COMPLETED,
          EVENTS.CREDITS_ADDED
        ],
        fromBlock: fromBlock || 0,
      });
      
      // Filter by user if specified
      if (userAddress) {
        return events.filter(event => 
          event.args.payer?.toLowerCase() === userAddress.toLowerCase() ||
          event.args.user?.toLowerCase() === userAddress.toLowerCase()
        );
      }
      
      return events;
    } catch (error) {
      console.error('Error fetching payment events:', error);
      return [];
    }
  }
  
  static async getVotingEvents(userAddress?: string, fromBlock?: number) {
    if (!CONTRACTS.VOTING_CONTRACT) return [];
    
    const contract = getContractInstance(CONTRACTS.VOTING_CONTRACT);
    
    try {
      const events = await getContractEvents({
        contract,
        events: [
          EVENTS.GENERATION_SUBMITTED,
          EVENTS.VOTE_CAST,
          EVENTS.WEEKLY_CONTEST_STARTED,
          EVENTS.WEEKLY_CONTEST_ENDED,
          EVENTS.LEADERBOARD_UPDATED
        ],
        fromBlock: fromBlock || 0,
      });
      
      // Filter by user if specified
      if (userAddress) {
        return events.filter(event => 
          event.args.creator?.toLowerCase() === userAddress.toLowerCase() ||
          event.args.voter?.toLowerCase() === userAddress.toLowerCase() ||
          event.args.user?.toLowerCase() === userAddress.toLowerCase()
        );
      }
      
      return events;
    } catch (error) {
      console.error('Error fetching voting events:', error);
      return [];
    }
  }
  
  static async getStakingEvents(userAddress?: string, fromBlock?: number) {
    if (!CONTRACTS.STAKING_CONTRACT) return [];
    
    const contract = getContractInstance(CONTRACTS.STAKING_CONTRACT);
    
    try {
      const events = await getContractEvents({
        contract,
        events: [
          EVENTS.STAKED,
          EVENTS.UNSTAKED,
          EVENTS.DISTRIBUTION_ADDED,
          EVENTS.REWARDS_CLAIMED
        ],
        fromBlock: fromBlock || 0,
      });
      
      // Filter by user if specified
      if (userAddress) {
        return events.filter(event => 
          event.args.user?.toLowerCase() === userAddress.toLowerCase()
        );
      }
      
      return events;
    } catch (error) {
      console.error('Error fetching staking events:', error);
      return [];
    }
  }
  
  static async getNFTTransfers(userAddress?: string, fromBlock?: number) {
    const contract = getContractInstance(CONTRACTS.BANDIT_KIDZ_NFT);
    
    try {
      const events = await getContractEvents({
        contract,
        events: [EVENTS.NFT_TRANSFER],
        fromBlock: fromBlock || 0,
      });
      
      // Filter by user if specified
      if (userAddress) {
        return events.filter(event => 
          event.args.from?.toLowerCase() === userAddress.toLowerCase() ||
          event.args.to?.toLowerCase() === userAddress.toLowerCase()
        );
      }
      
      return events;
    } catch (error) {
      console.error('Error fetching NFT transfer events:', error);
      return [];
    }
  }
  
  static async getTokenTransfers(tokenAddress: string, userAddress?: string, fromBlock?: number) {
    const contract = getContractInstance(tokenAddress);
    
    try {
      const events = await getContractEvents({
        contract,
        events: [EVENTS.TRANSFER],
        fromBlock: fromBlock || 0,
      });
      
      // Filter by user if specified
      if (userAddress) {
        return events.filter(event => 
          event.args.from?.toLowerCase() === userAddress.toLowerCase() ||
          event.args.to?.toLowerCase() === userAddress.toLowerCase()
        );
      }
      
      return events;
    } catch (error) {
      console.error('Error fetching token transfer events:', error);
      return [];
    }
  }
  
  static async getAllUserEvents(userAddress: string, fromBlock?: number) {
    const [paymentEvents, votingEvents, stakingEvents, nftEvents] = await Promise.all([
      this.getPaymentEvents(userAddress, fromBlock),
      this.getVotingEvents(userAddress, fromBlock),
      this.getStakingEvents(userAddress, fromBlock),
      this.getNFTTransfers(userAddress, fromBlock),
    ]);
    
    // Combine and sort by block number
    const allEvents = [...paymentEvents, ...votingEvents, ...stakingEvents, ...nftEvents]
      .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
    
    return allEvents;
  }
}

// Real-time event subscription helper
export class EventSubscriptionManager {
  private subscriptions: Map<string, any> = new Map();
  
  subscribeToPaymentEvents(callback: (event: any) => void, userAddress?: string) {
    if (!CONTRACTS.PAYMENT_CONTRACT) return;
    
    const contract = getContractInstance(CONTRACTS.PAYMENT_CONTRACT);
    
    // This would be implemented with websocket connection in a real app
    // For now, we'll use polling
    const intervalId = setInterval(async () => {
      try {
        const events = await ContractEventListener.getPaymentEvents(userAddress, -10); // Last 10 blocks
        events.forEach(callback);
      } catch (error) {
        console.error('Error in payment event subscription:', error);
      }
    }, 10000); // Poll every 10 seconds
    
    this.subscriptions.set('payment', intervalId);
    
    return () => {
      clearInterval(intervalId);
      this.subscriptions.delete('payment');
    };
  }
  
  subscribeToVotingEvents(callback: (event: any) => void, userAddress?: string) {
    if (!CONTRACTS.VOTING_CONTRACT) return;
    
    const intervalId = setInterval(async () => {
      try {
        const events = await ContractEventListener.getVotingEvents(userAddress, -10);
        events.forEach(callback);
      } catch (error) {
        console.error('Error in voting event subscription:', error);
      }
    }, 10000);
    
    this.subscriptions.set('voting', intervalId);
    
    return () => {
      clearInterval(intervalId);
      this.subscriptions.delete('voting');
    };
  }
  
  unsubscribeAll() {
    this.subscriptions.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const eventManager = new EventSubscriptionManager();