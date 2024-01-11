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
import { TxLabel } from "../components/TxLabel";
import { validateStabilityDepositChange } from "../components/Stability/validation/validateStabilityDepositChange";
import { StabilityDepositAction } from "../components/Stability/StabilityDepositAction";

let amountUnstaked = 0;

export const UnstakeModal = ({
	isOpen = false,
	onClose = () => { },
	accountBalance = Decimal.ZERO,
	onDone = () => { },
	stabilityDeposit,
	validationContext,
	lusdInStabilityPool
}: {
	isOpen: boolean;
	onClose: () => void;
	accountBalance: Decimal;
	onDone: (tx: string, unstakeAmount: number) => void;
	stabilityDeposit: StabilityDeposit;
	validationContext: ValidationContextForStabilityPool;
	lusdInStabilityPool: Decimal;
}) => {
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(-1);
	const [unstakeAmount, setUnstakeAmount] = useState(0);
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);
	const [useMax, setUseMax] = useState(false);

	const [validChange, description] = validateStabilityDepositChange(
		stabilityDeposit,
		(stabilityDeposit.currentLUSD.lte(unstakeAmount) || useMax) ? Decimal.ZERO : stabilityDeposit.currentLUSD.sub(unstakeAmount),
		validationContext
	);
	const [errorMessages, setErrorMessages] = useState<ErrorMessage | undefined>(description as ErrorMessage);

	const handleMax = () => {
		const val = Number(stabilityDeposit.currentLUSD);
		setValueForced(val);
		setUnstakeAmount(val);
		amountUnstaked = val;
		setErrorMessages(undefined);
		setUseMax(true);
	};

	const handleInputUnstake = (val: number) => {
		setValueForced(-1);
		setUnstakeAmount(val);
		amountUnstaked = val;
		setErrorMessages(undefined);
		setUseMax(false);
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
			onDone(transactionState.tx.rawSentTransaction as unknown as string, amountUnstaked);
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	return isOpen ? <Modal
		title={t("unstake") + " " + WEN.symbol}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{
				gap: "1rem",
				maxWidth: "372px"
			}}>

			<TxLabel
				title={t("currentlyStaked")}
				logo="images/stake-orange.png"
				amount={stabilityDeposit.currentLUSD.toString(2) + " " + WEN.symbol} />

			<div className="flex-column-align-left">
				<div
					className="flex-row-space-between"
					style={{ alignItems: "center" }}>
					<div className="label fat">{t("unstakeAmount")}</div>

					<button
						className="textButton smallTextButton"
						onClick={handleMax}>
						{t("max")}:&nbsp;{stabilityDeposit.currentLUSD.toString(2)}&nbsp;{WEN.symbol}
					</button>
				</div>

				<AmountInput
					coin={WEN}
					price={Decimal.ONE}
					allowSwap={false}
					valueForced={valueForced}
					onInput={handleInputUnstake}
					max={Number(accountBalance.toString())}
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
					<div className="label">{t("staked")}</div>

					<ChangedValueLabel
						previousValue={stabilityDeposit.currentLUSD.toString(2)}
						newValue={(stabilityDeposit.currentLUSD.gt(unstakeAmount) ? stabilityDeposit.currentLUSD.sub(unstakeAmount) : Decimal.ZERO).toString(2) + " " + WEN.symbol} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("walletBalance")}</div>

					<ChangedValueLabel
						previousValue={accountBalance.toString(2)}
						newValue={accountBalance.add(unstakeAmount).toString(2) + " " + WEN.symbol} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("shareOfStabilityPool")}</div>

					<ChangedValueLabel
						previousValue={stabilityDeposit.currentLUSD.mulDiv(100, lusdInStabilityPool).toString(2) + "%"}
						newValue={(
							stabilityDeposit.currentLUSD.gt(unstakeAmount)
								? stabilityDeposit.currentLUSD.sub(unstakeAmount).mulDiv(100, lusdInStabilityPool.add(unstakeAmount))
								: Decimal.ZERO
						).toString(2) + "%"} />
				</div>
			</div>
		</div>

		{validChange && !transactionState.id && transactionState.type === "idle" ? <StabilityDepositAction
			transactionId={txId}
			change={validChange}>
			<button
				className="primaryButton bigButton"
				style={{ width: "100%" }}
				disabled={unstakeAmount === 0}>
				{t("unstake") + " " + WEN.symbol}
			</button>
		</StabilityDepositAction> : <button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled>
			{transactionState.type !== "confirmed" && transactionState.type !== "confirmedOneShot" && transactionState.type !== "idle" ? (t("unstaking") + "...") : (t("unstake") + " " + WEN.symbol)}
		</button>}
	</Modal> : <></>
};