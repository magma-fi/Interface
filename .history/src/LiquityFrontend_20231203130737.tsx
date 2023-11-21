import React from "react";
// import { Flex, Container } from "theme-ui";
// import { HashRouter as Router, Switch, Route } from "react-router-dom";
import { Wallet } from "@ethersproject/wallet";
import { Decimal, Difference, Trove } from "lib-base";
import { LiquityStoreProvider } from "@liquity/lib-react";
import { useLiquity } from "./hooks/LiquityContext";
import { TransactionMonitor, TransactionProvider } from "./components/Transaction";
// import { UserAccount } from "./components/UserAccount";
// import { SystemStatsPopup } from "./components/SystemStatsPopup";
// import { Header, SideBar } from "./components/SideBar";
// import { PageSwitcher } from "./pages/PageSwitcher";
// import { RiskyTrovesPage } from "./pages/RiskyTrovesPage";
// import { Bonds } from "./pages/Bonds";
import { TroveViewProvider } from "./components/Trove/context/TroveViewProvider";
import { StabilityViewProvider } from "./components/Stability/context/StabilityViewProvider";
import { StakingViewProvider } from "./components/Staking/context/StakingViewProvider";
import "tippy.js/dist/tippy.css"; // Tooltip default style
import { BondsProvider } from "./components/Bonds/context/BondsProvider";
// import { useAccount } from "wagmi";
// import { ConnectWalletModal } from "./components/ConnectWalletModal";
import { MainView } from "./views/MainView";

type LiquityFrontendProps = {
  loader?: React.ReactNode;
};
export const LiquityFrontend: React.FC<LiquityFrontendProps> = ({ loader }) => {
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
              <MainView />
            </BondsProvider>
          </StakingViewProvider>
        </StabilityViewProvider>
      </TroveViewProvider>
      {/* </Router> */}
      <TransactionMonitor />
    </LiquityStoreProvider>
  </TransactionProvider>
};
