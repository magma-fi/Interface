import { useEffect } from "react";
import { configureChains, WagmiConfig, createConfig } from "wagmi";
import { iotexTestnet, iotex } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { InjectedConnector } from "wagmi/connectors/injected";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { SafeConnector } from "wagmi/connectors/safe"
import { LiquityProvider } from "./hooks/LiquityContext";
import { AppLoader } from "./components/AppLoader";
import { appController } from "./libs/appController";
import { MainView } from "./views/MainView";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [iotex, iotexTestnet],
  [publicProvider()],
  { batch: { multicall: true } }
);

const wagmiCfg = createConfig({
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        name: "MetaMask",
        getProvider: () => window.ethereum
      }
    }),
    new InjectedConnector({
      chains,
      options: {
        name: "OKX Wallet",
        getProvider: () => window?.okxwallet
      }
    }),
    new InjectedConnector({
      chains,
      options: {
        name: "Gate Wallet",
        getProvider: () => window?.gatewallet
      }
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: "a1362d88b5470c1006e169ce345815ae",
        showQrModal: true
      }
    }),
    new SafeConnector({
      chains: [iotex],
      options: {
        allowedDomains: [/safe.iotex.io$/],
        debug: false
      }
    })
  ],
  autoConnect: true,
  publicClient,
  webSocketPublicClient
});

const App = () => {
  const loader = <AppLoader />;

  useEffect(() => {
    appController.init();

    Telegram.WebApp.showAlert("Welcome to Magma!");
  }, []);

  return <WagmiConfig config={wagmiCfg}>
    <LiquityProvider loader={loader}>
      <MainView chains={chains} />
    </LiquityProvider>
  </WagmiConfig>
};

export default App;
