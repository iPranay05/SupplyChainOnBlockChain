const { ethers } = require('ethers');
const crypto = require('crypto');
require('dotenv').config();

class WalletService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc'
    );

    // Master wallet for gas fees and contract interactions
    this.masterWallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

    // Contract setup
    this.contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    this.contractABI = require('./contracts/AgriTrace.json').abi;
    this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.masterWallet);

    console.log('Wallet service initialized');
    console.log('Master wallet:', this.masterWallet.address);
    console.log('Contract address:', this.contractAddress);
  }

  // Generate new wallet for user
  generateWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  }

  // Encrypt private key for storage
  encryptPrivateKey(privateKey, password) {
    const algorithm = 'aes-256-cbc';
    const salt = 'agritrace-salt'; // In production, use random salt per user
    const key = crypto.scryptSync(password, salt, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      salt
    };
  }

  // Decrypt private key
  decryptPrivateKey(encryptedData, password) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, encryptedData.salt || 'agritrace-salt', 32);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Get wallet instance for user
  getUserWallet(encryptedPrivateKey, password) {
    const privateKey = this.decryptPrivateKey(encryptedPrivateKey, password);
    return new ethers.Wallet(privateKey, this.provider);
  }

  // Fund user wallet with gas fees
  async fundWallet(userAddress, amount = '0.1') {
    try {
      const tx = await this.masterWallet.sendTransaction({
        to: userAddress,
        value: ethers.utils.parseEther(amount)
      });

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error funding wallet:', error);
      throw error;
    }
  }

  // Register stakeholder on blockchain
  async registerStakeholder(userWallet, name, location, role) {
    try {
      const userContract = this.contract.connect(userWallet);
      const tx = await userContract.registerStakeholder(name, location, role);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error registering stakeholder:', error);
      throw error;
    }
  }

  // Verify stakeholder (admin only)
  async verifyStakeholder(userAddress) {
    try {
      const tx = await this.contract.verifyStakeholder(userAddress);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error verifying stakeholder:', error);
      throw error;
    }
  }

  // Register product on blockchain
  async registerProduct(userWallet, productData) {
    try {
      const { name, variety, farmLocation, quantity, qualityGrade, isOrganic, price, ipfsHash } = productData;

      const userContract = this.contract.connect(userWallet);
      const tx = await userContract.registerProduct(
        name,
        variety,
        farmLocation,
        quantity,
        qualityGrade,
        isOrganic,
        ethers.utils.parseEther(price.toString()),
        ipfsHash || ''
      );

      const receipt = await tx.wait();

      // Extract product ID from events
      const event = receipt.events.find(e => e.event === 'ProductRegistered');
      const productId = event ? event.args.productId.toNumber() : null;

      return {
        txHash: tx.hash,
        productId
      };
    } catch (error) {
      console.error('Error registering product:', error);
      throw error;
    }
  }

  // Transfer product on blockchain
  async transferProduct(userWallet, productId, toAddress, quantity, price, location) {
    try {
      const userContract = this.contract.connect(userWallet);
      const tx = await userContract.transferProduct(
        productId,
        toAddress,
        quantity,
        ethers.utils.parseEther(price.toString()),
        location
      );

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error transferring product:', error);
      throw error;
    }
  }

  // Get blockchain product data
  async getBlockchainProduct(productId) {
    try {
      const product = await this.contract.getProduct(productId);
      return {
        id: product.id.toNumber(),
        name: product.name,
        variety: product.variety,
        farmer: product.farmer,
        farmLocation: product.farmLocation,
        harvestDate: new Date(product.harvestDate.toNumber() * 1000),
        quantity: product.quantity.toNumber(),
        qualityGrade: product.qualityGrade,
        isOrganic: product.isOrganic,
        currentPrice: ethers.utils.formatEther(product.currentPrice),
        status: product.status,
        ipfsHash: product.ipfsHash
      };
    } catch (error) {
      console.error('Error getting blockchain product:', error);
      throw error;
    }
  }

  // Get blockchain transactions for product
  async getBlockchainTransactions(productId) {
    try {
      const transactions = await this.contract.getProductTransactions(productId);
      return transactions.map(tx => ({
        id: tx.id.toNumber(),
        productId: tx.productId.toNumber(),
        from: tx.from,
        to: tx.to,
        quantity: tx.quantity.toNumber(),
        price: ethers.utils.formatEther(tx.price),
        timestamp: new Date(tx.timestamp.toNumber() * 1000),
        location: tx.location,
        txType: tx.txType
      }));
    } catch (error) {
      console.error('Error getting blockchain transactions:', error);
      throw error;
    }
  }

  // Check if stakeholder is verified
  async isStakeholderVerified(address) {
    try {
      const stakeholder = await this.contract.getStakeholder(address);
      return stakeholder.isVerified;
    } catch (error) {
      console.error('Error checking stakeholder verification:', error);
      return false;
    }
  }

  // Get wallet balance
  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }
}

module.exports = WalletService;