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
import { Decimal, Trove, Difference } from "lib-base";
import { validateTroveChange } from "../components/Trove/validation/validateTroveChange";
import { Fees } from "lib-base/dist/src/Fees";
import { useStableTroveChange } from "../hooks/useStableTroveChange";
import { TroveAction } from "../components/Trove/TroveAction";
import { calculateAvailableBorrow, calculateAvailableWithdrawal, feeFrom } from "../utils";
import { Slider } from "../components/Slider";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { useMyTransactionState } from "../components/Transaction";

let repaidAmount = 0;

export const RepayModal = ({
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
	availableBorrow,
	onCloseVault = () => { }
}: {
	isOpen: boolean;
	onClose: () => void;
	market: Coin;
	price: Decimal;
	trove: Trove;
	fees: Fees;
	validationContext: ValidationContext;
	max: Decimal;
	onDone: (tx: string, repaidAmount: number) => void;
	constants?: Record<string, Decimal>;
	recoveryMode: boolean;
	liquidationPoint: Decimal;
	availableWithdrawal: Decimal;
	availableBorrow: Decimal;
	onCloseVault: () => void;
}) => {
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(-1);
	const [repayAmount, setRepayAmount] = useState(-1);
	const previousTrove = useRef<Trove>(trove);
	const netDebt = trove.debt.gt(1) ? trove.netDebt : Decimal.ZERO;
	const [desireNetDebt, setDesireNetDebt] = useState(netDebt);
	const maxSafe = Decimal.ONE.div(liquidationPoint);
	const troveUR = Decimal.ONE.div(trove.collateralRatio(price));
	const troveUtilizationRateNumber = Number(troveUR);
	const troveUtilizationRateNumberPercent = troveUtilizationRateNumber * 100;
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);
	const wenLiquidationReserve = constants?.LUSD_GAS_COMPENSATION || Decimal.ONE;
	const minNetDebt = constants?.MIN_NET_DEBT || Decimal.ONE;
	const isDebtIncrease = desireNetDebt.gt(trove.netDebt);
	const debtIncreaseAmount = isDebtIncrease ? desireNetDebt.sub(trove.netDebt) : Decimal.ZERO;
	const borrowingRate = fees.borrowingRate();
	const MinSafe = minNetDebt.add(minNetDebt.mul(borrowingRate)).div(trove.collateral.mul(price));
	const fee = isDebtIncrease
		? feeFrom(trove, new Trove(trove.collateral, trove.debt.add(debtIncreaseAmount)), borrowingRate)
		: Decimal.ZERO;
	const isDirty = !netDebt.eq(desireNetDebt);
	const updatedTrove = isDirty ? new Trove(trove.collateral, desireNetDebt.add(wenLiquidationReserve).add(fee)) : trove;
	const [troveChange, description] = validateTroveChange(
		trove!,
		updatedTrove!,
		borrowingRate,
		validationContext,
		constants
	);
	const stableTroveChange = useStableTroveChange(troveChange);
	const txErrorMessages = (description?.key || description?.string) && description as ErrorMessage;

	const [errorMessages, setErrorMessages] = useState<ErrorMessage | undefined>(description as ErrorMessage);

	const errorInfo = txErrorMessages || errorMessages;

	const utilRate = Decimal.ONE.div(updatedTrove.collateralRatio(price));
	const [sliderForcedValue, setSliderForcedValue] = useState(troveUtilizationRateNumber);
	const [useMax, setUseMax] = useState(false);

	useEffect(() => {
		setSliderForcedValue(Number(utilRate));
	}, [utilRate])

	const init = () => {
		setValueForced(-1);
		setRepayAmount(-1);
		setDesireNetDebt(max);
		setErrorMessages(undefined);
		setUseMax(false);
	};

	const handleMax = () => {
		const val = Number(max);
		setValueForced(val);
		setRepayAmount(val);
		repaidAmount = val;
		setErrorMessages(undefined);
		setUseMax(true);
	};

	const applyUnsavedNetDebtChanges = (unsavedChanges: Difference, trove: Trove) => {
		if (unsavedChanges.absoluteValue) {
			if (unsavedChanges.positive) {
				return netDebt.add(unsavedChanges.absoluteValue);
			}
			if (unsavedChanges.negative) {
				if (unsavedChanges.absoluteValue.lte(netDebt)) {
					return netDebt.sub(unsavedChanges.absoluteValue);
				}
			}
			return netDebt;
		}
		return netDebt;
	};

	useEffect(() => {
		if (!trove) return;

		if (repayAmount >= 0 && netDebt.gte(repayAmount)) {
			const newNetDebt = netDebt.sub(useMax ? max : repayAmount);
			const previousNetDebt = previousTrove.current?.debt.gt(1) ? previousTrove.current?.netDebt : Decimal.from(0);
			const unsavedChanges = Difference.between(newNetDebt, previousNetDebt);
			const nextNetDebt = applyUnsavedNetDebtChanges(unsavedChanges, trove);
			setDesireNetDebt(nextNetDebt);
		}
	}, [trove, repayAmount, price]);

	const handleSlideUtilRate = (val: number) => {
		const wantNetDebt = previousTrove.current.collateral.mul(price).mul(val).add(wenLiquidationReserve)
		const netDebtDifferent = previousTrove.current.netDebt.gt(wantNetDebt) ? previousTrove.current.netDebt.sub(wantNetDebt) : Decimal.ZERO;
		const newDebt = Number(netDebtDifferent);
		setRepayAmount(newDebt);
		repaidAmount = newDebt;
		setValueForced(newDebt);
		setErrorMessages(undefined);
		setUseMax(false);
	};

	const handleInputRepay = (val: number) => {
		setValueForced(-1);
		setRepayAmount(val);
		repaidAmount = val;
		setErrorMessages(undefined);
		setUseMax(false);
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
			onDone(transactionState.tx.rawSentTransaction as unknown as string, repaidAmount);
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

						<div
							className="flex-row-align-left"
							style={{ gap: "0.5rem" }}>
							<button
								className="textButton smallTextButton"
								onClick={handleMax}>
								{t("max")}:&nbsp;{max.toString(2)}&nbsp;{WEN.symbol}
							</button>

							<button
								className="textButton smallTextButton"
								style={{ textTransform: "none" }}
								onClick={onCloseVault}>
								{t("or")}&nbsp;{t("closeVault")}
							</button>
						</div>
					</div>

					<AmountInput
						coin={WEN}
						price={Decimal.ONE}
						allowSwap={false}
						valueForced={valueForced}
						onInput={handleInputRepay}
						max={Number(max.toString())}
						warning={undefined}
						error={errorInfo && (errorInfo.string || t(errorInfo.key!, errorInfo.values))} />
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
						min={Number(MinSafe)}
						max={Number(maxSafe)}
						onChange={handleSlideUtilRate}
						forcedValue={sliderForcedValue}
						allowReduce={true}
						limitValue={troveUtilizationRateNumber}
						allowIncrease={false} />
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