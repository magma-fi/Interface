import React, { useEffect, useMemo, useState } from "react";
import { useLang } from "../hooks/useLang";
import { ModalAction, WEN, globalContants } from "../libs/globalContants";
import { Coin } from "../libs/types";
import { LiquityStoreState } from "lib-base/dist/src/LiquityStore";
import { selectForTroveChangeValidation } from "../components/Trove/validation/validateTroveChange";
import { useLiquitySelector } from "@liquity/lib-react";
import { StakeModal } from "./StakeModal";
import { selectForStabilityDepositChangeValidation } from "../components/Stability/validation/validateStabilityDepositChange";
import { TxDone } from "../components/TxDone";
import { TxLabel } from "../components/TxLabel";
import { UnstakeModal } from "./UnstakeModal";
import { ChangedValueLabel } from "../components/ChangedValueLabel";
import { useContract } from "../hooks/useContract";
import { HintHelpers, LUSDToken, SortedTroves, TroveManager } from "lib-ethers/dist/types";
import { useLiquity } from "../hooks/LiquityContext";
import LUSDTokenAbi from "lib-ethers/abi/LUSDToken.json";
import TroveManagerAbi from "lib-ethers/abi/TroveManager.json";
import HintHelpersAbi from "lib-ethers/abi/HintHelpers.json";
import SortedTrovesAbi from "lib-ethers/abi/SortedTroves.json";
import { BigNumber } from "@ethersproject/bignumber";
import { Decimal } from "lib-base"
import { useAccount } from "wagmi";

type ModalOpenning = {
	action: ModalAction;
	isShow: boolean;
}

