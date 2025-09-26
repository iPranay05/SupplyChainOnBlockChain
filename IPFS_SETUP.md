# 🌐 IPFS Integration Setup Guide

## What is IPFS?

IPFS (InterPlanetary File System) is a **decentralized storage network** that stores files across multiple nodes, making them:
- ✅ **Immutable** - Files can't be changed once uploaded
- ✅ **Decentralized** - No single point of failure
- ✅ **Permanent** - Files stay available as long as nodes pin them
- ✅ **Verifiable** - Each file gets a unique hash for verification

## 🥔 Perfect for Agricultural Supply Chain

### What We Store on IPFS:
1. **Product Photos** - Farm photos, harvest images
2. **Quality Reports** - Lab test results, certifications
3. **Handoff Photos** - Transport, delivery, shelf photos
4. **Batch Metadata** - Complete product information
5. **Supply Chain Events** - Detailed handoff records

### Benefits:
- **Tamper-Proof**: Photos and documents can't be altered
- **Always Available**: Distributed across multiple nodes
- **Cost-Effective**: Much cheaper than storing on blockchain
- **Transparent**: Anyone can verify file authenticity

## 🚀 Setup Options

### Option 1: Infura IPFS (Recommended for Production)

1. **Sign up at [Infura.io](https://infura.io/)**
2. **Create new IPFS project**
3. **Get your credentials**:
   - Project ID: `2ABC123...`
   - Project Secret: `xyz789...`

4. **Update backend/.env**:
```env
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https
IPFS_PROJECT_ID=your_project_id_here
IPFS_PROJECT_SECRET=your_project_secret_here
```

### Option 2: Local IPFS Node (For Development)

1. **Install IPFS**:
```bash
# Download from https://ipfs.io/
# Or use package manager
brew install ipfs  # macOS
```

2. **Initialize and start**:
```bash
ipfs init
ipfs daemon
```

3. **Update backend/.env**:
```env
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http
# No credentials needed for local node
```

### Option 3: Public Gateway (Testing Only)

For testing, the system will fallback to local file storage if IPFS fails.

## 📱 How It Works in AgriTrace

### 1. Farmer Creates Potato Batch
```
Raju uploads potato photo → IPFS stores image → Returns hash: QmABC123...
System creates metadata → IPFS stores JSON → Returns hash: QmXYZ789...
Blockchain stores IPFS hashes → Immutable reference to decentralized data
```

### 2. Supply Chain Handoffs
```
Distributor scans QR → Takes transport photo → IPFS stores image
System creates handoff event → IPFS stores metadata → Blockchain records hash
Consumer scans QR → Retrieves all IPFS data → Complete transparent history
```

## 🔍 Verification Process

### Anyone Can Verify:
1. **Get IPFS hash** from blockchain transaction
2. **Visit IPFS gateway**: `https://ipfs.io/ipfs/QmABC123...`
3. **View original file** - exactly as uploaded
4. **Verify authenticity** - hash proves file hasn't changed

### Example URLs:
- **Photo**: `https://ipfs.io/ipfs/QmPhotoHash123`
- **Metadata**: `https://ipfs.io/ipfs/QmMetadataHash456`
- **Quality Report**: `https://ipfs.io/ipfs/QmReportHash789`

## 💰 Cost Comparison

| Storage Method | Cost | Immutability | Decentralization |
|----------------|------|--------------|------------------|
| **Local Server** | Low | ❌ No | ❌ No |
| **Cloud Storage** | Medium | ❌ No | ❌ No |
| **Blockchain** | Very High | ✅ Yes | ✅ Yes |
| **IPFS** | Low | ✅ Yes | ✅ Yes |

## 🛠️ Installation

```bash
# Install IPFS dependency
cd backend
npm install ipfs-http-client@60.0.1

# Start backend with IPFS
npm start
```

## 🔧 Configuration

The system automatically:
- ✅ **Uploads files to IPFS** when available
- ✅ **Falls back to local storage** if IPFS fails
- ✅ **Pins important content** to ensure availability
- ✅ **Stores IPFS hashes** on blockchain for verification

## 🌟 Benefits for Users

### For Farmers:
- **Permanent Records**: Photos and documents never disappear
- **Proof of Quality**: Immutable quality reports and certifications
- **Global Access**: Files accessible from anywhere in the world

### For Supply Chain:
- **Tamper-Proof Documentation**: All handoff photos and documents immutable
- **Transparent History**: Complete audit trail with verifiable evidence
- **Cost Effective**: Much cheaper than storing everything on blockchain

### For Consumers:
- **Complete Transparency**: Access all original photos and documents
- **Verify Authenticity**: Confirm files haven't been altered
- **Trust Building**: See real evidence of product journey

## 🚀 Ready to Use!

Once configured, the system automatically:
1. **Uploads all photos to IPFS**
2. **Creates immutable metadata records**
3. **Stores IPFS hashes on blockchain**
4. **Provides transparent access to all stakeholders**

**Result**: Complete decentralized transparency for the entire agricultural supply chain! 🌾⛓️✨