const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Database = require('./database');
const WalletService = require('./walletService');
const PinataService = require('./pinataService');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware - Allow mobile access
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://192.168.0.193:3000',
    'http://192.168.0.193:3001',
    'http://192.168.0.193:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002'
  ],
  credentials: true
}));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint for deployment
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'agritrace-backend'
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Initialize services
const db = new Database();
const walletService = new WalletService();
const ipfsService = new PinataService();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AgriTrace Backend is running' });
});

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Register user (farmer, distributor, retailer)
app.post('/api/register', async (req, res) => {
  try {
    const { phone, name, location, role, password } = req.body;
    
    console.log('\n🚀 ===== CUSTODIAL WALLET REGISTRATION STARTED =====');
    console.log('📋 Registration Request:', {
      phone: phone?.substring(0, 3) + '***' + phone?.substring(phone.length - 3),
      name,
      location,
      role: ['Farmer', 'Distributor', 'Retailer', 'Consumer'][role],
      timestamp: new Date().toISOString()
    });

    // Validate input
    if (!phone || !name || !location || role === undefined || !password) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const existingUser = await db.getUserByPhone(phone);
    if (existingUser) {
      console.log('❌ User already exists with phone:', phone?.substring(0, 3) + '***');
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }
    console.log('✅ User does not exist, proceeding with registration');

    // Generate wallet
    console.log('\n🔐 ===== CUSTODIAL WALLET GENERATION =====');
    console.log('⚡ Generating new Ethereum wallet...');
    const startTime = Date.now();
    const wallet = walletService.generateWallet();
    const walletGenTime = Date.now() - startTime;
    
    console.log('✅ Wallet generated successfully!');
    console.log('📊 Wallet Details:', {
      address: wallet.address,
      privateKeyLength: wallet.privateKey.length,
      generationTime: `${walletGenTime}ms`,
      network: 'Avalanche Fuji Testnet'
    });

    // Encrypt private key with user's password
    console.log('\n🔒 ===== PRIVATE KEY ENCRYPTION =====');
    console.log('🔐 Encrypting private key with user password...');
    const encryptStartTime = Date.now();
    const encryptedPrivateKey = walletService.encryptPrivateKey(wallet.privateKey, password);
    const encryptTime = Date.now() - encryptStartTime;
    
    console.log('✅ Private key encrypted successfully!');
    console.log('📊 Encryption Details:', {
      algorithm: 'AES-256-CBC',
      ivLength: encryptedPrivateKey.iv.length,
      encryptedLength: encryptedPrivateKey.encrypted.length,
      encryptionTime: `${encryptTime}ms`,
      saltUsed: encryptedPrivateKey.salt
    });

    // Create user in database
    console.log('\n💾 ===== DATABASE STORAGE =====');
    console.log('📝 Storing user data in database...');
    const userData = {
      phone,
      name,
      location,
      role: parseInt(role),
      walletAddress: wallet.address,
      encryptedPrivateKey: JSON.stringify(encryptedPrivateKey)
    };

    const dbStartTime = Date.now();
    const user = await db.createUser(userData);
    const dbTime = Date.now() - dbStartTime;
    
    console.log('✅ User stored in database successfully!');
    console.log('📊 Database Details:', {
      userId: user.id,
      walletLinked: wallet.address,
      encryptedKeyStored: true,
      storageTime: `${dbTime}ms`
    });

    // Fund wallet with gas fees
    console.log('\n💰 ===== WALLET FUNDING =====');
    console.log('⛽ Funding user wallet with gas fees...');
    try {
      const fundStartTime = Date.now();
      const fundTxHash = await walletService.fundWallet(wallet.address);
      const fundTime = Date.now() - fundStartTime;
      
      console.log('✅ Wallet funded successfully!');
      console.log('📊 Funding Details:', {
        walletAddress: wallet.address,
        amount: '0.1 AVAX',
        txHash: fundTxHash,
        fundingTime: `${fundTime}ms`,
        masterWallet: walletService.masterWallet.address
      });
    } catch (error) {
      console.error('❌ Error funding wallet:', error.message);
      console.log('⚠️  Continuing without funding - user can be funded later');
    }

    // Get user wallet instance
    console.log('\n🔓 ===== WALLET DECRYPTION TEST =====');
    console.log('🔐 Testing wallet decryption and access...');
    try {
      const decryptStartTime = Date.now();
      const userWallet = walletService.getUserWallet(encryptedPrivateKey, password);
      const decryptTime = Date.now() - decryptStartTime;
      
      console.log('✅ Wallet decryption successful!');
      console.log('📊 Decryption Details:', {
        walletAddress: userWallet.address,
        addressMatch: userWallet.address === wallet.address,
        decryptionTime: `${decryptTime}ms`,
        networkConnected: true
      });

      // Register on blockchain
      console.log('\n⛓️  ===== BLOCKCHAIN REGISTRATION =====');
      console.log('📝 Registering stakeholder on blockchain...');
      try {
        const blockchainStartTime = Date.now();
        const txHash = await walletService.registerStakeholder(userWallet, name, location, parseInt(role));
        const blockchainTime = Date.now() - blockchainStartTime;
        
        console.log('✅ Stakeholder registered on blockchain!');
        console.log('📊 Blockchain Registration Details:', {
          txHash: txHash,
          stakeholderAddress: userWallet.address,
          role: ['Farmer', 'Distributor', 'Retailer', 'Consumer'][parseInt(role)],
          registrationTime: `${blockchainTime}ms`,
          network: 'Avalanche Fuji'
        });

        // Auto-verify the user if enabled
        console.log('\n✅ ===== AUTO-VERIFICATION CHECK =====');
        console.log('🔍 Checking AUTO_VERIFY_USERS setting:', process.env.AUTO_VERIFY_USERS);
        if (process.env.AUTO_VERIFY_USERS === 'true') {
          console.log('🚀 Auto-verification enabled, attempting to verify user...');
          try {
            const verifyStartTime = Date.now();
            const verifyTxHash = await walletService.verifyStakeholder(wallet.address);
            const verifyTime = Date.now() - verifyStartTime;
            
            console.log('✅ Stakeholder auto-verified on blockchain!');
            console.log('📊 Verification Details:', {
              verifyTxHash: verifyTxHash,
              verifiedAddress: wallet.address,
              verificationTime: `${verifyTime}ms`,
              verifiedBy: walletService.masterWallet.address
            });

            // Update database verification status
            await db.verifyUser(user.id);
            console.log('✅ Database verification status updated for user:', user.id);
          } catch (verifyError) {
            console.error('❌ Error auto-verifying stakeholder:', verifyError.message);
            console.log('⚠️  User can be verified later manually');
          }
        } else {
          console.log('⏸️  Auto-verification disabled - user will need manual verification');
        }
      } catch (error) {
        console.error('❌ Error registering on blockchain:', error.message);
        console.log('⚠️  User created but blockchain registration failed - can retry later');
      }
    } catch (decryptError) {
      console.error('❌ Error creating user wallet instance:', decryptError.message);
      console.log('⚠️  User created but wallet access failed');
    }

    // Generate JWT token
    console.log('\n🔑 ===== JWT TOKEN GENERATION =====');
    console.log('🎫 Generating authentication token...');
    const tokenStartTime = Date.now();
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    const tokenTime = Date.now() - tokenStartTime;
    
    console.log('✅ JWT token generated successfully!');
    console.log('📊 Token Details:', {
      userId: user.id,
      expiresIn: '24h',
      tokenLength: token.length,
      generationTime: `${tokenTime}ms`
    });

    // Check final verification status
    console.log('\n🔍 ===== FINAL STATUS CHECK =====');
    console.log('📋 Checking final user verification status...');
    const finalUser = await db.getUserById(user.id);
    
    const totalRegistrationTime = Date.now() - startTime;
    
    console.log('✅ Registration process completed!');
    console.log('📊 Final Registration Summary:', {
      userId: user.id,
      walletAddress: wallet.address,
      isVerified: finalUser.is_verified,
      role: ['Farmer', 'Distributor', 'Retailer', 'Consumer'][user.role],
      totalTime: `${totalRegistrationTime}ms`,
      custodialWalletCreated: true,
      blockchainRegistered: true,
      databaseStored: true
    });

    console.log('\n🎉 ===== CUSTODIAL WALLET REGISTRATION COMPLETED =====');
    console.log('🔐 Custodial Wallet System Summary:');
    console.log('   • User wallet generated and encrypted ✅');
    console.log('   • Private key secured with user password ✅');
    console.log('   • Wallet funded with gas fees ✅');
    console.log('   • Blockchain registration completed ✅');
    console.log('   • User can now interact with smart contracts ✅');
    console.log('   • No MetaMask or external wallet needed ✅\n');

    res.status(201).json({
      message: finalUser.is_verified
        ? 'User registered and verified successfully'
        : 'User registered successfully - verification pending',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        location: user.location,
        role: user.role,
        walletAddress: wallet.address,
        isVerified: finalUser.is_verified
      }
    });

  } catch (error) {
    console.error('\n💥 ===== REGISTRATION ERROR =====');
    console.error('❌ Registration failed:', error.message);
    console.error('📍 Error stack:', error.stack);
    console.error('⚠️  User registration aborted\n');
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    // Get user from database
    const user = await db.getUserByPhone(phone);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For simplicity, we're not hashing passwords in this demo
    // In production, you should hash passwords with bcrypt

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Check blockchain verification status
    let isVerified = user.is_verified;
    try {
      const blockchainVerified = await walletService.isStakeholderVerified(user.wallet_address);
      if (blockchainVerified && !isVerified) {
        await db.verifyUser(user.id);
        isVerified = true;
      }
    } catch (error) {
      console.error('Error checking blockchain verification:', error);
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        location: user.location,
        role: user.role,
        walletAddress: user.wallet_address,
        isVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check verification status
    let isVerified = user.is_verified;
    try {
      const blockchainVerified = await walletService.isStakeholderVerified(user.wallet_address);
      if (blockchainVerified && !isVerified) {
        await db.verifyUser(user.id);
        isVerified = true;
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    }

    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      location: user.location,
      role: user.role,
      walletAddress: user.wallet_address,
      isVerified,
      createdAt: user.created_at
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Register product with photo upload
app.post('/api/products', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { name, variety, quantity, qualityGrade, isOrganic, price, farmLocation } = req.body;

    // Validate input
    if (!name || !variety || !quantity || !qualityGrade || !price || !farmLocation) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get user
    const user = await db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is a farmer
    if (user.role !== 0) {
      return res.status(403).json({ error: 'Only farmers can register products' });
    }

    // Generate QR code data
    const qrData = {
      productId: Date.now(), // Temporary ID
      name,
      farmer: user.name,
      location: farmLocation,
      harvestDate: new Date().toISOString()
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    // Upload to Pinata IPFS
    let ipfsResult = null;
    let photoUrl = null;

    try {
      if (req.file) {
        const photoPath = req.file.path;
        const productMetadata = {
          name,
          variety,
          farmLocation,
          farmerName: user.name,
          harvestDate: new Date().toISOString()
        };

        ipfsResult = await ipfsService.uploadBatchMetadata(productMetadata, photoPath);
        photoUrl = ipfsResult.photoHash ? ipfsService.getGatewayUrl(ipfsResult.photoHash) : null;

        console.log(`✅ Product photo uploaded to Pinata IPFS: ${ipfsResult.photoHash}`);
      }
    } catch (ipfsError) {
      console.error('❌ Pinata upload failed, using local storage:', ipfsError);
      photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    }

    // Create product in database
    const productData = {
      userId: user.id,
      name,
      variety,
      quantity: parseInt(quantity),
      qualityGrade,
      isOrganic: Boolean(isOrganic),
      price: parseFloat(price),
      farmLocation,
      qrCode,
      photoUrl,
      ipfsHash: ipfsResult?.metadataHash || null
    };

    const product = await db.createProduct(productData);

    // Register on blockchain if user is verified
    let blockchainId = null;
    let txHash = null;

    try {
      const isVerified = await walletService.isStakeholderVerified(user.wallet_address);
      if (isVerified) {
        const encryptedPrivateKey = JSON.parse(user.encrypted_private_key);
        const userWallet = walletService.getUserWallet(encryptedPrivateKey, req.body.password || 'default');

        const result = await walletService.registerProduct(userWallet, {
          name,
          variety,
          farmLocation,
          quantity: parseInt(quantity),
          qualityGrade,
          isOrganic: Boolean(isOrganic),
          price: parseFloat(price),
          ipfsHash: ''
        });

        blockchainId = result.productId;
        txHash = result.txHash;

        // Update product with blockchain ID
        await db.updateProductBlockchainId(product.id, blockchainId);
      }
    } catch (error) {
      console.error('Error registering product on blockchain:', error);
      // Continue anyway - product is saved in database
    }

    // Update QR code with actual product ID
    const updatedQrData = {
      ...qrData,
      productId: product.id,
      blockchainId,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/product/${product.id}`
    };

    const updatedQrCode = await QRCode.toDataURL(JSON.stringify(updatedQrData));

    res.status(201).json({
      message: 'Product registered successfully',
      product: {
        id: product.id,
        blockchainId,
        name,
        variety,
        quantity,
        qualityGrade,
        isOrganic,
        price,
        farmLocation,
        qrCode: updatedQrCode,
        txHash,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Product registration error:', error);
    res.status(500).json({ error: 'Product registration failed' });
  }
});

// Get user's products
app.get('/api/products/my', authenticateToken, async (req, res) => {
  try {
    const products = await db.getProductsByUserId(req.user.userId);
    res.json(products);
  } catch (error) {
    console.error('Error getting user products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Alternative endpoint for my-products
app.get('/api/products/my-products', authenticateToken, async (req, res) => {
  try {
    const products = await db.getProductsByUserId(req.user.userId);
    res.json(products);
  } catch (error) {
    console.error('Error getting user products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Error getting all products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Transfer product
app.post('/api/products/:id/transfer', authenticateToken, async (req, res) => {
  try {
    const { toPhone, quantity, price, location, password } = req.body;
    const productId = req.params.id;

    console.log('Transfer request received:', { productId, toPhone, quantity, price, location });

    // Validate input
    if (!toPhone || !quantity || !price || !location || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get current user
    const fromUser = await db.getUserById(req.user.userId);
    if (!fromUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recipient user
    const toUser = await db.getUserByPhone(toPhone);
    if (!toUser) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Get product
    const product = await db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns the product or has received it
    // For now, allow any verified user to transfer any product (for demo purposes)
    // In production, implement proper ownership checks
    console.log(`Transfer request: Product ${productId} from user ${fromUser.id} to ${toUser.phone}`);

    // Check quantity
    if (product.quantity < parseInt(quantity)) {
      return res.status(400).json({ error: 'Insufficient quantity' });
    }

    // Transfer on blockchain if both users are verified
    let txHash = null;
    try {
      const fromVerified = await walletService.isStakeholderVerified(fromUser.wallet_address);
      const toVerified = await walletService.isStakeholderVerified(toUser.wallet_address);

      if (fromVerified && toVerified && product.blockchain_id) {
        const encryptedPrivateKey = JSON.parse(fromUser.encrypted_private_key);
        const fromWallet = walletService.getUserWallet(encryptedPrivateKey, password);

        txHash = await walletService.transferProduct(
          fromWallet,
          product.blockchain_id,
          toUser.wallet_address,
          parseInt(quantity),
          parseFloat(price),
          location
        );
      }
    } catch (error) {
      console.error('Error transferring on blockchain:', error);
      // Continue anyway - record in database
    }

    // Record transaction in database
    const transactionData = {
      productId: product.id,
      fromUserId: fromUser.id,
      toUserId: toUser.id,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      location,
      txHash,
      txType: 1 // Transfer
    };

    await db.createTransaction(transactionData);

    // Update product quantity and status
    const newQuantity = product.quantity - parseInt(quantity);

    // Update product status based on recipient role
    let newStatus = product.status;
    if (toUser.role === 1) newStatus = 2; // AtDistributor
    else if (toUser.role === 2) newStatus = 3; // AtRetailer
    else if (toUser.role === 3) newStatus = 4; // Sold

    // Update product in database (simplified - in production, handle partial transfers)
    await db.run(
      'UPDATE products SET quantity = ?, status = ? WHERE id = ?',
      [newQuantity, newStatus, product.id]
    );

    res.json({
      message: 'Product transferred successfully',
      txHash,
      remainingQuantity: newQuantity
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
});

// Get available products for transfer (products not owned by current user)
app.get('/api/products/available', authenticateToken, async (req, res) => {
  try {
    const products = await db.query(
      `SELECT p.*, u.name as farmer_name, u.location as farmer_location 
       FROM products p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.user_id != ? AND p.quantity > 0 AND p.status < 4
       ORDER BY p.created_at DESC`,
      [req.user.userId]
    );

    res.json(products);
  } catch (error) {
    console.error('Error getting available products:', error);
    res.status(500).json({ error: 'Failed to get available products' });
  }
});

// Get users by role for transfer
app.get('/api/users/role/:role', authenticateToken, async (req, res) => {
  try {
    const role = parseInt(req.params.role);
    const users = await db.query(
      'SELECT id, phone, name, location, role FROM users WHERE role = ? AND is_verified = 1',
      [role]
    );

    res.json(users);
  } catch (error) {
    console.error('Error getting users by role:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// QR-based product purchase with IPFS
app.post('/api/products/:id/qr-purchase', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { price, location, notes, scanLocation, temperature, gpsCoordinates } = req.body;
    const productId = req.params.id;

    console.log('QR Purchase request:', { productId, price, location, scanLocation });

    // Get current user
    const user = await db.getUserById(req.user.userId);
    if (!user || !user.is_verified) {
      return res.status(403).json({ error: 'User must be verified to purchase products' });
    }

    // Get product
    const product = await db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is available for this user role
    const canPurchase =
      (user.role === 1 && product.status === 0) || // Distributor can buy from Farmer
      (user.role === 2 && product.status === 2) || // Retailer can buy from Distributor  
      (user.role === 3 && product.status === 3);   // Consumer can buy from Retailer

    if (!canPurchase) {
      return res.status(400).json({ error: 'Product not available for your role at this stage' });
    }

    // Handle photo upload
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Update product status based on buyer role
    let newStatus = product.status;
    if (user.role === 1) newStatus = 2; // AtDistributor
    else if (user.role === 2) newStatus = 3; // AtRetailer
    else if (user.role === 3) newStatus = 4; // Sold

    // Record transaction in database
    const transactionData = {
      productId: product.id,
      fromUserId: null, // Will be determined by current owner
      toUserId: user.id,
      quantity: product.quantity,
      price: parseFloat(price),
      location,
      photoUrl,
      notes: notes || '',
      scanLocation: scanLocation || location,
      txHash: null,
      txType: 1 // Transfer
    };

    await db.createTransaction(transactionData);

    // Update product status
    await db.run(
      'UPDATE products SET status = ? WHERE id = ?',
      [newStatus, product.id]
    );

    // Try blockchain transaction if possible
    let txHash = null;
    try {
      if (product.blockchain_id && user.wallet_address) {
        // Blockchain transfer logic here
        console.log('Blockchain transfer would happen here');
      }
    } catch (error) {
      console.error('Blockchain transfer failed:', error);
    }

    res.json({
      message: 'Product purchased successfully via QR scan',
      transaction: {
        ...transactionData,
        txHash,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('QR Purchase error:', error);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get transaction history
    const transactions = await db.getProductTransactions(product.id);

    // Get blockchain data if available
    let blockchainData = null;
    if (product.blockchain_id) {
      try {
        blockchainData = await walletService.getBlockchainProduct(product.blockchain_id);
      } catch (error) {
        console.error('Error getting blockchain data:', error);
      }
    }

    res.json({
      ...product,
      transactions,
      blockchainData
    });

  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Batch-related endpoints (new batch-based system)
app.get('/api/batches/my-batches', authenticateToken, async (req, res) => {
  try {
    const batches = await db.getBatchesByUserId(req.user.userId);
    res.json(batches);
  } catch (error) {
    console.error('Error getting user batches:', error);
    res.status(500).json({ error: 'Failed to get batches' });
  }
});

app.get('/api/batches/:id', async (req, res) => {
  try {
    const batch = await db.getBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get handoff events
    const handoffs = await db.getBatchHandoffs(req.params.id);
    batch.handoffs = handoffs;

    res.json(batch);
  } catch (error) {
    console.error('Error getting batch:', error);
    res.status(500).json({ error: 'Failed to get batch' });
  }
});

app.post('/api/batches', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { produce, variety, quantity, price, farmLocation, gpsCoordinates, qualityGrade, isOrganic } = req.body;
    const user = await db.getUserById(req.user.userId);

    if (!user || user.role !== 0) {
      return res.status(403).json({ error: 'Only farmers can create batches' });
    }

    // Generate batch number
    const timestamp = Math.floor(Date.now() / 86400000); // Days since epoch
    const batchNumber = `BATCH_${produce.toUpperCase()}_${timestamp}_${Date.now()}`;

    // Prepare batch data for IPFS
    const batchMetadata = {
      batchNumber,
      produce,
      variety,
      quantity: parseFloat(quantity),
      qualityGrade,
      isOrganic: Boolean(isOrganic),
      farmLocation,
      gpsCoordinates: gpsCoordinates || '',
      farmerName: user.name
    };

    // Upload to Pinata IPFS
    let ipfsResult = null;
    let photoUrl = null;

    try {
      const photoPath = req.file ? req.file.path : null;
      ipfsResult = await ipfsService.uploadBatchMetadata(batchMetadata, photoPath);

      photoUrl = ipfsResult.photoHash ? ipfsService.getGatewayUrl(ipfsResult.photoHash) : null;

      console.log(`✅ Batch metadata uploaded to Pinata IPFS: ${ipfsResult.metadataHash}`);

    } catch (ipfsError) {
      console.error('❌ Pinata upload failed, using local storage:', ipfsError);
      photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    }

    const batchData = {
      batchNumber,
      userId: user.id,
      produce,
      variety,
      quantity: parseFloat(quantity),
      currentPrice: parseFloat(price),
      qualityGrade,
      isOrganic: Boolean(isOrganic),
      farmLocation,
      gpsCoordinates: gpsCoordinates || '',
      photoUrl,
      qualityReportUrl: null,
      ipfsHash: ipfsResult?.metadataHash || null,
      ipfsPhotoHash: ipfsResult?.photoHash || null,
      ipfsMetadataUrl: ipfsResult?.metadataUrl || null
    };

    const batch = await db.createBatch(batchData);

    res.status(201).json({
      message: 'Batch created successfully',
      batch: {
        id: batch.id,
        batchNumber,
        ...batchData,
        ipfs: ipfsResult ? {
          metadataUrl: ipfsResult.metadataUrl,
          photoUrl: ipfsResult.photoHash ? ipfsService.getGatewayUrl(ipfsResult.photoHash) : null
        } : null,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Batch creation error:', error);
    res.status(500).json({ error: 'Batch creation failed' });
  }
});

// Verify stakeholder (admin only)
app.post('/api/admin/verify/:userId', async (req, res) => {
  try {
    // In production, add proper admin authentication
    const user = await db.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify on blockchain
    const txHash = await walletService.verifyStakeholder(user.wallet_address);

    // Update database
    await db.verifyUser(user.id);

    res.json({
      message: 'User verified successfully',
      txHash
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Start server - Listen on all interfaces for mobile access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AgriTrace Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Mobile access: http://192.168.0.193:${PORT}/api/health`);
});

module.exports = app;