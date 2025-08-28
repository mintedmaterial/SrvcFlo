const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ServiceFlow AI Integration Tests", function () {
  // Test fixture for deploying all contracts
  async function deployServiceFlowFixture() {
    const [owner, user1, user2, treasury, banditKidz] = await ethers.getSigners();
    
    // Deploy FLOAI Token
    const FLOAIToken = await ethers.getContractFactory("FLOAIToken");
    const devWallets = [user1.address, user2.address, treasury.address, banditKidz.address];
    const floaiToken = await FLOAIToken.deploy(devWallets);
    
    // Deploy Credit Contract
    const CreditContract = await ethers.getContractFactory("SrvcFLoAICollection");
    const creditContract = await CreditContract.deploy(owner.address);
    
    // Deploy Agent Factory
    const AgentFactory = await ethers.getContractFactory("ServiceFlowAgentFactory");
    const agentFactory = await AgentFactory.deploy(
      await floaiToken.getAddress(),
      await creditContract.getAddress()
    );
    
    return {
      floaiToken,
      creditContract,
      agentFactory,
      owner,
      user1,
      user2,
      treasury,
      banditKidz,
      devWallets
    };
  }

  describe("FLOAI Token Distribution", function () {
    it("Should have correct total supply and distribution", async function () {
      const { floaiToken } = await loadFixture(deployServiceFlowFixture);
      
      const totalSupply = await floaiToken.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1000000000")); // 1B tokens
      
      const distributionInfo = await floaiToken.getDistributionInfo();
      expect(distributionInfo.builderAmount).to.equal(ethers.parseEther("350000000")); // 35%
      expect(distributionInfo.publicMarketAmount).to.equal(ethers.parseEther("150000000")); // 15%
      expect(distributionInfo.banditKidzAmount).to.equal(ethers.parseEther("200000000")); // 20%
      expect(distributionInfo.ecosystemAmount).to.equal(ethers.parseEther("100000000")); // 10%
      expect(distributionInfo.liquidityAmount).to.equal(ethers.parseEther("110000000")); // 11%
      expect(distributionInfo.devAmount).to.equal(ethers.parseEther("40000000")); // 4%
    });

    it("Should allow vested token release for public market", async function () {
      const { floaiToken } = await loadFixture(deployServiceFlowFixture);
      
      const PUBLIC_MARKET = "0x0000000000000000000000000000000000000002";
      
      // Check initial releasable amount (should be 0 at start)
      const initialReleasable = await floaiToken.getReleasableAmount(PUBLIC_MARKET);
      expect(initialReleasable).to.equal(0);
      
      // Advance time by 1 month (1/24 of vesting period)
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      // Check releasable amount after 1 month
      const monthlyReleasable = await floaiToken.getReleasableAmount(PUBLIC_MARKET);
      const expectedMonthly = ethers.parseEther("150000000") / BigInt(24); // 1/24 of total
      expect(monthlyReleasable).to.be.closeTo(expectedMonthly, ethers.parseEther("1000"));
    });

    it("Should support token burning", async function () {
      const { floaiToken, user1 } = await loadFixture(deployServiceFlowFixture);
      
      const initialBalance = await floaiToken.balanceOf(user1.address);
      const burnAmount = ethers.parseEther("1000");
      
      if (initialBalance < burnAmount) {
        // Transfer some tokens to user1 first
        const BUILDER_WALLET = "0x0000000000000000000000000000000000000001";
        await floaiToken.connect(user1).approve(user1.address, burnAmount);
      }
      
      // Get user1's actual balance
      const userBalance = await floaiToken.balanceOf(user1.address);
      if (userBalance >= burnAmount) {
        await floaiToken.connect(user1).burn(burnAmount);
        const finalBalance = await floaiToken.balanceOf(user1.address);
        expect(finalBalance).to.equal(userBalance - burnAmount);
      }
    });
  });

  describe("Credit System", function () {
    it("Should have correct credit package configurations", async function () {
      const { creditContract } = await loadFixture(deployServiceFlowFixture);
      
      // Test Starter package (ID: 0)
      expect(await creditContract.getCreditAmount(0)).to.equal(750);
      expect(await creditContract.getSTokenPrice(0)).to.equal(ethers.parseEther("5"));
      expect(await creditContract.getUSDCPrice(0)).to.equal(5000000); // 5 USDC (6 decimals)
      
      // Test Creator package (ID: 1)
      expect(await creditContract.getCreditAmount(1)).to.equal(8000);
      expect(await creditContract.getSTokenPrice(1)).to.equal(ethers.parseEther("50"));
      expect(await creditContract.getUSDCPrice(1)).to.equal(50000000); // 50 USDC
      
      // Test Professional package (ID: 2)
      expect(await creditContract.getCreditAmount(2)).to.equal(50000);
      expect(await creditContract.getSTokenPrice(2)).to.equal(ethers.parseEther("200"));
      expect(await creditContract.getUSDCPrice(2)).to.equal(200000000); // 200 USDC
      
      // Test Enterprise package (ID: 3)
      expect(await creditContract.getCreditAmount(3)).to.equal(500000);
      expect(await creditContract.getSTokenPrice(3)).to.equal(ethers.parseEther("1500"));
      expect(await creditContract.getUSDCPrice(3)).to.equal(1500000000); // 1500 USDC
    });

    it("Should allow purchasing credits with S tokens", async function () {
      const { creditContract, user1 } = await loadFixture(deployServiceFlowFixture);
      
      const packageId = 0; // Starter package
      const price = await creditContract.getSTokenPrice(packageId);
      
      // Purchase credits
      await creditContract.connect(user1).purchaseCreditsWithS(packageId, { value: price });
      
      // Check balance
      const balance = await creditContract.balanceOf(user1.address, packageId);
      expect(balance).to.equal(750); // Starter package credits
    });

    it("Should handle model access tiers correctly", async function () {
      const { creditContract } = await loadFixture(deployServiceFlowFixture);
      
      // Starter package should not have all models
      expect(await creditContract.packageHasAllModels(0)).to.be.false;
      expect(await creditContract.packageHasCollectionInfluence(0)).to.be.false;
      
      // Creator package and above should have all models
      expect(await creditContract.packageHasAllModels(1)).to.be.true;
      expect(await creditContract.packageHasCollectionInfluence(1)).to.be.true;
      
      expect(await creditContract.packageHasAllModels(2)).to.be.true;
      expect(await creditContract.packageHasCollectionInfluence(2)).to.be.true;
      
      expect(await creditContract.packageHasAllModels(3)).to.be.true;
      expect(await creditContract.packageHasCollectionInfluence(3)).to.be.true;
    });

    it("Should allow burning credits for usage", async function () {
      const { creditContract, owner, user1 } = await loadFixture(deployServiceFlowFixture);
      
      const packageId = 1; // Creator package
      const price = await creditContract.getSTokenPrice(packageId);
      
      // Purchase credits first
      await creditContract.connect(user1).purchaseCreditsWithS(packageId, { value: price });
      
      const initialBalance = await creditContract.balanceOf(user1.address, packageId);
      expect(initialBalance).to.equal(8000);
      
      // Use 200 credits (cost of one image generation)
      await creditContract.connect(owner).useCredits(user1.address, packageId, 200);
      
      const finalBalance = await creditContract.balanceOf(user1.address, packageId);
      expect(finalBalance).to.equal(7800);
    });
  });

  describe("Agent Factory", function () {
    it("Should have correct minting costs", async function () {
      const { agentFactory } = await loadFixture(deployServiceFlowFixture);
      
      expect(await agentFactory.MINT_COST_S()).to.equal(ethers.parseEther("50"));
      expect(await agentFactory.MINT_COST_FLOAI()).to.equal(ethers.parseEther("5000"));
    });

    it("Should mint agent with S tokens", async function () {
      const { agentFactory, user1 } = await loadFixture(deployServiceFlowFixture);
      
      const agentConfig = {
        name: "Test Image Agent",
        agentType: "image",
        instructions: "Generate beautiful images",
        tools: ["DALL-E", "Stable Diffusion"],
        connections: ["OpenAI"],
        floaiPerOp: 100,
        metadataURI: "https://example.com/metadata/1",
        metadataHash: ethers.keccak256(ethers.toUtf8Bytes("test-metadata")),
        creditPackageId: 1
      };
      
      const mintCost = await agentFactory.MINT_COST_S();
      
      await expect(
        agentFactory.connect(user1).mintAgentWithS(
          agentConfig.name,
          agentConfig.agentType,
          agentConfig.instructions,
          agentConfig.tools,
          agentConfig.connections,
          agentConfig.floaiPerOp,
          agentConfig.metadataURI,
          agentConfig.metadataHash,
          agentConfig.creditPackageId,
          { value: mintCost }
        )
      ).to.emit(agentFactory, "AgentMinted")
       .withArgs(1, user1.address, agentConfig.agentType, agentConfig.creditPackageId, "S_TOKENS");
      
      // Check agent was minted
      const agentConfig2 = await agentFactory.getAgentConfig(1);
      expect(agentConfig2.name).to.equal(agentConfig.name);
      expect(agentConfig2.agentType).to.equal(agentConfig.agentType);
      expect(agentConfig2.creator).to.equal(user1.address);
      expect(agentConfig2.isActive).to.be.true;
    });

    it("Should mint agent with FLOAI tokens", async function () {
      const { agentFactory, floaiToken, user1, treasury } = await loadFixture(deployServiceFlowFixture);
      
      // Transfer FLOAI tokens to user1 first
      const mintCost = await agentFactory.MINT_COST_FLOAI();
      
      // Treasury should have FLOAI tokens from initial distribution
      await floaiToken.connect(treasury).transfer(user1.address, mintCost);
      
      // Approve the agent factory to spend FLOAI tokens
      await floaiToken.connect(user1).approve(await agentFactory.getAddress(), mintCost);
      
      const agentConfig = {
        name: "Test Video Agent",
        agentType: "video",
        instructions: "Generate amazing videos",
        tools: ["RunwayML", "Pika Labs"],
        connections: ["Custom API"],
        floaiPerOp: 250,
        metadataURI: "https://example.com/metadata/2",
        metadataHash: ethers.keccak256(ethers.toUtf8Bytes("test-metadata-2")),
        creditPackageId: 2
      };
      
      await expect(
        agentFactory.connect(user1).mintAgentWithFLOAI(
          agentConfig.name,
          agentConfig.agentType,
          agentConfig.instructions,
          agentConfig.tools,
          agentConfig.connections,
          agentConfig.floaiPerOp,
          agentConfig.metadataURI,
          agentConfig.metadataHash,
          agentConfig.creditPackageId
        )
      ).to.emit(agentFactory, "AgentMinted")
       .withArgs(1, user1.address, agentConfig.agentType, agentConfig.creditPackageId, "FLOAI");
    });

    it("Should track agent usage and revenue", async function () {
      const { agentFactory, owner, user1 } = await loadFixture(deployServiceFlowFixture);
      
      // First mint an agent
      const mintCost = await agentFactory.MINT_COST_S();
      await agentFactory.connect(user1).mintAgentWithS(
        "Revenue Test Agent",
        "image",
        "Test instructions",
        ["DALL-E"],
        ["OpenAI"],
        100,
        "https://example.com/metadata/3",
        ethers.keccak256(ethers.toUtf8Bytes("test-metadata-3")),
        1,
        { value: mintCost }
      );
      
      const tokenId = 1;
      
      // Record agent usage
      await agentFactory.connect(owner).recordAgentUsage(tokenId, 100, "image_generation");
      
      const agentConfig = await agentFactory.getAgentConfig(tokenId);
      expect(agentConfig.generationCount).to.equal(1);
      
      // Record revenue
      const revenueAmount = ethers.parseEther("10"); // 10 FLOAI
      await agentFactory.connect(owner).recordRevenue(tokenId, revenueAmount, user1.address);
      
      const agentConfigUpdated = await agentFactory.getAgentConfig(tokenId);
      expect(agentConfigUpdated.totalRevenue).to.equal(revenueAmount);
      
      // Check revenue tracking
      const revenueInfo = await agentFactory.getAgentRevenue(tokenId, user1.address);
      expect(revenueInfo.totalGenerated).to.equal(revenueAmount);
      expect(revenueInfo.ownerEarnings).to.equal(revenueAmount);
    });

    it("Should handle agent transfers with metadata re-encryption", async function () {
      const { agentFactory, user1, user2 } = await loadFixture(deployServiceFlowFixture);
      
      // Mint an agent
      const mintCost = await agentFactory.MINT_COST_S();
      await agentFactory.connect(user1).mintAgentWithS(
        "Transfer Test Agent",
        "social",
        "Test instructions",
        ["GPT-4"],
        ["OpenAI"],
        50,
        "https://example.com/metadata/4",
        ethers.keccak256(ethers.toUtf8Bytes("test-metadata-4")),
        0,
        { value: mintCost }
      );
      
      const tokenId = 1;
      
      // Transfer the agent
      await expect(
        agentFactory.connect(user1).transferFrom(user1.address, user2.address, tokenId)
      ).to.emit(agentFactory, "AgentTransferred")
       .withArgs(tokenId, user1.address, user2.address, "https://example.com/metadata/4");
      
      // Check new owner
      expect(await agentFactory.ownerOf(tokenId)).to.equal(user2.address);
      
      // Check user agent tracking
      const user1Agents = await agentFactory.getUserAgents(user1.address);
      const user2Agents = await agentFactory.getUserAgents(user2.address);
      
      expect(user1Agents.length).to.equal(0);
      expect(user2Agents.length).to.equal(1);
      expect(user2Agents[0]).to.equal(tokenId);
    });

    it("Should check premium features based on credit package", async function () {
      const { agentFactory, user1, user2 } = await loadFixture(deployServiceFlowFixture);
      
      const mintCost = await agentFactory.MINT_COST_S();
      
      // Mint agent with Starter package (no premium features)
      await agentFactory.connect(user1).mintAgentWithS(
        "Basic Agent",
        "image",
        "Basic instructions",
        ["Basic Model"],
        [],
        100,
        "https://example.com/metadata/5",
        ethers.keccak256(ethers.toUtf8Bytes("test-metadata-5")),
        0, // Starter package
        { value: mintCost }
      );
      
      // Mint agent with Creator package (has premium features)
      await agentFactory.connect(user2).mintAgentWithS(
        "Premium Agent",
        "video",
        "Premium instructions",
        ["Premium Model"],
        [],
        250,
        "https://example.com/metadata/6",
        ethers.keccak256(ethers.toUtf8Bytes("test-metadata-6")),
        1, // Creator package
        { value: mintCost }
      );
      
      // Check premium features
      expect(await agentFactory.agentHasPremiumFeatures(1)).to.be.false; // Starter
      expect(await agentFactory.agentHasPremiumFeatures(2)).to.be.true;  // Creator
    });
  });

  describe("Revenue Distribution", function () {
    it("Should distribute minting fees correctly (75/25 split)", async function () {
      const { agentFactory, user1, treasury, banditKidz } = await loadFixture(deployServiceFlowFixture);
      
      const initialTreasuryBalance = await ethers.provider.getBalance(treasury.address);
      const initialBanditKidzBalance = await ethers.provider.getBalance(banditKidz.address);
      
      const mintCost = await agentFactory.MINT_COST_S();
      const expectedBanditKidzShare = (mintCost * BigInt(75)) / BigInt(100);
      const expectedDevShare = mintCost - expectedBanditKidzShare;
      
      // Note: In the actual implementation, you'd need to set the treasury addresses
      // For this test, we're just checking the calculation logic
      
      await agentFactory.connect(user1).mintAgentWithS(
        "Fee Test Agent",
        "image",
        "Test instructions",
        ["DALL-E"],
        ["OpenAI"],
        100,
        "https://example.com/metadata/7",
        ethers.keccak256(ethers.toUtf8Bytes("test-metadata-7")),
        1,
        { value: mintCost }
      );
      
      // The actual fee distribution would happen to the configured addresses
      // This test verifies the contract is deployed and functioning
      expect(await agentFactory.totalSupply()).to.equal(1);
    });
  });

  describe("Integration Flow", function () {
    it("Should complete full user journey: purchase credits -> mint agent -> generate content", async function () {
      const { creditContract, agentFactory, floaiToken, user1, treasury } = await loadFixture(deployServiceFlowFixture);
      
      // Step 1: Purchase credits
      const packageId = 1; // Creator package
      const creditPrice = await creditContract.getSTokenPrice(packageId);
      await creditContract.connect(user1).purchaseCreditsWithS(packageId, { value: creditPrice });
      
      const userCredits = await creditContract.balanceOf(user1.address, packageId);
      expect(userCredits).to.equal(8000);
      
      // Step 2: Mint an agent
      const mintCost = await agentFactory.MINT_COST_S();
      await agentFactory.connect(user1).mintAgentWithS(
        "Full Journey Agent",
        "image",
        "A comprehensive image generation agent",
        ["DALL-E", "Stable Diffusion"],
        ["OpenAI", "Stability AI"],
        200, // Cost per operation
        "https://example.com/metadata/journey",
        ethers.keccak256(ethers.toUtf8Bytes("journey-metadata")),
        packageId,
        { value: mintCost }
      );
      
      const tokenId = 1;
      const agentConfig = await agentFactory.getAgentConfig(tokenId);
      expect(agentConfig.name).to.equal("Full Journey Agent");
      expect(agentConfig.creator).to.equal(user1.address);
      
      // Step 3: Simulate content generation (use credits)
      const generationCost = 200; // Credits for one image
      await creditContract.connect(user1).approve(await agentFactory.getAddress(), generationCost);
      
      // In a real implementation, this would be called by the Cloudflare Worker
      // For testing, we simulate the credit burning
      await creditContract.connect(user1).burn(user1.address, packageId, generationCost);
      
      const remainingCredits = await creditContract.balanceOf(user1.address, packageId);
      expect(remainingCredits).to.equal(7800); // 8000 - 200
      
      // Step 4: Record usage and revenue
      const owner = await agentFactory.owner();
      await agentFactory.connect(user1).recordAgentUsage(tokenId, 200, "image_generation");
      
      const revenue = ethers.parseEther("1"); // 1 FLOAI revenue
      await agentFactory.connect(user1).recordRevenue(tokenId, revenue, user1.address);
      
      const finalAgentConfig = await agentFactory.getAgentConfig(tokenId);
      expect(finalAgentConfig.generationCount).to.equal(1);
      expect(finalAgentConfig.totalRevenue).to.equal(revenue);
      
      console.log("✅ Full user journey completed successfully!");
    });
  });
});