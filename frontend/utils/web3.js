import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

let web3Modal;
let provider;
let signer;

if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'mainnet',
    cacheProvider: true,
    providerOptions: {}
  });
}

export const connectWallet = async () => {
  try {
    const instance = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(instance);
    signer = provider.getSigner();

    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    return {
      address,
      network: network.name,
      chainId: network.chainId
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const disconnectWallet = async () => {
  if (web3Modal) {
    web3Modal.clearCachedProvider();
  }
  provider = null;
  signer = null;
};

export const getProvider = () => provider;
export const getSigner = () => signer;

export const switchNetwork = async (chainId) => {
  if (!provider) throw new Error('No provider available');

  try {
    await provider.send('wallet_switchEthereumChain', [
      { chainId: ethers.utils.hexValue(chainId) }
    ]);
  } catch (error) {
    if (error.code === 4902) {
      // Network not added to wallet
      const networkData = getNetworkData(chainId);
      await provider.send('wallet_addEthereumChain', [networkData]);
    } else {
      throw error;
    }
  }
};

const getNetworkData = (chainId) => {
  const networks = {
    43113: {
      chainId: '0xa869',
      chainName: 'Avalanche Fuji Testnet',
      nativeCurrency: {
        name: 'AVAX',
        symbol: 'AVAX',
        decimals: 18
      },
      rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
      blockExplorerUrls: ['https://testnet.snowtrace.io/']
    },
    11155111: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia Testnet',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://sepolia.infura.io/v3/97dc4ec7d01547e385dc496b41aeef7c'],
      blockExplorerUrls: ['https://sepolia.etherscan.io/']
    },
    137: {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      },
      rpcUrls: ['https://polygon-rpc.com/'],
      blockExplorerUrls: ['https://polygonscan.com/']
    },
    80002: {
      chainId: '0x13882',
      chainName: 'Polygon Amoy Testnet',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      },
      rpcUrls: ['https://rpc-amoy.polygon.technology/'],
      blockExplorerUrls: ['https://amoy.polygonscan.com/']
    },
    80001: {
      chainId: '0x13881',
      chainName: 'Mumbai Testnet',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      },
      rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
      blockExplorerUrls: ['https://mumbai.polygonscan.com/']
    }
  };

  return networks[chainId];
};