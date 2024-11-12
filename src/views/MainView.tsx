/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { SideBar } from "../components/SideBar";
import { UserAccount } from "../components/UserAccount";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { BorrowView } from "./BorrowView";
import { StakeView } from "./StakeView";
import { Chain, useAccount, useBalance, useNetwork } from "wagmi";
import { LiquidationsView } from "./LiquidationsView";
import { useLiquity } from "../hooks/LiquityContext";
import { globalContants } from "../libs/globalContants";
import { TermsModal } from "./TermsModal";
import { ReferralView } from "./ReferralView";
import { Footer } from "./Footer";
import { graphqlAsker } from "../libs/graphqlAsker";
import { DappContract } from "../libs/DappContract";
import appConfig from "../appConfig.json";
import { DepositByReferrer, JsonObject } from "../libs/types";
import refererFactory from "../abis/refererFactory.json";
import { appController } from "../libs/appController";
import { Address, zeroAddress } from "viem";
import { magma } from "../libs/magma";
import { JsonRpcSigner } from "@ethersproject/providers";
import { Vault } from "../libs/Vault";
import BigNumber from "bignumber.js";
import { Dashboard } from "./Dashboard";

export const MainView = ({ chains }: { chains: Chain[] }) => {
	const { isConnected } = useAccount();
	const [showConnectModal, setShowConnectModal] = useState(false);
	const [showTerms, setShowTerms] = useState(false);
	const { chain } = useNetwork();
	const isSupportedNetwork = chains.findIndex(item => item.id === chain?.id) >= 0;
	const { account, chainId, signer } = useLiquity();
	const [referrer, setReferrer] = useState<string | undefined>(undefined);
	// const [externalDataDone, setExternalDataDone] = useState(false);
	const [magmaData, setMagmaData] = useState<Record<string, any>>();
	const [points, setPoints] = useState(0);
	const { data } = useBalance({ address: account as Address, chainId });
	const accountBalance = BigNumber(data?.value.toString() || 0) || globalContants.BIG_NUMBER_0;
	const [vaults, setVaults] = useState<any>({});
	const [pointObject, setPointObject] = useState<Record<string, number>>();
	const [isReferrer, setIsReferrer] = useState(false);
	const [referralCode, setReferralCode] = useState("");
	const [depositsByReferrer, setDepositsByReferrer] = useState<DepositByReferrer[]>()
	const haveDeposited: boolean = Object.values(vaults).findIndex(vault => (vault as unknown as Vault).collateral.gt(0)) >= 0;
	const [refresh, setRefresh] = useState(false);

	// useEffect(() => {
	// 	if (chainId === 0) return;

	// 	appController.employWorkers(chainId, () => {
	// 		setExternalDataDone(true);
	// 	});
	// }, [chainId]);

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

	// useEffect(() => {
	// 	if (!chainId || !account || referrer === undefined) return;

	// 	appController.getUserPoints(
	// 		chainId,
	// 		account.toLowerCase(),
	// 		referrer,
	// 		(res, resObject) => {
	// 			setPoints(res);
	// 			setPointObject(resObject);
	// 		});
	// }, [chainId, account, referrer]);

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
		}
	}, [isConnected]);

	useEffect(() => {
		if (chainId > 0 && signer && account) {
			magma.init(chainId, signer as JsonRpcSigner, account);

			const getData = async () => {
				const res = await magma.getMagmaData();

				const v = await magma.getVaultByOwner(account);
				if (v) setVaults(v);

				if (res) setMagmaData({
					...res,
					accountBalance,
					vaults: v,
					totalCollateralRatio: magma.getTotalCollateralRatio()
				});
			};

			getData();
		}
	}, [account, chainId, signer, refresh]);

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

	const switchRefresh = () => {
		setRefresh(!refresh);
	};

	return <>
		<div className="app">
			{/* <Titlebar /> */}

			<BrowserRouter>
				<div style={{
					width: "100%",
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
					marginTop: "1.5rem"
				}}>
					<UserAccount
						onConnect={handleConnectWallet}
						isSupportedNetwork={isSupportedNetwork}
						chains={chains}
						chainId={chainId}
						points={points}
						pointObject={pointObject} />

					<Routes>
						<Route
							path="/stake"
							element={<StakeView
								magmaData={magmaData}
								refreshTrigger={switchRefresh} />} />

						<Route
							path="/liquidations"
							element={<LiquidationsView
								magmaData={magmaData}
								refreshTrigger={switchRefresh} />} />

						<Route
							path="/referral"
							element={<ReferralView
								haveDeposited={haveDeposited}
								isReferrer={isReferrer}
								referralCode={referralCode}
								referrer={referrer}
								deposits={depositsByReferrer}
								points={points} />} />

						<Route
							path="/borrow"
							element={<BorrowView
								isReferrer={isReferrer}
								// externalDataDone={externalDataDone}
								magmaData={magmaData}
								refreshTrigger={switchRefresh} />} />

						<Route
							path="/"
							element={<Dashboard magmaData={magmaData} />} />
					</Routes>

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