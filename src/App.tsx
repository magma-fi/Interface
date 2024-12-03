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

/**
 * 通过这个方法获取connector。即使在不存在Metamask（卸载或禁用）的情况下，只要其它钱包也实现了window.ethereum，则仍然可以以Metamask的名义连接该钱包。
 * @returns {Array} connectors
 */
const getConnectors = () => {
  const connectors = [
    new InjectedConnector({
      chains,
      options: {
        name: "Gate Wallet",
        getProvider: () => window?.gatewallet
      }
    }),
    new InjectedConnector({
      chains,
      options: {
        name: "OKX Wallet",
        getProvider: () => window?.okxwallet,
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
  ];

  if (window.ethereum) {
    connectors.unshift(new InjectedConnector({
      chains,
      options: {
        name: "MetaMask",
        getProvider: () => window.ethereum
      }
    }));
  }

  return connectors;
};

const wagmiCfg = createConfig({
  connectors: getConnectors(),
  autoConnect: true,
  publicClient,
  webSocketPublicClient
});

const App = () => {
  const loader = <AppLoader />;

  useEffect(() => {
    appController.init();
  }, []);

  return <WagmiConfig config={wagmiCfg}>
    <LiquityProvider loader={loader}>
      <MainView chains={chains} />
    </LiquityProvider>
  </WagmiConfig>
};

export default App;
