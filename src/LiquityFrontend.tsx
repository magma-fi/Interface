import React from "react";
import { Wallet } from "@ethersproject/wallet";
import { Decimal, Difference, Trove } from "lib-base";
import { LiquityStoreProvider } from "@liquity/lib-react";
import { useLiquity } from "./hooks/LiquityContext";
import { TransactionProvider } from "./components/Transaction";
import { TroveViewProvider } from "./components/Trove/context/TroveViewProvider";
import { StabilityViewProvider } from "./components/Stability/context/StabilityViewProvider";
import { StakingViewProvider } from "./components/Staking/context/StakingViewProvider";
import "tippy.js/dist/tippy.css"; // Tooltip default style
import { BondsProvider } from "./components/Bonds/context/BondsProvider";
import { MainView } from "./views/MainView";
import { Chain } from "viem";

type LiquityFrontendProps = {
  chains?: Chain[];
  loader?: React.ReactNode;
  rabbyKit?: unknown;
};
export const LiquityFrontend: React.FC<LiquityFrontendProps> = ({ loader, chains, rabbyKit }) => {
  const { account, provider, liquity } = useLiquity();

  // For console tinkering ;-)
  Object.assign(window, {
    account,
    provider,
    liquity,
    Trove,
    Decimal,
    Difference,
    Wallet
  });

  return <TransactionProvider>
    <LiquityStoreProvider {...{ loader }} store={liquity.store}>
      {/* <Router> */}
      <TroveViewProvider>
        <StabilityViewProvider>
          <StakingViewProvider>
            <BondsProvider>
              <MainView
                chains={chains!}
                rabbyKit={rabbyKit} />
            </BondsProvider>
          </StakingViewProvider>
        </StabilityViewProvider>
      </TroveViewProvider>
      {/* </Router> */}
      {/* <TransactionMonitor /> */}
    </LiquityStoreProvider>
  </TransactionProvider>
};
