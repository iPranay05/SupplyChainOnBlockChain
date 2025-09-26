const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgriTrace", function () {
  let agriTrace;
  let owner;
  let farmer;
  let distributor;
  let consumer;

  beforeEach(async function () {
    [owner, farmer, distributor, consumer] = await ethers.getSigners();
    
    const AgriTrace = await ethers.getContractFactory("AgriTrace");
    agriTrace = await AgriTrace.deploy();
    await agriTrace.deployed();
  });

  describe("Stakeholder Registration", function () {
    it("Should register a farmer", async function () {
      await agriTrace.connect(farmer).registerStakeholder(
        "John Doe",
        "California, USA",
        0 // Farmer
      );

      const stakeholder = await agriTrace.getStakeholder(farmer.address);
      expect(stakeholder.name).to.equal("John Doe");
      expect(stakeholder.role).to.equal(0);
      expect(stakeholder.isVerified).to.equal(false);
    });

    it("Should verify a stakeholder", async function () {
      await agriTrace.connect(farmer).registerStakeholder(
        "John Doe",
        "California, USA",
        0
      );

      await agriTrace.connect(owner).verifyStakeholder(farmer.address);
      
      const stakeholder = await agriTrace.getStakeholder(farmer.address);
      expect(stakeholder.isVerified).to.equal(true);
    });

    it("Should not allow duplicate registration", async function () {
      await agriTrace.connect(farmer).registerStakeholder(
        "John Doe",
        "California, USA",
        0
      );

      await expect(
        agriTrace.connect(farmer).registerStakeholder(
          "Jane Doe",
          "Texas, USA",
          0
        )
      ).to.be.revertedWith("Stakeholder already registered");
    });
  });

  describe("Product Registration", function () {
    beforeEach(async function () {
      await agriTrace.connect(farmer).registerStakeholder(
        "John Doe",
        "California, USA",
        0
      );
      await agriTrace.connect(owner).verifyStakeholder(farmer.address);
    });

    it("Should register a product", async function () {
      await agriTrace.connect(farmer).registerProduct(
        "Organic Tomatoes",
        "Cherry Tomatoes",
        "California Farm",
        100,
        "Premium",
        true,
        ethers.utils.parseEther("5.0"),
        "QmTest123"
      );

      const product = await agriTrace.getProduct(1);
      expect(product.name).to.equal("Organic Tomatoes");
      expect(product.farmer).to.equal(farmer.address);
      expect(product.isOrganic).to.equal(true);
      expect(product.status).to.equal(0); // Harvested
    });

    it("Should not allow non-farmers to register products", async function () {
      await agriTrace.connect(distributor).registerStakeholder(
        "Distributor Co",
        "Nevada, USA",
        1 // Distributor
      );
      await agriTrace.connect(owner).verifyStakeholder(distributor.address);

      await expect(
        agriTrace.connect(distributor).registerProduct(
          "Organic Tomatoes",
          "Cherry Tomatoes",
          "California Farm",
          100,
          "Premium",
          true,
          ethers.utils.parseEther("5.0"),
          "QmTest123"
        )
      ).to.be.revertedWith("Only farmers can register products");
    });

    it("Should not allow unverified stakeholders to register products", async function () {
      await expect(
        agriTrace.connect(farmer).registerProduct(
          "Organic Tomatoes",
          "Cherry Tomatoes",
          "California Farm",
          100,
          "Premium",
          true,
          ethers.utils.parseEther("5.0"),
          "QmTest123"
        )
      ).to.be.revertedWith("Only verified stakeholders can perform this action");
    });
  });

  describe("Product Transfer", function () {
    beforeEach(async function () {
      // Register and verify farmer
      await agriTrace.connect(farmer).registerStakeholder(
        "John Doe",
        "California, USA",
        0
      );
      await agriTrace.connect(owner).verifyStakeholder(farmer.address);

      // Register and verify distributor
      await agriTrace.connect(distributor).registerStakeholder(
        "Distributor Co",
        "Nevada, USA",
        1
      );
      await agriTrace.connect(owner).verifyStakeholder(distributor.address);

      // Register product
      await agriTrace.connect(farmer).registerProduct(
        "Organic Tomatoes",
        "Cherry Tomatoes",
        "California Farm",
        100,
        "Premium",
        true,
        ethers.utils.parseEther("5.0"),
        "QmTest123"
      );
    });

    it("Should transfer product to distributor", async function () {
      await agriTrace.connect(farmer).transferProduct(
        1,
        distributor.address,
        50,
        ethers.utils.parseEther("6.0"),
        "Nevada Warehouse"
      );

      const product = await agriTrace.getProduct(1);
      expect(product.status).to.equal(2); // AtDistributor
      expect(product.quantity).to.equal(50); // Remaining quantity

      const transactions = await agriTrace.getProductTransactions(1);
      expect(transactions.length).to.equal(2); // Harvest + Transfer
    });

    it("Should update ownership history", async function () {
      await agriTrace.connect(farmer).transferProduct(
        1,
        distributor.address,
        50,
        ethers.utils.parseEther("6.0"),
        "Nevada Warehouse"
      );

      const ownershipHistory = await agriTrace.getProductOwnershipHistory(1);
      expect(ownershipHistory.length).to.equal(2);
      expect(ownershipHistory[0]).to.equal(farmer.address);
      expect(ownershipHistory[1]).to.equal(distributor.address);
    });

    it("Should not allow transfer of more than available quantity", async function () {
      await expect(
        agriTrace.connect(farmer).transferProduct(
          1,
          distributor.address,
          150, // More than available (100)
          ethers.utils.parseEther("6.0"),
          "Nevada Warehouse"
        )
      ).to.be.revertedWith("Insufficient quantity");
    });
  });

  describe("Quality and Price Updates", function () {
    beforeEach(async function () {
      await agriTrace.connect(farmer).registerStakeholder(
        "John Doe",
        "California, USA",
        0
      );
      await agriTrace.connect(owner).verifyStakeholder(farmer.address);

      await agriTrace.connect(farmer).registerProduct(
        "Organic Tomatoes",
        "Cherry Tomatoes",
        "California Farm",
        100,
        "Premium",
        true,
        ethers.utils.parseEther("5.0"),
        "QmTest123"
      );
    });

    it("Should update product quality", async function () {
      await agriTrace.connect(farmer).updateQuality(1, "Grade A");
      
      const product = await agriTrace.getProduct(1);
      expect(product.qualityGrade).to.equal("Grade A");
    });

    it("Should update product price", async function () {
      await agriTrace.connect(farmer).updatePrice(1, ethers.utils.parseEther("7.0"));
      
      const product = await agriTrace.getProduct(1);
      expect(product.currentPrice).to.equal(ethers.utils.parseEther("7.0"));
    });

    it("Should not allow non-owners to update quality", async function () {
      await expect(
        agriTrace.connect(distributor).updateQuality(1, "Grade A")
      ).to.be.revertedWith("Only verified stakeholders can perform this action");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await agriTrace.connect(farmer).registerStakeholder(
        "John Doe",
        "California, USA",
        0
      );
      await agriTrace.connect(owner).verifyStakeholder(farmer.address);

      await agriTrace.connect(farmer).registerProduct(
        "Organic Tomatoes",
        "Cherry Tomatoes",
        "California Farm",
        100,
        "Premium",
        true,
        ethers.utils.parseEther("5.0"),
        "QmTest123"
      );
    });

    it("Should get all products", async function () {
      const products = await agriTrace.getAllProducts();
      expect(products.length).to.equal(1);
      expect(products[0].name).to.equal("Organic Tomatoes");
    });

    it("Should get products by farmer", async function () {
      const products = await agriTrace.getProductsByFarmer(farmer.address);
      expect(products.length).to.equal(1);
      expect(products[0].farmer).to.equal(farmer.address);
    });
  });
});