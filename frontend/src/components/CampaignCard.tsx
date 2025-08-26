import React, { useState } from 'react';
import { Calendar, Target, Users, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import type { CampaignWithId } from '../types/contract';
import type { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface CampaignCardProps {
  campaign: CampaignWithId;
  api: ApiPromise | null;
  account: InjectedAccountWithMeta | null;
  getSigner: (account: InjectedAccountWithMeta) => Promise<any>;
  currentBlock: number;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  api,
  account,
  getSigner,
  currentBlock,
}) => {
  const [contributionAmount, setContributionAmount] = useState('');
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const { contribute, isLoading, error } = useContract(api, account);

  const goalAmount = parseFloat(campaign.goal) || 0;
  const raisedAmount = parseFloat(campaign.raised) || 0;
  const progressPercentage = goalAmount > 0 ? Math.min((raisedAmount / goalAmount) * 100, 100) : 0;
  
  const isExpired = currentBlock >= campaign.deadline;
  const isGoalReached = raisedAmount >= goalAmount;
  const canContribute = campaign.active && !isExpired && !isGoalReached && account;

  const formatTokenAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getStatusBadge = () => {
    if (isGoalReached) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Goal Reached</span>;
    }
    if (isExpired) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Expired</span>;
    }
    if (campaign.active) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Active</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>;
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !contributionAmount) return;

    try {
      setSuccess(false);
      await contribute(campaign.id, contributionAmount, getSigner);
      setSuccess(true);
      setContributionAmount('');
      setShowContributeForm(false);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to contribute:', err);
    }
  };

  return (
    <div className="card hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{campaign.title}</h3>
          <p className="text-sm text-gray-600">by {formatAddress(campaign.creator)}</p>
        </div>
        {getStatusBadge()}
      </div>

      <p className="text-gray-700 text-sm mb-4 line-clamp-3">{campaign.description}</p>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">
            {formatTokenAmount(raisedAmount)} / {formatTokenAmount(goalAmount)} tokens
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="progress-bar h-2 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="text-xs text-gray-500 text-right">
          {progressPercentage.toFixed(1)}% funded
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <Target className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Goal</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Block {campaign.deadline}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Contributors</span>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg mb-3">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Contribution successful!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg mb-3">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {canContribute && (
        <div className="space-y-3">
          {!showContributeForm ? (
            <button
              onClick={() => setShowContributeForm(true)}
              className="btn-primary w-full"
            >
              Contribute
            </button>
          ) : (
            <form onSubmit={handleContribute} className="space-y-3">
              <input
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="input"
                placeholder="Amount to contribute"
                min="0"
                step="0.01"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowContributeForm(false);
                    setContributionAmount('');
                  }}
                  className="btn-secondary flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isLoading || !contributionAmount}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Contributing...
                    </>
                  ) : (
                    'Contribute'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!canContribute && account && (
        <div className="text-center text-sm text-gray-500 py-2">
          {isGoalReached ? 'Goal reached!' : isExpired ? 'Campaign expired' : 'Campaign inactive'}
        </div>
      )}
    </div>
  );
};