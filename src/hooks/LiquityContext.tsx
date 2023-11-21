import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Provider } from "@ethersproject/abstract-provider";
import { FallbackProvider } from "@ethersproject/providers";
import { BaseProvider } from "@ethersproject/providers";
import { PublicClient, useAccount, useChainId, useConnect, useNetwork, usePublicClient, useWalletClient } from "wagmi";

import {
  BlockPolledLiquityStore,
  EthersLiquity,
  EthersLiquityWithStore,
  _connectByChainId
} from "lib-ethers";

import { LiquityFrontendConfig, getConfig } from "../config";
import { BatchedProvider } from "../providers/BatchingProvider";
import { useEthersProvider } from "../libs/ethers";
import { MainView } from "../views/MainView";
import { VoidSigner, ethers } from "ethers";
import { globalContants } from "../libs/globalContants";

type LiquityContextValue = {
  config: LiquityFrontendConfig;
  account: string | undefined;
  provider: Provider;
  liquity: EthersLiquityWithStore<BlockPolledLiquityStore>;
};

const LiquityContext = createContext<LiquityContextValue | undefined>(undefined);

type LiquityProviderProps = {
  loader?: React.ReactNode;
  unsupportedNetworkFallback?: React.ReactNode;
  // unsupportedMainnetFallback?: React.ReactNode;
};

export const LiquityProvider: React.FC<LiquityProviderProps> = ({
  children,
  loader,
  unsupportedNetworkFallback,
  // unsupportedMainnetFallback
}) => {
  const { isConnected, address } = useAccount();
  const signer = useWalletClient();
  const chainId = useChainId();
  // const provider: PublicClient = usePublicClient({ chainId });
  const wagmiProvider = useEthersProvider();
  const addr = isConnected ? address : globalContants.ADDRESS_PLACEHOLDER;
  const { chains } = useNetwork();

  let customProvider: BaseProvider | undefined;
  let customSigner: VoidSigner | undefined;
  if (!isConnected) {
    // 在未连接钱包的情况下，强制连接默认网络。
    customProvider = ethers.getDefaultProvider(chains.find(item => item.id === globalContants.DEFAULT_NETWORK_ID)?.rpcUrls.public.http[0]);
    customSigner = new ethers.VoidSigner(globalContants.ADDRESS_PLACEHOLDER, customProvider);
  }
  const provider = isConnected ? wagmiProvider : customProvider;
  const signerData = isConnected ? signer.data : customSigner;

  const [config, setConfig] = useState<LiquityFrontendConfig>({} as LiquityFrontendConfig);

  const connection = useMemo(() => {
    console.debug("取得connection chainId =", chainId);
    console.debug("取得connection config =", config);
    console.debug("取得connection provider =", provider);
    console.debug("取得connection signerData =", signerData);
    console.debug("取得connection addr =", addr);

    if (config && provider && signerData && addr) {
      const batchedProvider = new BatchedProvider(provider, chainId);
      console.debug("batchedProvider =", batchedProvider);
      // batchedProvider._debugLog = true;

      try {
        return _connectByChainId(batchedProvider, signerData, chainId, {
          userAddress: addr,
          frontendTag: config.frontendTag,
          useStore: "blockPolled"
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [config, provider, signerData, addr, chainId]);
  console.debug("connection =", connection);
  console.debug("isConnected =", isConnected);

  useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  if (isConnected && (!config || !provider || !signerData || !addr)) {
    return <>{loader}</>;
  }

  // if (config?.testnetOnly && chainId === 1) {
  //   return <>{unsupportedMainnetFallback}</>;
  // }

  if (!isConnected && !connection) {
    return <>{unsupportedNetworkFallback}</>;
    // return <>{children}</>;
    // return <MainView />
  }

  if (connection) {
    const liquity = EthersLiquity._from(connection);
    liquity.store.logging = true;

    return <LiquityContext.Provider
      value={{ config, account: addr, provider: connection.provider, liquity }}>
      {children}
    </LiquityContext.Provider>
  }

  return <></>
};

export const useLiquity = () => {
  const liquityContext = useContext(LiquityContext);

  if (!liquityContext) {
    throw new Error("You must provide a LiquityContext via LiquityProvider");
  }

  return liquityContext;
};
