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
import { formatAsset, formatAssetAmount, formatCurrency, formatPercent } from "../utils";
import { Slider } from "../components/Slider";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { Vault } from "../libs/Vault";
import BigNumber from "bignumber.js";
import { useLiquity } from "../hooks/LiquityContext";
import appConfig from "../appConfig.json";
import { magma } from "../libs/magma";

let amountWithdrawn = 0;

export const WithdrawModal = ({
	isOpen = false,
	onClose = () => { },
	price = 0,
	vault,
	market,
	fees,
	max,
	onDone = () => { },
	recoveryMode,
	liquidationPoint,
	availableWithdrawal,
	availableBorrow,
	appMMROffset = 1,
	ccr
}: {
	isOpen: boolean;
	onClose: () => void;
	market: Coin;
	price: number;
	vault: Vault;
	fees: Record<string, any>;
	max: BigNumber;
	onDone: (tx: string, withdrawInput: number) => void;
	recoveryMode: boolean;
	liquidationPoint: number;
	availableWithdrawal: BigNumber;
	availableBorrow: BigNumber;
	appMMROffset: number;
	ccr: number;
}) => {
	const { chainId } = useLiquity();
	const cfg = (appConfig.constants as JsonObject)[String(chainId)];
	const maxNumber = formatAssetAmount(max, market.decimals);
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(-1);
	const [withdrawInput, setWithdrawInput] = useState(-1);
	const positiveWithdrawInput = withdrawInput > 0 ? withdrawInput : 0;
	const withdrawAmount = BigNumber(positiveWithdrawInput).shiftedBy(market.decimals);
	const maxSafe = 1 / liquidationPoint;
	const vaultUtilizationRateNumber = 1 / vault.collateralRatio(price);
	const vaultUtilizationRateNumberPercent = vaultUtilizationRateNumber * 100;
	const [sliderForcedValue, setSliderForcedValue] = useState(vaultUtilizationRateNumber);
	const borrowingRate = fees.borrowingRate;
	const [errorMessages, setErrorMessages] = useState<ErrorMessage>();
	const updatedCollateral = vault.collateral.minus(withdrawAmount);
	const updatedUtilRate = 1 / Vault.computeCollateralRatio(updatedCollateral, vault.debt, price, 1, market, WEN);
	const newURPercentNumber = updatedUtilRate * 100;
	const urIsGood = vaultUtilizationRateNumberPercent > newURPercentNumber;
	const updatedAvailableBorrow = Vault.calculateAvailableBorrow(updatedCollateral, vault.debt, price, market, WEN, liquidationPoint, borrowingRate, appMMROffset);
	const [sending, setSending] = useState(false);

	useEffect(() => {
		setSliderForcedValue(updatedUtilRate);
	}, [updatedUtilRate])

	const init = () => {
		setValueForced(-1);
		setWithdrawInput(-1);
	};

	useEffect(init, []);

	const handleMax = () => {
		setValueForced(maxNumber);
		setWithdrawInput(maxNumber);
		amountWithdrawn = maxNumber;
	};

	const handleSlideUtilRate = (val: number) => {
		const newCol = vault.collateral.minus(vault.debt.dividedBy(val).dividedBy(price)).shiftedBy(-market.decimals).toNumber();
		setWithdrawInput(newCol);
		amountWithdrawn = newCol;
		setValueForced(newCol);
	};

	const handleInputWithdraw = (val: number) => {
		setValueForced(-1);
		setWithdrawInput(val);
		amountWithdrawn = val;
	};

	const handleCloseModal = () => {
		init();
		onClose();
	};

	const handleWithdraw = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		if (magma.wouldBeRecoveryMode(updatedCollateral, vault.debt, price, 1, market, WEN)) {
			return setErrorMessages({
				key: "noOpenningToFall",
				values: { ccr }
			} as unknown as ErrorMessage);
		}

		setSending(true);

		vault.adjust(
			borrowingRate + cfg.feePercentSlippage,
			withdrawAmount,
			globalContants.BIG_NUMBER_0,
			false,
			globalContants.BIG_NUMBER_0,
			updatedCollateral,
			vault.debt,
			undefined,
			error => {
				setErrorMessages({ string: error.message } as ErrorMessage);
				setSending(false);
			},
			tx => {
				setSending(false);
				return onDone && onDone(tx, amountWithdrawn);
			}
		)
	};

	return isOpen ? <Modal
		title={t("withdraw") + " " + market.symbol}
		onClose={handleCloseModal}>
		<div className="withdrawModal">
			<div className="flex-column">
				<div className="flex-column-align-left">
					<div
						className="flex-row-space-between"
						style={{ alignItems: "center" }}>
						<div className="label fat">{t("withdrawInput")}</div>

						<button
							className="textButton smallTextButton"
							onClick={handleMax}>
							{t("max")}:&nbsp;{formatAsset(maxNumber, market)}
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

						<div className="label">{t("maxSafe")}:&nbsp;{formatPercent(maxSafe)}</div>
					</div>

					<Slider
						min={0}
						max={maxSafe}
						onChange={handleSlideUtilRate}
						forcedValue={sliderForcedValue}
						allowReduce={false}
						limitValue={vaultUtilizationRateNumber}
						allowIncrease={true} />
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
						previousValue={formatAssetAmount(availableBorrow, WEN.decimals)}
						newValue={formatAssetAmount(updatedAvailableBorrow, WEN.decimals)}
						nextPostfix={WEN.symbol}
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("available2Withdraw")}</div>

					<ChangedValueLabel
						previousValue={formatAssetAmount(availableWithdrawal, market.decimals)}
						newValue={formatAssetAmount(availableWithdrawal, market.decimals) - positiveWithdrawInput}
						nextPostfix={market.symbol}
						positive={urIsGood} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("vaultDebt")}</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>
						{formatCurrency(formatAssetAmount(vault.debt, WEN.decimals))}
					</div>
				</div>
			</div>
		</div>

		<button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled={withdrawAmount.lte(0) || sending || withdrawAmount.gt(availableWithdrawal) || recoveryMode}
			onClick={handleWithdraw}>
			<img src="images/repay-dark.png" />

			{sending ? t("withdrawing") + "..." : t("withdraw")}
		</button>
	</Modal> : <></>
};