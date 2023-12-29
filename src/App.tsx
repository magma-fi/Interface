import { useEffect } from "react";
import { configureChains, WagmiConfig, createConfig } from "wagmi";
import { iotexTestnet, iotex } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { InjectedConnector } from "wagmi/connectors/injected";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { jsonRpcProvider } from "@wagmi/core/providers/jsonRpc"
// import { ConnectKitProvider, getDefaultClient } from "connectkit";
// import { Flex, Heading, Paragraph, Link } from "theme-ui";

// import { BatchedWebSocketAugmentedWeb3Provider } from "@liquity/providers";
import { LiquityProvider } from "./hooks/LiquityContext";
// import { WalletConnector } from "./components/WalletConnector";
// import { TransactionProvider } from "./components/Transaction";
// import { Icon } from "./components/Icon";
import { getConfig } from "./config";
// import theme from "./theme";

// import { DisposableWalletProvider } from "./testUtils/DisposableWalletProvider";
import { LiquityFrontend } from "./LiquityFrontend";
import { AppLoader } from "./components/AppLoader";
import { useAsyncValue } from "./hooks/AsyncValue";
import { appController } from "./libs/appController";
import { TransactionProvider } from "./components/Transaction";
import appConfig from "./appConfig.json";

// const isDemoMode = import.meta.env.VITE_APP_DEMO_MODE === "true";

// if (isDemoMode) {
//   const ethereum = new DisposableWalletProvider(
//     import.meta.env.VITE_APP_RPC_URL || `http://${window.location.hostname || "localhost"}:8545`,
//     "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"
//   );

//   Object.assign(window, { ethereum });
// }

// Start pre-fetching the config
getConfig().then(config => {
  // console.log("Frontend config:");
  // console.log(config);
  Object.assign(window, { config });
});

// const UnsupportedMainnetFallback: React.FC = () => (
//   <Flex
//     sx={{
//       flexDirection: "column",
//       alignItems: "center",
//       justifyContent: "center",
//       height: "100vh",
//       textAlign: "center"
//     }}
//   >
//     <Heading sx={{ mb: 3 }}>
//       <Icon name="exclamation-triangle" /> This app is for testing purposes only.
//     </Heading>

//     <Paragraph sx={{ mb: 3 }}>Please change your network to Görli.</Paragraph>

//     <Paragraph>
//       If you'd like to use the Liquity Protocol on mainnet, please pick a frontend{" "}
//       <Link href="https://www.liquity.org/frontend">
//         here <Icon name="external-link-alt" size="xs" />
//       </Link>
//       .
//     </Paragraph>
//   </Flex>
// );

// const UnsupportedNetworkFallback: React.FC = () => (
//   <Flex
//     sx={{
//       flexDirection: "column",
//       alignItems: "center",
//       justifyContent: "center",
//       height: "100vh",
//       textAlign: "center"
//     }}
//   >
//     <Heading sx={{ mb: 3 }}>
//       <Icon name="exclamation-triangle" /> Liquity is not supported on this network.
//     </Heading>
//     Please switch to IoTeX Testnet.
//   </Flex>
// );

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [iotexTestnet, iotex],
  [
    publicProvider(),
    jsonRpcProvider({
      rpc: (chain) => ({ http: appConfig.rpc[String(chain.id)].http })
    }),
  ]
);

const wagmiCfg = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: "a1362d88b5470c1006e169ce345815ae",
        showQrModal: true
      }
    })
  ],
  publicClient,
  webSocketPublicClient
})

const App = () => {
  const config = useAsyncValue(getConfig);
  const loader = <AppLoader />;

  // return (
  //   <ThemeUIProvider theme={theme}>
  //     {config.loaded && (
  //       <WagmiConfig
  //         client={createClient(
  //           getDefaultClient({
  //             appName: "Liquity",
  //             chains:
  //               isDemoMode || import.meta.env.MODE === "test"
  //                 ? [localhost]
  //                 : config.value.testnetOnly
  //                   ? [goerli]
  //                   : [mainnet, goerli, iotexTestnet],
  //             walletConnectProjectId: config.value.walletConnectProjectId,
  //             infuraId: config.value.infuraApiKey,
  //             alchemyId: config.value.alchemyApiKey
  //           })
  //         )}
  //       >
  //         <ConnectKitProvider options={{ hideBalance: true }}>
  //           <WalletConnector loader={loader}>
  //             <LiquityProvider
  //               loader={loader}
  //               unsupportedNetworkFallback={<UnsupportedNetworkFallback />}
  //               unsupportedMainnetFallback={<UnsupportedMainnetFallback />}
  //             >
  //               <TransactionProvider>
  //                 <LiquityFrontend loader={loader} />
  //               </TransactionProvider>
  //             </LiquityProvider>
  //           </WalletConnector>
  //         </ConnectKitProvider>
  //       </WagmiConfig>
  //     )}
  //   </ThemeUIProvider>
  // );

  useEffect(() => {
    appController.init();
  }, []);

  return config.loaded ? <WagmiConfig config={wagmiCfg}>
    {/* <ConnectKitProvider options={{ hideBalance: true }}> */}
    {/* <WalletConnector loader={loader}> */}
    <LiquityProvider
      loader={loader}
    // unsupportedNetworkFallback={<UnsupportedNetworkFallback />}
    // unsupportedMainnetFallback={<UnsupportedMainnetFallback />}
    >
      <TransactionProvider>
        <LiquityFrontend loader={loader} />
      </TransactionProvider>
    </LiquityProvider>
    {/* </WalletConnector> */}
    {/* </ConnectKitProvider> */}
  </WagmiConfig> : <></>
};

export default App;
