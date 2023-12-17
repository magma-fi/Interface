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

	const handleMax = () => {
		const val = Number(stabilityDeposit.currentLUSD.toString(2));
		setValueForced(val);
		setUnstakeAmount(val);
	};

	const handleInputDeposit = (val: number) => {
		setValueForced(-1);
		setUnstakeAmount(val);
	};

	const handleCloseModal = () => {
		onClose();
	};

	const [validChange, description] = validateStabilityDepositChange(
		stabilityDeposit,
		stabilityDeposit.currentLUSD.sub(unstakeAmount),
		validationContext
	);
	const errorMessages = description as ErrorMessage;

	useEffect(() => {
		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string, unstakeAmount);
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
					onInput={handleInputDeposit}
					max={Number(accountBalance.toString())}
					warning={undefined}
					error={description && t(errorMessages.key)}
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
						newValue={stabilityDeposit.currentLUSD.sub(unstakeAmount).toString(2) + " " + WEN.symbol} />
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
						newValue={stabilityDeposit.currentLUSD.sub(unstakeAmount).mulDiv(100, lusdInStabilityPool.add(unstakeAmount)).toString(2) + "%"} />
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