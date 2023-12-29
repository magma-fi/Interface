/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { ErrorMessage, ValidationContextForStabilityPool } from "../libs/types";
import { WEN } from "../libs/globalContants";
import { AmountInput } from "../components/AmountInput";
import { useState, useEffect, useMemo } from "react";
import { Decimal, StabilityDeposit } from "lib-base";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { useMyTransactionState } from "../components/Transaction";
import TroveManagerAbi from "lib-ethers/abi/TroveManager.json";
import HintHelpersAbi from "lib-ethers/abi/HintHelpers.json";
import SortedTrovesAbi from "lib-ethers/abi/SortedTroves.json";
import { HintHelpers, SortedTroves, TroveManager } from "lib-ethers/dist/types";
import { validateStabilityDepositChange } from "../components/Stability/validation/validateStabilityDepositChange";
import { StabilityDepositAction } from "../components/Stability/StabilityDepositAction";
import { SnackBar } from "../components/SnackBar";

export const SwapWEN2IOTXModal = ({
	isOpen = false,
	onClose = () => { },
	accountBalance = Decimal.ZERO,
	onDone = () => { },
	stabilityDeposit,
	validationContext,
	lusdInStabilityPool,
	max,
	price
}: {
	isOpen: boolean;
	onClose: () => void;
	accountBalance: Decimal;
	onDone: (tx: string, swapAmount: number) => void;
	stabilityDeposit: StabilityDeposit;
	validationContext: ValidationContextForStabilityPool;
	lusdInStabilityPool: Decimal;
	max: Decimal;
	price: Decimal;
}) => {
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(-1);
	const [swapAmount, setSwapAmount] = useState(0);
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);
	const maxNumber = Number(max);

	const [validChange, description] = validateStabilityDepositChange(
		stabilityDeposit,
		stabilityDeposit.currentLUSD.add(swapAmount),
		validationContext
	);

	const [errorMessages, setErrorMessages] = useState<ErrorMessage | undefined>(description as ErrorMessage);

	const [hintHelpersDefault, hintHelpersDefaultStatus] = useContract<HintHelpers>(
		liquity.connection.addresses.hintHelpers,
		HintHelpersAbi
	);

	// DECIMAL_PRECISION()
	// REDEMPTION_FEE_FLOOR()
	const [troveManagerDefault, troveManagerDefaultStatus] = useContract<TroveManager>(
		liquity.connection.addresses.troveManager,
		TroveManagerAbi
	);

	const [sortedTrovesDefault, sortedTrovesDefaultStatus] = useContract<SortedTroves>(
		liquity.connection.addresses.sortedTroves,
		SortedTrovesAbi
	);

	const handleMax = () => {
		const val = maxNumber;
		setValueForced(val);
		setSwapAmount(val);
		setErrorMessages(undefined);
	};

	const handleInputSwap = (val: number) => {
		setValueForced(-1);
		setSwapAmount(val);
		setErrorMessages(undefined);
	};

	const handleCloseModal = () => {
		setErrorMessages(undefined);
		onClose();
	};

	useEffect(() => {
		if (transactionState.type === "failed" || transactionState.type === "cancelled") {
			setErrorMessages({ string: transactionState.error.message || JSON.stringify(transactionState.error).substring(0, 100) } as ErrorMessage);
		}

		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string, swapAmount);
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	const handleSwap = () => {
		// const wenAmount = stabilityDeposit.currentLUSD.toString();
		// console.debug("xxx 分解参数 wenAmount =", wenAmount);
		// const { firstRedemptionHint, partialRedemptionHintNICR } = await hintHelpersDefault.getRedemptionHints(wenAmount, price.mul(globalContants.IOTX_DECIMALS).toString(), 0);
		// console.debug("xxx 分解参数 firstRedemptionHint =", firstRedemptionHint);
		// const { 0: upperPartialRedemptionHint, 1: lowerPartialRedemptionHint } = await sortedTrovesDefault.findInsertPosition(
		// 	partialRedemptionHintNICR,
		// 	address,
		// 	address
		// )
		// console.debug("xxx 参数",
		// 	wenAmount,
		// 	firstRedemptionHint,
		// 	upperPartialRedemptionHint,
		// 	lowerPartialRedemptionHint,
		// 	partialRedemptionHintNICR,
		// );
		// // const redemptionTx = await troveManagerDefault.redeemCollateral(
		// // 	wenAmount,
		// // 	firstRedemptionHint,
		// // 	upperPartialRedemptionHint,
		// // 	lowerPartialRedemptionHint,
		// // 	partialRedemptionHintNICR,
		// // 	0,
		// // 	"1000000000000000000"
		// // )
		// // 还需要approve!!!
		// const txHash = await walletClient.writeContract({
		// 	account: address,
		// 	address: liquity.connection.addresses.troveManager as Address,
		// 	abi: TroveManagerAbi,
		// 	functionName: 'redeemCollateral',
		// 	args: [
		// 		wenAmount,
		// 		firstRedemptionHint,
		// 		upperPartialRedemptionHint,
		// 		lowerPartialRedemptionHint,
		// 		partialRedemptionHintNICR,
		// 		0,
		// 		"1000000000000000000"
		// 	]
		// })
		// console.debug("xxx txHash =", txHash);
	};

	return isOpen ? <Modal
		title={t("swapWen2Iotx")}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{
				gap: "1rem",
				maxWidth: "372px"
			}}>
			<div className="description">{t("swapioUSD2IOTX")}</div>

			<SnackBar
				type="warningSnackBar"
				text={t("note") + ": " + t("differentWithRepaying")} />

			<div className="flex-column-align-left">
				<div
					className="flex-row-space-between"
					style={{ alignItems: "center" }}>
					<div className="label fat">{t("amount2Swap")}</div>

					<button
						className="textButton smallTextButton"
						onClick={handleMax}>
						{t("max")}:&nbsp;{max.toString(2)}&nbsp;{WEN.symbol}
					</button>
				</div>

				<AmountInput
					coin={WEN}
					price={Decimal.ONE}
					allowSwap={false}
					valueForced={valueForced}
					onInput={handleInputSwap}
					max={maxNumber}
					warning={undefined}
					error={errorMessages && (errorMessages.string || t(errorMessages.key!, errorMessages.values))}
					allowReduce={true}
					currentValue={-1}
					allowIncrease={true} />
			</div>

			<div
				className="subCard"
				style={{ minWidth: "fit-content" }}>
				<div className="flex-row-space-between">
					<div className="label">{t("currentRate")}</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>1&nbsp;IOTX&nbsp;=&nbsp;{Decimal.ONE.div(price).toString(2)}&nbsp;{WEN.symbol}</div>
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("walletBalance")}</div>

					<ChangedValueLabel
						previousValue={accountBalance.toString(2)}
						newValue={(accountBalance.gt(swapAmount) ? accountBalance.sub(swapAmount) : Decimal.ZERO).toString(2) + " " + WEN.symbol} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("shareOfStabilityPool")}</div>

					<ChangedValueLabel
						previousValue={stabilityDeposit.currentLUSD.mulDiv(100, lusdInStabilityPool).toString(2) + "%"}
						newValue={stabilityDeposit.currentLUSD.add(swapAmount).mulDiv(100, lusdInStabilityPool.add(swapAmount)).toString(2) + "%"} />
				</div>
			</div>
		</div>

		{/* if (!hintHelpersDefault || !troveManagerDefault || !sortedTrovesDefault || !address || !walletClient) return; */}
		{validChange && !transactionState.id && transactionState.type === "idle" ? <StabilityDepositAction
			transactionId={txId}
			change={validChange}>
			<button
				className="primaryButton bigButton"
				style={{ width: "100%" }}
				disabled={swapAmount === 0}>
				<img src="images/stake-dark.png" />

				{t("stake") + " " + WEN.symbol}
			</button>
		</StabilityDepositAction> : <button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled>
			<img src="images/stake-dark.png" />

			{transactionState.type !== "confirmed" && transactionState.type !== "confirmedOneShot" && transactionState.type !== "idle" ? (t("staking") + "...") : (t("stake") + " " + WEN.symbol)}
		</button>}
	</Modal> : <></>
};