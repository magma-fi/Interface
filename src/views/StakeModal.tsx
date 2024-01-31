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

let amountStaked = 0;

export const StakeModal = ({
	isOpen = false,
	onClose = () => { },
	wenBalance = Decimal.ZERO,
	onDone = () => { },
	stabilityDeposit,
	validationContext,
	lusdInStabilityPool
}: {
	isOpen: boolean;
	onClose: () => void;
	wenBalance: Decimal;
	onDone: (tx: string, depositAmount: number) => void;
	stabilityDeposit: StabilityDeposit;
	validationContext: ValidationContextForStabilityPool;
	lusdInStabilityPool: Decimal;
}) => {
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(-1);
	const [depositAmount, setDepositAmount] = useState(0);
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);
	const [useMax, setUseMax] = useState(false);

	const [validChange, description] = validateStabilityDepositChange(
		stabilityDeposit,
		useMax ? wenBalance : stabilityDeposit.currentLUSD.add(depositAmount),
		validationContext
	);

	const [errorMessages, setErrorMessages] = useState<ErrorMessage | undefined>(description as ErrorMessage);

	const handleMax = () => {
		const val = Number(wenBalance);
		setValueForced(val);
		setDepositAmount(val);
		setErrorMessages(undefined);
		setUseMax(true);

		amountStaked = val;
	};

	const handleInputDeposit = (val: number) => {
		setValueForced(-1);
		setDepositAmount(val);
		setErrorMessages(undefined);
		setUseMax(false);

		amountStaked = val;
	};

	const handleCloseModal = () => {
		setErrorMessages(undefined);
		onClose();
	};

	useEffect(() => {
		if (transactionState.type === "failed" || transactionState.type === "cancelled") {
			setErrorMessages({ string: transactionState.error.reason || JSON.stringify(transactionState.error.message || transactionState.error).substring(0, 100) } as ErrorMessage);
		}

		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string, amountStaked);
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	return isOpen ? <Modal
		title={t("stake") + " " + WEN.symbol}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{
				gap: "1rem",
				maxWidth: "372px"
			}}>
			<div className="description">{t("withdrawAnytime")}</div>

			<TxLabel
				title={t("currentInterest") + " (APY)"}
				logo="images/chart.png"
				amount={"0"} />

			<div className="flex-column-align-left">
				<div
					className="flex-row-space-between"
					style={{ alignItems: "center" }}>
					<div className="label fat">{t("stakeAmount")}</div>

					<button
						className="textButton smallTextButton"
						onClick={handleMax}>
						{t("max")}:&nbsp;{wenBalance.toString(2)}&nbsp;{WEN.symbol}
					</button>
				</div>

				<AmountInput
					coin={WEN}
					price={Decimal.ONE}
					allowSwap={false}
					valueForced={valueForced}
					onInput={handleInputDeposit}
					max={Number(wenBalance.toString())}
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
						previousValue={Number(stabilityDeposit.currentLUSD)}
						newValue={Number(stabilityDeposit.currentLUSD.add(depositAmount))}
						nextPostfix={WEN.symbol}
						positive={depositAmount > 0} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("walletBalance")}</div>

					<ChangedValueLabel
						previousValue={Number(wenBalance)}
						newValue={Number(wenBalance.gt(depositAmount) ? wenBalance.sub(depositAmount) : Decimal.ZERO)}
						nextPostfix={WEN.symbol}
						positive={depositAmount > 0} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("shareOfStabilityPool")}</div>

					<ChangedValueLabel
						previousValue={Number(stabilityDeposit.currentLUSD.mulDiv(100, lusdInStabilityPool))}
						previousPostfix="%"
						newValue={Number(stabilityDeposit.currentLUSD.add(depositAmount).mulDiv(100, lusdInStabilityPool.add(depositAmount)))}
						nextPostfix="%"
						positive={depositAmount > 0} />
				</div>
			</div>
		</div>

		{validChange && !transactionState.id && transactionState.type === "idle" ? <StabilityDepositAction
			transactionId={txId}
			change={validChange}>
			<button
				className="primaryButton bigButton"
				style={{ width: "100%" }}
				disabled={depositAmount === 0}>
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