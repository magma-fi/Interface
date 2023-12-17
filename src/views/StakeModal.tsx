/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { ValidationContextForStabilityPool } from "../libs/types";
import { WEN } from "../libs/globalContants";
import { AmountInput } from "../components/AmountInput";
import { useState, useEffect, useMemo } from "react";
import { Decimal, StabilityDeposit } from "lib-base";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { useMyTransactionState } from "../components/Transaction";
import { TxLabel } from "../components/TxLabel";
import { validateStabilityDepositChange } from "../components/Stability/validation/validateStabilityDepositChange";
import { StabilityDepositAction } from "../components/Stability/StabilityDepositAction";

export const StakeModal = ({
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

	const handleMax = () => {
		const val = Number(accountBalance.toString());
		setValueForced(val);
		setDepositAmount(val);
	};

	const handleInputDeposit = (val: number) => {
		setValueForced(-1);
		setDepositAmount(val);
	};

	const handleCloseModal = () => {
		onClose();
	};

	const [validChange, description] = validateStabilityDepositChange(
		stabilityDeposit,
		stabilityDeposit.currentLUSD.add(depositAmount),
		validationContext
	);

	useEffect(() => {
		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string, depositAmount);
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
				title={t("currentInterest") + "(APY)"}
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
						{t("max")}:&nbsp;{accountBalance.toString(2)}&nbsp;{WEN.symbol}
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
					error={undefined}
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
						newValue={stabilityDeposit.currentLUSD.add(depositAmount).toString(2) + " " + WEN.symbol} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("walletBalance")}</div>

					<ChangedValueLabel
						previousValue={accountBalance.toString(2)}
						newValue={accountBalance.sub(depositAmount).toString(2) + " " + WEN.symbol} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("shareOfStabilityPool")}</div>

					<ChangedValueLabel
						previousValue={stabilityDeposit.currentLUSD.mulDiv(100, lusdInStabilityPool).toString(2) + "%"}
						newValue={stabilityDeposit.currentLUSD.add(depositAmount).mulDiv(100, lusdInStabilityPool.add(depositAmount)).toString(2) + "%"} />
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