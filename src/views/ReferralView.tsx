/* eslint-disable @typescript-eslint/no-empty-function */
import { useAccount } from "wagmi";
import { useLang } from "../hooks/useLang";
// import { useMyTransactionState, useTransactionFunction } from "../components/Transaction";
import { useEffect, useState } from "react";
import { useLiquity } from "../hooks/LiquityContext";
import appConfig from "../appConfig.json";
import { JsonObject } from "../libs/types";
import { Decimal } from "lib-base";
import { StabilityPool } from "lib-ethers/dist/types";
import { useContract } from "../hooks/useContract";
import StabilityPoolAbi from "lib-ethers/abi/StabilityPool.json";
import { MAGMA, globalContants } from "../libs/globalContants";
import copy from "copy-to-clipboard";
import { DappContract } from "../libs/DappContract.";
import refererFactory from "../abis/refererFactory.json";
// import { ethers } from "ethers";
// import { EthersSigner } from "lib-ethers";

export const ReferralView = ({
	isReferrer = false,
	haveDeposited = false,
	referralCode = "",
	referer = ""
}: {
	isReferrer: boolean;
	haveDeposited: boolean;
	referralCode: string;
	referer: string;
}) => {
	const { t } = useLang();
	const { address } = useAccount();
	const { liquity, chainId, provider, signer } = useLiquity();
	// const txId = useMemo(() => String(Date.now()), []);
	// const transactionState = useMyTransactionState(txId, true);
	const [loading, setLoading] = useState(false);
	const kickbackRate = Decimal.from((appConfig.refer.kickbackRate as JsonObject)[String(chainId)]);
	const [errorMessage, setErrorMessage] = useState("");
	const [frontendRewards, setFrontendRewards] = useState(Decimal.ZERO);
	const [copied, setCopied] = useState(false);
	const refererFactoryAddress = (appConfig.refer.refererFactory as JsonObject)[String(chainId)];

	// const [sendTransaction] = useTransactionFunction(
	// 	txId,
	// 	liquity.send.registerFrontend.bind(liquity.send, kickbackRate)
	// );

	const [stabilityPoolDefault, stabilityPoolStatus] = useContract<StabilityPool>(
		liquity.connection.addresses.stabilityPool,
		StabilityPoolAbi
	);

	useEffect(() => {
		const read = async () => {
			if (stabilityPoolStatus === "LOADED" && address) {
				// const res = await stabilityPoolDefault?.getFrontEndLQTYGain(address);
				const res = await stabilityPoolDefault?.getFrontEndLQTYGain(referer);
				if (res) {
					setFrontendRewards(Decimal.from(res.toString()).div(MAGMA.decimals));
				}
			}
		};

		read();
	}, [address, stabilityPoolDefault, stabilityPoolStatus]);

	const handleRegisterFrontend = async () => {
		if (!chainId || !provider || kickbackRate?.eq(0) || !signer || !refererFactoryAddress) return;

		setLoading(true);

		const refererFactoryContract = new DappContract(
			refererFactoryAddress,
			refererFactory,
			signer
		);

		refererFactoryContract.dappFunctions.registerReferralAccount.run(
			undefined,
			(error: Error | unknown) => {
				setErrorMessage((error as Error).message);
				setLoading(false);
			},
			() => {
				setErrorMessage("");
				setLoading(false);

				setTimeout(() => {
					window.location.reload();
				}, 1000);
			},
			kickbackRate.mul(globalContants.IOTX_DECIMALS).toString()
		);
	};

	// useEffect(() => {
	// 	if (transactionState.id === txId && (transactionState.type === "failed" || transactionState.type === "cancelled")) {
	// 		setErrorMessage(transactionState.error.reason || transactionState.error.code || transactionState.error.message);
	// 		setLoading(false);
	// 	}

	// 	if (transactionState.id === txId && (transactionState.type === "confirmed")) {
	// 		setErrorMessage("");
	// 		setLoading(false);
	// 	}
	// }, [transactionState.type, transactionState.id, txId]);

	const handleCopy = () => {
		copy(globalContants.HOST + referralCode);
		setCopied(true);

		setTimeout(() => {
			setCopied(false)
		}, 3000);
	};

	return <div className="mainContainer">
		<div className="titleBox">
			<img
				className="viewIcon"
				src="images/liquidations.png" />

			<h2>{t("becomeAmbassador")}</h2>

			<div className="description">{t("referralHeaderDescription")}</div>

			{!isReferrer && <div
				className="card bigBox">
				<img src="images/register-address.png" />

				<h3>{t("registerYourAddress")}</h3>

				<div
					className="card bigBox"
					style={{ width: "fit-content" }}>
					<div className="flex-row-align-left">
						<img
							src="images/link.png"
							width="20px" />

						<div>{globalContants.HOST}******</div>
					</div>

					<div className="flex-column-align-center">
						<button
							className="primaryButton bigButton"
							style={{
								paddingLeft: "5rem",
								paddingRight: "5rem"
							}}
							disabled={!address || loading || !refererFactoryAddress}
							onClick={handleRegisterFrontend}>
							<img src="images/wallet-dark.png" />

							{loading ? t("registering") + "..." : t("registerAddress")}
						</button>

						{/* {haveDeposited && <div className="label smallLabel">{t("mustHaveNoDeposit")}</div>} */}

						{errorMessage && <div className="label smallLabel">{errorMessage}</div>}
					</div>
				</div>
			</div>}

			{isReferrer && <div
				className="card bigBox referralBox">
				<div className="flex-column-align-left">
					<div className="label smallLabel">{t("totalRewardsReceived")}</div>

					<div className="flex-row-align-left">
						<img
							src="images/magma.png"
							width="24px" />

						<h4>{frontendRewards.toString(2)}&nbsp;{t("magmaPoints")}</h4>
					</div>
				</div>

				<div className="verticalDivision">&nbsp;</div>

				<div
					className="flex-column-align-left"
					style={{
						gap: "1rem",
						flex: "1 1"
					}}>
					<div className="label">{t("referralURL")}</div>

					<div className="card bigBox urlLabel">
						<div className="flex-row-align-left">
							<img
								src="images/link.png"
								width="20px" />

							<div>{copied ? t("copiedSuccessfully") : globalContants.HOST + referralCode}</div>
						</div>

						<button
							className="primaryButton"
							style={{
								paddingLeft: "2rem",
								paddingRight: "2rem"
							}}
							onClick={handleCopy}>
							<img src="images/copy.png" />

							{t("copyURL")}
						</button>
					</div>
				</div>
			</div>}
		</div>
	</div>
};