import { useState, useCallback } from 'react';
import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';
import type { Campaign, CampaignWithId } from '../types/contract';

// You'll need to replace this with your actual contract address and ABI
const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE';

// Simplified ABI - you'll need to replace this with your actual contract ABI
const CONTRACT_ABI = {
  "source": {
    "hash": "0x...",
    "language": "ink! 4.0.0",
    "compiler": "rustc 1.68.0"
  },
  "contract": {
    "name": "crowd_funding",
    "version": "0.1.0",
    "authors": ["[your_name] <[your_email]>"]
  },
  "spec": {
    "constructors": [
      {
        "args": [],
        "docs": [],
        "label": "new",
        "payable": false,
        "returnType": {
          "displayName": ["ink_primitives", "ConstructorResult"],
          "type": 0
        },
        "selector": "0x9bae9d5e"
      }
    ],
    "docs": [],
    "events": [],
    "lang_error": {
      "displayName": ["ink", "LangError"],
      "type": 1
    },
    "messages": [
      {
        "args": [
          {
            "label": "title",
            "type": {
              "displayName": ["String"],
              "type": 2
            }
          },
          {
            "label": "description", 
            "type": {
              "displayName": ["String"],
              "type": 2
            }
          },
          {
            "label": "goal",
            "type": {
              "displayName": ["U256"],
              "type": 3
            }
          },
          {
            "label": "duration_blocks",
            "type": {
              "displayName": ["u32"],
              "type": 4
            }
          }
        ],
        "docs": [],
        "label": "create_campaign",
        "mutates": true,
        "payable": false,
        "returnType": {
          "displayName": ["Result"],
          "type": 5
        },
        "selector": "0x..."
      }
    ]
  },
  "types": []
};

export const useContract = (api: ApiPromise | null, account: InjectedAccountWithMeta | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!api) return null;
    return new ContractPromise(api, CONTRACT_ABI, CONTRACT_ADDRESS);
  }, [api]);

  const createCampaign = async (
    title: string,
    description: string,
    goal: string,
    durationBlocks: number,
    getSigner: (account: InjectedAccountWithMeta) => Promise<any>
  ) => {
    if (!api || !account) throw new Error('API or account not available');
    
    const contract = getContract();
    if (!contract) throw new Error('Contract not available');

    setIsLoading(true);
    setError(null);

    try {
      const signer = await getSigner(account);
      
      // Gas limit estimation
      const gasLimit: WeightV2 = api.registry.createType('WeightV2', {
        refTime: new BN('100000000000'),
        proofSize: new BN('100000'),
      });

      const { result, output } = await contract.tx.createCampaign(
        { gasLimit, storageDepositLimit: null },
        title,
        description,
        goal,
        durationBlocks
      ).signAndSend(account.address, { signer });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const contribute = async (
    campaignId: number,
    amount: string,
    getSigner: (account: InjectedAccountWithMeta) => Promise<any>
  ) => {
    if (!api || !account) throw new Error('API or account not available');
    
    const contract = getContract();
    if (!contract) throw new Error('Contract not available');

    setIsLoading(true);
    setError(null);

    try {
      const signer = await getSigner(account);
      
      const gasLimit: WeightV2 = api.registry.createType('WeightV2', {
        refTime: new BN('100000000000'),
        proofSize: new BN('100000'),
      });

      const { result } = await contract.tx.contribute(
        { gasLimit, storageDepositLimit: null, value: amount },
        campaignId
      ).signAndSend(account.address, { signer });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to contribute';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getCampaign = async (campaignId: number): Promise<Campaign | null> => {
    if (!api) return null;
    
    const contract = getContract();
    if (!contract) return null;

    try {
      const gasLimit: WeightV2 = api.registry.createType('WeightV2', {
        refTime: new BN('100000000000'),
        proofSize: new BN('100000'),
      });

      const { result, output } = await contract.query.getCampaign(
        account?.address || '',
        { gasLimit, storageDepositLimit: null },
        campaignId
      );

      if (result.isOk && output) {
        return output.toHuman() as Campaign;
      }
      return null;
    } catch (err) {
      console.error('Failed to get campaign:', err);
      return null;
    }
  };

  const getCampaignCount = async (): Promise<number> => {
    if (!api) return 0;
    
    const contract = getContract();
    if (!contract) return 0;

    try {
      const gasLimit: WeightV2 = api.registry.createType('WeightV2', {
        refTime: new BN('100000000000'),
        proofSize: new BN('100000'),
      });

      const { result, output } = await contract.query.getCampaignCount(
        account?.address || '',
        { gasLimit, storageDepositLimit: null }
      );

      if (result.isOk && output) {
        return parseInt(output.toString());
      }
      return 0;
    } catch (err) {
      console.error('Failed to get campaign count:', err);
      return 0;
    }
  };

  return {
    createCampaign,
    contribute,
    getCampaign,
    getCampaignCount,
    isLoading,
    error,
  };
};