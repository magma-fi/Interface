import React, { useMemo, useState } from "react";
import { useLang } from "../hooks/useLang";
import { ModalAction, WEN } from "../libs/globalContants";
import { Coin } from "../libs/types";
import { LiquityStoreState } from "lib-base/dist/src/LiquityStore";
import { selectForTroveChangeValidation } from "../components/Trove/validation/validateTroveChange";
import { useLiquitySelector } from "@liquity/lib-react";
import { StakeModal } from "./StakeModal";
import { selectForStabilityDepositChangeValidation } from "../components/Stability/validation/validateStabilityDepositChange";
import { TxDone } from "../components/TxDone";
import { TxLabel } from "../components/TxLabel";

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
				lusdInStabilityPool
			} = state;

			return {
				lusdBalance,
				stabilityDeposit,
				lusdInStabilityPool,
				validationContext: selectForStabilityDepositChangeValidation(state)
			};
		};
	}, []);

	const {
		lusdBalance,
		stabilityDeposit,
		lusdInStabilityPool,
		validationContext
	} = useLiquitySelector(selector);

	const [showModal, setShowModal] = useState<ModalOpenning | null>(null);
	const [showTxResult, setTxResult] = useState<ModalOpenning | null>(null);
	const [amountInTx, setAmountInTx] = useState(0);
	const [txHash, setTxHash] = useState("");

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
		if (showModal) {
			switch (showModal.action) {
				case ModalAction.Stake:
					handleCloseModal();

					setTxHash(tx);
					setAmountInTx(arg);
					setTxResult({
						action: ModalAction.Stake,
						isShow: true
					} as ModalOpenning);
					break;

				default:
					handleCloseModal();
					break;
			}
		}
	};

	if (market?.symbol === "DAI" || market?.symbol === "USDC") {
		return <div className="marketView">
			<h2>Coming soon...</h2>
		</div>
	}

	return <>
		<div className="marketView">
			<div>
				<div
					className="flex-column"
					style={{ alignItems: "center" }}>
					<div className="flex-column">
						<button
							id={ModalAction.Stake}
							className="primaryButton"
							onClick={handleShowModal}>
							<img src="images/stake-dark.png" />

							{t("stake")}
						</button>

						<button className="secondaryButton">
							<img src="images/swap-orange.png" />

							{t("swapWen2Iotx")}
						</button>
					</div>

					<div className="label">{t("walletBalance") + " " + lusdBalance.toString(2) + " " + WEN.symbol}</div>
				</div>
			</div>

			<div>
				Coming soon...
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
	</>
};