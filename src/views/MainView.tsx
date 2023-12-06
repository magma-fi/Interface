import { useState } from "react";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { SideBar } from "../components/SideBar";
import { UserAccount } from "../components/UserAccount";
import { Route, BrowserRouter, Switch } from "react-router-dom";
import { BorrowView } from "./BorrowView";
import { StakeView } from "./StakeView";

export const MainView = () => {
	const [showConnectModal, setShowConnectModal] = useState(false);

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
					<UserAccount onConnect={handleConnectWallet} />
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