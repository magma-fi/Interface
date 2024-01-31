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

let amountWithdrawn = 0;

export const WithdrawModal = ({
	isOpen = false,
	onClose = () => { },
	price = Decimal.ZERO,
	trove,
	market,
	fees,
	validationContext,
	max,
	onDone = () => { },
	constants,
	recoveryMode,
	liquidationPoint,
	availableWithdrawal,
	availableBorrow
}: {
	isOpen: boolean;
	onClose: () => void;
	market: Coin;
	price: Decimal;
	trove: Trove;
	fees: Fees;
	validationContext: ValidationContext;
	max: Decimal;
	onDone: (tx: string, withdrawAmount: number) => void;
	constants?: Record<string, Decimal>;
	recoveryMode: boolean;
	liquidationPoint: Decimal;
	availableWithdrawal: Decimal;
	availableBorrow: Decimal;
}) => {
	const maxNumber = Number(max);
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(-1);
	const [withdrawAmount, setWithdrawAmount] = useState(-1);
	const [desireCollateral, setDesireCollateral] = useState(trove.collateral);
	const previousTrove = useRef<Trove>(trove);
	// const netDebt = trove.debt.gt(1) ? trove.netDebt : Decimal.ZERO;
	const maxSafe = Decimal.ONE.div(liquidationPoint);
	const troveUtilizationRateNumber = Number(Decimal.ONE.div(trove.collateralRatio(price)));
	const troveUtilizationRateNumberPercent = troveUtilizationRateNumber * 100;
	const [sliderForcedValue, setSliderForcedValue] = useState(troveUtilizationRateNumber);
	// const [slideValue, setSlideValue] = useState(0);
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);

	const isDirty = !trove.collateral.eq(desireCollateral);
	const updatedTrove = isDirty ? new Trove(desireCollateral, trove.debt) : trove;
	const borrowingRate = fees.borrowingRate();
	const [troveChange, description] = validateTroveChange(
		trove!,
		updatedTrove!,
		borrowingRate,
		validationContext,
		constants
	);
	const stableTroveChange = useStableTroveChange(troveChange);

	let txErrorMessage: ErrorMessage;
	const errorMsg = useMemo(() => {
		if (description) return description as ErrorMessage;
	}, [description]);
	const errorMessages = errorMsg || txErrorMessage!;

	const utilRate = Decimal.ONE.div(updatedTrove.collateralRatio(price));
	const newURPercentNumber = Number(utilRate.mul(100));
	const urIsGood = troveUtilizationRateNumberPercent > newURPercentNumber;

	useEffect(() => {
		setSliderForcedValue(Number(utilRate.toString()));
	}, [utilRate])

	const init = () => {
		setValueForced(-1);
		setWithdrawAmount(-1);
	};

	useEffect(init, []);

	const handleMax = () => {
		setValueForced(maxNumber);
		setWithdrawAmount(maxNumber);
		amountWithdrawn = maxNumber;
	};

	const applyUnsavedCollateralChanges = (unsavedChanges: Difference, trove: Trove) => {
		if (unsavedChanges.absoluteValue) {
			if (unsavedChanges.positive) {
				return trove.collateral.add(unsavedChanges.absoluteValue);
			}
			if (unsavedChanges.negative) {
				if (unsavedChanges.absoluteValue.lt(trove.collateral)) {
					return trove.collateral.sub(unsavedChanges.absoluteValue);
				}
			}
			return trove.collateral;
		}
		return trove.collateral;
	};

	useEffect(() => {
		if (!trove) return;

		if (withdrawAmount >= 0) {
			const col = trove.collateral.gt(withdrawAmount) ? trove.collateral.sub(withdrawAmount) : Decimal.ZERO;
			const previousCol = previousTrove.current?.collateral;
			const unsavedChanges = Difference.between(col, previousCol);
			const nextCol = applyUnsavedCollateralChanges(unsavedChanges, trove);
			setDesireCollateral(nextCol);
		}
	}, [trove, withdrawAmount, price]);

	const handleSlideUtilRate = (val: number) => {
		const newCol = Number(
			previousTrove.current?.collateral.sub(
				previousTrove.current.debt.div(val).div(price)
			)
		);
		setWithdrawAmount(newCol);
		amountWithdrawn = newCol;
		setValueForced(newCol);
	};

	const handleInputWithdraw = (val: number) => {
		setValueForced(-1);
		setWithdrawAmount(val);
		amountWithdrawn = val;
	};

	const handleCloseModal = () => {
		init();
		onClose();
	};

	useEffect(() => {
		if (transactionState.type === "failed" || transactionState.type === "cancelled") {
			txErrorMessage = { string: transactionState.error.reason || JSON.stringify(transactionState.error.message || transactionState.error).substring(0, 100) } as ErrorMessage;
		}

		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string, amountWithdrawn);
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	return isOpen ? <Modal
		title={t("withdraw") + " " + market.symbol}
		onClose={handleCloseModal}>
		<div className="withdrawModal">
			<div className="flex-column">
				<div className="flex-column-align-left">
					<div
						className="flex-row-space-between"
						style={{ alignItems: "center" }}>
						<div className="label fat">{t("withdrawAmount")}</div>

						<button
							className="textButton smallTextButton"
							onClick={handleMax}>
							{t("max")}:&nbsp;{max.toString(2)}&nbsp;{market.symbol}
						</button>
					</div>

					<AmountInput
						coin={market}
						price={price}
						allowSwap={false}
						valueForced={valueForced}
						onInput={handleInputWithdraw}
						max={maxNumber}
						warning={undefined}
						error={errorMessages && (errorMessages.string || t(errorMessages.key!, errorMessages.values))}
						allowReduce={true}
						currentValue={-1}
						allowIncrease={true} />
				</div>

				<div className="flex-column-align-left">
					<div
						className="flex-row-space-between"
						style={{ alignItems: "center" }}>
						<div className="label fat">{t("utilizationRate")}</div>

						{/* <button
							className="textButton smallTextButton"
							onClick={handleMax}>
							{t("maxSafe")}:&nbsp;{maxSafe.mul(100).toString(2)}%
						</button> */}
						<div className="label">{t("maxSafe")}:&nbsp;{maxSafe.mul(100).toString(2)}%</div>
					</div>

					<Slider
						min={0}
						max={Number(maxSafe)}
						onChange={handleSlideUtilRate}
						forcedValue={sliderForcedValue}
						allowReduce={false}
						limitValue={troveUtilizationRateNumber}
						allowIncrease={true} />
				</div>
			</div>

			<div
				className="subCard"
				style={{ minWidth: "fit-content" }}>
				<div className="flex-row-space-between">
					<div className="label">{t("utilizationRate")}</div>

					<ChangedValueLabel
						previousValue={troveUtilizationRateNumberPercent}
						previousPostfix="%"
						newValue={newURPercentNumber}
						nextPostfix="%"
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Borrow")}</div>

					<ChangedValueLabel
						previousValue={Number(availableBorrow)}
						newValue={updatedTrove.debt.gt(0) ? Number(calculateAvailableBorrow(updatedTrove, price, liquidationPoint)) : 0}
						nextPostfix={WEN.symbol}
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Withdraw")}</div>

					<ChangedValueLabel
						previousValue={trove.debt.gt(0) ? Number(availableWithdrawal) : 0}
						newValue={updatedTrove.debt.gt(0) ? Number(calculateAvailableWithdrawal(updatedTrove, price, liquidationPoint)) : 0}
						nextPostfix={market.symbol}
						positive={urIsGood} />
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

		{
			stableTroveChange &&
				(
					(!transactionState.id && transactionState.type === "idle")
					|| transactionState.type === "cancelled"
				)
				? <TroveAction
					transactionId={txId}
					change={stableTroveChange}
					maxBorrowingRate={borrowingRate.add(0.005)}
					borrowingFeeDecayToleranceMinutes={60}>
					<button
						className="primaryButton bigButton"
						style={{ width: "100%" }}>
						<img src="images/repay-dark.png" />

						{t("withdraw")}
					</button>
				</TroveAction> : <button
					className="primaryButton bigButton"
					style={{ width: "100%" }}
					disabled>
					<img src="images/repay-dark.png" />

					{transactionState.type !== "confirmed" && transactionState.type !== "confirmedOneShot" && transactionState.type !== "idle" ? (t("withdrawing") + "...") : t("withdraw")}
				</button>}
	</Modal> : <></>
};