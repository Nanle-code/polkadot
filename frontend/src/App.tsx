import React, { useState } from 'react';
import { Heart, Github, ExternalLink } from 'lucide-react';
import { usePolkadot } from './hooks/usePolkadot';
import { WalletConnection } from './components/WalletConnection';
import { CreateCampaign } from './components/CreateCampaign';
import { CampaignList } from './components/CampaignList';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const {
    api,
    accounts,
    selectedAccount,
    setSelectedAccount,
    isConnecting,
    error,
    connectWallet,
    getSigner,
    isConnected,
  } = usePolkadot();

  const handleCampaignCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CrowdFund</h1>
                <p className="text-xs text-gray-500">Decentralized Crowdfunding</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/your-repo/crowdfunding-contract"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              
              {isConnected && (
                <CreateCampaign
                  api={api}
                  account={selectedAccount}
                  getSigner={getSigner}
                  onCampaignCreated={handleCampaignCreated}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Decentralized Crowdfunding Platform
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Create and support crowdfunding campaigns on the blockchain. 
                Transparent, secure, and decentralized funding for everyone.
              </p>
            </div>
            
            <WalletConnection
              accounts={accounts}
              selectedAccount={selectedAccount}
              setSelectedAccount={setSelectedAccount}
              isConnecting={isConnecting}
              error={error}
              connectWallet={connectWallet}
              isConnected={isConnected}
            />

            {/* Features Section */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Transparent</h3>
                <p className="text-sm text-gray-600">
                  All transactions and campaign details are recorded on the blockchain for complete transparency.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
                <p className="text-sm text-gray-600">
                  Smart contracts ensure funds are only released when campaign goals are met.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Github className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Decentralized</h3>
                <p className="text-sm text-gray-600">
                  No central authority controls your campaigns. You have full ownership and control.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <WalletConnection
              accounts={accounts}
              selectedAccount={selectedAccount}
              setSelectedAccount={setSelectedAccount}
              isConnecting={isConnecting}
              error={error}
              connectWallet={connectWallet}
              isConnected={isConnected}
            />
            
            <CampaignList
              api={api}
              account={selectedAccount}
              getSigner={getSigner}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Built with Ink! Smart Contracts and React</p>
            <p className="mt-1">
              Powered by Polkadot • Open Source • Decentralized
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;