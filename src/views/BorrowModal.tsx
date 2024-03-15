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
import { useState, useEffect } from "react";
import { formatAsset, formatAssetAmount, formatPercent } from "../utils";
import { Slider } from "../components/Slider";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { Vault } from "../libs/Vault";
import BigNumber from "bignumber.js";
import { useLiquity } from "../hooks/LiquityContext";
import appConfig from "../appConfig.json";

export const BorrowModal = ({
	isOpen = false,
	onClose = () => { },
	price,
	vault,
	market,
	fees,
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
	price: number;
	vault: Vault;
	fees: Record<string, any>;
	max: number;
	onDone: (tx: string) => void;
	constants?: Record<string, any>;
	liquidationPrice: number;
	recoveryMode: boolean;
	liquidationPoint: number;
	availableWithdrawal: BigNumber;
	availableBorrow: number;
}) => {
	const { chainId } = useLiquity();
	const cfg = (appConfig.constants as JsonObject)[String(chainId)];
	const { t } = useLang();
	const [borrowValue, setBorrowValue] = useState(-1);
	const borrowAmount = BigNumber(borrowValue).shiftedBy(WEN.decimals);
	const [valueForced, setValueForced] = useState(-1);
	const maxSafe = 1 / liquidationPoint;
	const vaultCollateralRatio = vault.collateralRatio(price);
	const vaultUtilizationRateNumber = 1 / vaultCollateralRatio;
	const vaultUtilizationRateNumberPercent = vaultUtilizationRateNumber * 100;
	const [forcedSlideValue, setForcedSlideValue] = useState(vaultUtilizationRateNumber);
	const wenLiquidationReserve = constants?.LUSD_GAS_COMPENSATION || BigNumber(cfg.wenGasCompensation).shiftedBy(market.decimals);
	const borrowingRate = fees.borrowingRate;
	const fee = borrowAmount.gt(0) ? borrowAmount.multipliedBy(borrowingRate) : globalContants.BIG_NUMBER_0;
	const updatedVaultDebt = borrowAmount.gt(0) ? vault.debt.plus(borrowAmount).plus(fee) : vault.debt;
	const newCollateralRatio = Vault.computeCollateralRatio(vault.collateral, updatedVaultDebt, price, 1, market, WEN);
	const newURisPositive = newCollateralRatio > vaultCollateralRatio;
	const newUR = 1 / newCollateralRatio;
	const [sending, setSending] = useState(false);
	const [tx, setTx] = useState("");
	const [errorMsg, setErrorMsg] = useState<ErrorMessage>();
	const newLiquidationPrice = updatedVaultDebt.dividedBy(vault.collateral).toNumber();

	useEffect(() => {
		setForcedSlideValue(newUR);
	}, [newUR])

	const init = () => {
		setValueForced(-1);
		setBorrowValue(-1);
	};

	useEffect(init, []);

	const handleMax = () => {
		const val = Number(max);
		setValueForced(val);
		setBorrowValue(val);
	};

	const handleSlideUtilRate = (val: number) => {
		const newDebt = vault.debt
			.multipliedBy(val)
			.dividedBy(vaultUtilizationRateNumber)
			.minus(vault.netDebt)
			.minus(wenLiquidationReserve)
			.shiftedBy(-WEN.decimals)
			.toNumber();
		setBorrowValue(newDebt);
		setValueForced(newDebt);
	};

	const handleInputBorrowValue = (val: number) => {
		setValueForced(-1);
		setBorrowValue(val);
	};

	const handleCloseModal = () => {
		init();
		onClose();
	};

	const handleBorrow = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		setSending(true);

		vault.adjust(
			borrowingRate + cfg.feePercentSlippage,
			globalContants.BIG_NUMBER_0,
			borrowAmount,
			true,
			globalContants.BIG_NUMBER_0,
			vault.collateral,
			updatedVaultDebt,
			tx => {
				setTx(tx);
			},
			error => {
				setErrorMsg({ string: error.message } as ErrorMessage);
				setSending(false);
				setTx("");
			},
			tx => {
				setSending(false);
				return onDone && onDone(tx);
			}
		);
	};

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
						<div className="label fat">{t("borrowValue")}</div>

						<button
							className="textButton smallTextButton"
							onClick={handleMax}>
							{t("max")}:&nbsp;{formatAsset(max, WEN)}
						</button>
					</div>

					<AmountInput
						coin={WEN}
						price={1}
						allowSwap={false}
						valueForced={valueForced}
						onInput={handleInputBorrowValue}
						max={max}
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

						<div className="label">{t("maxSafe")}:&nbsp;{formatPercent(maxSafe)}</div>
					</div>

					<Slider
						min={0}
						max={maxSafe}
						onChange={handleSlideUtilRate}
						forcedValue={forcedSlideValue}
						allowReduce={false}
						limitValue={vaultUtilizationRateNumber}
						allowIncrease={true} />
				</div>
			</div>

			<div
				className="subCard subContainer">
				<div className="flex-row-space-between">
					<div className="label">{t("utilizationRate")}</div>

					<ChangedValueLabel
						previousValue={vaultUtilizationRateNumberPercent}
						previousPostfix="%"
						newValue={newUR * 100}
						nextPostfix="%"
						positive={newURisPositive} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Borrow")}</div>

					<ChangedValueLabel
						previousValue={availableBorrow}
						newValue={availableBorrow - (borrowValue > 0 ? borrowValue : 0)}
						nextPostfix={WEN.symbol}
						positive={newURisPositive} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Withdraw")}</div>

					<ChangedValueLabel
						previousValue={availableWithdrawal.shiftedBy(-WEN.decimals).toNumber()}
						newValue={Vault.calculateAvailableWithdrawal(vault.collateral, updatedVaultDebt, price, chainId, market, WEN).shiftedBy(-market.decimals).toNumber()}
						nextPostfix={market.symbol}
						positive={newURisPositive} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("vaultDebt")}</div>

					<ChangedValueLabel
						previousValue={vault.debt.shiftedBy(-WEN.decimals).toNumber()}
						newValue={updatedVaultDebt.shiftedBy(-WEN.decimals).toNumber()}
						nextPostfix={globalContants.USD}
						positive={newURisPositive} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("liquidationPrice")}(1&nbsp;{market?.symbol})</div>

					<ChangedValueLabel
						previousValue={liquidationPrice}
						newValue={newLiquidationPrice}
						nextPostfix={globalContants.USD}
						positive={newLiquidationPrice < liquidationPrice}
						maximumFractionDigits={4} />
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
						{formatAsset(formatAssetAmount(wenLiquidationReserve, WEN.decimals), WEN)}
					</div>
				</div>
			</div>
		</div>

		<button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled={borrowAmount.lte(0) || sending || borrowValue > availableBorrow}
			onClick={handleBorrow}>
			<img src="images/borrow-dark.png" />

			{t("borrow")}
		</button>
	</Modal> : <></>
};