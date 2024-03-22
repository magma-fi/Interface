/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useLang } from "../hooks/useLang";
import { IOTX, MAGMA, ModalAction, WEN, globalContants } from "../libs/globalContants";
import { Coin, StabilityDepositOperation, StabilityTransactionRecord, StabilityDeposit } from "../libs/types";
import { StakeModal } from "./StakeModal";
import { TxDone } from "../components/TxDone";
import { TxLabel } from "../components/TxLabel";
import { UnstakeModal } from "./UnstakeModal";
import { useLiquity } from "../hooks/LiquityContext";
import { SwapWEN2IOTXModal } from "./SwapWEN2IOTXModal";
import { graphqlAsker } from "../libs/graphqlAsker";
import { StabilityTransactionListItem } from "./StabilityTransactionListItem";
import { formatAsset, formatAssetAmount, formatCurrency, formatPercent } from "../utils";
import BigNumber from "bignumber.js";

type ModalOpenning = {
	action: ModalAction;
	isShow: boolean;
}

export const PoolView = ({ market, magmaData, refreshTrigger }: {
	market: Coin;
	magmaData?: Record<string, any>;
	refreshTrigger: () => void;
}) => {
	if (!magmaData) return <></>

	const {
		lusdBalance,
		stabilityDeposit,
		lusdInStabilityPool,
		vaultsCount,
		price,
		vault
	} = magmaData;
	const { t } = useLang();
	const { liquity, walletClient, account, chainId } = useLiquity();
	const [showModal, setShowModal] = useState<ModalOpenning | null>(null);
	const [showTxResult, setTxResult] = useState<ModalOpenning | null>(null);
	const [amountInTx, setAmountInTx] = useState(0);
	const [txHash, setTxHash] = useState("");
	const wenTotalSupply = magmaData?.wenTotalSupply || globalContants.BIG_NUMBER_0;
	const rewardsFromCollateral = formatAssetAmount(stabilityDeposit.collateralGain, WEN.decimals);
	const reserve = magmaData?.LUSD_GAS_COMPENSATION;
	const netDebt = vault.debt.gt(reserve) ? vault.netDebt : globalContants.BIG_NUMBER_0;
	const [txs, setTxs] = useState<StabilityTransactionRecord[]>();
	const stakedDecimals = formatAssetAmount(stabilityDeposit.currentLUSD, WEN.decimals);


	const handleRedeemCollateral = (evt: React.MouseEvent<HTMLButtonElement>) => {
		setShowModal({
			action: evt.currentTarget.id as ModalAction,
			isShow: true
		} as ModalOpenning);
	};

	useEffect(() => {
		if (!account || (txs && txs.length > 0)) return;

		setTimeout(() => {
			const query = graphqlAsker.requestStabilityDepositChanges(account, 5)
			graphqlAsker.ask(chainId, query, (data: any) => {
				if (data?.stabilityDepositChanges) {
					setTxs(data.stabilityDepositChanges.map((item: any) => ({
						id: item.sequenceNumber,
						operation: StabilityDepositOperation[item.stabilityDepositOperation as keyof typeof StabilityDepositOperation],
						amount: Number(item.depositedAmountChange),
						timestamp: item.transaction.timestamp * 1000,
						tx: item.transaction.id
					} as StabilityTransactionRecord)));
				}
			});
		}, 1000);
	}, [account, chainId]);

	const handleShowModal = (evt: React.MouseEvent<HTMLButtonElement>) => {
		setShowModal({
			action: evt.currentTarget.id as ModalAction,
			isShow: true
		} as ModalOpenning)
	};

	const handleCloseModal = () => {
		setShowModal(null);
	};

	const handleCloseTxResult = () => {
		setTxResult(null);
		setTxHash("");
		setAmountInTx(0);
	};

	const handleWatchAsset = async () => {
		await walletClient?.watchAsset({
			type: "ERC20",
			options: {
				address: liquity.connection.addresses.lqtyToken,
				decimals: MAGMA.decimals || 18,
				symbol: MAGMA.symbol
			}
		});
	};

	const handleModalDone = (tx: string, arg: number) => {
		setTxHash(tx);
		setAmountInTx(arg);

		setTxResult({
			action: showModal?.action,
			isShow: true
		} as ModalOpenning);

		handleCloseModal();

		return refreshTrigger && refreshTrigger();
	};

	if (market?.symbol === "DAI" || market?.symbol === "USDC") {
		return <div className="marketView">
			<h2>Coming soon...</h2>
		</div>
	}

	const handleUnstake = () => {
		setShowModal({
			action: ModalAction.Unstake,
			isShow: true
		} as ModalOpenning)
	};

	const handleClaim = () => {
		// if (sendTransaction) {
		// 	setAmountInTx(Number(stabilityDeposit.lqtyReward.toString(2)));

		// 	return sendTransaction();
		// }
	};

	return <>
		<div className="marketView poolView">
			<div
				className="flex-column"
				style={{ gap: "24px" }}>
				<div
					className="flex-column"
					style={{
						alignItems: "center",
						gap: "1rem"
					}}>
					<div className="flex-column">
						<button
							id={ModalAction.Stake}
							className="primaryButton"
							onClick={handleShowModal}>
							<img src="images/stake-dark.png" />

							{t("stake")}
						</button>

						<button
							id={ModalAction.SwapWEN2IOTX}
							onClick={handleRedeemCollateral}
							className="secondaryButton fullWidth">
							<img src="images/swap-orange.png" />

							{t("swapWen2Iotx")}
						</button>
					</div>

					<div className="label">{t("walletBalance") + " " + formatAsset(formatAssetAmount(lusdBalance, WEN.decimals), WEN)}</div>
				</div>

				<div className="panel">
					<div className="flex-column">
						<div className="flex-row-space-between">
							<h4 className="fat">{t("staked")}</h4>

							<div>
								<span className="label">{t("shareOfPool")}&nbsp;&nbsp;</span>

								<span>{formatPercent(stabilityDeposit.currentLUSD.dividedBy(lusdInStabilityPool).toNumber())}</span>
							</div>
						</div>

						<div
							className="flex-row-space-between"
							style={{ alignItems: "center" }}>
							<div className="flex-row-align-left">
								<img
									src={WEN.logo}
									width="40px" />

								<div className="flex-column-align-left">
									<div>{formatCurrency(stakedDecimals)}</div>

									<div className="label labelSmall">{formatAsset(stakedDecimals, WEN)}</div>
								</div>
							</div>

							<button
								className="secondaryButton"
								onClick={handleUnstake}>
								{t("unstake")}
							</button>
						</div>
					</div>

					<div className="flex-column">
						<h4 className="fat">{t("magmaRewards")}</h4>

						<div
							className="flex-row-space-between"
							style={{ alignItems: "center" }}>
							<div className="flex-row-align-left">
								<img
									src={MAGMA.logo}
									width="40px" />

								<div className="flex-column-align-left">
									{/* <div>{stabilityDeposit.lqtyReward.toString(2)}&nbsp;{globalContants.USD}</div> */}

									<div className="label labelSmall">{stabilityDeposit.lqtyReward.toString(2)}&nbsp;{MAGMA.symbol}</div>
								</div>
							</div>

							<button
								className="secondaryButton"
								onClick={handleClaim}
								disabled={(stabilityDeposit as StabilityDeposit).lqtyReward.eq(0)}>
								<img src="images/rewards.png" />

								{t("claimRewards")}
							</button>
						</div>
					</div>

					<div className="flex-column">
						<h4 className="fat">{t("rewardsFromCollateral")}</h4>

						<div className="label">{t("rewardsDescription")}</div>

						<div
							className="flex-row-space-between"
							style={{ alignItems: "center" }}>
							<div className="flex-row-align-left">
								<img
									src={IOTX.logo}
									width="40px" />

								<div className="flex-column-align-left">
									<div>{formatCurrency(rewardsFromCollateral * price)}</div>

									<div className="label labelSmall">{rewardsFromCollateral.toString(2)}&nbsp;{IOTX.symbol}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div
				className="flex-column"
				style={{ gap: "40px" }}>
				<div
					className="panel"
					style={{ gap: "12px" }}>
					<div className="flex-row-space-between">
						<div className="label">{t("totalValueLocked")}</div>

						<div>{formatAsset(formatAssetAmount(lusdInStabilityPool, WEN.decimals), WEN)}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("wenTotalSupply")}</div>

						<div>{formatAsset(formatAssetAmount(wenTotalSupply, WEN.decimals), WEN)}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("wenStakingRate")}</div>

						<div style={{ color: "#F25454" }}>{formatPercent(lusdInStabilityPool.dividedBy(wenTotalSupply).toNumber())}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("numberOfVaults")}</div>

						<div>{vaultsCount}</div>
					</div>
				</div>

				{txs && txs.length > 0 && <div
					className="card"
					style={{ gap: "24px" }}>
					<div className="flex-row-space-between">
						<h3>{t("latestTransactions")}</h3>

						<div>&nbsp;</div>
					</div>

					{txs.map(txItem => {
						return <StabilityTransactionListItem
							key={txItem.id}
							// price={price} 
							// market={market}
							data={txItem} />
					})}
				</div>}
			</div>
		</div>

		{showModal?.action === ModalAction.Stake && showModal.isShow && <StakeModal
			isOpen={showModal.isShow}
			onClose={handleCloseModal}
			wenBalance={lusdBalance}
			onDone={handleModalDone}
			stabilityDeposit={stabilityDeposit}
			lusdInStabilityPool={lusdInStabilityPool} />}

		{showTxResult?.action === ModalAction.Stake && showTxResult.isShow && <TxDone
			title={t("stakedSuccessfully")}
			onClose={handleCloseTxResult}
			illustration="images/stake-successful.png"
			whereGoBack={t("back2StabilityPool")}>
			<TxLabel
				txHash={txHash}
				title={t("stakedAmount")}
				logo={WEN.logo}
				amount={amountInTx + " " + WEN.symbol} />
		</TxDone>}

		{showModal?.action === ModalAction.SwapWEN2IOTX && showModal.isShow && <SwapWEN2IOTXModal
			isOpen={showModal.isShow}
			onClose={handleCloseModal}
			onDone={handleModalDone}
			max={BigNumber.min(netDebt, lusdBalance)}
			price={price} />}

		{showTxResult?.action === ModalAction.SwapWEN2IOTX && showTxResult.isShow && <TxDone
			title={t("wenSwappedSuccessfully")}
			onClose={handleCloseTxResult}
			illustration="images/swap-success.png"
			whereGoBack={t("back2StabilityPool")}>
			<TxLabel
				txHash={txHash}
				title={t("youReceived")}
				logo={WEN.logo}
				amount={amountInTx + " " + IOTX.symbol} />
		</TxDone>}

		{showModal?.action === ModalAction.Unstake && showModal.isShow && <UnstakeModal
			isOpen={showModal.isShow}
			onClose={handleCloseModal}
			wenBalance={lusdBalance}
			onDone={handleModalDone}
			stabilityDeposit={stabilityDeposit}
			lusdInStabilityPool={lusdInStabilityPool} />}

		{showTxResult?.action === ModalAction.Unstake && showTxResult.isShow && <TxDone
			title={t("unstakedSuccessfully")}
			onClose={handleCloseTxResult}
			illustration="images/unstake-successful.png"
			whereGoBack={t("back2StabilityPool")}>
			<TxLabel
				txHash={txHash}
				title={t("unstakedAmount")}
				logo={WEN.logo}
				amount={amountInTx + " " + WEN.symbol} />
		</TxDone>}

		{showTxResult?.action === ModalAction.ClaimRewards && showTxResult.isShow && <TxDone
			title={t("rewardsClaimedSuccessfully")}
			onClose={handleCloseTxResult}
			illustration="images/rewards-collected.png"
			whereGoBack={t("close")}>
			<div className="flex-column-align-center">
				<TxLabel
					txHash={txHash}
					title={t("claimed")}
					logo={MAGMA.logo}
					amount={amountInTx + " " + MAGMA.symbol} />

				<button
					className="textButton smallTextButton"
					style={{ textTransform: "none" }}
					onClick={handleWatchAsset}>
					{t("watchMagmaToWallet")}
				</button>
			</div>
		</TxDone>}
	</>
};