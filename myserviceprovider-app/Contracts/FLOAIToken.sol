// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @custom:security-contact security@srvcflo.com
contract FLOAIToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    
    // Distribution addresses - UPDATE THESE WITH ACTUAL ADDRESSES
    address public constant BUILDER_WALLET = 0x0000000000000000000000000000000000000001; // 35% - 350M
    address public constant PUBLIC_MARKET = 0x0000000000000000000000000000000000000002; // 15% - 150M
    address public constant BANDIT_KIDZ_STAKING = 0x0000000000000000000000000000000000000003; // 20% - 200M
    address public constant PUBLIC_ECOSYSTEM = 0x0000000000000000000000000000000000000004; // 10% - 100M
    address public constant LIQUIDITY_POOL = 0x0000000000000000000000000000000000000005; // 11% - 110M
    
    // Development team wallets (1% each = 40M total)
    address[4] public devWallets;
    
    // Airdrop tracking
    mapping(address => bool) public banditKidzClaimed;
    mapping(address => bool) public otherNFTClaimed;
    mapping(address => uint256) public airdropAmounts;
    
    // Vesting for public market (to prevent dumping)
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // Events
    event AirdropClaimed(address indexed recipient, uint256 amount, string nftCollection);
    event VestingCreated(address indexed beneficiary, uint256 amount, uint256 duration);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    
    constructor(address[4] memory _devWallets) ERC20("ServiceFlow AI", "FLOAI") Ownable(msg.sender) {
        devWallets = _devWallets;
        
        // Distribute initial supply
        _mint(BUILDER_WALLET, (TOTAL_SUPPLY * 35) / 100); // 350M
        _mint(BANDIT_KIDZ_STAKING, (TOTAL_SUPPLY * 20) / 100); // 200M
        _mint(PUBLIC_ECOSYSTEM, (TOTAL_SUPPLY * 10) / 100); // 100M
        _mint(LIQUIDITY_POOL, (TOTAL_SUPPLY * 11) / 100); // 110M
        
        // Mint to dev wallets (1% each = 10M each)
        for (uint i = 0; i < 4; i++) {
            _mint(devWallets[i], (TOTAL_SUPPLY * 1) / 100);
        }
        
        // Hold remaining 150M + 50M for vested public market and NFT airdrops
        _mint(address(this), (TOTAL_SUPPLY * 20) / 100); // 200M total
        
        // Create vesting schedule for public market (150M over 24 months)
        _createVestingSchedule(PUBLIC_MARKET, (TOTAL_SUPPLY * 15) / 100, 24 * 30 days);
    }
    
    // Create vesting schedule
    function _createVestingSchedule(address beneficiary, uint256 amount, uint256 duration) internal {
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: duration
        });
        
        emit VestingCreated(beneficiary, amount, duration);
    }
    
    // Release vested tokens
    function releaseVestedTokens(address beneficiary) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule");
        
        uint256 releasableAmount = _getReleasableAmount(beneficiary);
        require(releasableAmount > 0, "No tokens to release");
        
        schedule.releasedAmount += releasableAmount;
        _transfer(address(this), beneficiary, releasableAmount);
        
        emit TokensReleased(beneficiary, releasableAmount);
    }
    
    // Calculate releasable vested amount
    function _getReleasableAmount(address beneficiary) internal view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        
        if (block.timestamp < schedule.startTime) {
            return 0;
        }
        
        uint256 elapsedTime = block.timestamp - schedule.startTime;
        uint256 vestedAmount;
        
        if (elapsedTime >= schedule.duration) {
            vestedAmount = schedule.totalAmount;
        } else {
            vestedAmount = (schedule.totalAmount * elapsedTime) / schedule.duration;
        }
        
        return vestedAmount - schedule.releasedAmount;
    }
    
    // Get releasable amount (external view)
    function getReleasableAmount(address beneficiary) external view returns (uint256) {
        return _getReleasableAmount(beneficiary);
    }
    
    // Airdrop to Bandit Kidz holders
    function airdropToBanditKidz(address[] memory holders, uint256[] memory amounts) 
        external onlyOwner nonReentrant {
        require(holders.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAirdrop = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAirdrop += amounts[i];
        }
        
        require(balanceOf(address(this)) >= totalAirdrop, "Insufficient contract balance");
        
        for (uint256 i = 0; i < holders.length; i++) {
            require(!banditKidzClaimed[holders[i]], "Already claimed");
            
            banditKidzClaimed[holders[i]] = true;
            airdropAmounts[holders[i]] = amounts[i];
            _transfer(address(this), holders[i], amounts[i]);
            
            emit AirdropClaimed(holders[i], amounts[i], "BanditKidz");
        }
    }
    
    // Airdrop to other NFT collections
    function airdropToCollection(
        address[] memory holders, 
        uint256[] memory amounts,
        string memory collectionName
    ) external onlyOwner nonReentrant {
        require(holders.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAirdrop = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAirdrop += amounts[i];
        }
        
        require(balanceOf(address(this)) >= totalAirdrop, "Insufficient contract balance");
        
        for (uint256 i = 0; i < holders.length; i++) {
            require(!otherNFTClaimed[holders[i]], "Already claimed from other collection");
            
            otherNFTClaimed[holders[i]] = true;
            airdropAmounts[holders[i]] += amounts[i];
            _transfer(address(this), holders[i], amounts[i]);
            
            emit AirdropClaimed(holders[i], amounts[i], collectionName);
        }
    }
    
    // Emergency pause
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Override transfer functions to include pause functionality
    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, value);
    }
    
    // Burn function for deflationary mechanics
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    // Get distribution info
    function getDistributionInfo() external pure returns (
        uint256 builderAmount,
        uint256 publicMarketAmount,
        uint256 banditKidzAmount,
        uint256 ecosystemAmount,
        uint256 liquidityAmount,
        uint256 devAmount
    ) {
        builderAmount = (TOTAL_SUPPLY * 35) / 100;
        publicMarketAmount = (TOTAL_SUPPLY * 15) / 100;
        banditKidzAmount = (TOTAL_SUPPLY * 20) / 100;
        ecosystemAmount = (TOTAL_SUPPLY * 10) / 100;
        liquidityAmount = (TOTAL_SUPPLY * 11) / 100;
        devAmount = (TOTAL_SUPPLY * 4) / 100;
    }
}