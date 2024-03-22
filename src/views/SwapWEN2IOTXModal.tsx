/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { IOTX, WEN, globalContants } from "../libs/globalContants";
import { AmountInput } from "../components/AmountInput";
import React, { useState, useEffect } from "react";
import { SnackBar } from "../components/SnackBar";
import BigNumber from "bignumber.js";
import { formatAsset, formatAssetAmount, formatNumber, formatPercent } from "../utils";
import { magma } from "../libs/magma";
import { ErrorMessage } from "../libs/types";

export const SwapWEN2IOTXModal = ({
	isOpen = false,
	onClose = () => { },
	onDone = () => { },
	max,
	price
}: {
	isOpen: boolean;
	onClose: () => void;
	onDone: (tx: string, swapInput: number) => void;
	max: BigNumber;
	price: number;
}) => {
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(-1);
	const [swapInput, setSwapInput] = useState(0);
	const swapAmount = BigNumber(swapInput).shiftedBy(WEN.decimals);
	const maxNumber = formatAssetAmount(max, WEN.decimals);
	const [fee, setFee] = useState(globalContants.BIG_NUMBER_0);
	const redeemRate = price;
	const feeDecimals = formatAssetAmount(fee, WEN.decimals);
	const receive = swapAmount.minus(fee).dividedBy(redeemRate);
	const [sending, setSending] = useState(false);
	const [iotxAsUnit, setIOTXAsUnit] = useState(true);
	const [errInfo, setErrInfo] = useState<ErrorMessage>();

	useEffect(() => {
		const getData = async () => {
			const res = await magma.getRedemptionFeeWithDecay(swapAmount);
			if (res) setFee(res);
		}

		getData();
	}, [swapAmount]);

	const handleMax = () => {
		const val = maxNumber;
		setValueForced(val);
		setSwapInput(val);
	};

	const handleInputSwap = (val: number) => {
		setValueForced(-1);
		setSwapInput(val);
	};

	const handleCloseModal = () => {
		onClose();
	};

	const handleSwap = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		setSending(true);

		magma.swap(
			swapAmount,
			price,
			undefined,
			error => {
				setErrInfo({ string: error.message } as ErrorMessage);
				setSending(false);
			},
			tx => {
				setSending(false);
				return onDone && onDone(tx, swapInput);
			}
		);
	};

	const handleSwapUnits = () => {
		setIOTXAsUnit(!iotxAsUnit);
	};

	return isOpen ? <Modal
		title={t("swapWen2Iotx")}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{
				gap: "1rem",
				maxWidth: "372px"
			}}>
			<div className="description">{t("swapioUSD2IOTX")}</div>

			<SnackBar
				type="warningSnackBar"
				text={t("note") + ": " + t("differentWithRepaying")} />

			<div className="flex-column-align-left">
				<div
					className="flex-row-space-between"
					style={{ alignItems: "center" }}>
					<div className="label fat">{t("amount2Swap")}</div>

					<button
						className="textButton smallTextButton"
						onClick={handleMax}>
						{t("debtBalance")}:&nbsp;{formatAsset(maxNumber, WEN)}
					</button>
				</div>

				<AmountInput
					coin={WEN}
					price={1}
					allowSwap={false}
					valueForced={valueForced}
					onInput={handleInputSwap}
					max={maxNumber}
					warning={undefined}
					allowReduce={true}
					currentValue={-1}
					allowIncrease={true}
					error={errInfo && (errInfo.string || t(errInfo.key!, errInfo.values))} />
			</div>

			<div
				className="subCard"
				style={{ minWidth: "fit-content" }}>
				<div className="flex-row-space-between">
					<div className="label">{t("currentRate")}</div>

					<div className="flex-row-align-left">
						<button
							className="textButton inLineTextButton"
							onClick={handleSwapUnits}>
							<img src="images/swap.png" />
						</button>

						<div
							className="label"
							style={{ color: "#F6F6F7" }}>
							<span>1&nbsp;</span>

							{iotxAsUnit ? IOTX.symbol : WEN.symbol}

							<span>&nbsp;=&nbsp;</span>

							{iotxAsUnit ? formatNumber(redeemRate) : formatNumber(1 / redeemRate)}

							<span>&nbsp;</span>

							{iotxAsUnit ? WEN.symbol : IOTX.symbol}
						</div>
					</div>
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("conversionFee")}&nbsp;({formatPercent(fee.dividedBy(swapAmount.gt(0) ? swapAmount : globalContants.BIG_NUMBER_1).toNumber())})</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>{formatAsset(feeDecimals, WEN)}</div>
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("youSend")}</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>{swapInput.toFixed(2)}&nbsp;{WEN.symbol}</div>
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("youReceive")}</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>{formatAsset(formatAssetAmount(receive, IOTX.decimals), IOTX)}</div>
				</div>
			</div>
		</div>

		<button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled={swapInput === 0 || sending}
			onClick={handleSwap}>
			<img src="images/swap-black.png" />

			{sending ? (t("sending") + "...") : (t("swapWen2Iotx"))}
		</button>
	</Modal> : <></>
};