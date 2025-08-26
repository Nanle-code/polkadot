import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { CampaignCard } from './CampaignCard';
import { useContract } from '../hooks/useContract';
import type { CampaignWithId } from '../types/contract';
import type { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface CampaignListProps {
  api: ApiPromise | null;
  account: InjectedAccountWithMeta | null;
  getSigner: (account: InjectedAccountWithMeta) => Promise<any>;
  refreshTrigger: number;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  api,
  account,
  getSigner,
  refreshTrigger,
}) => {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<CampaignWithId[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'expired'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentBlock, setCurrentBlock] = useState(0);

  const { getCampaign, getCampaignCount } = useContract(api, account);

  useEffect(() => {
    const getCurrentBlock = async () => {
      if (!api) return;
      try {
        const header = await api.rpc.chain.getHeader();
        setCurrentBlock(header.number.toNumber());
      } catch (err) {
        console.error('Failed to get current block:', err);
      }
    };

    getCurrentBlock();
    const interval = setInterval(getCurrentBlock, 6000); // Update every 6 seconds (approximate block time)
    return () => clearInterval(interval);
  }, [api]);

  useEffect(() => {
    const loadCampaigns = async () => {
      if (!api) return;
      
      setIsLoading(true);
      try {
        const count = await getCampaignCount();
        const campaignPromises = [];
        
        for (let i = 0; i < count; i++) {
          campaignPromises.push(getCampaign(i));
        }
        
        const campaignResults = await Promise.all(campaignPromises);
        const validCampaigns: CampaignWithId[] = campaignResults
          .map((campaign, index) => campaign ? { ...campaign, id: index } : null)
          .filter((campaign): campaign is CampaignWithId => campaign !== null);
        
        setCampaigns(validCampaigns);
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaigns();
  }, [api, getCampaign, getCampaignCount, refreshTrigger]);

  useEffect(() => {
    let filtered = campaigns;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(campaign => {
        const isExpired = currentBlock >= campaign.deadline;
        const isGoalReached = parseFloat(campaign.raised) >= parseFloat(campaign.goal);
        
        switch (filterStatus) {
          case 'active':
            return campaign.active && !isExpired && !isGoalReached;
          case 'completed':
            return isGoalReached;
          case 'expired':
            return isExpired && !isGoalReached;
          default:
            return true;
        }
      });
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, searchTerm, filterStatus, currentBlock]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading campaigns...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="input pl-10 pr-8 appearance-none bg-white"
          >
            <option value="all">All Campaigns</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{campaigns.length}</div>
          <div className="text-sm text-gray-600">Total Campaigns</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {campaigns.filter(c => parseFloat(c.raised) >= parseFloat(c.goal)).length}
          </div>
          <div className="text-sm text-gray-600">Successful</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {campaigns.filter(c => c.active && currentBlock < c.deadline).length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">
            {campaigns.reduce((sum, c) => sum + parseFloat(c.raised || '0'), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Raised</div>
        </div>
      </div>

      {/* Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">No campaigns found</div>
          <div className="text-sm text-gray-400">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Be the first to create a campaign!'
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              api={api}
              account={account}
              getSigner={getSigner}
              currentBlock={currentBlock}
            />
          ))}
        </div>
      )}
    </div>
  );
};