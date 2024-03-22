/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { ErrorMessage, StabilityDeposit } from "../libs/types";
import { WEN, globalContants } from "../libs/globalContants";
import { AmountInput } from "../components/AmountInput";
import { useState } from "react";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { TxLabel } from "../components/TxLabel";
import BigNumber from "bignumber.js";
import { formatAsset, formatAssetAmount } from "../utils";
import { magma } from "../libs/magma";
import { useLiquity } from "../hooks/LiquityContext";

let amountStaked = 0;

export const StakeModal = ({
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
	onDone: (tx: string, depositInput: number) => void;
	stabilityDeposit: StabilityDeposit;
	lusdInStabilityPool: BigNumber;
}) => {
	const { frontendTag } = useLiquity();
	const { t } = useLang();
	const [valueForced, setValueForced] = useState(-1);
	const [depositInput, setDepositInput] = useState(0);
	const depositAmount = BigNumber(depositInput).shiftedBy(WEN.decimals);
	const wenBalanceDecimals = formatAssetAmount(wenBalance, WEN.decimals);
	const stakedDecimals = formatAssetAmount(stabilityDeposit.currentLUSD, WEN.decimals);
	const [sending, setSending] = useState(false);
	const [errorMessages, setErrorMessages] = useState<ErrorMessage>();

	const handleMax = () => {
		const val = wenBalanceDecimals;
		setValueForced(val);
		setDepositInput(val);
		setErrorMessages(undefined);

		amountStaked = val;
	};

	const handleInputDeposit = (val: number) => {
		setValueForced(-1);
		setDepositInput(val);
		setErrorMessages(undefined);

		amountStaked = val;
	};

	const handleCloseModal = () => {
		setErrorMessages(undefined);
		onClose();
	};

	const handleStake = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		setSending(true);

		magma.stake(
			depositAmount,
			frontendTag,
			undefined,
			error => setErrorMessages({ string: error.message } as ErrorMessage),
			tx => {
				setSending(false);
				return onDone && onDone(tx, amountStaked);
			}
		);
	};

	return isOpen ? <Modal
		title={t("stake") + " " + WEN.symbol}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{
				gap: "1rem",
				maxWidth: "372px"
			}}>
			<div className="description">{t("withdrawAnytime")}</div>

			<TxLabel
				title={t("currentInterest") + " (APY)"}
				logo="images/chart.png"
				amount={"0"} />

			<div className="flex-column-align-left">
				<div
					className="flex-row-space-between"
					style={{ alignItems: "center" }}>
					<div className="label fat">{t("stakeAmount")}</div>

					<button
						className="textButton smallTextButton"
						onClick={handleMax}>
						{t("max")}:&nbsp;{formatAsset(wenBalanceDecimals, WEN)}
					</button>
				</div>

				<AmountInput
					coin={WEN}
					price={1}
					allowSwap={false}
					valueForced={valueForced}
					onInput={handleInputDeposit}
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
						newValue={stakedDecimals + depositInput}
						nextPostfix={WEN.symbol}
						positive={depositInput > 0} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("walletBalance")}</div>

					<ChangedValueLabel
						previousValue={wenBalanceDecimals}
						newValue={wenBalanceDecimals - depositInput}
						nextPostfix={WEN.symbol}
						positive={depositInput > 0} />
				</div>

				<div className="flex-row-space-between">
					<div className="label">{t("shareOfStabilityPool")}</div>

					<ChangedValueLabel
						previousValue={stabilityDeposit.currentLUSD.dividedBy(lusdInStabilityPool).toNumber() * 100}
						previousPostfix="%"
						newValue={stabilityDeposit.currentLUSD.plus(depositAmount).dividedBy(lusdInStabilityPool.plus(depositAmount)).toNumber() * 100}
						nextPostfix="%"
						positive={depositInput > 0} />
				</div>
			</div>
		</div>

		<button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled={depositInput === 0 || sending}
			onClick={handleStake}>
			<img src="images/stake-dark.png" />

			{(sending ? (t("staking") + "...") : t("stake")) + " " + WEN.symbol}
		</button>
	</Modal> : <></>
};