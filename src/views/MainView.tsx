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
import { DepositByReferrer, JsonObject } from "../libs/types";
import refererFactory from "../abis/refererFactory.json";
import { appController } from "../libs/appController";
import { zeroAddress } from "viem";

const select = ({ trove }: LiquityStoreState) => ({ trove });

export const MainView = ({ chains, rabbyKit }: {
	chains: Chain[];
	rabbyKit?: unknown;
}) => {
	const { isConnected } = useAccount();
	const [showConnectModal, setShowConnectModal] = useState(false);
	const [showTerms, setShowTerms] = useState(false);
	const { chain } = useNetwork();
	const isSupportedNetwork = chains.findIndex(item => item.id === chain?.id) >= 0;
	const { account, liquity, chainId, signer } = useLiquity();
	const [referrer, setReferrer] = useState<string | undefined>(undefined);
	const [constants, setConstants] = useState<Record<string, Decimal>>({});
	const [externalDataDone, setExternalDataDone] = useState(false);
	const dec = Math.pow(10, WEN.decimals || 18);
	const [points, setPoints] = useState(0);
	const [pointObject, setPointObject] = useState<Record<string, number>>();

	const { trove } = useLiquitySelector(select);
	const [isReferrer, setIsReferrer] = useState(false);
	const [referralCode, setReferralCode] = useState("");
	const [depositsByReferrer, setDepositsByReferrer] = useState<DepositByReferrer[]>()
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
		if (chainId === 0) return;

		appController.employWorkers(chainId, () => {
			setExternalDataDone(true);
		});
	}, [chainId]);

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
			if (res && (res[0] !== zeroAddress)) {
				setReferrer(res[0]);
				setIsReferrer(true);
			} else {
				setReferrer("");
				setIsReferrer(false);
			}
		};

		if (chainId && account && signer) {
			getReferer();
		}
	}, [account, chainId, signer]);

	useEffect(() => {
		if (!chainId || !account || referrer === undefined) return;

		appController.getUserPoints(
			chainId,
			account.toLowerCase(),
			referrer,
			(res, resObject) => {
				setPoints(res);
				setPointObject(resObject);
			});
	}, [chainId, account, referrer]);

	useEffect(() => {
		if (!referrer || chainId === 0) return;

		setTimeout(() => {
			const query = graphqlAsker.requestReferer(referrer)
			graphqlAsker.ask(chainId, query, (data: any) => {
				if (data?.frontends?.length > 0) {
					const ref = data?.frontends[0];
					setReferralCode(ref.code);

					setDepositsByReferrer(ref.deposits.map((item: any) => {
						return {
							address: item.id,
							depositedAmount: Number(item.depositedAmount),
							latestTransaction: item.changes[0].transaction.id,
							lastUpdate: item.changes[0].transaction.timestamp
						} as DepositByReferrer;
					}));
				}
			});
		}, 1000);
	}, [referrer, chainId]);

	useEffect(() => {
		if (!isConnected) {
			setShowConnectModal(true);
			// return rabbyKit && rabbyKit.open();
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
		// return rabbyKit && rabbyKit.open();
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
							chainId={chainId}
							points={points}
							pointObject={pointObject} />
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
								referrer={referrer}
								deposits={depositsByReferrer}
								points={points} />
						</Route>

						<Route path="/">
							<BorrowView
								isReferrer={isReferrer}
								constants={constants}
								externalDataDone={externalDataDone} />
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