const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Deploying AgriTrace contract...");

  // Check if private key is loaded
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in .env file");
    console.log("Please add your private key to the .env file:");
    console.log("PRIVATE_KEY=your_private_key_here");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  
  if (!deployer) {
    console.error("❌ No deployer account found. Check your private key and network configuration.");
    process.exit(1);
  }

  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "MATIC");
  
  if (balance.eq(0)) {
    console.error("❌ Account has no MATIC. Please get test MATIC from the faucet:");
    console.log("https://faucet.polygon.technology/");
    process.exit(1);
  }

  const AgriTrace = await ethers.getContractFactory("AgriTrace");
  const agriTrace = await AgriTrace.deploy();

  await agriTrace.deployed();

  console.log("AgriTrace contract deployed to:", agriTrace.address);
  
  // Save contract address and ABI for frontend
  const fs = require('fs');
  const contractsDir = './frontend/contracts';

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    contractsDir + '/contract-address.json',
    JSON.stringify({ AgriTrace: agriTrace.address }, undefined, 2)
  );

  const AgriTraceArtifact = artifacts.readArtifactSync("AgriTrace");

  fs.writeFileSync(
    contractsDir + '/AgriTrace.json',
    JSON.stringify(AgriTraceArtifact, null, 2)
  );

  console.log("Contract address and ABI saved to frontend/contracts/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });