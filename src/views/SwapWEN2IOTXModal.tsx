/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { ErrorMessage, ValidationContextForStabilityPool } from "../libs/types";
import { IOTX, WEN, globalContants } from "../libs/globalContants";
import { AmountInput } from "../components/AmountInput";
import { useState, useEffect, useMemo } from "react";
import { Decimal, StabilityDeposit, UserTrove } from "lib-base";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { useMyTransactionState } from "../components/Transaction";
import TroveManagerAbi from "lib-ethers/abi/TroveManager.json";
import HintHelpersAbi from "lib-ethers/abi/HintHelpers.json";
import SortedTrovesAbi from "lib-ethers/abi/SortedTroves.json";
import { HintHelpers, SortedTroves, TroveManager } from "lib-ethers/dist/types";
import { validateStabilityDepositChange } from "../components/Stability/validation/validateStabilityDepositChange";
import { StabilityDepositAction } from "../components/Stability/StabilityDepositAction";
import { SnackBar } from "../components/SnackBar";
import { useContract } from "../hooks/useContract";
import { useLiquity } from "../hooks/LiquityContext";
import { Address, useAccount } from "wagmi";

export const SwapWEN2IOTXModal = ({
	isOpen = false,
	onClose = () => { },
	accountBalance = Decimal.ZERO,
	onDone = () => { },
	stabilityDeposit,
	validationContext,
	lusdInStabilityPool,
	max,
	price,
	trove
}: {
	isOpen: boolean;
	onClose: () => void;
	accountBalance: Decimal;
	onDone: (tx: string, swapAmount: number) => void;
	stabilityDeposit: StabilityDeposit;
	validationContext: ValidationContextForStabilityPool;
	lusdInStabilityPool: Decimal;
	max: Decimal;
	price: Decimal;
	trove: UserTrove;
}) => {
	const { t } = useLang();
	const { address } = useAccount();
	const { provider, liquity, walletClient } = useLiquity();
	const [valueForced, setValueForced] = useState(-1);
	const [swapAmount, setSwapAmount] = useState(0);
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);
	const maxNumber = Number(max);
	const [fee, setFee] = useState(Decimal.ZERO);
	const redeemRate = trove.collateral.gt(0) ? trove.debt.div(trove.collateral) : Decimal.ZERO;
	const feeDecimals = fee.div(globalContants.IOTX_DECIMALS);
	const receive = Decimal.ONE.div(redeemRate).mul(swapAmount);
	const [sending, setSending] = useState(false);

	const [validChange, description] = validateStabilityDepositChange(
		stabilityDeposit,
		stabilityDeposit.currentLUSD.add(swapAmount),
		validationContext
	);

	const [errorMessages, setErrorMessages] = useState<ErrorMessage | undefined>(description as ErrorMessage);

	const [hintHelpersDefault, hintHelpersDefaultStatus] = useContract<HintHelpers>(
		liquity.connection.addresses.hintHelpers,
		HintHelpersAbi
	);

	// DECIMAL_PRECISION()
	// REDEMPTION_FEE_FLOOR()
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
		setErrorMessages(undefined);
	};

	const handleInputSwap = (val: number) => {
		setValueForced(-1);
		setSwapAmount(val);
		setErrorMessages(undefined);
	};

	const handleCloseModal = () => {
		setErrorMessages(undefined);
		onClose();
	};

	useEffect(() => {
		if (transactionState.type === "failed" || transactionState.type === "cancelled") {
			setErrorMessages({ string: transactionState.error.message || JSON.stringify(transactionState.error).substring(0, 100) } as ErrorMessage);
		}

		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onDone(transactionState.tx.rawSentTransaction as unknown as string, swapAmount);
			transactionState.resolved = true;
		}
	}, [transactionState.type])

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
		if (!hintHelpersDefault || !troveManagerDefault || !sortedTrovesDefault || !address || !walletClient) return;

		const wenAmount = Decimal.from(swapAmount).mul(globalContants.WEN_DECIMALS).toString();
		const { firstRedemptionHint, partialRedemptionHintNICR } = await hintHelpersDefault.getRedemptionHints(wenAmount, price.mul(globalContants.IOTX_DECIMALS).toString(), 0);
		const { 0: upperPartialRedemptionHint, 1: lowerPartialRedemptionHint } = await sortedTrovesDefault.findInsertPosition(
			partialRedemptionHintNICR,
			address,
			address
		)
		const txHash = await walletClient.writeContract({
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
				feeDecimals.mul(wenAmount).toString()
			]
		})

		if (txHash) {
			setSending(true);
			return listenHash(txHash);
		}
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
					error={errorMessages && (errorMessages.string || t(errorMessages.key!, errorMessages.values))}
					allowReduce={true}
					currentValue={-1}
					allowIncrease={true} />
			</div>

			<div
				className="subCard"
				style={{ minWidth: "fit-content" }}>
				<div className="flex-row-space-between">
					<div className="label">{t("currentRate")}</div>

					<div
						className="label"
						style={{ color: "#F6F6F7" }}>1&nbsp;IOTX&nbsp;=&nbsp;{redeemRate.toString(2)}&nbsp;{WEN.symbol}</div>
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
				|| !troveManagerDefault
				|| !sortedTrovesDefault
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