/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { Coin, ErrorMessage, ValidationContext } from "../libs/types";
import { WEN, globalContants } from "../libs/globalContants";
import { AmountInput } from "../components/AmountInput";
import { useState, useEffect, useRef, useMemo } from "react";
import { Decimal, Trove, Difference, CRITICAL_COLLATERAL_RATIO } from "lib-base";
import { validateTroveChange } from "../components/Trove/validation/validateTroveChange";
import { Fees } from "lib-base/dist/src/Fees";
import { useStableTroveChange } from "../hooks/useStableTroveChange";
import { TroveAction } from "../components/Trove/TroveAction";
import { calculateAvailableBorrow, calculateAvailableWithdrawal, calculateUtilizationRate } from "../utils";
import { Slider } from "../components/Slider";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { debounce } from "../libs/debounce";
import { useMyTransactionState } from "../components/Transaction";

export const RepayModal = ({
	isOpen = false,
	onClose = () => { },
	price = Decimal.ZERO,
	trove,
	market,
	fees,
	validationContext,
	max,
	onDone = () => { }
}: {
	isOpen: boolean;
	onClose: () => void;
	market: Coin;
	price: Decimal;
	trove: Trove;
	fees: Fees;
	validationContext: ValidationContext;
	max: Decimal;
	onDone: (tx: string, repayAmount: number) => void;
}) => {
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(0);
	const [repayAmount, setRepayAmount] = useState(0);
	const previousTrove = useRef<Trove>(trove);
	const netDebt = trove.debt.gt(1) ? trove.netDebt : Decimal.ZERO;
	const netDebtNumber = Number(netDebt.toString());
	const maxSafe = Decimal.ONE.div(CRITICAL_COLLATERAL_RATIO);
	const troveUtilizationRateNumber = Number(Decimal.ONE.div(trove.collateralRatio(price)).mul(100));
	const [utilRate, setUtilRate] = useState(Decimal.ZERO);
	const [slideValue, setSlideValue] = useState(0);
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId);

	const isDirty = !netDebt.eq(repayAmount);
	const updatedTrove = isDirty ? new Trove(trove.collateral, trove.netDebt.sub(repayAmount)) : trove;
	const borrowingRate = fees.borrowingRate();
	const [troveChange, description] = validateTroveChange(
		trove!,
		updatedTrove!,
		borrowingRate,
		validationContext
	);
	const stableTroveChange = useStableTroveChange(troveChange);
	const errorMessages = description as ErrorMessage;

	const init = () => {
		setValueForced(0);
		setRepayAmount(0);
	};

	useEffect(init, []);

	const handleMax = () => {
		setValueForced(Number(max.toString()));
	};

	const applyUnsavedNetDebtChanges = (unsavedChanges: Difference, trove: Trove) => {
		if (unsavedChanges.absoluteValue) {
			if (unsavedChanges.positive) {
				return netDebt.add(unsavedChanges.absoluteValue);
			}
			if (unsavedChanges.negative) {
				if (unsavedChanges.absoluteValue.lt(netDebt)) {
					return netDebt.sub(unsavedChanges.absoluteValue);
				}
			}
			return netDebt;
		}
		return netDebt;
	};

	useEffect(() => {
		if (!trove) return;

		const netDebt = trove.netDebt.sub(repayAmount);
		const previousNetDebt = previousTrove.current?.debt.gt(1) ? previousTrove.current?.netDebt : Decimal.from(0);

		if (!previousNetDebt.eq(netDebt)) {
			const unsavedChanges = Difference.between(netDebt, previousNetDebt);
			const nextNetDebt = applyUnsavedNetDebtChanges(unsavedChanges, trove);
			setRepayAmount(Number(trove.netDebt.sub(nextNetDebt).toString()));
		}

		setUtilRate(calculateUtilizationRate(updatedTrove, price));
	}, [trove, repayAmount, price]);

	useEffect(() => {
		if (slideValue === 0) return;


		debounce.run(() => {
			const toReduce = trove.debt.mul((troveUtilizationRateNumber - slideValue * 100) / troveUtilizationRateNumber)
			const val = Number(toReduce.toString());
			setRepayAmount(val);
			setValueForced(val);
		}, 1000);
	}, [slideValue]);

	const handleInputRepay = (val: number) => {
		setValueForced(0);
		setRepayAmount(val);
	};

	const handleCloseModal = () => {
		init();
		onClose();
	};

	const handleSlideUtilRate = (val: number) => {
		setSlideValue(val);
	};

	useEffect(() => {
		if (transactionState.type === "waitingForConfirmation" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string, repayAmount);
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	return isOpen ? <Modal
		title={t("repayDebt")}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{ gap: "24px" }}>
			<div className="flex-column">
				<div className="flex-column-align-left">
					<div
						className="flex-row-space-between"
						style={{ alignItems: "center" }}>
						<div className="label fat">{t("repayAmount")}</div>

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
						onInput={handleInputRepay}
						max={Number(max.toString())}
						warning={undefined}
						error={description && t(errorMessages.key, errorMessages.values)}
						allowReduce={true}
						currentValue={netDebtNumber}
						allowIncrease={false} />
				</div>

				<div className="flex-column-align-left">
					<div
						className="flex-row-space-between"
						style={{ alignItems: "center" }}>
						<div className="label fat">{t("utilizationRate")}</div>

						<button
							className="textButton smallTextButton"
							onClick={handleMax}>
							{t("maxSafe")}:&nbsp;{maxSafe.mul(100).toString(2)}%
						</button>
					</div>

					<Slider
						min={0}
						max={Number(maxSafe.toString())}
						currentValue={troveUtilizationRateNumber / 100}
						onChange={handleSlideUtilRate}
						forcedValue={Number(utilRate.toString())}
						allowReduce={true}
						allowIncrease={false} />
				</div>
			</div>

			<div
				className="subCard"
				style={{ minWidth: "fit-content" }}>
				<div className="flex-row-space-between">
					<div className="label">{t("utilizationRate")}</div>

					<ChangedValueLabel
						previousValue={troveUtilizationRateNumber.toFixed(2) + "%"}
						newValue={utilRate.mul(100).toString(2) + "%"} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Borrow")}</div>

					<ChangedValueLabel
						previousValue={trove.debt.gt(0) ? calculateAvailableBorrow(trove, price).toString(2) : 0}
						newValue={(updatedTrove.debt.gt(0) ? calculateAvailableBorrow(updatedTrove, price).toString(2) : 0) + " " + WEN.symbol} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Withdraw")}</div>

					<ChangedValueLabel
						previousValue={trove.debt.gt(0) ? calculateAvailableWithdrawal(trove, price).toString(2) : 0}
						newValue={(updatedTrove.debt.gt(0) ? calculateAvailableWithdrawal(updatedTrove, price).toString(2) : 0) + " " + market.symbol} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("vaultDebt")}</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>
						{updatedTrove.debt.toString(2)}&nbsp;{globalContants.USD}
					</div>
				</div>
			</div>
		</div>

		{stableTroveChange && !transactionState.id && transactionState.type === "idle" ? <TroveAction
			transactionId={txId}
			change={stableTroveChange}
			maxBorrowingRate={borrowingRate.add(0.005)}
			borrowingFeeDecayToleranceMinutes={60}>
			<button
				className="primaryButton bigButton"
				style={{ width: "100%" }}
				disabled={repayAmount === 0}>
				<img src="images/repay-dark.png" />

				{t("repay")}
			</button>
		</TroveAction> : <button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled>
			<img src="images/repay-dark.png" />

			{transactionState.type !== "confirmed" && transactionState.type !== "confirmedOneShot" && transactionState.type !== "idle" ? (t("repaying") + "...") : t("repay")}
		</button>}
	</Modal> : <></>
};