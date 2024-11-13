/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";
import { useLang } from "../hooks/useLang";
import { Coin, ErrorMessage, JsonObject, VaultStatusWithinMagma } from "../libs/types";
import React, { useEffect, useState } from "react";
import appConfig from "../appConfig.json";
import { formatAssetAmount, formatCurrency, loadABI } from "../utils";
import { useLiquity } from "../hooks/LiquityContext";
import { IOTX, WEN, globalContants } from "../libs/globalContants";
import { erc20ABI } from "wagmi";
import swapAndCloseTool from "../abis/swapAndCloseTool.json";
import { Vault } from "../libs/Vault";
import BigNumber from "bignumber.js";
import { DappContract } from "../libs/DappContract";
import { magma } from "../libs/magma";

export const CloseModal = ({
	isOpen = false,
	onClose = () => { },
	vault,
	chainId,
	balance,
	price,
	wenBalance,
	market
}: {
	isOpen: boolean;
	onClose: () => void;
	vault: Vault;
	chainId: number;
	balance: BigNumber;
	price: number;
	wenBalance: BigNumber;
	market: Coin;
}) => {
	const { account, signer } = useLiquity();
	const { t } = useLang();
	const indexOfConfig = String(chainId);
	const [agree, setAgree] = useState(false);
	const [errorMessages, setErrorMessages] = useState<ErrorMessage>();
	const needSwap = false; // vault.netDebt.gt(wenBalance);
	const howMuchWEN = needSwap ? vault.netDebt.minus(wenBalance) : globalContants.BIG_NUMBER_0; // errorMessages?.values?.amount ? Decimal.from(errorMessages.values!.amount).mul(wenDec) : Decimal.ZERO;
	const [howMuchIOTX, setHowMuchIOTX] = useState(globalContants.BIG_NUMBER_0);
	const howMuchIOTXDecimal = formatAssetAmount(howMuchIOTX, market.decimals);
	const theSwapCfg = (appConfig.swap as JsonObject)[indexOfConfig];
	const theMagmaCfg = (appConfig.magma as JsonObject)[indexOfConfig];
	const address = theSwapCfg?.liquidity?.address;
	const [swapping, setSwapping] = useState(false);
	const [sending, setSending] = useState(false);

	useEffect(() => {
		if (!needSwap) return;

		const getContract = async () => {
			const abi = await loadABI(theSwapCfg.liquidity.abi);
			if (address && abi) {
				const theContract = new DappContract(address, abi, signer);

				try {
					const res = await theContract.dappFunctions.getAmountsIn.call(
						howMuchWEN.toFixed(),
						[
							(appConfig.tokens.wrappedNativeCurrency as JsonObject)[indexOfConfig].address,
							theMagmaCfg.lusdToken
						]
					);

					if (res) {
						setHowMuchIOTX(BigNumber(res[0]._hex));
					}
				} catch (error) {
					console.error(error);
				}
			}
		};

		getContract();
	}, [needSwap]);

	const handleCloseModal = () => {
		onClose();
	};

	const swap = async () => {
		const theContract = new DappContract(theSwapCfg.swapAndCloseTool.address, swapAndCloseTool, signer);
		theContract.dappFunctions.swapAndCloseTrove.run(
			undefined,
			error => {
				setErrorMessages({ string: error.message } as ErrorMessage);
			},
			tx => {
				setSwapping(false);
				return onClose();
			},
			{
				from: account,
				value: howMuchIOTX.multipliedBy(1.02).toFixed(0)
			}
		);
	};

	const handeTermChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
		setAgree(evt.target.checked);
	};

	const handleSwap = async () => {
		// if (!publicClient) return;
		setSwapping(true);

		const theContract = new DappContract(theMagmaCfg.lusdToken, erc20ABI, signer);
		theContract.dappFunctions.approve.run(
			undefined,
			error => {
				setErrorMessages({ string: error.message } as ErrorMessage);
			},
			tx => {
				return swap();
			},
			{ from: account },
			theSwapCfg.swapAndCloseTool.address,
			vault.netDebt.toFixed()
		);
	};

	const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		setSending(true);

		if (vault.status === VaultStatusWithinMagma.limitedByRedemption) {
			vault.claimCollateral(
				undefined,
				error => {
					setErrorMessages({ string: error.message } as ErrorMessage);
					setSending(false);
				},
				tx => {
					setSending(false);
					return onClose();
				}
			);
		} else {
			magma.closeVault(
				market,
				undefined,
				error => {
					setErrorMessages({ string: error.message } as ErrorMessage);
					setSending(false);
				},
				tx => {
					setSending(false);
					return onClose();
				}
			);
		}
	};

	return isOpen ? <Modal
		title={t("closeVault")}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{ gap: "24px" }}>
			{needSwap && <div className="flex-column-align-left">
				<div>
					{t("swapIotx2Wen", {
						iotxAmount: howMuchIOTXDecimal.toFixed(globalContants.DECIMALS_2),
						wenAmount: formatAssetAmount(howMuchWEN, WEN.decimals).toFixed(globalContants.DECIMALS_2)
					})}
				</div>

				<div className="label small">
					{IOTX.symbol + " " + t("price") + ": " + formatCurrency(price)}
				</div>

				<div className="label small">
					{IOTX.symbol + " " + t("balance") + ": " + formatAssetAmount(balance, IOTX.decimals)}
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

			{errorMessages && <div
				className="errorText"
				style={{ maxWidth: "16.6875rem" }}>
				{errorMessages.string || t(errorMessages.key!, errorMessages.values)}
			</div>}
		</div>

		<button
			className="primaryButton bigButton"
			style={{ width: "100%" }}
			disabled={vault.status !== VaultStatusWithinMagma.limitedByRedemption && (
				(needSwap && (!agree || swapping))
				|| (!needSwap && sending)
			)}
			onClick={vault.status === VaultStatusWithinMagma.limitedByRedemption ? handleClose : (needSwap ? handleSwap : handleClose)}>
			<img src="images/repay-dark.png" />

			{t("closeVault")}
		</button>
	</Modal> : <></>
};