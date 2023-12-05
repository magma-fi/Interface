/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { Coin, ErrorMessage, ValidationContext } from "../libs/types";
import { WEN, globalContants } from "../libs/globalContants";
import { AmountInput } from "../components/AmountInput";
import { useState, useEffect, useRef } from "react";
import { ExpandableView } from "./ExpandableView";
import { Decimal, Trove, Difference, CRITICAL_COLLATERAL_RATIO, LUSD_LIQUIDATION_RESERVE } from "lib-base";
import { validateTroveChange } from "../components/Trove/validation/validateTroveChange";
import { Fees } from "lib-base/dist/src/Fees";
import { useStableTroveChange } from "../hooks/useStableTroveChange";
import { TroveAction } from "../components/Trove/TroveAction";
import { calculateAvailableBorrow, calculateAvailableWithdrawal } from "../utils";
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
	onDone = () => { }
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
}) => {
	const { t } = useLang();
	const amountDeposited = Number(trove.collateral);
	const [valueForced, setValueForced] = useState(amountDeposited);
	const [depositValue, setDepositValue] = useState(0);
	const [borrowValue, setBorrowValue] = useState(0);
	const [showExpandBorrowView, setShowExpandBorrowView] = useState(false);
	const previousTrove = useRef<Trove>(trove);
	const previousAvailableBorrow = previousTrove.current.collateral.mul(price).div(CRITICAL_COLLATERAL_RATIO);
	const [newAvailableBorrow, setNewAvailableBorrow] = useState(previousAvailableBorrow);
	const previousNetDebt = previousTrove.current?.debt.gt(1) ? previousTrove.current?.netDebt : Decimal.from(0);
	const previousBorrowedAmountNumber = Number(previousNetDebt.toString());
	const [defaultBorrowAmount, setDefaultBorrowAmount] = useState(previousBorrowedAmountNumber);
	const troveUtilizationRateNumber = Number(Decimal.ONE.div(trove.collateralRatio(price)).mul(100));
	const txId = "deposit";
	const transactionState = useMyTransactionState(txId);

	const isDirty = !previousTrove.current.collateral.eq(depositValue) || !previousNetDebt.eq(borrowValue);
	const updatedTrove = isDirty ? new Trove(Decimal.from(depositValue), Decimal.from(borrowValue)) : trove;
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
		setValueForced(amountDeposited);
		setDepositValue(0);
		setBorrowValue(0);
		setShowExpandBorrowView(false);
		setNewAvailableBorrow(previousAvailableBorrow);
		setDefaultBorrowAmount(previousBorrowedAmountNumber);
	};

	useEffect(init, []);

	const handleMax = () => {
		setValueForced(Number(accountBalance.toString()));
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
		setDefaultBorrowAmount(0);
		setBorrowValue(val);
	}

	const handleMaxBorrow = () => {
		setDefaultBorrowAmount(Number(newAvailableBorrow?.toString()));
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
			error={description && t(errorMessages.key, errorMessages.values)}
			warning={undefined}
			allowReduce={false}
			currentValue={defaultBorrowAmount}
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

		const collateral = Decimal.from(depositValue);

		setNewAvailableBorrow(collateral.mul(price).div(CRITICAL_COLLATERAL_RATIO));

		if (!previousTrove.current?.collateral.eq(collateral)) {
			const unsavedChanges = Difference.between(collateral, previousTrove.current?.collateral);
			const nextCollateral = applyUnsavedCollateralChanges(unsavedChanges, trove);
			setDepositValue(Number(nextCollateral.toString()));
		}

		const tempNetDebt = Decimal.from(borrowValue);

		if (!previousNetDebt.eq(tempNetDebt)) {
			const unsavedChanges = Difference.between(tempNetDebt, previousNetDebt);
			const nextNetDebt = applyUnsavedNetDebtChanges(unsavedChanges, trove);
			setBorrowValue(Number(nextNetDebt.toString()));
		}

	}, [trove, depositValue, price, borrowValue]);

	const handleInputDeposit = (val: number) => {
		setValueForced(0);
		setDepositValue(val);
	};

	const handleCloseModal = () => {
		onClose();
	};

	useEffect(() => {
		if (transactionState.type === "waitingForConfirmation" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string);
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	return isOpen ? <Modal
		title={t("deposit") + " " + market?.symbol}
		onClose={handleCloseModal}>
		<div className="flex-row-space-between">
			<div
				className="flex-column"
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
						error={undefined}
						allowReduce={false}
						currentValue={amountDeposited}
						allowIncrease={true} />
				</div>

				<div
					className="collapsedView"
					style={{ width: "100%" }}>
					<ExpandableView
						coverView={availableBorrowView}
						hiddenView={borrowView}
						expand={showExpandBorrowView} />
				</div>
			</div>

			<div
				className="subCard"
				style={{ minWidth: "fit-content" }}>
				<div className="flex-row-space-between">
					<div className="label">{t("utilizationRate")}</div>

					<ChangedValueLabel
						previousValue={troveUtilizationRateNumber.toFixed(2) + "%"}
						newValue={((updatedTrove.collateral.gt(0) && updatedTrove.debt.gt(0)) ? Decimal.ONE.div(updatedTrove.collateralRatio(price)).mul(100).toString(2) : 0) + "%"} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("liquidationPrice")}(1&nbsp;{market?.symbol})</div>

					<ChangedValueLabel
						previousValue={trove.collateral.gt(0) ? trove.collateral.div(trove.debt).toString(2) : 0}
						newValue={(updatedTrove.collateral.gt(0) ? updatedTrove.collateral.div(updatedTrove.debt).toString(2) : 0) + " " + globalContants.USD} />
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
						previousValue={trove.debt.gt(0) ? calculateAvailableWithdrawal(trove, price).toString(2) : 0}
						newValue={(updatedTrove.debt.gt(0) ? calculateAvailableWithdrawal(updatedTrove, price).toString(2) : 0) + " " + market.symbol} />
				</div>

				{showExpandBorrowView && <>
					<div className="flex-row-space-between">
						<div className="label">{t("available2Borrow")}</div>

						<ChangedValueLabel
							previousValue={trove.debt.gt(0) ? calculateAvailableBorrow(trove, price).toString(2) : 0}
							newValue={(updatedTrove.debt.gt(0) ? calculateAvailableBorrow(updatedTrove, price).toString(2) : 0) + " " + WEN.symbol} />
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

						<div
							className="label"
							style={{ color: "#F6F6F7" }}>
							{updatedTrove.debt.toString(2)}&nbsp;{globalContants.USD}
						</div>
					</div>
				</>}
			</div>
		</div>

		{stableTroveChange && !transactionState.id && transactionState.type === "idle" ? <TroveAction
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