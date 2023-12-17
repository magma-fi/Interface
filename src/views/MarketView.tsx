/* eslint-disable react-hooks/rules-of-hooks */
import { useLiquitySelector } from "@liquity/lib-react";
import { useLang } from "../hooks/useLang";
import { Coin, TroveChangeTx } from "../libs/types";
import { useEffect, useMemo, useState } from "react";
import { LiquityStoreState } from "lib-base/dist/src/LiquityStore";
import { selectForTroveChangeValidation } from "../components/Trove/validation/validateTroveChange";
import { CRITICAL_COLLATERAL_RATIO, LUSD_LIQUIDATION_RESERVE, MINIMUM_COLLATERAL_RATIO, Percent } from "lib-base";
import { IOTX, TroveOptions, WEN, globalContants } from "../libs/globalContants";
import { IconButton } from "../components/IconButton";
import { DropdownMenu } from "../components/DropdownMenu";
import { Cell, Pie, PieChart } from "recharts";
import { DepositeModal } from "./DepositModal";
import { Decimal } from "lib-base";
import { calculateAvailableWithdrawal } from "../utils";
import { BorrowModal } from "./BorrowModal";
import { RepayModal } from "./RepayModal";
import { WithdrawModal } from "./WithdrawModal";
import { TxDone } from "../components/TxDone";
import { TxLabel } from "../components/TxLabel";
import { graphqlAsker } from "../libs/graphqlAsker";
import { useChainId } from "wagmi";
import { CloseModal } from "./CloseModal";

