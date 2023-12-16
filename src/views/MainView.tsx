import { useEffect, useState } from "react";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { SideBar } from "../components/SideBar";
import { UserAccount } from "../components/UserAccount";
import { Route, BrowserRouter, Switch } from "react-router-dom";
import { BorrowView } from "./BorrowView";
import { StakeView } from "./StakeView";
import { useChainId, useNetwork } from "wagmi";
import { LiquidationsView } from "./LiquidationsView";
import { useContract } from "../hooks/useContract";
import { BorrowerOperations } from "lib-ethers/dist/types";
import { useLiquity } from "../hooks/LiquityContext";
import BorrowerOperationsAbi from "lib-ethers/abi/BorrowerOperations.json";
import { Decimal } from "lib-base";
import { WEN } from "../libs/globalContants";

export const MainView = () => {
	const [showConnectModal, setShowConnectModal] = useState(false);
	const { chain, chains } = useNetwork();
	const chainId = useChainId();
	const isSupportedNetwork = chains.findIndex(item => item.id === chain?.id) >= 0;
	const { liquity } = useLiquity();
	const [constants, setConstants] = useState<Record<string, Decimal>>({});

	const [borrowerOperationsDefault, borrowerOperationsStatus] = useContract<BorrowerOperations>(
		liquity.connection.addresses.borrowerOperations,
		BorrowerOperationsAbi
	);

	useEffect(() => {
		const getContants = async () => {
			const dec = Math.pow(10, WEN.decimals || 18);
			let minNetDebt;
			let wenGasGompensation;
			let mcr;
			if (borrowerOperationsStatus === "LOADED") {
				minNetDebt = await borrowerOperationsDefault?.MIN_NET_DEBT()
				wenGasGompensation = await borrowerOperationsDefault?.LUSD_GAS_COMPENSATION();
				mcr = await borrowerOperationsDefault?.MCR();
			}

			setConstants({
				MIN_NET_DEBT: Decimal.from(minNetDebt?.toString() || 0).div(dec),
				LUSD_GAS_COMPENSATION: Decimal.from(wenGasGompensation?.toString() || 0).div(dec),
				MCR: Decimal.from(mcr?.toString() || 0).div(dec)
			});
		};

		getContants();
	}, [borrowerOperationsDefault, borrowerOperationsStatus]);

	const handleConnectWallet = () => {
		setShowConnectModal(true);
	};

	const handleCloseConnectModal = () => {
		setShowConnectModal(false)
	};

	return <>
		<div className="app">
			<BrowserRouter>
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
							<LiquidationsView constants={constants} />
						</Route>

						<Route path="/">
							{/* <PageSwitcher /> */}
							<BorrowView constants={constants} />
						</Route>

						{/* <Route path="/bonds">
							<Bonds />
						</Route>
						<Route path="/risky-troves">
							<RiskyTrovesPage />
						</Route> */}
					</Switch>
				</div>

				<SideBar>
					<UserAccount
						onConnect={handleConnectWallet}
						isSupportedNetwork={isSupportedNetwork}
						chains={chains}
						chainId={chainId} />
					{/* <SystemStatsPopup /> */}
				</SideBar>
			</BrowserRouter>
		</div>

		<ConnectWalletModal
			isOpen={showConnectModal}
			onClose={handleCloseConnectModal} />
	</>
};