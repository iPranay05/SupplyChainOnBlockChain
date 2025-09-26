import { ethers } from 'ethers';
import { getSigner, getProvider } from './web3';

// These will be populated after contract deployment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const CONTRACT_ABI = []; // Will be imported from artifacts

let contract = null;

export const initContract = async () => {
  try {
    // Import contract ABI and address
    const contractAddress = await import('../contracts/contract-address.json');
    const contractABI = await import('../contracts/AgriTrace.json');
    
    const signer = getSigner();
    if (!signer) throw new Error('No signer available');
    
    contract = new ethers.Contract(
      contractAddress.AgriTrace,
      contractABI.abi,
      signer
    );
    
    return contract;
  } catch (error) {
    console.error('Error initializing contract:', error);
    throw error;
  }
};

export const getContract = () => {
  if (!contract) {
    throw new Error('Contract not initialized. Call initContract() first.');
  }
  return contract;
};

// Stakeholder functions
export const registerStakeholder = async (name, location, role) => {
  const contract = getContract();
  const tx = await contract.registerStakeholder(name, location, role);
  return await tx.wait();
};

export const getStakeholder = async (address) => {
  const contract = getContract();
  return await contract.getStakeholder(address);
};

// Product functions
export const registerProduct = async (productData) => {
  const contract = getContract();
  const {
    name,
    variety,
    farmLocation,
    quantity,
    qualityGrade,
    isOrganic,
    price,
    ipfsHash
  } = productData;
  
  const tx = await contract.registerProduct(
    name,
    variety,
    farmLocation,
    quantity,
    qualityGrade,
    isOrganic,
    ethers.utils.parseEther(price.toString()),
    ipfsHash
  );
  
  return await tx.wait();
};

export const getProduct = async (productId) => {
  const contract = getContract();
  return await contract.getProduct(productId);
};

export const getAllProducts = async () => {
  const contract = getContract();
  return await contract.getAllProducts();
};

export const getProductsByFarmer = async (farmerAddress) => {
  const contract = getContract();
  return await contract.getProductsByFarmer(farmerAddress);
};

export const transferProduct = async (productId, to, quantity, price, location) => {
  const contract = getContract();
  const tx = await contract.transferProduct(
    productId,
    to,
    quantity,
    ethers.utils.parseEther(price.toString()),
    location
  );
  return await tx.wait();
};

export const getProductTransactions = async (productId) => {
  const contract = getContract();
  return await contract.getProductTransactions(productId);
};

export const getProductOwnershipHistory = async (productId) => {
  const contract = getContract();
  return await contract.getProductOwnershipHistory(productId);
};

export const updateQuality = async (productId, newGrade) => {
  const contract = getContract();
  const tx = await contract.updateQuality(productId, newGrade);
  return await tx.wait();
};

export const updatePrice = async (productId, newPrice) => {
  const contract = getContract();
  const tx = await contract.updatePrice(
    productId,
    ethers.utils.parseEther(newPrice.toString())
  );
  return await tx.wait();
};

// Utility functions
export const formatPrice = (priceInWei) => {
  return ethers.utils.formatEther(priceInWei);
};

export const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

export const getStakeholderRole = (roleNumber) => {
  const roles = ['Farmer', 'Distributor', 'Retailer', 'Consumer'];
  return roles[roleNumber] || 'Unknown';
};

export const getProductStatus = (statusNumber) => {
  const statuses = ['Harvested', 'InTransit', 'AtDistributor', 'AtRetailer', 'Sold'];
  return statuses[statusNumber] || 'Unknown';
};