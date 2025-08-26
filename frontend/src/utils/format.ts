export const formatTokenAmount = (amount: string | number, decimals: number = 4): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

export const formatAddress = (address: string, startChars: number = 6, endChars: number = 6): string => {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

export const formatTimeRemaining = (currentBlock: number, deadline: number): string => {
  const blocksRemaining = deadline - currentBlock;
  if (blocksRemaining <= 0) return 'Expired';
  
  // Assuming ~6 seconds per block
  const secondsRemaining = blocksRemaining * 6;
  const days = Math.floor(secondsRemaining / (24 * 60 * 60));
  const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60));
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  
  const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
  return `${minutes}m remaining`;
};

export const calculateProgress = (raised: string | number, goal: string | number): number => {
  const raisedNum = typeof raised === 'string' ? parseFloat(raised) : raised;
  const goalNum = typeof goal === 'string' ? parseFloat(goal) : goal;
  
  if (goalNum === 0) return 0;
  return Math.min((raisedNum / goalNum) * 100, 100);
};