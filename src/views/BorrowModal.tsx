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
import { Decimal, Trove, Difference, LUSD_LIQUIDATION_RESERVE } from "lib-base";
import { validateTroveChange } from "../components/Trove/validation/validateTroveChange";
import { Fees } from "lib-base/dist/src/Fees";
import { useStableTroveChange } from "../hooks/useStableTroveChange";
import { TroveAction } from "../components/Trove/TroveAction";
import { calculateAvailableBorrow, calculateAvailableWithdrawal, feeFrom } from "../utils";
import { Slider } from "../components/Slider";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { useMyTransactionState } from "../components/Transaction";

export const BorrowModal = ({
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
	liquidationPrice,
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
	onDone: (tx: string) => void;
	constants?: Record<string, Decimal>;
	liquidationPrice: Decimal;
	recoveryMode: boolean;
	liquidationPoint: Decimal;
	availableWithdrawal: Decimal;
	availableBorrow: Decimal;
}) => {
	const { t } = useLang();
	// const debt = Number(trove.debt);
	const [borrowAmount, setBorrowAmount] = useState(-1);
	const previousTrove = useRef<Trove>(trove);
	const netDebt = trove.debt.gt(1) ? trove.netDebt : Decimal.ZERO;
	// const netDebtNumber = Number(netDebt.toString());
	const [valueForced, setValueForced] = useState(-1);
	const maxSafe = Decimal.ONE.div(liquidationPoint);
	const troveUtilizationRateNumber = Number(Decimal.ONE.div(trove.collateralRatio(price)));
	const troveUtilizationRateNumberPercent = troveUtilizationRateNumber * 100;
	const [forcedSlideValue, setForcedSlideValue] = useState(troveUtilizationRateNumber);
	// const dec = Math.pow(10, WEN.decimals || 0);
	const wenLiquidationReserve = constants?.LUSD_GAS_COMPENSATION || Decimal.ONE;
	// const wenMinimumNetDebt = constants?.MIN_NET_DEBT.div(dec) || Decimal.ONE;
	// const [slideValue, setSlideValue] = useState();
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);
	const [desireNetDebt, setDesireNextDebt] = useState(previousTrove.current?.netDebt);
	const isDirty = !netDebt.eq(desireNetDebt);
	const isDebtIncrease = desireNetDebt.gt(trove.netDebt);
	const borrowingRate = fees.borrowingRate();
	const fee = isDebtIncrease
		? feeFrom(trove, new Trove(trove.collateral, trove.debt.add(borrowAmount).add(borrowingRate.mul(borrowAmount))), borrowingRate)
		: Decimal.ZERO;
	const updatedTrove = isDirty ? new Trove(trove.collateral, desireNetDebt.add(wenLiquidationReserve).add(fee)) : trove;
	const [troveChange, description] = validateTroveChange(
		trove!,
		updatedTrove!,
		borrowingRate,
		validationContext,
		constants
	);
	const stableTroveChange = useStableTroveChange(troveChange);
	let txErrorMessage: ErrorMessage;
	const errorMessages = useMemo(() => {
		if (description) return description as ErrorMessage;
	}, [description]);
	const errorMsg = errorMessages || txErrorMessage!;

	const newCollateralRatio = updatedTrove.collateralRatio(price);
	const newUR = ((updatedTrove.collateral.gt(0) && updatedTrove.debt.gt(0)) ? Decimal.ONE.div(newCollateralRatio) : Decimal.ZERO);

	const newTroveCollateralRatio = updatedTrove.debt.eq(0) ? Decimal.ZERO : newCollateralRatio;
	const newTroveCollateralValue = updatedTrove.collateral.mul(price);
	const line = Decimal.min(liquidationPoint, newTroveCollateralRatio);
	const newDebtToLiquidate = Decimal.max(
		updatedTrove.debt,
		Decimal.ONE.div(line.gt(0) ? line : Decimal.ONE).mul(newTroveCollateralValue)
	);
	const newLiquidationPrice = updatedTrove.collateral.gt(0) ? newDebtToLiquidate.div(updatedTrove.collateral) : Decimal.ZERO;

	useEffect(() => {
		setForcedSlideValue(Number(newUR.toString()));
	}, [newUR])

	const init = () => {
		setValueForced(-1);
		setBorrowAmount(-1);
	};

	useEffect(init, []);

	const handleMax = () => {
		const val = Number(max);
		setValueForced(val);
		setBorrowAmount(val);
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

		if (borrowAmount >= 0) {
			const newNetDebt = netDebt.add(borrowAmount);
			const previousNetDebt = previousTrove.current?.debt.gt(1) ? previousTrove.current?.netDebt : Decimal.from(0);
			const unsavedChanges = Difference.between(newNetDebt, previousNetDebt);
			const nextNetDebt = applyUnsavedNetDebtChanges(unsavedChanges, trove);
			setDesireNextDebt(nextNetDebt);
		}
	}, [trove, borrowAmount, price]);

	const handleSlideUtilRate = (val: number) => {
		const newDebt = Number(previousTrove.current?.debt.mul(val).div(troveUtilizationRateNumber).sub(previousTrove.current.netDebt).sub(wenLiquidationReserve).toString());
		setBorrowAmount(newDebt);
		setValueForced(newDebt);
	};

	const handleInputBorrowValue = (val: number) => {
		setValueForced(-1);
		setBorrowAmount(val);
	};

	const handleCloseModal = () => {
		init();
		onClose();
	};

	useEffect(() => {
		if (transactionState.type === "failed" || transactionState.type === "cancelled") {
			txErrorMessage = { string: transactionState.error.message || JSON.stringify(transactionState.error).substring(0, 100) } as ErrorMessage;
		}

		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string);
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	return isOpen ? <Modal
		title={t("borrow") + " " + WEN.symbol}
		onClose={handleCloseModal}>
		<div className="flex-row-space-between depositModal">
			<div
				className="flex-column subContainer"
				style={{ gap: "24px" }}>
				<div className="flex-column-align-left">
					<div
						className="flex-row-space-between"
						style={{ alignItems: "center" }}>
						<div className="label fat">{t("borrowAmount")}</div>

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
						onInput={handleInputBorrowValue}
						max={Number(max.toString())}
						warning={undefined}
						error={errorMsg && (errorMsg.string || t(errorMsg.key!, errorMsg.values))}
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
						forcedValue={forcedSlideValue}
						allowReduce={false}
						limitValue={troveUtilizationRateNumber}
						allowIncrease={true} />
				</div>
			</div>

			<div
				className="subCard subContainer">
				<div className="flex-row-space-between">
					<div className="label">{t("utilizationRate")}</div>

					<ChangedValueLabel
						previousValue={troveUtilizationRateNumberPercent.toFixed(2) + "%"}
						newValue={newUR.mul(100).toString(2) + "%"} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Borrow")}</div>

					<ChangedValueLabel
						previousValue={trove.debt.gt(0) ? availableBorrow.toString(2) : 0}
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

					<ChangedValueLabel
						previousValue={trove.debt.toString(2)}
						newValue={updatedTrove.debt.toString(2) + " " + globalContants.USD} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("liquidationPrice")}(1&nbsp;{market?.symbol})</div>

					<ChangedValueLabel
						previousValue={liquidationPrice.toString(2)}
						newValue={newLiquidationPrice.toString(2) + " " + globalContants.USD} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("borrowFee")}&nbsp;({borrowingRate.mul(100).toString(2)}%)</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>
						{updatedTrove.debt.mul(borrowingRate).toString(2)}&nbsp;{WEN.symbol}
					</div>
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("interestRate")}</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>0%</div>
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("liquidationReserve")}</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>
						{LUSD_LIQUIDATION_RESERVE.toString(2)}&nbsp;{WEN.symbol}
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
						<img src="images/borrow-dark.png" />

						{t("borrow")}
					</button>
				</TroveAction> : <button
					className="primaryButton bigButton"
					style={{ width: "100%" }}
					disabled>
					<img src="images/borrow-dark.png" />

					{transactionState.type !== "confirmed" && transactionState.type !== "confirmedOneShot" && transactionState.type !== "idle" ? (t("borrowing") + "...") : t("borrow")}
				</button>}
	</Modal> : <></>
};