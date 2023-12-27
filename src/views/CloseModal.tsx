/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { ErrorMessage, ValidationContext } from "../libs/types";
import React, { useEffect, useMemo, useState } from "react";
import { Decimal, Trove } from "lib-base";
import { validateTroveChange } from "../components/Trove/validation/validateTroveChange";
import { Fees } from "lib-base/dist/src/Fees";
import { useStableTroveChange } from "../hooks/useStableTroveChange";
import { TroveAction } from "../components/Trove/TroveAction";
import { useMyTransactionState } from "../components/Transaction";
import appConfig from "../appConfig.json";
import { loadABI } from "../utils";
import { useLiquity } from "../hooks/LiquityContext";
import { IOTX, WEN, globalContants } from "../libs/globalContants";
import { erc20ABI, useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther } from "viem";

export const CloseModal = ({
	isOpen = false,
	onClose = () => { },
	trove,
	fees,
	validationContext,
	chainId,
	balance,
	price
}: {
	isOpen: boolean;
	onClose: () => void;
	trove: Trove;
	fees: Fees;
	validationContext: ValidationContext;
	chainId: number;
	balance: Decimal;
	price: Decimal;
}) => {
	const { t } = useLang();
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);
	const indexOfConfig: string = String(chainId);
	const publicClient = usePublicClient();
	const account = useAccount();
	const [agree, setAgree] = useState(false);

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
	const theCfg = appConfig.swap[indexOfConfig];
	const address = theCfg?.liquidity?.address;
	const [swapping, setSwapping] = useState(false);

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

	const swap = async () => {
		const txHash = await walletClient.writeContract({
			account: account.address,
			address: appConfig.swap[indexOfConfig].swapAndCloseTool.address,
			abi: appConfig.swap[indexOfConfig].swapAndCloseTool.abi,
			functionName: 'swapAndCloseTrove',
			args: [],
			value: parseEther(howMuchIOTX.mul(1.02).div(iotxDec).toString())
		})

		return listenHash(txHash, false);
	};

	const listenHash = async (txHash: string, approve = true) => {
		if (!txHash) return;

		const receipt = await provider.getTransactionReceipt(txHash);

		if (!receipt) {
			return setTimeout(() => {
				listenHash(txHash, approve);
			}, 5000);
		}

		if (receipt.status === 1) {
			if (approve) {
				await swap();
			} else {
				setSwapping(false);
				onClose();
			}
		}
	};

	const handeTermChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
		setAgree(evt.target.checked);
	};

	const handleSwap = async () => {
		if (!publicClient) return;

		const txHash = await walletClient.writeContract({
			account: account.address,
			address: appConfig.tokens.wen[indexOfConfig].address,
			abi: erc20ABI,
			functionName: 'approve',
			args: [
				appConfig.swap[indexOfConfig].swapAndCloseTool.address,
				parseEther(trove.netDebt.toString())
			],
		})

		setSwapping(true);

		return listenHash(txHash);
	};

	return isOpen ? <Modal
		title={t("closeVault")}
		onClose={handleCloseModal}>
		<div
			className="depositModal flex-column"
			style={{
				gap: "24px",
				flexDirection: "column"
			}}>
			<div>{description && errorMessages && t(errorMessages.key, errorMessages.values)}</div>

			{needSwap && <div className="flex-column-align-left">
				<div>
					{t("swapIotx2Wen", {
						iotxAmount: howMuchIOTXDecimal.toString(2),
						wenAmount: howMuchWEN.div(wenDec).toString(2)
					})}
				</div>

				<div className="label small">
					{IOTX.symbol + " " + t("price") + ": " + price.toString(2) + " " + globalContants.USD}
				</div>

				<div className="label small">
					{IOTX.symbol + " " + t("balance") + ": " + balance.toString(2)}
				</div>

				<div style={{
					width: "100%"
				}}>
					<label
						className="label small"
						htmlFor="term"
						style={{ whiteSpace: "normal" }}>
						{t("knowSlippage")}&nbsp;
					</label>

					<input
						id="term"
						type="checkbox"
						style={{ display: "inline-box" }}
						onChange={handeTermChange} />
				</div>
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
		</TroveAction> : (agree && !swapping ? <button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			onClick={handleSwap}>
			<img src="images/repay-dark.png" />
			{t("closeVault")}
		</button> : <button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled>
			<img src="images/repay-dark.png" />

			{(transactionState.type !== "confirmed" && transactionState.type !== "confirmedOneShot" && transactionState.type !== "idle" || swapping) ? (t("closing") + "...") : t("closeVault")}
		</button>)}
	</Modal> : <></>
};