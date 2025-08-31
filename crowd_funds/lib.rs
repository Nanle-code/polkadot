#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod crowd_funding {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::primitives::U256;
    use ink::storage::Mapping;
    use ink::H160;

    #[ink(storage)]
    pub struct CrowdFunding {
        /// Campaign counter for generating unique IDs
        campaign_counter: u32,
        /// Mapping from campaign ID to campaign details
        campaigns: Mapping<u32, Campaign>,
        /// Mapping from (campaign_id, contributor) to contribution amount
        contributions: Mapping<(u32, H160), U256>,
        /// Mapping from campaign ID to list of contributors
        contributors: Mapping<u32, Vec<H160>>,
    }

    #[derive(Clone)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout)
    )]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub struct Campaign {
        /// Campaign creator
        pub creator: H160,
        /// Campaign title
        pub title: String,
        /// Campaign description
        pub description: String,
        /// Funding goal in native tokens
        pub goal: U256,
        /// Campaign deadline (block number)
        pub deadline: u32,
        /// Total amount raised
        pub raised: U256,
        /// Whether the campaign is active
        pub active: bool,
        /// Whether funds have been withdrawn by creator
        pub withdrawn: bool,
    }

    #[derive(Debug, PartialEq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        /// Campaign does not exist
        CampaignNotFound,
        /// Campaign has ended
        CampaignEnded,
        /// Campaign is not active
        CampaignInactive,
        /// Goal not reached
        GoalNotReached,
        /// Only campaign creator can perform this action
        OnlyCreator,
        /// Campaign deadline must be in the future
        InvalidDeadline,
        /// Contribution amount must be greater than 0
        ZeroContribution,
        /// Refund not available
        RefundNotAvailable,
        /// Funds already withdrawn
        AlreadyWithdrawn,
        /// No contribution found
        NoContribution,
        /// Transfer failed
        TransferFailed,
        /// Goal already reached
        GoalAlreadyReached,
    }

    #[ink(event)]
    pub struct CampaignCreated {
        #[ink(topic)]
        campaign_id: u32,
        #[ink(topic)]
        creator: H160,
        title: String,
        goal: U256,
        deadline: u32,
    }

    #[ink(event)]
    pub struct ContributionMade {
        #[ink(topic)]
        campaign_id: u32,
        #[ink(topic)]
        contributor: H160,
        amount: U256,
        total_raised: U256,
    }

    #[ink(event)]
    pub struct FundsWithdrawn {
        #[ink(topic)]
        campaign_id: u32,
        #[ink(topic)]
        creator: H160,
        amount: U256,
    }

    #[ink(event)]
    pub struct RefundIssued {
        #[ink(topic)]
        campaign_id: u32,
        #[ink(topic)]
        contributor: H160,
        amount: U256,
    }

    #[ink(event)]
    pub struct GoalReached {
        #[ink(topic)]
        campaign_id: u32,
        total_raised: U256,
        goal: U256,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl CrowdFunding {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                campaign_counter: 0,
                campaigns: Mapping::default(),
                contributions: Mapping::default(),
                contributors: Mapping::default(),
            }
        }

        /// Create a new crowdfunding campaign
        #[ink(message)]
        pub fn create_campaign(
            &mut self,
            title: String,
            description: String,
            goal: U256,
            duration_blocks: u32,
        ) -> Result<u32> {
            let current_block = self.env().block_number();

            #[allow(clippy::arithmetic_side_effects)]
            let deadline = current_block + duration_blocks;

            if deadline <= current_block {
                return Err(Error::InvalidDeadline);
            }

            let campaign_id = self.campaign_counter;

            // Fixed: Use proper checked arithmetic
            self.campaign_counter = self
                .campaign_counter
                .checked_add(1)
                .expect("Campaign counter overflow");

            let campaign = Campaign {
                creator: self.env().caller(),
                title: title.clone(),
                description,
                goal,
                deadline,
                raised: U256::from(0),
                active: true,
                withdrawn: false,
            };

            self.campaigns.insert(campaign_id, &campaign);
            self.contributors.insert(campaign_id, &Vec::<H160>::new());

            self.env().emit_event(CampaignCreated {
                campaign_id,
                creator: campaign.creator,
                title,
                goal,
                deadline,
            });

            Ok(campaign_id)
        }

        /// Contribute to a campaign
        #[ink(message, payable)]
        pub fn contribute(&mut self, campaign_id: u32) -> Result<()> {
            let contribution: U256 = self.env().transferred_value();

            if contribution == U256::from(0) {
                return Err(Error::ZeroContribution);
            }

            let mut campaign = self
                .campaigns
                .get(campaign_id)
                .ok_or(Error::CampaignNotFound)?;

            if !campaign.active {
                return Err(Error::CampaignInactive);
            }

            let current_block = self.env().block_number();
            if current_block >= campaign.deadline {
                return Err(Error::CampaignEnded);
            }

            let contributor = self.env().caller();

            // Update contribution amount for this contributor
            let existing_contribution = self
                .contributions
                .get((campaign_id, contributor))
                .unwrap_or(U256::from(0));

            #[allow(clippy::arithmetic_side_effects)]
            let new_contribution = existing_contribution + contribution;

            self.contributions
                .insert((campaign_id, contributor), &new_contribution);

            // Add contributor to list if first time contributing
            if existing_contribution == U256::from(0) {
                let mut contributors_list = self.contributors.get(campaign_id).unwrap_or_default();
                contributors_list.push(contributor);
                self.contributors.insert(campaign_id, &contributors_list);
            }

            // Update campaign raised amount
            // Fixed: Use proper checked arithmetic and assign back
            campaign.raised = campaign
                .raised
                .checked_add(contribution)
                .expect("Contribution overflow");
            self.campaigns.insert(campaign_id, &campaign);

            self.env().emit_event(ContributionMade {
                campaign_id,
                contributor,
                amount: contribution,
                total_raised: campaign.raised,
            });

            // Check if goal is reached
            if campaign.raised >= campaign.goal {
                self.env().emit_event(GoalReached {
                    campaign_id,
                    total_raised: campaign.raised,
                    goal: campaign.goal,
                });
            }

            Ok(())
        }

        /// Withdraw funds (only by campaign creator if goal reached)
        #[ink(message)]
        pub fn withdraw_funds(&mut self, campaign_id: u32) -> Result<()> {
            let mut campaign = self
                .campaigns
                .get(campaign_id)
                .ok_or(Error::CampaignNotFound)?;

            if campaign.creator != self.env().caller() {
                return Err(Error::OnlyCreator);
            }

            if campaign.withdrawn {
                return Err(Error::AlreadyWithdrawn);
            }

            let current_block = self.env().block_number();
            if current_block < campaign.deadline && campaign.raised < campaign.goal {
                return Err(Error::GoalNotReached);
            }

            if campaign.raised < campaign.goal {
                return Err(Error::GoalNotReached);
            }

            let amount = campaign.raised;
            campaign.withdrawn = true;
            campaign.active = false;
            self.campaigns.insert(campaign_id, &campaign);

            // Transfer funds to campaign creator
            if self.env().transfer(campaign.creator, amount).is_err() {
                return Err(Error::TransferFailed);
            }

            self.env().emit_event(FundsWithdrawn {
                campaign_id,
                creator: campaign.creator,
                amount,
            });

            Ok(())
        }

        /// Request refund (only if campaign failed)
        #[ink(message)]
        pub fn request_refund(&mut self, campaign_id: u32) -> Result<()> {
            let campaign = self
                .campaigns
                .get(campaign_id)
                .ok_or(Error::CampaignNotFound)?;

            let current_block = self.env().block_number();
            if current_block < campaign.deadline {
                return Err(Error::RefundNotAvailable);
            }

            if campaign.raised >= campaign.goal {
                return Err(Error::RefundNotAvailable);
            }

            let contributor = self.env().caller();
            let contribution = self
                .contributions
                .get((campaign_id, contributor))
                .ok_or(Error::NoContribution)?;

            if contribution == U256::from(0) {
                return Err(Error::NoContribution);
            }

            // Fixed: Set contribution to 0 instead of remove (if remove method doesn't exist)
            self.contributions
                .insert((campaign_id, contributor), &U256::from(0));

            // Transfer refund
            if self.env().transfer(contributor, contribution).is_err() {
                return Err(Error::TransferFailed);
            }

            self.env().emit_event(RefundIssued {
                campaign_id,
                contributor,
                amount: contribution,
            });

            Ok(())
        }

        /// Get campaign details
        #[ink(message)]
        pub fn get_campaign(&self, campaign_id: u32) -> Option<Campaign> {
            self.campaigns.get(campaign_id)
        }

        /// Get contribution amount for a specific contributor
        #[ink(message)]
        pub fn get_contribution(&self, campaign_id: u32, contributor: H160) -> U256 {
            self.contributions
                .get((campaign_id, contributor))
                .unwrap_or(U256::from(0))
        }

        /// Get list of contributors for a campaign
        #[ink(message)]
        pub fn get_contributors(&self, campaign_id: u32) -> Vec<H160> {
            self.contributors.get(campaign_id).unwrap_or_default()
        }

        /// Get total number of campaigns
        #[ink(message)]
        pub fn get_campaign_count(&self) -> u32 {
            self.campaign_counter
        }

        /// Check if campaign goal is reached
        #[ink(message)]
        pub fn is_goal_reached(&self, campaign_id: u32) -> bool {
            if let Some(campaign) = self.campaigns.get(campaign_id) {
                campaign.raised >= campaign.goal
            } else {
                false
            }
        }

        /// Check if campaign has ended
        #[ink(message)]
        pub fn has_campaign_ended(&self, campaign_id: u32) -> bool {
            if let Some(campaign) = self.campaigns.get(campaign_id) {
                let current_block = self.env().block_number();
                current_block >= campaign.deadline
            } else {
                true
            }
        }

        /// Emergency function to deactivate a campaign (only by creator)
        #[ink(message)]
        pub fn deactivate_campaign(&mut self, campaign_id: u32) -> Result<()> {
            let mut campaign = self
                .campaigns
                .get(campaign_id)
                .ok_or(Error::CampaignNotFound)?;

            if campaign.creator != self.env().caller() {
                return Err(Error::OnlyCreator);
            }

            campaign.active = false;
            self.campaigns.insert(campaign_id, &campaign);

            Ok(())
        }
    }
}
