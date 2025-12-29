import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'viem/chains';
import '@rainbow-me/rainbowkit/styles.css';
import '../styles/globals.css';

// Configure chains with Base support
// Base Mainnet (8453) and Base Sepolia (84532) are now included
const { chains, publicClient } = configureChains(
  [
    base, // Base Mainnet (chain ID: 8453)
    baseSepolia, // Base Sepolia Testnet (chain ID: 84532)
    { id: 1337, name: 'Localhost' },
    { id: 5, name: 'Goerli' }
  ],
  [
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'PolliT',
  projectId: 'pollit-mvp',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

export default function App({ Component, pageProps }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}


