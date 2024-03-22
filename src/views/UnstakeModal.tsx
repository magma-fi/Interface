/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { ErrorMessage, StabilityDeposit } from "../libs/types";
import { WEN, globalContants } from "../libs/globalContants";
import { AmountInput } from "../components/AmountInput";
import React, { useState } from "react";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { TxLabel } from "../components/TxLabel";
import { formatAsset, formatAssetAmount } from "../utils";
import BigNumber from "bignumber.js";
import { magma } from "../libs/magma";

let amountUnstaked = 0;

export const UnstakeModal = ({
	isOpen = false,
	onClose = () => { },
	wenBalance = globalContants.BIG_NUMBER_0,
	onDone = () => { },
	stabilityDeposit,
	lusdInStabilityPool
}: {
	isOpen: boolean;
	onClose: () => void;
	wenBalance: BigNumber;
	onDone: (tx: string, unstakeInput: number) => void;
	stabilityDeposit: StabilityDeposit;
	lusdInStabilityPool: BigNumber;
}) => {
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(-1);
	const [unstakeInput, setUnstakeInput] = useState(0);
	const unstakeAmount = BigNumber(unstakeInput).shiftedBy(WEN.decimals);
	const stakedDecimals = formatAssetAmount(stabilityDeposit.currentLUSD, WEN.decimals);
	const [errorMessages, setErrorMessages] = useState<ErrorMessage>();
	const [sending, setSending] = useState(false);

	const handleMax = () => {
		const val = stakedDecimals;
		setValueForced(val);
		setUnstakeInput(val);
		amountUnstaked = val;
		setErrorMessages(undefined);
	};

	const handleInputUnstake = (val: number) => {
		setValueForced(-1);
		setUnstakeInput(val);
		amountUnstaked = val;
		setErrorMessages(undefined);
	};

	const handleCloseModal = () => {
		setErrorMessages(undefined);
		onClose();
	};

	const handleUnstake = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		setSending(true);

		magma.unstake(
			unstakeAmount,
			undefined,
			error => setErrorMessages({ string: error.message } as ErrorMessage),
			tx => {
				setSending(false);
				return onDone && onDone(tx, amountUnstaked);
			}
		);
	};

	return isOpen ? <Modal
		title={t("unstake") + " " + WEN.symbol}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{
				gap: "1rem",
				maxWidth: "372px"
			}}>

			<TxLabel
				title={t("currentlyStaked")}
				logo="images/stake-orange.png"
				amount={formatAsset(stakedDecimals, WEN)} />

			<div className="flex-column-align-left">
				<div
					className="flex-row-space-between"
					style={{ alignItems: "center" }}>
					<div className="label fat">{t("unstakeInput")}</div>

					<button
						className="textButton smallTextButton"
						onClick={handleMax}>
						{t("max")}:&nbsp;{formatAsset(stakedDecimals, WEN)}
					</button>
				</div>

				<AmountInput
					coin={WEN}
					price={1}
					allowSwap={false}
					valueForced={valueForced}
					onInput={handleInputUnstake}
					max={Number(wenBalance.toString())}
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
					<div className="label">{t("staked")}</div>

					<ChangedValueLabel
						previousValue={stakedDecimals}
						newValue={formatAssetAmount(stabilityDeposit.currentLUSD.minus(unstakeAmount), WEN.decimals)}
						nextPostfix={WEN.symbol}
						positive={unstakeInput == 0} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("walletBalance")}</div>

					<ChangedValueLabel
						previousValue={formatAssetAmount(wenBalance, WEN.decimals)}
						newValue={formatAssetAmount(wenBalance.plus(unstakeAmount), WEN.decimals)}
						nextPostfix={WEN.symbol}
						positive={unstakeInput > 0} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("shareOfStabilityPool")}</div>

					<ChangedValueLabel
						previousValue={stabilityDeposit.currentLUSD.dividedBy(lusdInStabilityPool).toNumber() * 100}
						previousPostfix="%"
						newValue={stabilityDeposit.currentLUSD.minus(unstakeAmount).dividedBy(lusdInStabilityPool.plus(unstakeAmount)).toNumber() * 100}
						nextPostfix="%"
						positive={unstakeInput === 0} />
				</div>
			</div>
		</div>

		<button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled={unstakeInput === 0 || sending}
			onClick={handleUnstake}>
			{(sending ? (t("unstakeing") + "...") : t("unstake")) + " " + WEN.symbol}
		</button>
	</Modal> : <></>
};