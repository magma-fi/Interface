/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { ErrorMessage, ValidationContext } from "../libs/types";
import { useEffect, useMemo, useState } from "react";
import { Decimal, Trove } from "lib-base";
import { validateTroveChange } from "../components/Trove/validation/validateTroveChange";
import { Fees } from "lib-base/dist/src/Fees";
import { useStableTroveChange } from "../hooks/useStableTroveChange";
import { TroveAction } from "../components/Trove/TroveAction";
import { useMyTransactionState } from "../components/Transaction";
import { Contract, ContractInterface } from "@ethersproject/contracts";
import appConfig from "../appConfig.json";
import { loadABI } from "../utils";
import { useLiquity } from "../hooks/LiquityContext";
import { IOTX, WEN } from "../libs/globalContants";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther } from "viem";

export const CloseModal = ({
	isOpen = false,
	onClose = () => { },
	trove,
	fees,
	validationContext,
	chainId,
	balance
}: {
	isOpen: boolean;
	onClose: () => void;
	trove: Trove;
	fees: Fees;
	validationContext: ValidationContext;
	chainId: number;
	balance: Decimal;
}) => {
	const { t } = useLang();
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);
	const indexOfConfig: string = String(chainId);
	const publicClient = usePublicClient();
	const account = useAccount();

	const updatedTrove = new Trove(Decimal.ZERO, Decimal.ZERO);
	const borrowingRate = fees.borrowingRate();
	const [troveChange, description] = validateTroveChange(
		trove!,
		updatedTrove!,
		borrowingRate,
		validationContext
	);
	const stableTroveChange = useStableTroveChange(troveChange);
	const errorMessages = description as ErrorMessage;
	const needSwap = errorMessages?.key === "needMoreToClose";
	const wenDec = Math.pow(10, WEN.decimals || 18);
	const iotxDec = Math.pow(10, IOTX.decimals || 18);
	const howMuchWEN = errorMessages?.values?.amount ? Decimal.from(errorMessages.values!.amount).mul(wenDec) : Decimal.ZERO;
	const { provider, walletClient } = useLiquity();
	const [howMuchIOTX, setHowMuchIOTX] = useState(Decimal.ZERO);
	const howMuchIOTXDecimal = howMuchIOTX.div(iotxDec);
	const insufficientIOTX = howMuchIOTXDecimal.gt(balance);
	const theCfg = appConfig.swap[indexOfConfig];
	const address = theCfg?.liquidity?.address;
	const [swapping, setSwapping] = useState(false);
	// const [reloadTrigger, setReloadTrigger] = useState(false);

	useEffect(() => {
		if (!needSwap) return;

		const getContract = async () => {
			const abi = await loadABI(theCfg.liquidity.abi);
			let res: bigint[] = [];

			if (address && abi) {
				try {
					res = await publicClient.readContract({
						address,
						abi,
						functionName: 'getAmountsIn',
						args: [
							howMuchWEN.toString(),
							[appConfig.tokens.wrappedNativeCurrency[indexOfConfig].address, appConfig.tokens.wen[indexOfConfig].address]
						]
					}) as bigint[];
				} catch (error) {
					console.error(error);
				}

				if (res.length === 2) {
					setHowMuchIOTX(Decimal.from(res[0].toString()));
				}
			}
		};

		getContract();
	}, [needSwap]);

	const handleCloseModal = () => {
		onClose();
	};

	useEffect(() => {
		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onClose()
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	const listenHash = async (txHash: string) => {
		if (!txHash) return;

		const receipt = await provider.getTransactionReceipt(txHash);
		if (!receipt) {
			return setTimeout(() => {
				listenHash(txHash);
			}, 5000);
		}

		if (receipt.status === 1) {
			setSwapping(false);
			// setReloadTrigger(!reloadTrigger);
		}
	};

	const handleSwap = async () => {
		if (!publicClient) return;

		const abi = await loadABI(theCfg.liquidity.abi);

		if (abi) {
			const txHash = await walletClient.writeContract({
				account: account.address,
				address,
				abi,
				functionName: 'swapETHForExactTokens',
				args: [
					howMuchWEN.toString(),
					[appConfig.tokens.wrappedNativeCurrency[indexOfConfig].address, appConfig.tokens.wen[indexOfConfig].address],
					"0x09E50c45790BE9020e7d22FE6FdC61c5f980c191",
					Math.floor(new Date().getTime() / 1000 + 15)
				],
				value: parseEther(howMuchIOTX.mul(1.02).div(iotxDec).toString()),
			})

			setSwapping(true);

			return listenHash(txHash);
		}
	};

	return isOpen ? <Modal
		title={t("closeVault")}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{ gap: "24px" }}>
			<div>{description && errorMessages && t(errorMessages.key, errorMessages.values)}</div>

			{needSwap && <div className="flex-row-align-left">
				<div className="label">
					{t("swapIotx2Wen", {
						iotxAmount: howMuchIOTXDecimal.toString(2),
						wenAmount: howMuchWEN.div(wenDec).toString(2)
					})}
				</div>

				<button
					className="textButton smallTextButton"
					style={{ textTransform: "none" }}
					onClick={handleSwap}
					disabled={insufficientIOTX || swapping}>
					{swapping ? t("swapping") + "..." : t("swap")}

					{insufficientIOTX && "(" + t("balance") + ":&nbsp;" + balance.toString(2) + ")"}
				</button>
			</div>}
		</div>

		{stableTroveChange && !transactionState.id && transactionState.type === "idle" ? <TroveAction
			transactionId={txId}
			change={stableTroveChange}
			maxBorrowingRate={borrowingRate.add(0.005)}
			borrowingFeeDecayToleranceMinutes={60}>
			<button
				className="primaryButton bigButton"
				style={{ width: "100%" }}>
				<img src="images/repay-dark.png" />

				{t("closeVault")}
			</button>
		</TroveAction> : <button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled>
			<img src="images/repay-dark.png" />

			{transactionState.type !== "confirmed" && transactionState.type !== "confirmedOneShot" && transactionState.type !== "idle" ? (t("closing") + "...") : t("closeVault")}
		</button>}
	</Modal> : <></>
};