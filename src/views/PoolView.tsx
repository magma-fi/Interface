/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useLang } from "../hooks/useLang";
import { IOTX, MAGMA, ModalAction, WEN, globalContants } from "../libs/globalContants";
import { Coin, StabilityDepositOperation, StabilityTransactionRecord } from "../libs/types";
import { LiquityStoreState } from "lib-base/dist/src/LiquityStore";
import { useLiquitySelector } from "@liquity/lib-react";
import { StakeModal } from "./StakeModal";
import { selectForStabilityDepositChangeValidation } from "../components/Stability/validation/validateStabilityDepositChange";
import { TxDone } from "../components/TxDone";
import { TxLabel } from "../components/TxLabel";
import { UnstakeModal } from "./UnstakeModal";
import { useLiquity } from "../hooks/LiquityContext";
import { Decimal, LUSD_LIQUIDATION_RESERVE } from "lib-base"
import { SwapWEN2IOTXModal } from "./SwapWEN2IOTXModal";
import { useMyTransactionState, useTransactionFunction } from "../components/Transaction";
import { graphqlAsker } from "../libs/graphqlAsker";
import { StabilityTransactionListItem } from "./StabilityTransactionListItem";

type ModalOpenning = {
	action: ModalAction;
	isShow: boolean;
}

export const PoolView = ({ market, constants }: {
	market: Coin;
	constants: Record<string, Decimal>
}) => {
	const { t } = useLang();

	const selector = useMemo(() => {
		return (state: LiquityStoreState) => {
			const {
				lusdBalance,
				stabilityDeposit,
				lusdInStabilityPool,
				numberOfTroves,
				price,
				trove
			} = state;

			return {
				lusdBalance,
				stabilityDeposit,
				lusdInStabilityPool,
				numberOfTroves,
				price,
				trove,
				validationContext: selectForStabilityDepositChangeValidation(state)
			};
		};
	}, []);

	const {
		lusdBalance,
		stabilityDeposit,
		lusdInStabilityPool,
		numberOfTroves,
		price,
		trove,
		validationContext
	} = useLiquitySelector(selector);
	// const { address } = useAccount();
	const { liquity, walletClient, account, chainId } = useLiquity();
	const [showModal, setShowModal] = useState<ModalOpenning | null>(null);
	const [showTxResult, setTxResult] = useState<ModalOpenning | null>(null);
	const [amountInTx, setAmountInTx] = useState(0);
	const [txHash, setTxHash] = useState("");
	const wenTotalSupply = constants?.wenTotalSupply || Decimal.ZERO;
	// const [rewardsFromCollateral, setRewardsFromCollateral] = useState(Decimal.ZERO);
	const rewardsFromCollateral = stabilityDeposit.collateralGain;
	const netDebt = trove.debt.gt(constants?.LUSD_GAS_COMPENSATION || LUSD_LIQUIDATION_RESERVE) ? trove.netDebt : Decimal.ZERO;
	const [resetTx, setResetTx] = useState(false);
	const txId = useMemo(() => String(new Date().getTime()), [resetTx]);
	const transactionState = useMyTransactionState(txId, true);
	const [txs, setTxs] = useState<StabilityTransactionRecord[]>();

	const [sendTransaction] = useTransactionFunction(
		txId,
		liquity.send.withdrawGainsFromStabilityPool.bind(liquity.send)
	);

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

	useEffect(() => {
		if (transactionState.id === txId && transactionState.tx) {
			setTxHash(transactionState.tx.rawSentTransaction as unknown as string);
		}

		if (transactionState.id === txId && (transactionState.type === "failed" || transactionState.type === "cancelled")) {
			setResetTx(!resetTx);
		}

		if (transactionState.id === txId && (transactionState.type === "confirmed")) {
			setTxResult({
				action: ModalAction.ClaimRewards,
				isShow: true
			} as ModalOpenning);

			setResetTx(!resetTx);
		}
	}, [transactionState.type, transactionState.id, txId]);

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
		if (sendTransaction) {
			setAmountInTx(Number(stabilityDeposit.lqtyReward.toString(2)));

			return sendTransaction();
		}
	};

	return <>
		<div className="marketView">
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

					<div className="label">{t("walletBalance") + " " + lusdBalance.toString(2) + " " + WEN.symbol}</div>
				</div>

				<div className="panel">
					<div className="flex-column">
						<div className="flex-row-space-between">
							<h4 className="fat">{t("staked")}</h4>

							<div>
								<span className="label">{t("shareOfPool")}&nbsp;&nbsp;</span>

								<span>{stabilityDeposit.currentLUSD.mulDiv(100, lusdInStabilityPool).toString(4) + "%"}</span>
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
									<div>{stabilityDeposit.currentLUSD.toString(2)}&nbsp;{globalContants.USD}</div>

									<div className="label labelSmall">{stabilityDeposit.currentLUSD.toString(2)}&nbsp;{WEN.symbol}</div>
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
								disabled={stabilityDeposit.lqtyReward.isZero || transactionState.type !== "idle"}>
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
									<div>{rewardsFromCollateral.mul(price).toString(2)}&nbsp;{globalContants.USD}</div>

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

						<div>{lusdInStabilityPool.toString(2) + " " + WEN.symbol}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("wenTotalSupply")}</div>

						<div>{wenTotalSupply.toString(2) + " " + WEN.symbol}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("wenStakingRate")}</div>

						<div style={{ color: "#F25454" }}>{(wenTotalSupply.gt(0) ? lusdInStabilityPool.div(wenTotalSupply).mul(100).toString(2) : 0) + "%"}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("numberOfVaults")}</div>

						<div>{numberOfTroves}</div>
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
							data={txItem}
							market={market}
							price={price} />
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
			validationContext={validationContext}
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
			max={Decimal.min(netDebt, lusdBalance)}
			price={price}
			trove={trove} />}

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
			accountBalance={stabilityDeposit.currentLUSD}
			onDone={handleModalDone}
			stabilityDeposit={stabilityDeposit}
			validationContext={validationContext}
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