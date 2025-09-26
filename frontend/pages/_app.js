import '../styles/globals.css';
import { useState, useEffect, createContext, useContext } from 'react';
import { connectWallet, disconnectWallet } from '../utils/web3';
import { initContract } from '../utils/contract';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

function MyApp({ Component, pageProps }) {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contract, setContract] = useState(null);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const walletInfo = await connectWallet();
      setAccount(walletInfo);
      
      // Initialize contract
      const contractInstance = await initContract();
      setContract(contractInstance);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    await disconnectWallet();
    setAccount(null);
    setContract(null);
  };

  useEffect(() => {
    // Check if wallet was previously connected
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            connect();
          }
        });
    }
  }, []);

  const value = {
    account,
    contract,
    isConnecting,
    connect,
    disconnect
  };

  return (
    <Web3Context.Provider value={value}>
      <Component {...pageProps} />
    </Web3Context.Provider>
  );
}

export default MyApp;