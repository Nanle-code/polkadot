# Crowdfunding Platform Frontend

A modern React frontend for the Ink! smart contract crowdfunding platform built on Polkadot/Substrate.

## Features

- **Wallet Integration**: Connect with Polkadot.js extension
- **Campaign Management**: Create and view crowdfunding campaigns
- **Real-time Updates**: Live campaign progress and blockchain data
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with Tailwind CSS

## Prerequisites

Before running the frontend, make sure you have:

1. **Node.js** (v16 or higher)
2. **Polkadot.js Extension** installed in your browser
3. **Substrate Node** running locally on `ws://127.0.0.1:9944`
4. **Smart Contract** deployed and accessible

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Configuration

### Contract Setup

You need to update the contract configuration in `src/hooks/useContract.ts`:

1. **Contract Address**: Replace `YOUR_CONTRACT_ADDRESS_HERE` with your deployed contract address
2. **Contract ABI**: Replace the simplified ABI with your actual contract ABI

```typescript
const CONTRACT_ADDRESS = 'your_actual_contract_address';
const CONTRACT_ABI = {
  // Your actual contract ABI here
};
```

### Network Configuration

The app is configured to connect to a local Substrate node. To connect to a different network, update the WebSocket URL in `src/hooks/usePolkadot.ts`:

```typescript
const wsProvider = new WsProvider('ws://your-node-url:port');
```

## Usage

### Connecting Your Wallet

1. Install the Polkadot.js browser extension
2. Create or import an account
3. Click "Connect Wallet" in the application
4. Select your account from the dropdown

### Creating a Campaign

1. Connect your wallet
2. Click "Create Campaign"
3. Fill in the campaign details:
   - Title and description
   - Funding goal (in tokens)
   - Duration (in days)
4. Submit the transaction

### Contributing to Campaigns

1. Browse available campaigns
2. Click "Contribute" on any active campaign
3. Enter the amount you want to contribute
4. Confirm the transaction

## Smart Contract Integration

The frontend interacts with your Ink! smart contract through the following main functions:

- `create_campaign`: Create a new crowdfunding campaign
- `contribute`: Contribute tokens to a campaign
- `get_campaign`: Retrieve campaign details
- `get_campaign_count`: Get total number of campaigns
- `withdraw_funds`: Withdraw funds (campaign creators only)
- `request_refund`: Request refund for failed campaigns

## Project Structure

```
src/
├── components/          # React components
│   ├── WalletConnection.tsx
│   ├── CreateCampaign.tsx
│   ├── CampaignCard.tsx
│   └── CampaignList.tsx
├── hooks/              # Custom React hooks
│   ├── usePolkadot.ts  # Polkadot API integration
│   └── useContract.ts  # Smart contract interactions
├── types/              # TypeScript type definitions
│   └── contract.ts
├── utils/              # Utility functions
│   └── format.ts
└── App.tsx            # Main application component
```

## Styling

The application uses Tailwind CSS for styling with a custom design system:

- **Primary Colors**: Blue color palette
- **Components**: Reusable button, card, and input styles
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Mobile-first responsive design

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **Contract Functions**: Extend `src/hooks/useContract.ts`
3. **Types**: Update `src/types/contract.ts`
4. **Styling**: Use Tailwind classes or extend the design system

## Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Ensure Polkadot.js extension is installed and enabled
   - Check that you have accounts in your extension

2. **Contract Interaction Failed**
   - Verify contract address and ABI are correct
   - Ensure your Substrate node is running
   - Check that the contract is deployed

3. **Transaction Failed**
   - Ensure you have sufficient balance for gas fees
   - Check that campaign parameters are valid
   - Verify the campaign is still active

### Network Issues

If you're having trouble connecting to the blockchain:

1. Check that your Substrate node is running
2. Verify the WebSocket URL is correct
3. Ensure your browser allows WebSocket connections
4. Check browser console for detailed error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.