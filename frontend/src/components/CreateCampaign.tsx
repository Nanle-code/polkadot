import React, { useState } from 'react';
import { Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import type { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface CreateCampaignProps {
  api: ApiPromise | null;
  account: InjectedAccountWithMeta | null;
  getSigner: (account: InjectedAccountWithMeta) => Promise<any>;
  onCampaignCreated: () => void;
}

export const CreateCampaign: React.FC<CreateCampaignProps> = ({
  api,
  account,
  getSigner,
  onCampaignCreated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    durationDays: '30',
  });
  const [success, setSuccess] = useState(false);

  const { createCampaign, isLoading, error } = useContract(api, account);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    try {
      setSuccess(false);
      
      // Convert days to blocks (assuming ~6 seconds per block)
      const durationBlocks = Math.floor(parseInt(formData.durationDays) * 24 * 60 * 10);
      
      await createCampaign(
        formData.title,
        formData.description,
        formData.goal,
        durationBlocks,
        getSigner
      );

      setSuccess(true);
      setFormData({ title: '', description: '', goal: '', durationDays: '30' });
      onCampaignCreated();
      
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Campaign
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Create New Campaign</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg mb-4">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Campaign created successfully!</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter campaign title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="textarea"
                placeholder="Describe your campaign"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Funding Goal (in tokens)
              </label>
              <input
                type="number"
                name="goal"
                value={formData.goal}
                onChange={handleInputChange}
                className="input"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (days)
              </label>
              <input
                type="number"
                name="durationDays"
                value={formData.durationDays}
                onChange={handleInputChange}
                className="input"
                min="1"
                max="365"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-secondary flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={isLoading || !account}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Campaign'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};