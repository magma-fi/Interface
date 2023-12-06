import { useLiquitySelector } from "@liquity/lib-react";
import { useLang } from "../hooks/useLang";
import { Coin } from "../libs/types";
import { useMemo, useState } from "react";
import { LiquityStoreState } from "lib-base/dist/src/LiquityStore";
import { selectForTroveChangeValidation } from "../components/Trove/validation/validateTroveChange";
import { Percent } from "lib-base";
import { CRITICAL_COLLATERAL_RATIO, LUSD_LIQUIDATION_RESERVE, MINIMUM_COLLATERAL_RATIO } from "lib-base/dist/src/constants";
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

export const PoolView = ({ market }: {
	market: Coin;
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
				fees
			} = state;

			return {
				price,
				accountBalance,
				validationContext: selectForTroveChangeValidation(state),
				total,
				numberOfTroves,
				borrowingRate,
				trove,
				fees
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
		fees
	} = useLiquitySelector(selector);
	const [txHash, setTxHash] = useState("");
	const [showDepositModal, setShowDepositModal] = useState(false);
	const [showDepositDoneModal, setShowDepositDoneModal] = useState(false);
	const [showBorrowModal, setShowBorrowModal] = useState(false);
	const [showBorrowDoneModal, setShowBorrowDoneModal] = useState(false);
	const [showRepayModal, setShowRepayModal] = useState(false);
	const [showRepayDoneModal, setShowRepayDoneModal] = useState(false);
	const [repaidAmount, setRepaidAmount] = useState(0);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);
	const [showWithdrawDoneModal, setShowWithdrawDoneModal] = useState(false);
	const [withdrawnAmount, setWithdrawnAmount] = useState(0);
	// const borrowingRate =fees.borrowingRate();
	const feePct = new Percent(borrowingRate);
	// const totalCollateralRatio = total.collateralRatio(price);
	// const totalCollateralRatioPct = new Percent(totalCollateralRatio);
	// const recoveryMode = totalCollateralRatio.div(CRITICAL_COLLATERAL_RATIO);
	const recoveryMode = Decimal.ONE.div(MINIMUM_COLLATERAL_RATIO);
	const borrowingFeePct = new Percent(borrowingRate);
	const currentPrice = trove.collateral.div(trove.debt);
	const maxAvailableBorrow = trove.collateral.mul(price).div(CRITICAL_COLLATERAL_RATIO);
	const availableBorrow = maxAvailableBorrow.sub(trove.debt);
	// const troveCollateralRatio = trove.debt.eq(0) ? Decimal.ZERO : trove.collateral.mulDiv(price, trove.debt);
	// const troveUtilizationRate = troveCollateralRatio.div(CRITICAL_COLLATERAL_RATIO).mul(100);
	const troveUtilizationRate = trove.debt.gt(1) ? trove.netDebt.div(trove.collateral.mul(price)).mul(100) : Decimal.ZERO;
	const troveUtilizationRateNumber = Number(troveUtilizationRate.toString());
	const chartData = [
		{ name: '', value: troveUtilizationRateNumber },
		{ name: '', value: 100 - troveUtilizationRateNumber }
	];
	const COLORS = ['#7ecf29', '#2b2326'];

	const availableWithdrawal = calculateAvailableWithdrawal(trove, price);
	const availableWithdrawalFiat = availableWithdrawal.mul(price);

	if (market?.symbol === "DAI" || market?.symbol === "USDC") {
		return <div className="marketView">
			<h2>Coming soon...</h2>
		</div>
	}

	const handleTroveAction = (idx: number) => {
		if (TroveOptions[idx].key === "close") {
			// 
		}
	};

	const handleDeposit = (evt: React.MouseEvent<HTMLButtonElement>) => {
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

						<p className="description">{t("letsGetStartedDEscription", { percent: feePct.toString(2) })}</p>
					</div>

					<button
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

					<div
						className="two-columns-grid"
						style={{
							gap: "1rem",
							alignItems: "flex-start",
							width: "calc(100% - 1rem)"
						}}>
						<div className="subCard">
							<div className="flex-row-space-between">
								<div className="label">{t("liquidation")}</div>

								<img
									src="images/liquidations.png"
									width="20px" />
							</div>

							<div className="flex-column-align-left">
								<div>{price.sub(currentPrice).div(price).mul(100).toString(2)}%</div>
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

					<div className="flex-row-space-between">
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

					<div className="flex-row-space-between">
						<div className="flex-column-align-left">
							<div className="label">{t("available2Borrow")}</div>

							<div className="flex-row-align-left">
								<img
									src="images/wen.png"
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

					<div className="flex-row-space-between">
						<div className="flex-column-align-left">
							<div className="label">{t("debt")}</div>

							<div className="flex-row-align-left">
								<img
									src="images/wen.png"
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

					<div className="flex-row-space-between">
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
						<div className="description">{t("loanToValue")}</div>

						<div>{total.debt.div(total.collateral.mul(price)).mul(100).toString(2)}%</div>
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
			onDone={handleDepositDone} />}

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
			max={maxAvailableBorrow}
			onDone={handleBorrowDone} />}

		{showBorrowDoneModal && <TxDone
			title={t("borrowedSuccessfully")}
			onClose={handleGoBackVault}
			illustration="images/borrow-successful.png"
			whereGoBack={t("back2Vault")}>
			<TxLabel
				txHash={txHash}
				title={t("borrowed")}
				logo="images/wen.png"
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
			max={trove.debt}
			onDone={handleRepayDone} />}

		{showRepayDoneModal && <TxDone
			title={t("repaidSuccessfully")}
			onClose={handleGoBackVault}
			illustration="images/repay-debt.png"
			whereGoBack={t("back2Vault")}>
			<TxLabel
				txHash={txHash}
				title={t("debtRepaid")}
				logo="images/wen.png"
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
			onDone={handleWithdrawDone} />}

		{showWithdrawDoneModal && <TxDone
			title={t("withdrawnSuccessfully")}
			onClose={handleGoBackVault}
			illustration="images/withdraw-success.png"
			whereGoBack={t("back2Vault")}>
			<TxLabel
				txHash={txHash}
				title={t("withdrawn")}
				logo="images/iotx.png"
				amount={withdrawnAmount.toFixed(2) + " " + WEN.symbol} />
		</TxDone>}
	</>
};