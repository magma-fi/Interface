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
import { BorrowerOperations, LUSDToken, TroveManager } from "lib-ethers/dist/types";
import { useLiquity } from "../hooks/LiquityContext";
import BorrowerOperationsAbi from "lib-ethers/abi/BorrowerOperations.json";
import TroveManagerAbi from "lib-ethers/abi/TroveManager.json";
import LUSDTokenAbi from "lib-ethers/abi/LUSDToken.json";
import { Decimal } from "lib-base";
import { WEN, globalContants } from "../libs/globalContants";
import { TermsModal } from "./TermsModal";

export const MainView = () => {
	const [showConnectModal, setShowConnectModal] = useState(false);
	const [showTerms, setShowTerms] = useState(false);
	const { chain, chains } = useNetwork();
	const chainId = useChainId();
	const isSupportedNetwork = chains.findIndex(item => item.id === chain?.id) >= 0;
	const { liquity } = useLiquity();
	const [constants, setConstants] = useState<Record<string, Decimal>>({});
	const dec = Math.pow(10, WEN.decimals || 18);

	const [wenTokenDefault, wenTokenStatus] = useContract<LUSDToken>(
		liquity.connection.addresses.lusdToken,
		LUSDTokenAbi
	);

	const [borrowerOperationsDefault, borrowerOperationsStatus] = useContract<BorrowerOperations>(
		liquity.connection.addresses.borrowerOperations,
		BorrowerOperationsAbi
	);

	const [troveManagerDefault, troveManagerStatus] = useContract<TroveManager>(
		liquity.connection.addresses.troveManager,
		TroveManagerAbi
	);

	useEffect(() => {
		if (!window.localStorage.getItem(globalContants.TERMS_SHOWED)) {
			setShowTerms(true);
		}
	}, []);

	useEffect(() => {
		const getContants = async () => {
			let totalSupply;
			let minNetDebt;
			let wenGasGompensation;
			let mcr;
			let ccr;
			let tvl;

			if (borrowerOperationsStatus === "LOADED") {
				minNetDebt = await borrowerOperationsDefault?.MIN_NET_DEBT()
				wenGasGompensation = await borrowerOperationsDefault?.LUSD_GAS_COMPENSATION();
				mcr = await borrowerOperationsDefault?.MCR();
				ccr = await borrowerOperationsDefault?.CCR();
			}

			if (wenTokenStatus === "LOADED") {
				totalSupply = await wenTokenDefault?.totalSupply();
			}

			if (troveManagerStatus === "LOADED") {
				tvl = await troveManagerDefault?.getEntireSystemColl();
			}

			setConstants({
				...constants,
				MIN_NET_DEBT: Decimal.from(minNetDebt?.toString() || 0).div(dec),
				LUSD_GAS_COMPENSATION: Decimal.from(wenGasGompensation?.toString() || 0).div(dec),
				MCR: Decimal.from(mcr?.toString() || 0).div(dec),
				wenTotalSupply: Decimal.from(totalSupply?.toString() || 0).div(dec),
				CCR: Decimal.from(ccr?.toString() || 0).div(dec),
				TVL: Decimal.from(tvl?.toString() || 0).div(dec),
			});
		};

		getContants();
	}, [borrowerOperationsDefault, borrowerOperationsStatus, wenTokenStatus, wenTokenDefault, troveManagerStatus, troveManagerStatus]);

	const handleConnectWallet = () => {
		setShowConnectModal(true);
	};

	const handleCloseConnectModal = () => {
		setShowConnectModal(false)
	};

	const handleCloseTermsModal = () => {
		setShowTerms(false);
		window.localStorage.setItem(globalContants.TERMS_SHOWED, "1");
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

		{showTerms && <TermsModal
			isOpen={showTerms}
			onClose={handleCloseTermsModal} />}
	</>
};