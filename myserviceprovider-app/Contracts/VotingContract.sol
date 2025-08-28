// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address owner);
}

interface IBanditKidzStaking {
    function getUserStakedTokens(address user) external view returns (uint256[] memory);
    function isTokenStaked(uint256 tokenId) external view returns (bool);
}

// Ownable pattern  
contract Ownable {
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() { 
        owner = msg.sender; 
    }

    modifier onlyOwner() { 
        require(msg.sender == owner, "Not owner"); 
        _; 
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

contract GenerationVotingAndLeaderboard is Ownable {
    IERC721 public banditKidzNFT;
    IBanditKidzStaking public banditKidzStaking;
    
    // Generation tracking
    struct Generation {
        string id;
        address creator;
        string prompt;
        string resultUrl;
        uint256 timestamp;
        uint256 upvotes;
        bool exists;
        bool isActive; // Can be voted on
        uint256 weeklyContestId;
    }
    
    // Weekly contest tracking
    struct WeeklyContest {
        uint256 id;
        string title;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        address[] winners; // Top 3 winners
        uint256 totalParticipants;
        mapping(address => uint256) participantPoints;
        mapping(string => bool) generationSubmitted; // generationId => submitted
    }
    
    // User stats
    struct UserStats {
        uint256 totalGenerationsCreated;
        uint256 totalUpvotesReceived;
        uint256 totalVotesCast;
        uint256 leaderboardPoints;
        uint256 weeklyPoints;
        bool canVote; // Has staked NFT or owns NFT
    }
    
    // Storage
    mapping(string => Generation) public generations;
    mapping(uint256 => WeeklyContest) public weeklyContests;
    mapping(address => mapping(string => bool)) public hasVoted; // user => generationId => voted
    mapping(address => UserStats) public userStats;
    mapping(address => uint256) public userWeeklyRank;
    mapping(address => uint256) public userGlobalRank;
    
    // Arrays for iteration
    string[] public allGenerationIds;
    uint256[] public allContestIds;
    
    // State variables
    uint256 public currentWeeklyContestId;
    uint256 public nextContestId = 1;
    uint256 public votingPowerMultiplier = 1; // 1x for regular NFT holders
    uint256 public stakingVotingMultiplier = 2; // 2x for staked NFT holders
    
    // Events
    event GenerationSubmitted(string indexed generationId, address indexed creator, uint256 weeklyContestId);
    event VoteCast(address indexed voter, string indexed generationId, uint256 votingPower);
    event WeeklyContestStarted(uint256 indexed contestId, string title, uint256 startTime, uint256 endTime);
    event WeeklyContestEnded(uint256 indexed contestId, address[] winners);
    event LeaderboardUpdated(address indexed user, uint256 newPoints, uint256 newRank);
    
    constructor(address _banditKidzStaking, address _banditKidzNFT) {
        require(_banditKidzStaking != address(0), "Zero address");
        require(_banditKidzNFT != address(0), "Zero address");
        banditKidzStaking = IBanditKidzStaking(_banditKidzStaking);
        banditKidzNFT = IERC721(_banditKidzNFT);
    }
    
    // Submit a generation to the contest
    function submitGeneration(
        string calldata generationId,
        address creator,
        string calldata prompt,
        string calldata resultUrl
    ) external onlyOwner {
        require(!generations[generationId].exists, "Generation already exists");
        require(currentWeeklyContestId > 0, "No active contest");
        
        WeeklyContest storage contest = weeklyContests[currentWeeklyContestId];
        require(contest.isActive, "Contest not active");
        require(block.timestamp >= contest.startTime && block.timestamp <= contest.endTime, "Contest not in progress");
        require(!contest.generationSubmitted[generationId], "Already submitted to contest");
        
        // Create generation
        generations[generationId] = Generation({
            id: generationId,
            creator: creator,
            prompt: prompt,
            resultUrl: resultUrl,
            timestamp: block.timestamp,
            upvotes: 0,
            exists: true,
            isActive: true,
            weeklyContestId: currentWeeklyContestId
        });
        
        // Add to arrays
        allGenerationIds.push(generationId);
        contest.generationSubmitted[generationId] = true;
        
        // Update user stats
        userStats[creator].totalGenerationsCreated++;
        
        emit GenerationSubmitted(generationId, creator, currentWeeklyContestId);
    }
    
    // Vote for a generation
    function vote(string calldata generationId) external {
        require(generations[generationId].exists, "Generation does not exist");
        require(generations[generationId].isActive, "Voting not active for this generation");
        require(!hasVoted[msg.sender][generationId], "Already voted");
        require(canUserVote(msg.sender), "Cannot vote - need NFT or staked NFT");
        
        Generation storage generation = generations[generationId];
        address creator = generation.creator;
        
        // Calculate voting power
        uint256 votingPower = getUserVotingPower(msg.sender);
        
        // Record vote
        hasVoted[msg.sender][generationId] = true;
        generation.upvotes += votingPower;
        
        // Update stats
        userStats[msg.sender].totalVotesCast++;
        userStats[creator].totalUpvotesReceived += votingPower;
        
        // Update leaderboard points for creator
        userStats[creator].leaderboardPoints += votingPower;
        
        // Update weekly contest points
        if (generation.weeklyContestId > 0) {
            WeeklyContest storage contest = weeklyContests[generation.weeklyContestId];
            contest.participantPoints[creator] += votingPower;
            userStats[creator].weeklyPoints += votingPower;
        }
        
        emit VoteCast(msg.sender, generationId, votingPower);
        emit LeaderboardUpdated(creator, userStats[creator].leaderboardPoints, userGlobalRank[creator]);
    }
    
    // Start a new weekly contest
    function startWeeklyContest(
        string calldata title,
        uint256 duration // in seconds
    ) external onlyOwner {
        require(duration > 0, "Duration must be positive");
        
        // End current contest if active
        if (currentWeeklyContestId > 0) {
            weeklyContests[currentWeeklyContestId].isActive = false;
        }
        
        // Create new contest
        currentWeeklyContestId = nextContestId;
        WeeklyContest storage newContest = weeklyContests[currentWeeklyContestId];
        
        newContest.id = currentWeeklyContestId;
        newContest.title = title;
        newContest.startTime = block.timestamp;
        newContest.endTime = block.timestamp + duration;
        newContest.isActive = true;
        newContest.totalParticipants = 0;
        
        allContestIds.push(currentWeeklyContestId);
        nextContestId++;
        
        emit WeeklyContestStarted(currentWeeklyContestId, title, newContest.startTime, newContest.endTime);
    }
    
    // End current weekly contest and select winners
    function endWeeklyContest() external onlyOwner {
        require(currentWeeklyContestId > 0, "No active contest");
        
        WeeklyContest storage contest = weeklyContests[currentWeeklyContestId];
        require(contest.isActive, "Contest not active");
        require(block.timestamp >= contest.endTime, "Contest not ended yet");
        
        contest.isActive = false;
        
        // TODO: Implement winner selection logic
        // For now, just emit empty winners array
        address[] memory winners = new address[](0);
        contest.winners = winners;
        
        emit WeeklyContestEnded(currentWeeklyContestId, winners);
    }
    
    // Check if user can vote (has NFT or staked NFT)
    function canUserVote(address user) public view returns (bool) {
        // Check if user owns any Bandit Kidz NFTs
        if (banditKidzNFT.balanceOf(user) > 0) {
            return true;
        }
        
        // Check if user has staked NFTs
        uint256[] memory stakedTokens = banditKidzStaking.getUserStakedTokens(user);
        return stakedTokens.length > 0;
    }
    
    // Get user's voting power based on NFT ownership and staking
    function getUserVotingPower(address user) public view returns (uint256) {
        uint256 votingPower = 0;
        
        // Base voting power for NFT ownership
        uint256 nftBalance = banditKidzNFT.balanceOf(user);
        if (nftBalance > 0) {
            votingPower += nftBalance * votingPowerMultiplier;
        }
        
        // Additional voting power for staked NFTs
        uint256[] memory stakedTokens = banditKidzStaking.getUserStakedTokens(user);
        if (stakedTokens.length > 0) {
            votingPower += stakedTokens.length * stakingVotingMultiplier;
        }
        
        return votingPower > 0 ? votingPower : 0;
    }
    
    // View functions
    function getGenerationsByCreator(address creator) external view returns (string[] memory) {
        uint256 count = 0;
        
        // Count generations by creator
        for (uint256 i = 0; i < allGenerationIds.length; i++) {
            if (generations[allGenerationIds[i]].creator == creator) {
                count++;
            }
        }
        
        // Create result array
        string[] memory result = new string[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allGenerationIds.length; i++) {
            if (generations[allGenerationIds[i]].creator == creator) {
                result[index] = allGenerationIds[i];
                index++;
            }
        }
        
        return result;
    }
    
    function getActiveGenerations() external view returns (string[] memory) {
        uint256 count = 0;
        
        // Count active generations
        for (uint256 i = 0; i < allGenerationIds.length; i++) {
            if (generations[allGenerationIds[i]].isActive) {
                count++;
            }
        }
        
        // Create result array
        string[] memory result = new string[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allGenerationIds.length; i++) {
            if (generations[allGenerationIds[i]].isActive) {
                result[index] = allGenerationIds[i];
                index++;
            }
        }
        
        return result;
    }
    
    function getCurrentContest() external view returns (
        uint256 id,
        string memory title,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        uint256 totalParticipants
    ) {
        if (currentWeeklyContestId == 0) {
            return (0, "", 0, 0, false, 0);
        }
        
        WeeklyContest storage contest = weeklyContests[currentWeeklyContestId];
        return (
            contest.id,
            contest.title,
            contest.startTime,
            contest.endTime,
            contest.isActive,
            contest.totalParticipants
        );
    }
    
    // Admin functions
    function setBanditKidzStaking(address _banditKidzStaking) external onlyOwner {
        require(_banditKidzStaking != address(0), "Zero address");
        banditKidzStaking = IBanditKidzStaking(_banditKidzStaking);
    }
    
    function setVotingMultipliers(uint256 _votingPowerMultiplier, uint256 _stakingVotingMultiplier) external onlyOwner {
        votingPowerMultiplier = _votingPowerMultiplier;
        stakingVotingMultiplier = _stakingVotingMultiplier;
    }
    
    function toggleGenerationVoting(string calldata generationId, bool active) external onlyOwner {
        require(generations[generationId].exists, "Generation does not exist");
        generations[generationId].isActive = active;
    }
}