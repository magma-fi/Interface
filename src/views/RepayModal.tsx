/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { Coin, ErrorMessage, JsonObject, ValidationContext } from "../libs/types";
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

let repaidAmount = 0;

export const RepayModal = ({
	isOpen = false,
	onClose = () => { },
	price = 0,
	vault,
	market,
	fees,
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
	price: number;
	vault: Vault;
	fees: Record<string, any>;
	max: BigNumber;
	onDone: (tx: string, repaidAmount: number) => void;
	constants?: Record<string, any>;
	recoveryMode: boolean;
	liquidationPoint: number;
	availableWithdrawal: BigNumber;
	availableBorrow: BigNumber;
	onCloseVault: () => void;
}) => {
	const { chainId } = useLiquity();
	const cfg = (appConfig.constants as JsonObject)[String(chainId)];
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(-1);
	const [repayInput, setRepayInput] = useState(-1);
	const repayAmount = BigNumber(repayInput).shiftedBy(WEN.decimals);
	const maxSafe = 1 / liquidationPoint;
	const vaultUR = 1 / vault.collateralRatio(price);
	const vaultUtilizationRateNumber = vaultUR;
	const vaultUtilizationRateNumberPercent = vaultUtilizationRateNumber * 100;
	const wenLiquidationReserve = constants?.LUSD_GAS_COMPENSATION || BigNumber(cfg.wenGasCompensation).shiftedBy(market.decimals);
	const minNetDebt = constants?.MIN_NET_DEBT;
	const borrowingRate = fees.borrowingRate;
	const minSafe = minNetDebt.multipliedBy(1 + borrowingRate).shiftedBy(-WEN.decimals)
		.dividedBy(vault.collateral.shiftedBy(-market.decimals).multipliedBy(price))
		.toNumber();
	const [errorInfo, setErrorInfo] = useState<ErrorMessage>();
	const updatedVaultDebt = repayInput >= 0 ? vault.debt.minus(repayAmount) : vault.debt;
	const utilRate = globalContants.BIG_NUMBER_1.dividedBy(Vault.computeCollateralRatio(vault.collateral, updatedVaultDebt, price, 1, market, WEN));
	const newURPercentNumber = utilRate.multipliedBy(100).toNumber();
	const urIsGood = vaultUtilizationRateNumberPercent > newURPercentNumber;
	const [sliderForcedValue, setSliderForcedValue] = useState(vaultUtilizationRateNumber);
	const maxNumber = formatAssetAmount(max, WEN.decimals);
	const [sending, setSending] = useState(false);

	useEffect(() => {
		setSliderForcedValue(Number(utilRate));
	}, [utilRate])

	const init = () => {
		setValueForced(-1);
		setRepayInput(-1);
	};

	const handleMax = () => {
		const val = maxNumber;
		setValueForced(val);
		setRepayInput(val);
		repaidAmount = val;
	};

	const handleSlideUtilRate = (val: number) => {
		const wantNetDebt = vault.collateral.shiftedBy(-market.decimals)
			.multipliedBy(price)
			.multipliedBy(val)
			.shiftedBy(WEN.decimals)
			.plus(wenLiquidationReserve);
		const netDebtDifferent = vault.netDebt.gt(wantNetDebt) ? vault.netDebt.minus(wantNetDebt) : globalContants.BIG_NUMBER_0;
		const newDebt = netDebtDifferent.shiftedBy(-WEN.decimals).toNumber();
		setRepayInput(newDebt);
		repaidAmount = newDebt;
		setValueForced(newDebt);
	};

	const handleInputRepay = (val: number) => {
		setValueForced(-1);
		setRepayInput(val);
		repaidAmount = val;
	};

	const handleCloseModal = () => {
		init();
		onClose();
	};

	const handleRepay = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		setSending(true);

		vault.adjust(
			borrowingRate + cfg.feePercentSlippage,
			globalContants.BIG_NUMBER_0,
			repayAmount,
			false,
			globalContants.BIG_NUMBER_0,
			vault.collateral,
			updatedVaultDebt,
			undefined,
			error => {
				setErrorInfo({ string: error.message } as ErrorMessage);
				setSending(false);
			},
			tx => {
				setSending(false);
				return onDone && onDone(tx, repaidAmount);
			}
		);
	};

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
						<div className="label fat">{t("repayInput")}</div>

						<div
							className="flex-row-align-left"
							style={{ gap: "0.5rem" }}>
							<button
								className="textButton smallTextButton"
								onClick={handleMax}>
								{t("max")}:&nbsp;{formatAsset(maxNumber, WEN)}
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
						price={1}
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

						<div className="label">{t("maxSafe")}:&nbsp;{formatPercent(maxSafe)}</div>
					</div>

					<Slider
						min={minSafe}
						max={maxSafe}
						onChange={handleSlideUtilRate}
						forcedValue={sliderForcedValue}
						allowReduce={true}
						limitValue={vaultUtilizationRateNumber}
						allowIncrease={false} />
				</div>
			</div>

			<div
				className="subCard"
				style={{ minWidth: "fit-content" }}>
				<div className="flex-row-space-between">
					<div className="label">{t("utilizationRate")}</div>

					<ChangedValueLabel
						previousValue={vaultUtilizationRateNumberPercent}
						previousPostfix="%"
						newValue={newURPercentNumber}
						nextPostfix="%"
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Borrow")}</div>

					<ChangedValueLabel
						previousValue={availableBorrow.toNumber()}
						newValue={availableBorrow.plus(repayInput >= 0 ? repayInput : 0).toNumber()}
						nextPostfix={WEN.symbol}
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Withdraw")}</div>

					<ChangedValueLabel
						previousValue={availableWithdrawal.shiftedBy(-market.decimals).toNumber()}
						newValue={Vault.calculateAvailableWithdrawal(vault.collateral, updatedVaultDebt, price, chainId, market, WEN).shiftedBy(-market.decimals).toNumber()}
						nextPostfix={market.symbol}
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("vaultDebt")}</div>

					<ChangedValueLabel
						previousValue={formatAssetAmount(vault.debt, WEN.decimals)}
						newValue={formatAssetAmount(vault.debt.plus(repaidAmount), WEN.decimals)}
						nextPostfix={globalContants.USD}
						positive={urIsGood} />
				</div>
			</div>
		</div>

		<button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled={repayAmount.lte(0) || sending || repayAmount.gt(constants?.lusdBalance)}
			onClick={handleRepay}>
			<img src="images/repay-dark.png" />

			{sending ? (t("repaying") + "...") : t("repay")}
		</button>
	</Modal> : <></>
};