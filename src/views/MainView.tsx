import { useState } from "react";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { SideBar } from "../components/SideBar";
import { UserAccount } from "../components/UserAccount";
import { Route, BrowserRouter, Switch } from "react-router-dom";
import { BorrowView } from "./BorrowView";
import { StakeView } from "./StakeView";
import { useChainId, useNetwork } from "wagmi";
import { LiquidationsView } from "./liquidationsView";

export const MainView = () => {
	const [showConnectModal, setShowConnectModal] = useState(false);
	const { chain, chains } = useNetwork();
	const chainId = useChainId();
	const isSupportedNetwork = chains.findIndex(item => item.id === chain?.id) >= 0;

	const handleConnectWallet = () => {
		setShowConnectModal(true);
	};

	const handleCloseConnectModal = () => {
		setShowConnectModal(false)
	};

	return <>
		<div className="app">
			<BrowserRouter>
				<SideBar>
					<UserAccount
						onConnect={handleConnectWallet}
						isSupportedNetwork={isSupportedNetwork}
						chains={chains}
						chainId={chainId} />
					{/* <SystemStatsPopup /> */}
				</SideBar>

				<div style={{
					display: "flex",
					flexGrow: 1,
					flexDirection: "column",
					alignItems: "center"
				}}>
					<Switch>
						<Route path="/stake">
							<StakeView />
						</Route>

						<Route path="/liquidations">
							<LiquidationsView />
						</Route>

						<Route path="/">
							{/* <PageSwitcher /> */}
							<BorrowView />
						</Route>

						{/* <Route path="/bonds">
							<Bonds />
						</Route>
						<Route path="/risky-troves">
							<RiskyTrovesPage />
						</Route> */}
					</Switch>
				</div>
			</BrowserRouter>
		</div>

		<ConnectWalletModal
			isOpen={showConnectModal}
			onClose={handleCloseConnectModal} />
	</>
};