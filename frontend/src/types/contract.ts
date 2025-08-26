export interface Campaign {
  creator: string;
  title: string;
  description: string;
  goal: string;
  deadline: number;
  raised: string;
  active: boolean;
  withdrawn: boolean;
}

export interface ContractError {
  CampaignNotFound?: null;
  CampaignEnded?: null;
  CampaignInactive?: null;
  GoalNotReached?: null;
  OnlyCreator?: null;
  InvalidDeadline?: null;
  ZeroContribution?: null;
  RefundNotAvailable?: null;
  AlreadyWithdrawn?: null;
  NoContribution?: null;
  TransferFailed?: null;
  GoalAlreadyReached?: null;
}

export interface CampaignWithId extends Campaign {
  id: number;
}

export interface ContributionInfo {
  amount: string;
  contributor: string;
}