export const MarketView = ({
	market,
	constants
}: {
	market: Coin;
	constants: Record<string, Decimal>
}) => {
	const selector = useMemo(() => {
		return (state: LiquityStoreState) => {
			const {
				price,
				accountBalance,
				total,
				numberOfTroves,
				borrowingRate,
				trove,
				fees,
				lusdBalance
			} = state;

			return {
				price,
				accountBalance,
				validationContext: selectForTroveChangeValidation(state),
				total,
				numberOfTroves,
				borrowingRate,
				trove,
				fees,
				lusdBalance
			};
		};
	}, []);

	const { t } = useLang();
	const {
		price,
		accountBalance,
		validationContext,
		total,
		numberOfTroves,
		borrowingRate,
		trove,
		fees,
		lusdBalance
	} = useLiquitySelector(selector);
	const [txHash, setTxHash] = useState("");
	const [showDepositModal, setShowDepositModal] = useState(false);
	const [depositAndBorrow, setDepositAndBorrow] = useState(true);
	const [showDepositDoneModal, setShowDepositDoneModal] = useState(false);
	const [showBorrowModal, setShowBorrowModal] = useState(false);
	const [showBorrowDoneModal, setShowBorrowDoneModal] = useState(false);
	const [showRepayModal, setShowRepayModal] = useState(false);
	const [showRepayDoneModal, setShowRepayDoneModal] = useState(false);
	const [repaidAmount, setRepaidAmount] = useState(0);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);
	const [showWithdrawDoneModal, setShowWithdrawDoneModal] = useState(false);
	const [withdrawnAmount, setWithdrawnAmount] = useState(0);
	const [showCloseModal, setShowCloseModal] = useState(false);
	// const borrowingRate =fees.borrowingRate();
	const feePct = new Percent(borrowingRate);
	// const totalCollateralRatio = total.collateralRatio(price);
	// const totalCollateralRatioPct = new Percent(totalCollateralRatio);
	// const recoveryMode = totalCollateralRatio.div(CRITICAL_COLLATERAL_RATIO);
	const recoveryMode = Decimal.ONE.div(MINIMUM_COLLATERAL_RATIO);
	const borrowingFeePct = new Percent(borrowingRate);
	const currentPrice = trove.collateral.div(trove.debt);
	const maxAvailableBorrow = trove.collateral.mul(price).div(CRITICAL_COLLATERAL_RATIO);
	const availableBorrow = maxAvailableBorrow.gt(trove.debt) ? maxAvailableBorrow.sub(trove.debt) : Decimal.ZERO;
	// const troveCollateralRatio = trove.debt.eq(0) ? Decimal.ZERO : trove.collateral.mulDiv(price, trove.debt);
	// const troveUtilizationRate = troveCollateralRatio.div(CRITICAL_COLLATERAL_RATIO).mul(100);
	const currentNetDebt = trove.debt.gt(1) ? trove.netDebt : Decimal.ZERO;
	const troveUtilizationRate = trove.collateral.gt(0) ? currentNetDebt.div(trove.collateral.mul(price)).mul(100) : Decimal.ZERO;
	const troveUtilizationRateNumber = Number(troveUtilizationRate.toString());
	const chartData = [
		{ name: '', value: troveUtilizationRateNumber },
		{ name: '', value: 100 - troveUtilizationRateNumber }
	];
	const COLORS = ['#7ecf29', '#2b2326'];

	const availableWithdrawal = calculateAvailableWithdrawal(trove, price);
	const availableWithdrawalFiat = availableWithdrawal.mul(price);
	const chainId = useChainId();
	const [txs, setTxs] = useState<TroveChangeTx[]>();
	// const { liquity } = useLiquity();
	// const [constants, setConstants] = useState<Record<string, unknown>>();

	// const [borrowerOperationsDefault, borrowerOperationsStatus] = useContract<BorrowerOperations>(
	// 	liquity.connection.addresses.borrowerOperations,
	// 	BorrowerOperationsAbi
	// );

	// useEffect(() => {
	// 	const getContants = async () => {
	// 		let minNetDebt;
	// 		let wenGasGompensation;
	// 		let mcr;
	// 		if (borrowerOperationsStatus === "LOADED") {
	// 			minNetDebt = await borrowerOperationsDefault?.MIN_NET_DEBT()
	// 			wenGasGompensation = await borrowerOperationsDefault?.LUSD_GAS_COMPENSATION();
	// 			mcr = await borrowerOperationsDefault?.MCR();
	// 		}

	// 		setConstants({
	// 			MIN_NET_DEBT: Decimal.from(minNetDebt?.toString() || 0),
	// 			LUSD_GAS_COMPENSATION: Decimal.from(wenGasGompensation?.toString() || 0),
	// 			MCR: Decimal.from(mcr?.toString() || 0)
	// 		});
	// 	};

	// 	getContants();
	// }, [borrowerOperationsDefault, borrowerOperationsStatus]);

	useEffect(() => {
		if (!trove.ownerAddress) return;

		const query = graphqlAsker.requestTroveChanges("0x")
		graphqlAsker.ask(chainId, query, data => {
			setTxs(data as TroveChangeTx[]);
		});
	}, [chainId, trove.ownerAddress]);

	if (market?.symbol === "DAI" || market?.symbol === "USDC") {
		return <div className="marketView">
			<h2>Coming soon...</h2>
		</div>
	}

	const handleTroveAction = (idx: number) => {
		if (TroveOptions[idx].key === "closeVault") {
			setShowCloseModal(true);
		}
	};

	const handleDeposit = (evt: React.MouseEvent<HTMLButtonElement>) => {
		setDepositAndBorrow(evt.currentTarget.id === "0");

		evt.preventDefault();
		evt.stopPropagation();
		setShowDepositModal(true);
	};

	const handleCloseDepositModal = () => {
		setShowDepositModal(false);
	};

	const handleDepositDone = (tx: string) => {
		setTxHash(tx);
		setShowDepositModal(false);
		setShowDepositDoneModal(true);
	};

	const handleBorrowDone = (tx: string) => {
		setTxHash(tx);
		setShowBorrowModal(false);
		setShowBorrowDoneModal(true);
	};

	const handleRepayDone = (tx: string, repayAmount: number) => {
		setTxHash(tx);
		setShowRepayModal(false);
		setShowRepayDoneModal(true);
		setRepaidAmount(repayAmount);
	};

	const handleWithdrawDone = (tx: string, withdrawAmount: number) => {
		setTxHash(tx);
		setShowWithdrawModal(false);
		setShowWithdrawDoneModal(true);
		setWithdrawnAmount(withdrawAmount);
	};

	const handleBorrow = (evt: React.MouseEvent<HTMLButtonElement>) => {
		evt.preventDefault();
		evt.stopPropagation();
		setShowBorrowModal(true);
	};

	const handleRepay = (evt: React.MouseEvent<HTMLButtonElement>) => {
		evt.preventDefault();
		evt.stopPropagation();
		setShowRepayModal(true);
	};

	const handleWithdraw = (evt: React.MouseEvent<HTMLButtonElement>) => {
		evt.preventDefault();
		evt.stopPropagation();
		setShowWithdrawModal(true);
	};

	const handleCloseBorrowModal = () => {
		setShowBorrowModal(false);
	};

	const handleCloseRepayModal = () => {
		setShowRepayModal(false);
	};

	const handleCloseWithdrawModal = () => {
		setShowWithdrawModal(false);
	};

	const handleCloseClosureModal = () => {
		setShowCloseModal(false);
	};

	const handleGoBackVault = () => {
		setShowDepositDoneModal(false);
		setShowBorrowDoneModal(false);
		setShowRepayDoneModal(false);
		setRepaidAmount(0);
		setShowWithdrawDoneModal(false);
		setWithdrawnAmount(0);
		setTxHash("");
	};

	return <>
		<div className="marketView">
			<div>
				{trove.status !== "open" && <div className="card">
					<img className="illustration" src="images/1wen=1usd.png" />

					<div>
						<h3>{t("letsGetStarted")}</h3>

						<p className="description">{t("letsGetStartedDEscription", {
							interest: "0%",
							percent: feePct.toString(2)
						})}</p>
					</div>

					<button
						id="0"
						className="primaryButton bigButton"
						style={{ width: "100%" }}
						onClick={handleDeposit}>
						<img src="images/deposit.png" />

						{t("deposit") + " " + market?.symbol}
					</button>

					<div
						className="description"
						style={{
							width: "100%",
							textAlign: "center"
						}}>{t("walletBalance")}&nbsp;{accountBalance.toString(2)}&nbsp;{market?.symbol}</div>
				</div>}

				{trove.status === "open" && <div
					className="card"
					style={{ paddingTop: "0.5rem" }}>
					<div
						className="flex-row-space-between"
						style={{ alignItems: "center" }}>
						<h3>{t("yourVault")}</h3>

						<DropdownMenu
							options={TroveOptions}
							onChange={handleTroveAction}>
							<IconButton icon="images/dots.png" />
						</DropdownMenu>
					</div>

					<div className="charts">
						<div className="subCard">
							<div className="flex-row-space-between">
								<div className="label">{t("liquidation")}</div>

								<img
									src="images/liquidations.png"
									width="20px" />
							</div>

							<div className="flex-column-align-left">
								<div>{price.gt(currentPrice) ? price.sub(currentPrice).div(price).mul(100).toString(2) : 0}%</div>
								<div className="label labelSmall">{t("belowCurrentPrice")}</div>
							</div>

							<div className="flex-column-align-left">
								<div>{currentPrice.toString(5)}&nbsp;{globalContants.USD}</div>

								<div className="label labelSmall">{t("liquidationPrice")}</div>
							</div>

							<div className="label labelSmall">{t("currentPrice")}:&nbsp;{price.toString(5)}&nbsp;{globalContants.USD}</div>
						</div>

						<div className="subCard">
							<div className="label">{t("utilizationRate")}</div>

							<div className="chartContainer">
								<PieChart width={108} height={108}>
									<Pie
										data={chartData}
										cx="50%"
										cy="50%"
										innerRadius={40}
										outerRadius={54}
										stroke="rgba(255, 255, 255, 0.1)"
										paddingAngle={0}
										dataKey="value">
										{chartData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
								</PieChart>

								<div className="label">{troveUtilizationRateNumber.toFixed(2)}%</div>
							</div>

							<div
								className="label labelSmall"
							>{t("liquidationAt")}&nbsp;{globalContants.LIQUIDATION_AT * 100}%</div>
						</div>
					</div>

					<div
						className="flex-row-space-between"
						style={{ alignItems: "flex-end" }}>
						<div className="flex-column-align-left">
							<div className="label">{t("deposited")}</div>

							<div className="flex-row-align-left">
								<img
									src="images/iotx.png"
									width="40px" />

								<div className="flex-column-align-left">
									<div>{trove.collateral.mul(price).toString(2)}&nbsp;{globalContants.USD}</div>

									<div className="label labelSmall">{trove.collateral.toString(2)}&nbsp;{IOTX.symbol}</div>
								</div>
							</div>
						</div>

						<div
							// style={{ flex: "1 1" }}
							className="flex-column-align-right"
							style={{ gap: "5px" }}>
							<button
								id="1"
								className="secondaryButton"
								onClick={handleDeposit}>
								<img src="images/deposit-light.png" />

								{t("deposit") + " " + IOTX.symbol}
							</button>

							<div
								className="label labelSmall"
								style={{
									textAlign: "center",
									width: "100%"
								}}>{t("balance")}&nbsp;{accountBalance.toString(2)}&nbsp;{IOTX.symbol}</div>
						</div>
					</div>

					<div
						className="flex-row-space-between"
						style={{ alignItems: "flex-end" }}>
						<div className="flex-column-align-left">
							<div className="label">{t("available2Borrow")}</div>

							<div className="flex-row-align-left">
								<img
									src={WEN.logo}
									width="40px" />

								<div className="flex-column-align-left">
									<div>{availableBorrow.toString(2)}&nbsp;{globalContants.USD}</div>

									<div className="label labelSmall">{availableBorrow.toString(2)}&nbsp;{WEN.symbol}</div>
								</div>
							</div>
						</div>

						<div
							className="flex-column-align-right"
							style={{ gap: "5px" }}>
							<button
								className="primaryButton"
								onClick={handleBorrow}>
								<img src="images/borrow-dark.png" />

								{t("borrow") + " " + WEN.symbol}
							</button>

							<div
								className="label labelSmall"
								style={{
									textAlign: "center",
									width: "100%"
								}}>{t("currentFee")}&nbsp;{borrowingFeePct.toString(2)}</div>
						</div>
					</div>

					<div
						className="flex-row-space-between"
						style={{ alignItems: "flex-end" }}>
						<div className="flex-column-align-left">
							<div className="label">{t("debt")}</div>

							<div className="flex-row-align-left">
								<img
									src={WEN.logo}
									width="40px" />

								<div className="flex-column-align-left">
									<div>{trove.debt.toString(2)}&nbsp;{globalContants.USD}</div>

									<div className="label labelSmall">{trove.debt.toString(2)}&nbsp;{WEN.symbol}</div>
								</div>
							</div>
						</div>

						<div
							className="flex-column-align-right"
							style={{ gap: "5px" }}>
							<button
								className="secondaryButton"
								onClick={handleRepay}>
								<img src="images/repay.png" />

								{t("repay") + " " + WEN.symbol}
							</button>
						</div>
					</div>

					<div
						className="flex-row-space-between"
						style={{ alignItems: "flex-end" }}>
						<div className="flex-column-align-left">
							<div className="label">{t("available2Withdraw")}</div>

							<div className="flex-row-align-left">
								<img
									src="images/iotx.png"
									width="40px" />

								<div className="flex-column-align-left">
									<div>{availableWithdrawalFiat.gt(0) ? availableWithdrawalFiat.toString(2) : "0"}&nbsp;{globalContants.USD}</div>

									<div className="label labelSmall">{availableWithdrawal.gt(0) ? availableWithdrawal.toString(2) : "0"}&nbsp;{IOTX.symbol}</div>
								</div>
							</div>
						</div>

						<div
							className="flex-column-align-right"
							style={{ gap: "5px" }}>
							<button
								className="secondaryButton"
								onClick={handleWithdraw}
								disabled={availableWithdrawal.eq(0)}>
								<img src="images/withdraw.png" />

								{t("withdraw") + " " + IOTX.symbol}
							</button>
						</div>
					</div>
				</div>}
			</div>

			<div>
				<div
					className="card"
					style={{ gap: "24px" }}>
					<div className="flex-row-space-between">
						<h3>{market?.symbol}&nbsp;{t("marketOverview")}</h3>

						<img
							src={market?.logo}
							width="24px" />
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("totalUtilizationRate")}</div>

						<div className="flex-column-align-right">
							<div>{troveUtilizationRate.prettify()}%</div>
							<div className="comments">{t("recoveryModeAt", { recovery: recoveryMode.mul(100).toString(2) })}</div>
						</div>
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("totalDeposits")}</div>

						<div className="flex-column-align-right">
							<div>{total.collateral.mul(price).shorten()}&nbsp;{globalContants.USD}</div>
							<div className="comments">{total.collateral.shorten()}&nbsp;{market?.symbol}</div>
						</div>
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("numberOfVaults")}</div>

						<div>{numberOfTroves}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("borrowFee")}</div>

						<div>{borrowingFeePct.toString(2)}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("liquidationReserve")}</div>

						<div>{LUSD_LIQUIDATION_RESERVE.toString(2)}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("loanToValue")}(LTV)</div>

						<div>{total.collateral.gt(0) ? total.debt.div(total.collateral.mul(price)).mul(100).toString(2) : 0}%</div>
					</div>
				</div>
			</div>
		</div>

		{showDepositModal && <DepositeModal
			isOpen={showDepositModal}
			onClose={handleCloseDepositModal}
			market={market}
			accountBalance={accountBalance}
			price={price}
			trove={trove}
			fees={fees}
			validationContext={validationContext}
			onDone={handleDepositDone}
			constants={constants}
			depositAndBorrow={depositAndBorrow} />}

		{showDepositDoneModal && <TxDone
			title={t("depositedSuccessfully")}
			onClose={handleGoBackVault}
			illustration="images/deposit-successful.png"
			whereGoBack={t("back2Vault")}>
			<TxLabel
				txHash={txHash}
				title={t("deposited")}
				logo="images/iotx.png"
				amount={trove.collateral.toString(2) + " " + IOTX.symbol} />
		</TxDone>}

		{showBorrowModal && <BorrowModal
			isOpen={showBorrowModal}
			onClose={handleCloseBorrowModal}
			market={market}
			price={price}
			trove={trove}
			fees={fees}
			validationContext={validationContext}
			max={maxAvailableBorrow.sub(trove.debt)}
			onDone={handleBorrowDone}
			constants={constants} />}

		{showBorrowDoneModal && <TxDone
			title={t("borrowedSuccessfully")}
			onClose={handleGoBackVault}
			illustration="images/borrow-successful.png"
			whereGoBack={t("back2Vault")}>
			<TxLabel
				txHash={txHash}
				title={t("borrowed")}
				logo={WEN.logo}
				amount={trove.debt.toString(2) + " " + WEN.symbol} />
		</TxDone>}

		{showRepayModal && <RepayModal
			isOpen={showRepayModal}
			onClose={handleCloseRepayModal}
			market={market}
			price={price}
			trove={trove}
			fees={fees}
			validationContext={validationContext}
			max={Decimal.min(currentNetDebt, lusdBalance)}
			onDone={handleRepayDone}
			constants={constants} />}

		{showRepayDoneModal && <TxDone
			title={t("repaidSuccessfully")}
			onClose={handleGoBackVault}
			illustration="images/repay-debt.png"
			whereGoBack={t("back2Vault")}>
			<TxLabel
				txHash={txHash}
				title={t("debtRepaid")}
				logo={WEN.logo}
				amount={repaidAmount.toFixed(2) + " " + WEN.symbol} />
		</TxDone>}

		{showWithdrawModal && <WithdrawModal
			isOpen={showWithdrawModal}
			onClose={handleCloseWithdrawModal}
			market={market}
			price={price}
			trove={trove}
			fees={fees}
			validationContext={validationContext}
			max={availableWithdrawal}
			onDone={handleWithdrawDone}
			constants={constants} />}

		{showWithdrawDoneModal && <TxDone
			title={t("withdrawnSuccessfully")}
			onClose={handleGoBackVault}
			illustration="images/withdraw-success.png"
			whereGoBack={t("back2Vault")}>
			<TxLabel
				txHash={txHash}
				title={t("withdrawn")}
				logo="images/iotx.png"
				amount={withdrawnAmount.toFixed(2) + " " + market.symbol} />
		</TxDone>}

		{showCloseModal && <CloseModal
			isOpen={showCloseModal}
			onClose={handleCloseClosureModal}
			trove={trove}
			fees={fees}
			validationContext={validationContext} />}
	</>
};