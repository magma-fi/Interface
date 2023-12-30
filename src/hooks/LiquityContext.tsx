import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Provider } from "@ethersproject/abstract-provider";
import { BaseProvider } from "@ethersproject/providers";
import { PublicClient, WalletClient, useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";

import {
  BlockPolledLiquityStore,
  EthersLiquity,
  EthersLiquityWithStore,
  _connectByChainId
} from "lib-ethers";

import { LiquityFrontendConfig, getConfig } from "../config";
import { BatchedProvider } from "../providers/BatchingProvider";
import { useEthersProvider } from "../libs/ethers";
import { VoidSigner, ethers } from "ethers";
import { globalContants } from "../libs/globalContants";

type LiquityContextValue = {
  config: LiquityFrontendConfig;
  account: string | undefined;
  provider: Provider;
  liquity: EthersLiquityWithStore<BlockPolledLiquityStore>;
  walletClient?: WalletClient;
  chainId: number;
  publicClient?: PublicClient;
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
  const wagmiProvider = useEthersProvider();
  const publicClient = usePublicClient({ chainId });
  const addr = isConnected ? address : globalContants.ADDRESS_PLACEHOLDER;

  let customProvider: BaseProvider | undefined;
  let customSigner: VoidSigner | undefined;
  if (!isConnected) {
    // 在未连接钱包的情况下，强制连接默认网络。
    customProvider = ethers.getDefaultProvider(globalContants.default_NETWORK_RPC);
    customSigner = new ethers.VoidSigner(globalContants.ADDRESS_PLACEHOLDER, customProvider);
  }
  const provider = isConnected ? wagmiProvider : customProvider;
  const signerData = isConnected ? signer.data : customSigner;

  const [config, setConfig] = useState<LiquityFrontendConfig>({} as LiquityFrontendConfig);

  const connection = useMemo(() => {
    if (config && provider && signerData && addr) {
      const batchedProvider = new BatchedProvider(provider, chainId);
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
      value={{
        config,
        account: addr,
        provider: connection.provider,
        liquity,
        chainId,
        walletClient: connection.signer as unknown as WalletClient,
        publicClient
      }}>
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
