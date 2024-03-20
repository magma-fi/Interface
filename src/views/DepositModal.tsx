/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { Coin, ErrorMessage, JsonObject } from "../libs/types";
import { WEN, globalContants } from "../libs/globalContants";
import { AmountInput } from "../components/AmountInput";
import React, { useState, useEffect } from "react";
import { ExpandableView } from "./ExpandableView";
import { formatAsset, formatAssetAmount, formatPercent } from "../utils";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import appConfig from "../appConfig.json";
import { useLiquity } from "../hooks/LiquityContext";
import BigNumber from "bignumber.js";
import { Vault } from "../libs/Vault";
import { magma } from "../libs/magma";

export const DepositeModal = ({
	isOpen = false,
	onClose = () => { },
	accountBalance = globalContants.BIG_NUMBER_0,
	price = 0,
	vault,
	market,
	fees,
	onDone = () => { },
	constants,
	depositAndBorrow = true,
	liquidationPrice,
	availableWithdrawal,
	liquidationPoint,
	availableBorrow,
	appMMROffset = 1
}: {
	isOpen: boolean;
	onClose: () => void;
	market: Coin;
	accountBalance: BigNumber;
	price: number;
	vault: Vault;
	fees: Record<string, any>;
	onDone: (tx: string) => void;
	constants?: Record<string, any>;
	depositAndBorrow: boolean;
	liquidationPrice: number;
	availableWithdrawal: BigNumber;
	liquidationPoint: number;
	availableBorrow: BigNumber;
	appMMROffset: number;
}) => {
	const { chainId } = useLiquity();
	const cfg = (appConfig.constants as JsonObject)[String(chainId)];
	const { t } = useLang();
	const [tx, setTx] = useState("");
	const [sending, setSending] = useState(false);
	const accountBalanceDecimals = formatAssetAmount(accountBalance, market.decimals);
	const vaultCollateralDecimals = formatAssetAmount(vault.collateral, market.decimals);
	const [valueForced, setValueForced] = useState(-1);
	const [depositValue, setDepositValue] = useState(0);
	const depositAmount = BigNumber(depositValue).shiftedBy(market.decimals);
	const newVaultCollateralDecimals = vaultCollateralDecimals + depositValue;
	const [borrowValue, setBorrowValue] = useState(0);
	const borrowAmount = BigNumber(borrowValue).shiftedBy(WEN.decimals);
	const [showExpandBorrowView, setShowExpandBorrowView] = useState(depositAndBorrow);
	const wenLiquidationReserve = constants?.LUSD_GAS_COMPENSATION || BigNumber(cfg.wenGasCompensation).shiftedBy(market.decimals);
	const borrowingRate = fees.borrowingRate;
	const [defaultBorrowAmount, setDefaultBorrowAmount] = useState(-1);
	const vaultCollateralRatio = vault.collateralRatio(price);
	const vaultUtilizationRateNumber = vaultCollateralRatio > 0 ? 1 / vaultCollateralRatio * 100 : 0;
	const fee = borrowAmount.multipliedBy(borrowingRate);
	const [errorInfo, setErrorInfo] = useState<ErrorMessage>();
	const updatedVaultCollateral = vault.collateral.plus(depositAmount);
	const updatedVaultDebt = vault.debt.gt(0) ? vault.debt.plus(borrowAmount).plus(fee) : vault.debt.plus(borrowAmount).plus(wenLiquidationReserve).plus(fee);
	const newCollateralRatio = Vault.computeCollateralRatio(updatedVaultCollateral, updatedVaultDebt, price, 1, market, WEN);
	const newAvailableBorrow = Vault.calculateAvailableBorrow(updatedVaultCollateral, vault.nominalNetDebt, price, market, WEN, liquidationPoint, borrowingRate, appMMROffset);
	const newAvailableBorrowNumber = newAvailableBorrow.shiftedBy(-WEN.decimals).toNumber();
	const newAvailableBorrowFiat = formatAsset(formatAssetAmount(newAvailableBorrow, WEN.decimals), WEN);
	const newLiquidationPrice = updatedVaultCollateral.gt(0) ? updatedVaultDebt.dividedBy(updatedVaultCollateral).toNumber() : 0;
	const newURPercentNumber = newCollateralRatio > 0 ? 1 / newCollateralRatio * 100 : 0;
	const urIsGood = vaultUtilizationRateNumber > newURPercentNumber;

	const init = () => {
		setValueForced(-1);
		setDepositValue(0);
		setBorrowValue(0);
		setShowExpandBorrowView(depositAndBorrow);
		setDefaultBorrowAmount(-1);
	};

	useEffect(init, []);

	const handleMax = () => {
		const val = accountBalanceDecimals;
		setValueForced(val);
		setDepositValue(val);
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
						{newAvailableBorrowFiat}
					</div>

					{newAvailableBorrow.gt(availableBorrow) && <div
						className="label labelSmall"
						style={{ textDecoration: "line-through" }}>
						{availableBorrow.toFixed(globalContants.DECIMALS_2)}
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
		const val = newAvailableBorrow?.minus(vault.debt).shiftedBy(-WEN.decimals).toNumber();
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
				{t("max")}:&nbsp;{newAvailableBorrowFiat}
			</button>
		</div>

		<AmountInput
			coin={WEN}
			price={1}
			allowSwap={false}
			valueForced={defaultBorrowAmount}
			onInput={handleInputBorrow}
			max={newAvailableBorrowNumber}
			error={errorInfo && (errorInfo.string || t(errorInfo.key!, errorInfo.values))}
			warning={undefined}
			allowReduce={true}
			currentValue={-1}
			allowIncrease={true} />
	</div>

	const handleInputDeposit = (val: number) => {
		setValueForced(-1);
		setDepositValue(val);
	};

	const handleCloseModal = () => {
		onClose();
	};

	const handleDeposit = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		setSending(true);

		if (vault?.status === 1) {
			// vault?.status === VaultStatus4Contract.active || vault?.status === VaultStatus4Subgraph.open
			vault.adjust(
				borrowingRate + cfg.feePercentSlippage,
				globalContants.BIG_NUMBER_0,
				globalContants.BIG_NUMBER_0,
				false,
				depositAmount,
				updatedVaultCollateral,
				updatedVaultDebt,
				tx => {
					setTx(tx);
				},
				error => {
					setErrorInfo({ string: error.message } as ErrorMessage);
					setSending(false);
					setTx("");
				},
				tx => {
					setSending(false);
					return onDone && onDone(tx);
				}
			);
		} else {
			magma.openVault(
				vault,
				borrowingRate + cfg.feePercentSlippage,
				updatedVaultDebt,
				depositAmount,
				tx => setTx(tx),
				error => {
					setErrorInfo({ string: error.message } as ErrorMessage);
					setSending(false);
					setTx("");
				},
				tx => {
					setSending(false);
					return onDone && onDone(tx);
				}
			);
		}
	};

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
							{t("max")}:&nbsp;{formatAsset(accountBalanceDecimals, market)}
						</button>
					</div>

					<AmountInput
						coin={market}
						price={price}
						allowSwap={false}
						valueForced={valueForced}
						onInput={handleInputDeposit}
						max={accountBalanceDecimals}
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
						previousValue={vaultUtilizationRateNumber}
						previousPostfix="%"
						newValue={newURPercentNumber}
						nextPostfix="%"
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("deposited")}</div>

					<ChangedValueLabel
						previousValue={vaultCollateralDecimals}
						newValue={newVaultCollateralDecimals}
						nextPostfix={market.symbol}
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("depositedValue")}</div>

					<ChangedValueLabel
						previousValue={vaultCollateralDecimals * price}
						newValue={newVaultCollateralDecimals * price}
						nextPostfix={globalContants.USD}
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Withdraw")}</div>

					<ChangedValueLabel
						previousValue={formatAssetAmount(availableWithdrawal, market.decimals)}
						newValue={formatAssetAmount(availableWithdrawal, market.decimals) + depositValue}
						nextPostfix={market.symbol}
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("liquidationPrice")}(1&nbsp;{market?.symbol})</div>

					<ChangedValueLabel
						previousValue={liquidationPrice}
						newValue={newLiquidationPrice}
						nextPostfix={globalContants.USD}
						positive={urIsGood}
						maximumFractionDigits={4} />
				</div>

				{showExpandBorrowView && <>
					<div className="flex-row-space-between">
						<div className="label">{t("available2Borrow")}</div>

						<ChangedValueLabel
							previousValue={availableBorrow.toNumber()}
							newValue={newAvailableBorrowNumber}
							nextPostfix={WEN.symbol}
							positive={urIsGood} />
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("borrowFee")}&nbsp;({formatPercent(borrowingRate)})</div>

						<div
							className="label"
							style={{ color: "#F6F6F7" }}>
							{formatAsset(formatAssetAmount(fee, WEN.decimals), WEN)}
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
							{formatAsset(formatAssetAmount(constants?.LUSD_GAS_COMPENSATION, WEN.decimals), WEN)}
						</div>
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("vaultDebt")}</div>

						<ChangedValueLabel
							previousValue={vault.debtDecimals}
							newValue={updatedVaultDebt.shiftedBy(-WEN.decimals).toNumber()}
							nextPostfix={globalContants.USD}
							positive={urIsGood} />
					</div>
				</>}
			</div>
		</div>

		<button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled={
				accountBalance.lt(depositValue)
				|| sending
				|| (depositAndBorrow && (depositValue === 0 || borrowValue === 0))
				|| (!depositAndBorrow && (depositValue === 0))
				|| updatedVaultDebt.lt(constants?.MIN_NET_DEBT)
			}
			onClick={handleDeposit}>
			<img src="images/deposit.png" />
			{sending ? (
				depositAndBorrow ? t("sending") : t("depositing")
			) : (
				depositAndBorrow ? t("depositAndBorrow") : t("deposit")
			)}
		</button>
	</Modal> : <></>
};