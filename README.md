# AgriTrace - Blockchain Agricultural Supply Chain Transparency

A comprehensive blockchain-based agricultural supply chain tracking system that provides complete farm-to-table transparency. Built with Next.js, Node.js, and Ethereum smart contracts.

## 🥔 Real-World Example: Potato Supply Chain

**Scenario**: Complete traceability from Raju's farm in Nashik to Priya's kitchen in Mumbai

### Step-by-Step Workflow

1. **🌾 Farm Stage (Farmer: Raju)**
   - Harvests 100kg of potatoes in Nashik
   - Creates Batch #POTATO_20250922_001 with GPS coordinates
   - Uploads quality report and farm photos
   - Generates unique QR code for the batch
   - Records: Grade A, Organic, ₹15/kg farm price

2. **🚛 Logistics Handoff (Distributor: FreshMove Logistics)**
   - Scans QR code at pickup: "Picked up by FreshMove, 11:00 AM, Temp: 18°C"
   - GPS location and temperature logged during transport
   - Each warehouse entry/exit triggers automatic logging
   - Updates price to ₹20/kg (₹5 markup for logistics)

3. **🏪 Retailer Receive (Retailer: CityMarket Store)**
   - Scans QR on arrival: "Received by CityMarket, 7:00 PM"
   - Uploads shelf photo and sets retail price ₹25/kg
   - Blockchain records retailer as current holder
   - Only ₹5 markup from distributor to shelf

4. **🛒 Consumer Trace (Consumer: Priya)**
   - Scans QR code on potato pack
   - Sees complete journey: Nashik → FreshMove → CityMarket
   - Views all photos, timestamps, and GPS locations
   - Verifies fair pricing: only ₹10 total markup from farm
   - Accesses quality reports and farm certifications

## ✨ Key Features

- **🔗 Blockchain Immutability**: All handoffs recorded on Ethereum
- **📱 QR Code Tracking**: Single QR per batch tracks entire journey
- **📍 GPS & Temperature Logging**: Real-time location and condition monitoring
- **📸 Photo Documentation**: Visual proof at every supply chain step
- **🌐 IPFS Decentralized Storage**: Tamper-proof photos and documents
- **💰 Price Transparency**: See exact markup at each stage
- **🏷️ Batch-Based System**: Better tracking than individual products
- **👥 Multi-Role Access**: Farmers, Distributors, Retailers, Consumers
- **🔐 Custodial Wallets**: Simplified blockchain for non-tech users

## 🛠️ Tech Stack

- **Frontend**: Next.js 13, React, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, SQLite
- **Blockchain**: Hardhat, Ethereum, Solidity
- **Decentralized Storage**: IPFS with Infura integration
- **Authentication**: JWT tokens with role-based access
- **File Storage**: IPFS + Local filesystem fallback
- **QR Generation**: Built-in QR code generation and scanning

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd agritrace
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

### 2. Environment Setup
```bash
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
```

### 3. Start Blockchain Network
```bash
npx hardhat node
```

### 4. Deploy Smart Contracts
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 5. Configure IPFS (Optional but Recommended)
```bash
# For production: Sign up at https://infura.io/
# Add IPFS credentials to backend/.env:
IPFS_PROJECT_ID=your_infura_project_id
IPFS_PROJECT_SECRET=your_infura_project_secret

# For development: Install local IPFS node
# See IPFS_SETUP.md for detailed instructions
```

### 6. Start Backend Server
```bash
cd backend
npm install  # Install IPFS dependencies
npm start
```

### 7. Start Frontend
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 📊 System Architecture

### Enhanced Smart Contract (AgriTrace.sol)
```solidity
struct Batch {
    uint256 id;
    string batchNumber;      // BATCH_POTATO_20250922_001
    string produce;          // "Potato"
    string gpsCoordinates;   // "19.9975,73.7898"
    address currentHolder;   // Current custody holder
    BatchStatus status;      // Harvested → InTransit → AtRetailer → Sold
}

struct HandoffEvent {
    string eventType;        // "Pickup", "Transit", "Delivery", "Sale"
    string temperature;      // "18°C"
    string gpsCoordinates;   // Location of handoff
    string photoHash;        // IPFS hash of photos
    uint256 timestamp;       // Blockchain timestamp
}
```

### Database Schema (Batch-Based)
- **Batches Table**: Replaces products for better supply chain tracking
- **Handoff Events Table**: Detailed event logging with GPS and temperature
- **Users Table**: Enhanced with GPS coordinates and locations
- **QR Codes Table**: Links QR codes to specific batches

### Role-Based Dashboards
1. **Farmer Dashboard**: Batch creation, GPS tracking, quality reports
2. **Distributor Dashboard**: QR scanning, temperature logging, route tracking
3. **Retailer Dashboard**: Inventory management, shelf photos, price setting
4. **Consumer Dashboard**: Complete supply chain visualization

