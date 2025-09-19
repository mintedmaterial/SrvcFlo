import { GelatoSmartWalletDynamicContextProvider, GelatoDynamicWidget } from '@gelatonetwork/smartwallet-react-dynamic';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';

export default function App() {
  return (
    <GelatoSmartWalletDynamicContextProvider settings={{ environmentId: '6a521bed-ec42-40cd-973d-610eedea1bf4', walletConnectors: [EthereumWalletConnectors], }}>
      <GelatoDynamicWidget />
    </GelatoSmartWalletDynamicContextProvider>
  );
}