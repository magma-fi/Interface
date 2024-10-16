/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { createConfig, WagmiProvider, http } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import { iotexTestnet, iotex } from "wagmi/chains";
import { LiquityProvider } from "./hooks/LiquityContext";
import { AppLoader } from "./components/AppLoader";
import { appController } from "./libs/appController";
import { MainView } from "./views/MainView";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Extend the Window interface to include Telegram
declare global {
  interface Window {
    Telegram?: any;
  }
}

const queryClient = new QueryClient()

const wagmiCfg = createConfig({
  chains: [iotex, iotexTestnet],
  connectors: [
    walletConnect({
      projectId: "a1362d88b5470c1006e169ce345815ae"
    })
  ],
  transports: {
    [iotex.id]: http(),
    [iotexTestnet.id]: http(),
  },
});

const App = () => {
  const loader = <AppLoader />;

  useEffect(() => {
    appController.init();

    if (window.Telegram) {
      window.Telegram?.WebApp.showAlert("Welcome to Magma!");

      window.open = url => {
        try {
          if (!url) {
            return null;
          }

          if (typeof url !== "string") {
            url = url.toString();
          }

          if (url.startsWith("metamask://")) {
            url = url.replace("metamask://", "https://metamask.app.link/");
          }

          window.Telegram.WebApp.openLink(url);
        } catch (error) {
          console.error(`Failed to openLink ${url}`, error);
        }

        return null;
      };
    }
  }, []);

  return <WagmiProvider config={wagmiCfg}>
    <QueryClientProvider client={queryClient}>
      <LiquityProvider loader={loader}>
        <MainView chains={[iotex, iotexTestnet]} />
      </LiquityProvider>
    </QueryClientProvider>
  </WagmiProvider>
};

export default App;
