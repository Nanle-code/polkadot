import React from 'react';
import { Wallet, AlertCircle, Loader2 } from 'lucide-react';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface WalletConnectionProps {
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  setSelectedAccount: (account: InjectedAccountWithMeta) => void;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({
  accounts,
  selectedAccount,
  setSelectedAccount,
  isConnecting,
  error,
  connectWallet,
  isConnected,
}) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  if (!isConnected) {
    return (
      <div className="card max-w-md mx-auto">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your Polkadot wallet to interact with crowdfunding campaigns
          </p>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="btn-primary w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium">Connected Wallet</p>
            <p className="text-xs text-gray-500">
              {selectedAccount ? formatAddress(selectedAccount.address) : 'No account selected'}
            </p>
          </div>
        </div>
        
        {accounts.length > 1 && (
          <select
            value={selectedAccount?.address || ''}
            onChange={(e) => {
              const account = accounts.find(acc => acc.address === e.target.value);
              if (account) setSelectedAccount(account);
            }}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            {accounts.map((account) => (
              <option key={account.address} value={account.address}>
                {account.meta.name} ({formatAddress(account.address)})
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};