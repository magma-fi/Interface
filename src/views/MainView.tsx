import { useEffect, useState } from "react";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { SideBar } from "../components/SideBar";
import { UserAccount } from "../components/UserAccount";
import { Route, BrowserRouter, Switch, useParams } from "react-router-dom";
import { BorrowView } from "./BorrowView";
import { StakeView } from "./StakeView";
import { Chain, useAccount, useNetwork } from "wagmi";
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
import { ReferralView } from "./ReferralView";
import { Footer } from "./Footer";
import { LiquityStoreState } from "lib-base/dist/src/LiquityStore";
import { useLiquitySelector } from "@liquity/lib-react";
import { graphqlAsker } from "../libs/graphqlAsker";
import { DappContract } from "../libs/DappContract.";
import appConfig from "../appConfig.json";
import { JsonObject } from "../libs/types";
import refererFactory from "../abis/refererFactory.json";

const select = ({
	trove,
	// stabilityDeposit
}: LiquityStoreState) => ({
	trove,
	// stabilityDeposit
});

export const MainView = ({ chains }: { chains: Chain[] }) => {
	const { isConnected } = useAccount();
	const [showConnectModal, setShowConnectModal] = useState(false);
	const [showTerms, setShowTerms] = useState(false);
	const { chain } = useNetwork();
	const isSupportedNetwork = chains.findIndex(item => item.id === chain?.id) >= 0;
	const { account, liquity, chainId, signer } = useLiquity();
	const [referer, setReferer] = useState("");
	const [constants, setConstants] = useState<Record<string, Decimal>>({});
	const dec = Math.pow(10, WEN.decimals || 18);

	const { trove } = useLiquitySelector(select);

	const [isReferrer, setIsReferrer] = useState(false);
	const [referralCode, setReferralCode] = useState("");
	const haveDeposited = trove?.collateral?.gt(0);

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

		const getReferer = async () => {
			const refererFactoryContract = new DappContract(
				(appConfig.refer.refererFactory as JsonObject)[String(chainId)],
				refererFactory,
				signer
			);

			const res = await refererFactoryContract.dappFunctions.referralAccounts.call(account);
			if (res) {
				setReferer(res[0])
			}
		};

		if (chainId && account) {
			getReferer();
		}
	}, [account, chainId]);

	useEffect(() => {
		if (!referer || chainId === 0) return;

		setTimeout(() => {
			const query = graphqlAsker.requestReferer(referer)
			graphqlAsker.ask(chainId, query, (data: any) => {
				if (data?.frontends?.length > 0) {
					setIsReferrer(true);

					const ref = data?.frontends[0];
					setReferralCode(ref.code);
				}
			});
		}, 1000);
	}, [referer, chainId]);

	useEffect(() => {
		if (!isConnected) {
			setShowConnectModal(true);
		}
	}, [isConnected]);

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
					alignItems: "center",
					position: "relative"
				}}>
					<div style={{
						width: "100%",
						display: "flex",
						flexDirection: "row",
						justifyContent: "flex-end",
						alignItems: "center"
					}}>
						<UserAccount
							onConnect={handleConnectWallet}
							isSupportedNetwork={isSupportedNetwork}
							chains={chains}
							chainId={chainId} />
					</div>

					<Switch>
						<Route path="/stake">
							<StakeView constants={constants} />
						</Route>

						<Route path="/liquidations">
							<LiquidationsView constants={constants} />
						</Route>

						<Route path="/referral">
							<ReferralView
								haveDeposited={haveDeposited}
								isReferrer={isReferrer}
								referralCode={referralCode}
								referer={referer} />
						</Route>

						<Route path="/">
							<BorrowView
								isReferrer={isReferrer}
								constants={constants} />
						</Route>

						{/* <Route path="/bonds">
							<Bonds />
						</Route> */}
					</Switch>

					<Footer />
				</div>

				<SideBar />
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