## 🔄 Supply Chain Flow

```
🌾 FARMER (Raju, Nashik)
   ↓ Creates batch with GPS + photos
   ↓ Generates QR code
   
🚛 DISTRIBUTOR (FreshMove)
   ↓ Scans QR → Records pickup
   ↓ Temperature + GPS logging
   
🏪 RETAILER (CityMarket)
   ↓ Scans QR → Records delivery
   ↓ Shelf photo + price update
   
🛒 CONSUMER (Priya)
   ↓ Scans QR → Views complete history
   ✅ Full transparency achieved
```

## 📱 QR Code System

Each batch gets a unique QR code containing:
```json
{
  "batchId": 1,
  "batchNumber": "BATCH_POTATO_20250922_001",
  "produce": "Potato",
  "farmer": "Raju",
  "farmLocation": "Nashik"
}
```

## 🔐 What's Recorded on Blockchain

- ✅ All custody changes with timestamps
- ✅ Price changes at each supply chain step
- ✅ GPS coordinates of all handoffs
- ✅ Temperature readings during transport
- ✅ Immutable hashes of photos and documents
- ✅ Quality grade updates and certifications

## 🌟 Benefits

### For Farmers
- **Fair Price Discovery**: See if distributors/retailers are pricing fairly
- **Quality Assurance**: Prove organic/quality claims with blockchain
- **Direct Market Access**: Consumers can trace back to specific farms

### For Distributors/Retailers
- **Supply Chain Efficiency**: Track inventory and optimize routes
- **Quality Control**: Monitor temperature and handling conditions
- **Consumer Trust**: Provide transparency that builds brand loyalty

### For Consumers
- **Complete Transparency**: Know exactly where food comes from
- **Fair Pricing**: See markup at each stage, ensure fair pricing
- **Quality Verification**: Access quality reports and certifications
- **Food Safety**: Track handling conditions and storage temperatures

## 🧪 Testing

```bash
# Test smart contracts
npx hardhat test

# Test backend APIs
cd backend && npm test

# Test frontend components
cd frontend && npm test
```

## 📚 API Documentation

### Batch Operations
- `POST /api/batches` - Create new batch (Farmers)
- `GET /api/batches/:id` - Get batch details
- `POST /api/batches/:id/handoff` - Record handoff event

### QR Operations
- `GET /api/qr/:batchId` - Generate QR code
- `POST /api/qr/scan` - Process QR scan

### Supply Chain Tracking
- `GET /api/batches/:id/history` - Complete supply chain history
- `GET /api/batches/:id/handoffs` - All handoff events

## 🏗️ Project Structure

```
├── contracts/              # Solidity smart contracts
│   └── AgriTrace.sol       # Enhanced batch-based contract
├── frontend/               # Next.js application
│   ├── components/         # React components
│   │   ├── FarmerDashboard.js
│   │   ├── DistributorDashboard.js
│   │   ├── RetailerDashboard.js
│   │   └── ConsumerDashboard.js
│   ├── pages/             # Next.js pages
│   │   ├── qr-purchase.js # QR scanning interface
│   │   └── universal-dashboard.js
│   └── utils/             # Web3 utilities
├── backend/               # Node.js backend
│   ├── server.js          # Express server
│   ├── database.js        # SQLite database
│   └── walletService.js   # Custodial wallet management
├── scripts/               # Deployment scripts
└── hardhat.config.js      # Hardhat configuration
```

## 🔧 Configuration

### Environment Variables

**Root `.env`:**
```env
PRIVATE_KEY=your_private_key_for_deployment
INFURA_PROJECT_ID=your_infura_project_id
```

**Backend `.env`:**
```env
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
PORT=3002
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
```

## 🚀 Deployment

### Local Development
```bash
# Start all services
npm run dev:all

# Or start individually
npm run blockchain  # Hardhat node
npm run backend     # Backend server
npm run frontend    # Next.js app
```

### Production Deployment
```bash
# Deploy to mainnet
npm run deploy:mainnet

# Update environment variables
# Deploy backend to your server
# Deploy frontend to Vercel/Netlify
```

## 🔐 Security Features

- **Role-Based Access Control**: Strict permissions for each stakeholder type
- **Custodial Wallet Security**: Encrypted private key storage
- **Blockchain Immutability**: Tamper-proof supply chain records
- **GPS Verification**: Location-based authenticity checks
- **Photo Verification**: Visual proof at each handoff

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] IPFS integration for decentralized photo storage
- [ ] Mobile app for farmers and distributors
- [ ] IoT sensor integration for automated temperature logging
- [ ] AI-powered quality assessment
- [ ] Multi-language support for global adoption
- [ ] Carbon footprint tracking
- [ ] Integration with payment systems

---

**Built with ❤️ for agricultural transparency and fair trade**