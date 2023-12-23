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
	const [errorMessages, setErrorMessages] = useState<ErrorMessage | undefined>(description as ErrorMessage);

	const utilRate = Decimal.ONE.div(updatedTrove.collateralRatio(price));

	useEffect(() => {
		setSliderForcedValue(Number(utilRate.toString()));
	}, [utilRate])

	const init = () => {
		setValueForced(-1);
		setWithdrawAmount(-1);
		setErrorMessages(undefined);
	};

	useEffect(init, []);

	const handleMax = () => {
		setValueForced(maxNumber);
		setWithdrawAmount(maxNumber);
		setErrorMessages(undefined);
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
			const col = trove.collateral.sub(withdrawAmount);
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
		setValueForced(newCol);
	};

	const handleInputWithdraw = (val: number) => {
		setValueForced(-1);
		setWithdrawAmount(val);
		setErrorMessages(undefined);
	};

	const handleCloseModal = () => {
		init();
		onClose();
	};

	useEffect(() => {
		if (transactionState.type === "failed" || transactionState.type === "cancelled") {
			setErrorMessages({ string: transactionState.error.message || JSON.stringify(transactionState.error).substring(0, 100) } as ErrorMessage);
		}

		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string, withdrawAmount);
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	return isOpen ? <Modal
		title={t("withdraw") + " " + market.symbol}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{ gap: "24px" }}>
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

						<button
							className="textButton smallTextButton"
							onClick={handleMax}>
							{t("maxSafe")}:&nbsp;{maxSafe.mul(100).toString(2)}%
						</button>
					</div>

					<Slider
						min={0}
						max={Number(maxSafe.toString())}
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
						previousValue={troveUtilizationRateNumberPercent.toFixed(2) + "%"}
						newValue={utilRate.mul(100).toString(2) + "%"} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Borrow")}</div>

					<ChangedValueLabel
						previousValue={availableBorrow.toString(2)}
						newValue={(updatedTrove.debt.gt(0) ? calculateAvailableBorrow(updatedTrove, price, liquidationPoint).toString(2) : 0) + " " + WEN.symbol} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Withdraw")}</div>

					<ChangedValueLabel
						previousValue={trove.debt.gt(0) ? availableWithdrawal.toString(2) : 0}
						newValue={(updatedTrove.debt.gt(0) ? calculateAvailableWithdrawal(updatedTrove, price, liquidationPoint).toString(2) : 0) + " " + market.symbol} />
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