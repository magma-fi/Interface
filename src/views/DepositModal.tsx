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
import { ExpandableView } from "./ExpandableView";
import { Decimal, Trove, Difference, CRITICAL_COLLATERAL_RATIO, LUSD_LIQUIDATION_RESERVE } from "lib-base";
import { validateTroveChange } from "../components/Trove/validation/validateTroveChange";
import { Fees } from "lib-base/dist/src/Fees";
import { useStableTroveChange } from "../hooks/useStableTroveChange";
import { TroveAction } from "../components/Trove/TroveAction";
import { calculateAvailableBorrow, calculateAvailableWithdrawal, feeFrom } from "../utils";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { useMyTransactionState } from "../components/Transaction";

export const DepositeModal = ({
	isOpen = false,
	onClose = () => { },
	accountBalance = Decimal.ZERO,
	price = Decimal.ZERO,
	trove,
	market,
	fees,
	validationContext,
	onDone = () => { },
	constants,
	depositAndBorrow = true,
	liquidationPrice,
	availableWithdrawal,
	recoveryMode,
	liquidationPoint,
	availableBorrow
}: {
	isOpen: boolean;
	onClose: () => void;
	market: Coin;
	accountBalance: Decimal;
	price: Decimal;
	trove: Trove;
	fees: Fees;
	validationContext: ValidationContext;
	onDone: (tx: string) => void;
	constants?: Record<string, Decimal>;
	depositAndBorrow: boolean;
	liquidationPrice: Decimal;
	availableWithdrawal: Decimal;
	recoveryMode: boolean;
	liquidationPoint: Decimal;
	availableBorrow: Decimal;
}) => {
	const { t } = useLang();
	// const amountDeposited = Number(trove.collateral);
	const [valueForced, setValueForced] = useState(-1);
	const [depositValue, setDepositValue] = useState(0);
	const [borrowValue, setBorrowValue] = useState(0);
	const [showExpandBorrowView, setShowExpandBorrowView] = useState(false);
	const previousTrove = useRef<Trove>(trove);
	const previousAvailableBorrow = previousTrove.current.collateral.mul(price).div(CRITICAL_COLLATERAL_RATIO);
	const [newAvailableBorrow, setNewAvailableBorrow] = useState(previousAvailableBorrow);
	const previousNetDebt = previousTrove.current?.debt.gt(1) ? previousTrove.current?.netDebt : Decimal.from(0);
	// const previousBorrowedAmountNumber = Number(previousNetDebt.toString());
	const [defaultBorrowAmount, setDefaultBorrowAmount] = useState(-1);
	const troveUtilizationRateNumber = Number(Decimal.ONE.div(trove.collateralRatio(price)).mul(100));
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);
	const [desireCollateral, setDesireCollateral] = useState(previousTrove.current?.collateral);
	const [desireNetDebt, setDesireNetDebt] = useState(previousNetDebt);
	const wenLiquidationReserve = constants?.LUSD_GAS_COMPENSATION || Decimal.ONE;
	// const wenMinimumNetDebt = constants?.MIN_NET_DEBT.div(dec) || Decimal.ONE;
	const troveNetDebt = trove.debt.gt(wenLiquidationReserve) ? trove.netDebt : Decimal.ZERO;
	const isDirty = !previousTrove.current.collateral.eq(desireCollateral) || !previousNetDebt.eq(desireNetDebt);
	const isDebtIncrease = desireNetDebt.gt(troveNetDebt);
	const debtIncreaseAmount = isDebtIncrease ? desireNetDebt.sub(troveNetDebt) : Decimal.ZERO;
	const borrowingRate = fees.borrowingRate();
	const fee = !depositAndBorrow
		? (
			isDebtIncrease
				? feeFrom(trove, new Trove(trove.collateral, trove.debt.add(debtIncreaseAmount)), borrowingRate)
				: Decimal.ZERO
		) : borrowingRate.mul(borrowValue);
	const updatedTrove = isDirty ? new Trove(desireCollateral, desireNetDebt.add(wenLiquidationReserve).add(fee)) : trove;
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

	const init = () => {
		setValueForced(-1);
		setDepositValue(0);
		setBorrowValue(0);
		setShowExpandBorrowView(false);
		setNewAvailableBorrow(previousAvailableBorrow);
		setDefaultBorrowAmount(-1);
		setErrorMessages(undefined);
	};

	useEffect(init, []);

	const handleMax = () => {
		const val = Number(accountBalance.toString(0));
		setValueForced(val);
		setDepositValue(val);
		setErrorMessages(undefined);
	};

	const handleExpandBorrow = () => {
		setShowExpandBorrowView(!showExpandBorrowView);
	};

	const availableBorrowView = <div
		className="flex-row-space-between"
		style={{ width: "calc(100% - 2rem)" }}>
		<div className="flex-row-align-left">
			<img
				src="images/borrow.png"
				width="22px" />

			<div className="flex-column-align-left">
				<div className="label">{t("available2Borrow")}</div>

				<div className="flex-row-align-left">
					<div
						className="label labelBig"
						style={{ color: "#F6F6F7" }}>
						{newAvailableBorrow?.toString(2)}&nbsp;{WEN.symbol}
					</div>

					{newAvailableBorrow.gt(previousAvailableBorrow) && <div
						className="label labelSmall"
						style={{ textDecoration: "line-through" }}>
						{previousAvailableBorrow?.toString(2)}
					</div>}
				</div>
			</div>
		</div>

		<button
			className="textButton"
			onClick={handleExpandBorrow}>
			{showExpandBorrowView ? t("close") : t("borrow")}

			<img src={showExpandBorrowView ? "images/close.png" : "images/arrow-down-orange.png"} />
		</button>
	</div>

	const handleInputBorrow = (val: number) => {
		setDefaultBorrowAmount(-1);
		setBorrowValue(val);
	}

	const handleMaxBorrow = () => {
		const val = Number(newAvailableBorrow?.sub(previousNetDebt).toString());
		setDefaultBorrowAmount(val);
		setBorrowValue(val);
	};

	const borrowView = <div
		className="flex-column-align-left"
		style={{ width: "calc(100% - 2rem)" }}>
		<div
			className="flex-row-space-between"
			style={{ alignItems: "center" }}>
			<div className="label fat">{t("borrowAmount")}</div>

			<button
				className="textButton smallTextButton"
				onClick={handleMaxBorrow}>
				{t("max")}:&nbsp;{newAvailableBorrow?.toString(2)}&nbsp;{WEN.symbol}
			</button>
		</div>

		<AmountInput
			coin={WEN}
			price={Decimal.ONE}
			allowSwap={false}
			valueForced={defaultBorrowAmount}
			onInput={handleInputBorrow}
			max={Number(newAvailableBorrow?.toString())}
			error={errorInfo && (errorInfo.string || t(errorInfo.key!, errorInfo.values))}
			warning={undefined}
			allowReduce={true}
			currentValue={-1}
			allowIncrease={true} />
	</div>

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

	const applyUnsavedNetDebtChanges = (unsavedChanges: Difference, trove: Trove) => {
		if (unsavedChanges.absoluteValue) {
			if (unsavedChanges.positive) {
				return previousNetDebt.add(unsavedChanges.absoluteValue);
			}
			if (unsavedChanges.negative) {
				if (unsavedChanges.absoluteValue.lt(previousNetDebt)) {
					return previousNetDebt.sub(unsavedChanges.absoluteValue);
				}
			}
			return previousNetDebt;
		}
		return previousNetDebt;
	};

	useEffect(() => {
		if (!trove) return;

		if (depositValue >= 0) {
			const newCollateral = previousTrove.current?.collateral.add(depositValue);
			const unsavedChanges = Difference.between(newCollateral, previousTrove.current?.collateral);
			const nextCollateral = applyUnsavedCollateralChanges(unsavedChanges, trove);
			setDesireCollateral(nextCollateral);

			const newBorrow = newCollateral.mul(price).div(CRITICAL_COLLATERAL_RATIO);
			setNewAvailableBorrow(newBorrow.gt(previousNetDebt) ? newBorrow.sub(previousNetDebt) : Decimal.ZERO);
		}

		if (borrowValue >= 0) {
			let nextNetDebt: Decimal;

			if (!depositAndBorrow) {
				const tempNetDebt = previousNetDebt.add(borrowValue);
				const unsavedChanges = Difference.between(tempNetDebt, previousNetDebt);
				nextNetDebt = applyUnsavedNetDebtChanges(unsavedChanges, trove);
			} else {
				nextNetDebt = Decimal.from(borrowValue);
			}

			setDesireNetDebt(nextNetDebt);
		}
	}, [trove, depositValue, price, borrowValue]);

	const handleInputDeposit = (val: number) => {
		setValueForced(-1);
		setDepositValue(val);
		setErrorMessages(undefined);
	};

	const handleCloseModal = () => {
		onClose();
	};

	useEffect(() => {
		if (transactionState.type === "failed" || transactionState.type === "cancelled") {
			setErrorMessages({ string: transactionState.error.message || JSON.stringify(transactionState.error).substring(0, 100) } as ErrorMessage);
		}

		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string);
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	return isOpen ? <Modal
		title={t("deposit") + " " + market?.symbol}
		onClose={handleCloseModal}>
		<div className="depositModal">
			<div
				className="flex-column subContainer"
				style={{ gap: "24px" }}>
				<div className="flex-column-align-left">
					<div
						className="flex-row-space-between"
						style={{ alignItems: "center" }}>
						<div className="label fat">{t("depositAmount")}</div>

						<button
							className="textButton smallTextButton"
							onClick={handleMax}>
							{t("max")}:&nbsp;{accountBalance.toString(2)}&nbsp;{market.symbol}
						</button>
					</div>

					<AmountInput
						coin={market}
						price={price}
						allowSwap={false}
						valueForced={valueForced}
						onInput={handleInputDeposit}
						max={Number(accountBalance.toString())}
						warning={undefined}
						error={(!depositAndBorrow && errorInfo) ? (errorInfo.string || t(errorInfo.key!, errorInfo.values)) : undefined}
						allowReduce={true}
						currentValue={-1}
						allowIncrease={true} />
				</div>

				{depositAndBorrow && <div
					className="collapsedView"
					style={{ width: "100%" }}>
					<ExpandableView
						coverView={availableBorrowView}
						hiddenView={borrowView}
						expand={showExpandBorrowView} />
				</div>}
			</div>

			<div
				className="subContainer subCard">
				<div className="flex-row-space-between">
					<div className="label">{t("utilizationRate")}</div>

					<ChangedValueLabel
						previousValue={troveUtilizationRateNumber.toFixed(2) + "%"}
						newValue={((updatedTrove.collateral.gt(0) && updatedTrove.debt.gt(0)) ? Decimal.ONE.div(updatedTrove.collateralRatio(price)).mul(100).toString(2) : 0) + "%"} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("deposited")}</div>

					<ChangedValueLabel
						previousValue={trove.collateral.toString(2)}
						newValue={updatedTrove.collateral.toString(2) + " " + market.symbol} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("depositedValue")}</div>

					<ChangedValueLabel
						previousValue={trove.collateral.mul(price).toString(2)}
						newValue={updatedTrove.collateral.mul(price).toString(2) + " " + globalContants.USD} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Withdraw")}</div>

					<ChangedValueLabel
						previousValue={trove.debt.gt(0) ? availableWithdrawal.toString(2) : 0}
						newValue={(updatedTrove.debt.gt(0) ? calculateAvailableWithdrawal(updatedTrove, price, liquidationPoint).toString(2) : 0) + " " + market.symbol} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("liquidationPrice")}(1&nbsp;{market?.symbol})</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>
						{liquidationPrice.toString(2)}&nbsp;{globalContants.USD}
					</div>
				</div>

				{showExpandBorrowView && <>
					<div className="flex-row-space-between">
						<div className="label">{t("available2Borrow")}</div>

						<ChangedValueLabel
							previousValue={trove.debt.gt(0) ? availableBorrow.toString(2) : 0}
							newValue={(updatedTrove.debt.gt(0) ? calculateAvailableBorrow(updatedTrove, price, liquidationPoint).toString(2) : 0) + " " + WEN.symbol} />
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

					<div className="flex-row-space-between">
						<div className="label">{t("vaultDebt")}</div>

						<ChangedValueLabel
							previousValue={trove.debt.toString(2)}
							newValue={updatedTrove.debt.toString(2) + " " + globalContants.USD} />
					</div>
				</>}
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
						<img src="images/deposit.png" />

						{t("deposit")}
					</button>
				</TroveAction> : <button
					className="primaryButton bigButton"
					style={{ width: "100%" }}
					disabled>
					<img src="images/deposit.png" />

					{transactionState.type !== "confirmed" && transactionState.type !== "confirmedOneShot" && transactionState.type !== "idle" ? (t("depositing") + "...") : t("deposit")}
				</button>}
	</Modal> : <></>
};