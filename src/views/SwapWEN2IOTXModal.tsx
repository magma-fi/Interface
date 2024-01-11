/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { IOTX, WEN, globalContants } from "../libs/globalContants";
import { AmountInput } from "../components/AmountInput";
import { useState, useEffect } from "react";
import { Decimal, UserTrove } from "lib-base";
import TroveManagerAbi from "lib-ethers/abi/TroveManager.json";
import HintHelpersAbi from "lib-ethers/abi/HintHelpers.json";
import SortedTrovesAbi from "lib-ethers/abi/SortedTroves.json";
import { HintHelpers, SortedTroves, TroveManager } from "lib-ethers/dist/types";
import { SnackBar } from "../components/SnackBar";
import { useContract } from "../hooks/useContract";
import { useLiquity } from "../hooks/LiquityContext";
import { Address, useAccount, useWaitForTransaction } from "wagmi";

export const SwapWEN2IOTXModal = ({
	isOpen = false,
	onClose = () => { },
	onDone = () => { },
	max,
	price,
	trove
}: {
	isOpen: boolean;
	onClose: () => void;
	onDone: (tx: string, swapAmount: number) => void;
	max: Decimal;
	price: Decimal;
	trove: UserTrove;
}) => {
	const { t } = useLang();
	const { address } = useAccount();
	const { provider, liquity, walletClient } = useLiquity();
	const [valueForced, setValueForced] = useState(-1);
	const [swapAmount, setSwapAmount] = useState(0);
	const maxNumber = Number(max);
	const [fee, setFee] = useState(Decimal.ZERO);
	const redeemRate = price;
	const feeDecimals = fee.div(globalContants.IOTX_DECIMALS);
	const receive = Decimal.ONE.div(redeemRate).mul(swapAmount);
	const [sending, setSending] = useState(false);
	const [iotxAsUnit, setIOTXAsUnit] = useState(true);
	const [useMax, setUseMax] = useState(false);

	const [hintHelpersDefault, hintHelpersDefaultStatus] = useContract<HintHelpers>(
		liquity.connection.addresses.hintHelpers,
		HintHelpersAbi
	);

	const [troveManagerDefault, troveManagerDefaultStatus] = useContract<TroveManager>(
		liquity.connection.addresses.troveManager,
		TroveManagerAbi
	);

	const [sortedTrovesDefault, sortedTrovesDefaultStatus] = useContract<SortedTroves>(
		liquity.connection.addresses.sortedTroves,
		SortedTrovesAbi
	);

	const handleMax = () => {
		const val = maxNumber;
		setValueForced(val);
		setSwapAmount(val);
		setUseMax(true);
	};

	const handleInputSwap = (val: number) => {
		setValueForced(-1);
		setSwapAmount(val);
		setUseMax(false);
	};

	const handleCloseModal = () => {
		onClose();
	};

	useEffect(() => {
		const getData = async () => {
			if (troveManagerDefaultStatus === "LOADED" && troveManagerDefault) {
				const res = await troveManagerDefault.REDEMPTION_FEE_FLOOR();
				if (res) {
					setFee(Decimal.from(res.toString()));
				}
			}
		}

		getData();
	}, [troveManagerDefaultStatus, troveManagerDefault]);

	const listenHash = async (txHash: string) => {
		if (!txHash) return;

		const receipt = await provider.getTransactionReceipt(txHash);

		if (!receipt) {
			return setTimeout(() => {
				listenHash(txHash);
			}, 5000);
		}

		if (receipt.status === 1) {
			setSending(false);
			onDone(txHash, Number(receive.toString()));
		}
	};

	const handleSwap = async () => {
		setSending(true);

		const wenAmount = Decimal.from(useMax ? max : swapAmount).mul(globalContants.WEN_DECIMALS).toString();
		const { firstRedemptionHint, partialRedemptionHintNICR } = await hintHelpersDefault!.getRedemptionHints(wenAmount, price.mul(globalContants.IOTX_DECIMALS).toString(), 0);
		const { 0: upperPartialRedemptionHint, 1: lowerPartialRedemptionHint } = await sortedTrovesDefault!.findInsertPosition(
			partialRedemptionHintNICR,
			address!,
			address!
		)

		let txHash = "";
		try {
			txHash = await walletClient!.writeContract({
				account: address,
				address: liquity.connection.addresses.troveManager as Address,
				abi: TroveManagerAbi,
				functionName: 'redeemCollateral',
				args: [
					wenAmount,
					firstRedemptionHint,
					upperPartialRedemptionHint,
					lowerPartialRedemptionHint,
					partialRedemptionHintNICR,
					0,
					globalContants.WEN_DECIMALS.toFixed()
				]
			})
		} catch (error) {
			console.warn(error);
		}

		if (txHash) {
			return listenHash(txHash);
		} else {
			return setSending(false);
		}
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
						{t("max")}:&nbsp;{max.toString(2)}&nbsp;{WEN.symbol}
					</button>
				</div>

				<AmountInput
					coin={WEN}
					price={Decimal.ONE}
					allowSwap={false}
					valueForced={valueForced}
					onInput={handleInputSwap}
					max={maxNumber}
					warning={undefined}
					allowReduce={true}
					currentValue={-1}
					allowIncrease={true}
					error={undefined} />
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

							{(iotxAsUnit ? redeemRate : Decimal.ONE.div(redeemRate)).toString(2)}

							<span>&nbsp;</span>

							{iotxAsUnit ? WEN.symbol : IOTX.symbol}
						</div>
					</div>
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("conversionFee")}&nbsp;({feeDecimals.mul(100).toString(2)})%</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>{feeDecimals.mul(max).toString(2)}&nbsp;{WEN.symbol}</div>
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("youSend")}</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>{swapAmount.toFixed(2)}&nbsp;{WEN.symbol}</div>
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("youReceive")}</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>{receive.toString(2)}&nbsp;{IOTX.symbol}</div>
				</div>
			</div>
		</div>

		<button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled={
				swapAmount === 0
				|| !hintHelpersDefault
				|| hintHelpersDefaultStatus !== "LOADED"
				|| !troveManagerDefault
				|| troveManagerDefaultStatus !== "LOADED"
				|| !sortedTrovesDefault
				|| sortedTrovesDefaultStatus !== "LOADED"
				|| !address
				|| !walletClient
				|| sending
			}
			onClick={handleSwap}>
			<img src="images/swap-black.png" />

			{sending ? (t("sending") + "...") : (t("swapWen2Iotx"))}
		</button>
	</Modal> : <></>
};