export const PoolView = ({ market }: {
	market: Coin;
}) => {
	const { t } = useLang();

	const selector = useMemo(() => {
		return (state: LiquityStoreState) => {
			const {
				lusdBalance,
				stabilityDeposit,
				lusdInStabilityPool,
				numberOfTroves,
				price
			} = state;

			return {
				lusdBalance,
				stabilityDeposit,
				lusdInStabilityPool,
				numberOfTroves,
				price,
				validationContext: selectForStabilityDepositChangeValidation(state)
			};
		};
	}, []);

	const {
		lusdBalance,
		stabilityDeposit,
		lusdInStabilityPool,
		numberOfTroves,
		price,
		validationContext
	} = useLiquitySelector(selector);

	const [showModal, setShowModal] = useState<ModalOpenning | null>(null);
	const [showTxResult, setTxResult] = useState<ModalOpenning | null>(null);
	const [amountInTx, setAmountInTx] = useState(0);
	const [txHash, setTxHash] = useState("");
	const { liquity } = useLiquity();
	const [wenTotalSupply, setWENTotalSupply] = useState(Decimal.ZERO)
	// const { address } = useAccount();

	const [lusdTokenDefault, lusdTokenDefaultStatus] = useContract<LUSDToken>(
		liquity.connection.addresses.lusdToken,
		LUSDTokenAbi
	);

	const [hintHelpersDefault, hintHelpersDefaultStatus] = useContract<HintHelpers>(
		liquity.connection.addresses.hintHelpers,
		HintHelpersAbi
	);

	const [troveManagerDefault, troveManagerDefaultStatus] = useContract<TroveManager>(
		liquity.connection.addresses.troveManager,
		TroveManagerAbi
	);

	// const [sortedTrovesDefault, sortedTrovesDefaultStatus] = useContract<SortedTroves>(
	// 	liquity.connection.addresses.sortedTroves,
	// 	SortedTrovesAbi
	// );

	// const handleRedeemCollateral = async () => {
	// 	if (!hintHelpersDefault || !troveManagerDefault || !sortedTrovesDefault || !address) return;

	// 	// const wenAmount = stabilityDeposit.currentLUSD.toString();
	// 	// const { firstRedemptionHint, partialRedemptionHintNICR } = await hintHelpersDefault.getRedemptionHints(wenAmount, price.toString(), 0);
	// 	// const { 0: upperPartialRedemptionHint, 1: lowerPartialRedemptionHint } = await sortedTrovesDefault.findInsertPosition(
	// 	// 	partialRedemptionHintNICR,
	// 	// 	address,
	// 	// 	address
	// 	// )
	// 	// const redemptionTx = await troveManagerDefault.redeemCollateral(
	// 	// 	wenAmount,
	// 	// 	firstRedemptionHint,
	// 	// 	upperPartialRedemptionHint,
	// 	// 	lowerPartialRedemptionHint,
	// 	// 	partialRedemptionHintNICR,
	// 	// 	0,
	// 	// 	"1000000000000000000"
	// 	// )
	// 	// liquity.populate.redeemLUSD()
	// };

	useEffect(() => {
		const read = async () => {
			if (lusdTokenDefault && lusdTokenDefaultStatus === "LOADED") {
				const res = await lusdTokenDefault.totalSupply();
				setWENTotalSupply(Decimal.from(res.toString()).div(Math.pow(10, WEN.decimals ?? 0)));
			}
		};

		read();
	}, [lusdTokenDefault, lusdTokenDefaultStatus]);

	const handleShowModal = (evt: React.MouseEvent<HTMLButtonElement>) => {
		setShowModal({
			action: evt.currentTarget.id as ModalAction,
			isShow: true
		} as ModalOpenning)
	};

	const handleCloseModal = () => {
		setShowModal(null);
	};

	const handleCloseTxResult = () => {
		setTxResult(null);
	};

	const handleModalDone = (tx: string, arg: number) => {
		setTxHash(tx);
		setAmountInTx(arg);

		setTxResult({
			action: showModal?.action,
			isShow: true
		} as ModalOpenning);

		handleCloseModal();
	};

	if (market?.symbol === "DAI" || market?.symbol === "USDC") {
		return <div className="marketView">
			<h2>Coming soon...</h2>
		</div>
	}

	const handleUnstake = () => {
		setShowModal({
			action: ModalAction.Unstake,
			isShow: true
		} as ModalOpenning)
	};

	return <>
		<div
			className="two-columns-grid"
			style={{
				width: "100%",
				gap: "40px"
			}}>
			<div
				className="flex-column"
				style={{ gap: "24px" }}>
				<div
					className="flex-column"
					style={{
						alignItems: "center",
						gap: "1rem"
					}}>
					<div className="flex-column">
						<button
							id={ModalAction.Stake}
							className="primaryButton"
							onClick={handleShowModal}>
							<img src="images/stake-dark.png" />

							{t("stake")}
						</button>

						<button
							disabled={
								!hintHelpersDefault
								|| hintHelpersDefaultStatus !== "LOADED"
								|| !troveManagerDefault
								|| troveManagerDefaultStatus !== "LOADED"
							}
							// onClick={handleRedeemCollateral}
							className="secondaryButton">
							<img src="images/swap-orange.png" />

							{t("swapWen2Iotx")}
						</button>
					</div>

					<div className="label">{t("walletBalance") + " " + lusdBalance.toString(2) + " " + WEN.symbol}</div>
				</div>

				<div className="panel">
					<div className="flex-column">
						<div className="flex-row-space-between">
							<h4 className="fat">{t("staked")}</h4>

							<div>
								<span className="label">{t("shareOfPool")}&nbsp;&nbsp;</span>

								<span>{stabilityDeposit.currentLUSD.mulDiv(100, lusdInStabilityPool).toString(4) + "%"}</span>
							</div>
						</div>

						<div
							className="flex-row-space-between"
							style={{ alignItems: "center" }}>
							<div className="flex-row-align-left">
								<img
									src={WEN.logo}
									width="40px" />

								<div className="flex-column-align-left">
									<div>{stabilityDeposit.currentLUSD.toString(2)}&nbsp;{globalContants.USD}</div>

									<div className="label labelSmall">{stabilityDeposit.currentLUSD.toString(2)}&nbsp;{WEN.symbol}</div>
								</div>
							</div>

							<button
								className="secondaryButton"
								onClick={handleUnstake}>
								{t("unstake")}
							</button>
						</div>
					</div>
				</div>
			</div>

			<div>
				<div
					className="panel"
					style={{ gap: "12px" }}>
					<div className="flex-row-space-between">
						<div className="label">{t("totalValueLocked")}</div>

						<div>{lusdInStabilityPool.toString(2) + " " + WEN.symbol}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("wenTotalSupply")}</div>

						<div>{wenTotalSupply.toString(2) + " " + WEN.symbol}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("totalUtilizationRate")}</div>

						<div style={{ color: "#F25454" }}>{lusdInStabilityPool.div(wenTotalSupply).mul(100).toString(2) + "%"}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="label">{t("numberOfVaults")}</div>

						<div>{numberOfTroves}</div>
					</div>
				</div>
			</div>
		</div>

		{showModal?.action === ModalAction.Stake && showModal.isShow && <StakeModal
			isOpen={showModal.isShow}
			onClose={handleCloseModal}
			accountBalance={lusdBalance}
			onDone={handleModalDone}
			stabilityDeposit={stabilityDeposit}
			validationContext={validationContext}
			lusdInStabilityPool={lusdInStabilityPool} />}

		{showTxResult?.action === ModalAction.Stake && showTxResult.isShow && <TxDone
			title={t("stakedSuccessfully")}
			onClose={handleCloseTxResult}
			illustration="images/stake-successful.png"
			whereGoBack={t("back2StabilityPool")}>
			<TxLabel
				txHash={txHash}
				title={t("stakedAmount")}
				logo={WEN.logo}
				amount={amountInTx + " " + WEN.symbol} />
		</TxDone>}

		{showModal?.action === ModalAction.Unstake && showModal.isShow && <UnstakeModal
			isOpen={showModal.isShow}
			onClose={handleCloseModal}
			accountBalance={lusdBalance}
			onDone={handleModalDone}
			stabilityDeposit={stabilityDeposit}
			validationContext={validationContext}
			lusdInStabilityPool={lusdInStabilityPool} />}

		{showTxResult?.action === ModalAction.Unstake && showTxResult.isShow && <TxDone
			title={t("unstakedSuccessfully")}
			onClose={handleCloseTxResult}
			illustration="images/unstake-successful.png"
			whereGoBack={t("back2StabilityPool")}>
			<TxLabel
				txHash={txHash}
				title={t("unstakedAmount")}
				logo={WEN.logo}
				amount={amountInTx + " " + WEN.symbol} />
		</TxDone>}
	</>
};