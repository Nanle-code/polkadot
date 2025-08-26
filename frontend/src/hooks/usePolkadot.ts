import { useState, useEffect } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

export const usePolkadot = () => {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connectToNode = async () => {
      try {
        setIsConnecting(true);
        // Connect to local substrate node (adjust URL as needed)
        const wsProvider = new WsProvider('ws://127.0.0.1:9944');
        const api = await ApiPromise.create({ provider: wsProvider });
        setApi(api);
        setError(null);
      } catch (err) {
        console.error('Failed to connect to node:', err);
        setError('Failed to connect to Substrate node. Make sure your node is running on ws://127.0.0.1:9944');
      } finally {
        setIsConnecting(false);
      }
    };

    connectToNode();
  }, []);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Enable the extension
      const extensions = await web3Enable('Crowdfunding DApp');
      if (extensions.length === 0) {
        throw new Error('No Polkadot extension found. Please install Polkadot.js extension.');
      }

      // Get accounts
      const accounts = await web3Accounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please create an account in your Polkadot extension.');
      }

      setAccounts(accounts);
      setSelectedAccount(accounts[0]);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const getSigner = async (account: InjectedAccountWithMeta) => {
    const injector = await web3FromAddress(account.address);
    return injector.signer;
  };

  return {
    api,
    accounts,
    selectedAccount,
    setSelectedAccount,
    isConnecting,
    error,
    connectWallet,
    getSigner,
    isConnected: !!selectedAccount && !!api,
  };
};