import { useState } from "react";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { SideBar } from "../components/SideBar";
import { UserAccount } from "../components/UserAccount";
import { Route, HashRouter as Router, Switch } from "react-router-dom";
import { BorrowView } from "./BorrowView";

export const MainView = () => {
	const [showConnectModal, setShowConnectModal] = useState(false);

	const handleConnectWallet = () => {
		setShowConnectModal(true);
	};

	const handleCloseConnectModal = () => {
		setShowConnectModal(false)
	};

	return <>
		<Router>
			<div className="app">
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
						<Route path="/" exact>
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
			</div>
		</Router>

		<ConnectWalletModal
			isOpen={showConnectModal}
			onClose={handleCloseConnectModal} />
	</>
};