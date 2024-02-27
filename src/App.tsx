import { useEffect } from "react";
import { configureChains, WagmiConfig, createConfig } from "wagmi";
import { iotexTestnet, iotex } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { InjectedConnector } from "wagmi/connectors/injected";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { SafeConnector } from "wagmi/connectors/safe"
import { LiquityProvider } from "./hooks/LiquityContext";
import { getConfig } from "./config";
import { LiquityFrontend } from "./LiquityFrontend";
import { AppLoader } from "./components/AppLoader";
import { useAsyncValue } from "./hooks/AsyncValue";
import { appController } from "./libs/appController";
import { TransactionProvider } from "./components/Transaction";

// Start pre-fetching the config
getConfig().then(config => {
  Object.assign(window, { config });
});

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [iotex, iotexTestnet],
  [
    publicProvider(),
    // jsonRpcProvider({
    //   rpc: (chain) => ({ http: appConfig.rpc[String(chain.id)].http })
    // })
  ],
  { batch: { multicall: true } }
);

const wagmiCfg = createConfig({
  connectors: [
    new InjectedConnector({ chains }),
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
  const config = useAsyncValue(getConfig);
  const loader = <AppLoader />;

  useEffect(() => {
    appController.init();
  }, []);

  return config.loaded ? <WagmiConfig config={wagmiCfg}>
    <LiquityProvider loader={loader}>
      {/* <TransactionProvider> */}
      <LiquityFrontend
        chains={chains}
        loader={loader} />
      {/* </TransactionProvider> */}
    </LiquityProvider>
  </WagmiConfig> : <></>
};

export default App;
