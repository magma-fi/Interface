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

export const CloseModal = ({
	isOpen = false,
	onClose = () => { },
	trove,
	fees,
	validationContext,
	chainId
}: {
	isOpen: boolean;
	onClose: () => void;
	trove: Trove;
	fees: Fees;
	validationContext: ValidationContext;
	chainId: number;
}) => {
	const { t } = useLang();
	const txId = useMemo(() => String(new Date().getTime()), []);
	const transactionState = useMyTransactionState(txId, true);

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
	const needSwap = errorMessages.key === "needMoreToClose";
	const wenDec = Math.pow(10, WEN.decimals || 18);
	const iotxDec = Math.pow(10, IOTX.decimals || 18);
	const howMuchWEN = Decimal.from(errorMessages.values!.amount).mul(wenDec);
	const { provider } = useLiquity();
	const [swapContract, setSwapContract] = useState<Contract | undefined>();
	const [howMuchIOTX, setHowMuchIOTX] = useState(Decimal.ZERO);

	useEffect(() => {
		if (!needSwap) return;

		const getContract = async () => {
			const theCfg = appConfig.swap[chainId as string];
			const addr = theCfg.liquidity.address;
			const abi = await loadABI(theCfg.liquidity.abi)

			if (abi) {
				const c = new Contract(addr, abi as ContractInterface, provider);
				setSwapContract(c);
			}
		};

		getContract();
	}, [needSwap]);

	useEffect(() => {
		if (!swapContract) return;

		const getData = async () => {
			const res = await swapContract.getAmountsIn(howMuchWEN.toString(), ["0xa00744882684c3e4747faefd68d283ea44099d03", "0x20143c45c2ce7984799079f256d8a68a918eeee6"]);
			if (res?.length === 2) {
				setHowMuchIOTX(Decimal.from(res[0].toString()));
			}
		};

		getData();
	}, [swapContract]);

	const handleCloseModal = () => {
		onClose();
	};

	useEffect(() => {
		if (transactionState.type === "confirmed" && transactionState.tx?.rawSentTransaction && !transactionState.resolved) {
			onClose()
			transactionState.resolved = true;
		}
	}, [transactionState.type])

	const handleSwap = () => {
		// 
	};

	return isOpen ? <Modal
		title={t("closeVault")}
		onClose={handleCloseModal}>
		<div
			className="flex-column"
			style={{ gap: "24px" }}>
			<div>{description && t(errorMessages.key, errorMessages.values)}</div>

			{needSwap && <button
				className="textButton smallTextButton"
				style={{ textTransform: "none" }}
				onClick={handleSwap}>
				{t("swapIotx2Wen", {
					iotxAmount: howMuchIOTX.div(iotxDec).toString(6),
					wenAmount: howMuchWEN.div(wenDec).toString(6)
				})}
			</button>}
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