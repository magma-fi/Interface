/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import { useLang } from "../hooks/useLang";
import { Coin, JsonObject, TroveChangeData, TroveChangeTx, VaultStatus4Contract, VaultStatus4Subgraph } from "../libs/types";
import { useEffect, useState } from "react";
import { IOTX, TroveOptions, WEN, globalContants } from "../libs/globalContants";
import { IconButton } from "../components/IconButton";
import { DropdownMenu } from "../components/DropdownMenu";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { DepositeModal } from "./DepositModal";
import { formatAsset, formatAssetAmount, formatCurrency, formatPercent } from "../utils";
import { BorrowModal } from "./BorrowModal";
import { RepayModal } from "./RepayModal";
import { WithdrawModal } from "./WithdrawModal";
import { TxDone } from "../components/TxDone";
import { TxLabel } from "../components/TxLabel";
import { graphqlAsker } from "../libs/graphqlAsker";
import { CloseModal } from "./CloseModal";
import { TransactiionListItem } from "./TransactiionListItem";
import appConfig from "../appConfig.json";
import { useLiquity } from "../hooks/LiquityContext";
import React from "react";
import { appController } from "../libs/appController";
import BigNumber from "bignumber.js";
import { Vault } from "../libs/Vault";

export const MarketView = ({
	market,
	isReferrer,
	externalDataDone,
	magmaData,
	refreshTrigger
}: {
	market: Coin;
	isReferrer: boolean;
	externalDataDone?: boolean;
	magmaData?: Record<string, any>;
	refreshTrigger: () => void;
}) => {
	if (!magmaData) return <></>

	// const selector = useMemo(() => {
	// 	return (state: LiquityStoreState) => {
	// 		const {
	// 			price,
	// 			accountBalance,
	// 			total,
	// 			numberOfTroves,
	// 			borrowingRate,
	// 			trove,
	// 			fees,
	// 			lusdBalance
	// 		} = state;

	// 		return {
	// 			price,
	// 			accountBalance,
	// 			validationContext: selectForTroveChangeValidation(state),
	// 			total,
	// 			numberOfTroves,
	// 			borrowingRate,
	// 			trove,
	// 			fees,
	// 			lusdBalance
	// 		};
	// 	};
	// }, []);
	const { t } = useLang();
	const {
		price,
		accountBalance,
		validationContext,
		lusdBalance
	} = magmaData; // useLiquitySelector(selector);
	if (!magmaData) return <></>;

	const vault: Vault = magmaData.vault;
	const total = {
		collateral: magmaData.entireSystemColl,
		debt: magmaData.entireSystemDebt
	}
	const numberOfTroves = magmaData.troveOwnersCount;
	const fees = { borrowingRate: magmaData.borrowingRateWithDecay };
	const { walletClient, chainId, liquity, account } = useLiquity()
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
	const borrowingRate = magmaData.borrowingRateWithDecay;
	const feePct = borrowingRate;
	// const totalCollateralRatio = total.collateralRatio(price);
	// const totalCollateralRatioPct = new Percent(totalCollateralRatio);
	// const recoveryMode = totalCollateralRatio.div(CRITICAL_COLLATERAL_RATIO);
	const recoveryMode = magmaData.recoveryMode;
	const appConfigConstants = (appConfig.constants as JsonObject)[String(chainId)];
	const CCR = magmaData?.CCR > 0 ? magmaData?.CCR : appConfigConstants.MAGMA_CRITICAL_COLLATERAL_RATIO;
	const MCR = magmaData?.MCR > 0 ? magmaData?.MCR : appConfigConstants.MAGMA_MINIMUM_COLLATERAL_RATIO;
	const appMMROffset = appConfigConstants.appMMROffset;
	const TVL = magmaData?.TVL || globalContants.BIG_NUMBER_0;
	const formatedTVL = formatAssetAmount(TVL);
	const mcrPercent = 1 / MCR;
	const recoveryModeAt = CCR > 0 ? 1 / CCR : 0;
	const liquidationPoint = recoveryMode ? CCR : MCR;
	const appLiquidationPoint = recoveryMode ? CCR : appConfigConstants.appMCR;
	const troveCollatera = formatAssetAmount(vault.collateral, IOTX.decimals);
	const troveCollateralValue = vault.collateral.shiftedBy(-market.decimals).multipliedBy(price);

	// const troveCollateralRatio = vault.debt.eq(0) ? Decimal.ZERO : vault.collateralRatio(price);
	// const line = Decimal.min(liquidationPoint, troveCollateralRatio);
	// const debtToLiquidate = Decimal.max(
	// 	vault.debt,
	// 	Decimal.ONE.div(line.gt(0) ? line : Decimal.ONE).mul(troveCollateralValue)
	// );
	const troveDebtValue = vault.debt.shiftedBy(-WEN.decimals);
	const vaultDebtValuneNumber = troveDebtValue.toNumber();
	const debtToLiquidate = vault.debt;
	const liquidationPrice = vault.collateral.gt(0) ? debtToLiquidate.dividedBy(vault.collateral).toNumber() : 0;

	// const maxAvailableBorrow = troveCollateralValue.dividedBy(liquidationPoint).multipliedBy(appMMROffset);
	// const maxAvailableBorrowSubFee = maxAvailableBorrow.multipliedBy(1 - borrowingRate);
	// const availableBorrow = maxAvailableBorrowSubFee.gt(troveDebtValue) ? maxAvailableBorrowSubFee.minus(troveDebtValue) : globalContants.BIG_NUMBER_0;
	const availableBorrow = vault.getAvailabelBorrow(price, liquidationPoint, borrowingRate, appMMROffset);
	const availableBorrowDecimals = formatAssetAmount(availableBorrow, WEN.decimals);
	const currentNetDebt = vault.debt.gt(1) ? vault.netDebt : globalContants.BIG_NUMBER_0;
	const minNetDebt = magmaData?.MIN_NET_DEBT;
	const reserve = magmaData?.LUSD_GAS_COMPENSATION;
	const maxAvailableRepay = currentNetDebt.gt(minNetDebt.plus(reserve)) ? currentNetDebt.minus(minNetDebt).minus(reserve) : globalContants.BIG_NUMBER_0;
	const totalUtilizationRate = total.collateral.gt(reserve) ? total.debt.dividedBy(total.collateral.multipliedBy(price)).toNumber() : 0;
	const troveUtilizationRate = vault.collateral.gt(0) ? troveDebtValue.dividedBy(troveCollateralValue).toNumber() : 0;

	const troveUtilizationRate100 = troveUtilizationRate * 100;
	const RADIAN = Math.PI / 180;
	const chartData = [
		{ name: '', value: troveUtilizationRate100 },
		{ name: '', value: 100 - troveUtilizationRate100 }
	];
	const COLORS = ['#7ecf29', '#2b2326'];
	const needle = (value: number, cx: number, cy: number, color: string | undefined) => {
		const ang = value;
		const length = 54;//(iR + 2 * oR) / 3;
		const sin = Math.sin(-RADIAN * ang);
		const cos = Math.cos(-RADIAN * ang);
		const x0 = cx + 5;
		const y0 = cy + 5;
		const xpc = x0 + (length - 15) * cos;
		const ypc = y0 + ((length - 15)) * sin;
		const xp = x0 + length * cos;
		const yp = y0 + length * sin;

		return [<path d={`M ${xpc} ${ypc} L${xp} ${yp}`} stroke={color} strokeWidth="2" fill={color} />];
	};

	const availableWithdrawal = vault.getAvailableWithdrawal(price, appLiquidationPoint);
	const availableWithdrawalDecimals = formatAssetAmount(availableWithdrawal, IOTX.decimals);
	const availableWithdrawalFiat = availableWithdrawalDecimals * price;
	const [txs, setTxs] = useState<TroveChangeTx[]>([]);
	const [changes, setChanges] = useState<TroveChangeData[]>([]);
	const [chartBoxWidth, setChartBoxWidth] = useState(700)

	useEffect(() => {
		if (!account) return;

		setTimeout(() => {
			const query = graphqlAsker.requestTroveChanges(account)
			graphqlAsker.ask(chainId, query, (data: any) => {
				if (data.troveChanges) {
					setTxs(data.troveChanges);
				}
			});
		}, 1000);
	}, [account, chainId]);

	// useEffect(() => {
	// 	if (chainId <= 0 || changes.length > 0) return;

	// 	setTimeout(() => {
	// 		const startTime = Math.floor(Date.now() / 1000) - globalContants.MONTH_SECONDS;
	// 		const query = graphqlAsker.requestChangeHistory(startTime);
	// 		graphqlAsker.ask(chainId, query, (data: any) => {
	// 			const tempArr: TroveChangeData[] = [];
	// 			let yesterday = "";

	// 			for (let i = data?.troveChanges.length - 1; i >= 0; i--) {
	// 				const item = data.troveChanges[i];
	// 				const time = new Date(item.transaction.timestamp * 1000);
	// 				const month = time.getMonth() + 1;
	// 				const day = time.getDate();
	// 				const date = month + "-" + day;

	// 				if (yesterday !== date) {
	// 					yesterday = date;

	// 					tempArr.push({
	// 						collateralAfter: Math.floor(Number(price.mul(item.collateralAfter)) / 1000),
	// 						debtAfter: Math.floor(Number(item.debtAfter) / 1000),
	// 						timestamp: item.transaction.timestamp,
	// 						date: yesterday
	// 					} as TroveChangeData);
	// 				}
	// 			}

	// 			setChanges(tempArr.reverse());
	// 		});
	// 	}, 2000);
	// }, [chainId]);

	useEffect(() => {
		if (!externalDataDone || !price || changes.length > 0) return;

		const tempArr: TroveChangeData[] = [];
		let howMany = 0

		appController.openDB(chainId, () => {
			appController.readAll((cursor?: IDBCursor) => {
				if (!cursor) return;

				howMany += 1;

				const key: string = cursor.key.toString();

				tempArr.push({
					collateralAfter: Number(price * cursor.value.collateral) / 1000,
					debtAfter: Number(cursor.value.debt) / 1000,
					date: key.substring(0, key.lastIndexOf("/"))
				} as TroveChangeData)

				if (howMany < 15) {
					cursor.continue();
				}
			});
		});

		setChanges(tempArr);

		setTimeout(() => {
			const dom = document.getElementById("marketView");
			setChartBoxWidth(dom?.clientWidth || 400);
		}, 2000);
	}, [chainId, changes.length, externalDataDone, price]);

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

	const handleCloseTroveFromRepayModal = () => {
		handleCloseRepayModal();
		setShowCloseModal(true);
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

		return refreshTrigger && refreshTrigger();
	};

	const handleBorrowDone = (tx: string) => {
		setTxHash(tx);
		setShowBorrowModal(false);
		setShowBorrowDoneModal(true);

		return refreshTrigger && refreshTrigger();
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

	const handleWatchAsset = async () => {
		await walletClient?.watchAsset({
			type: "ERC20",
			options: {
				address: liquity.connection.addresses.lusdToken,
				decimals: WEN.decimals || 18,
				symbol: WEN.symbol
			}
		});
	};

	const formatTooltipValue = (value: number, name: string) => {
		if (name === "debtAfter") {
			return [value.toFixed(2) + "K " + WEN.symbol, t("wenTotalSupply")];
		} else {
			return [value.toFixed(2) + "K " + globalContants.USD, t("totalDeposits")];
		}
	};

	return <>
		<div
			id="marketView"
			className="marketView marketViewLayout">
			<div>
				{vault.status !== VaultStatus4Contract.active && vault.status !== VaultStatus4Subgraph.open && <div className="card">
					<img className="illustration" src="images/1wen=1usd.png" />

					<div>
						<h3>{t("letsGetStarted")}</h3>

						<p className="description">{t("letsGetStartedDEscription", {
							interest: "0%",
							percent: feePct.toFixed(2)
						})}</p>
					</div>

					<button
						id="0"
						className="primaryButton bigButton"
						style={{ width: "100%" }}
						onClick={handleDeposit}
						disabled={accountBalance.eq(0)}>
						<img src="images/deposit.png" />

						{t("deposit") + " " + market?.symbol}
					</button>

					<div
						className="description"
						style={{
							width: "100%",
							textAlign: "center"
						}}>{t("walletBalance")}&nbsp;{formatAsset(formatAssetAmount(accountBalance), IOTX)}</div>
				</div>}

				{(vault.status === VaultStatus4Contract.active || vault.status === VaultStatus4Subgraph.open) && <div
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
						<div
							className="subCard"
							style={{ minHeight: "190px" }}>
							<div className="flex-row-space-between">
								<div className="label">{t("liquidation")}</div>

								<img
									src="images/liquidations.png"
									width="20px" />
							</div>

							<div className="flex-column-align-left">
								<div>{formatPercent(price > liquidationPrice ? (price - liquidationPrice) / price : 0)}</div>
								<div className="label labelSmall">{t("belowCurrentPrice")}</div>
							</div>

							<div className="flex-column-align-left">
								<div>{formatCurrency(liquidationPrice)}</div>

								<div className="label labelSmall">{t("liquidationPrice")}</div>
							</div>

							<div className="label labelSmall">{t("currentPrice")}:&nbsp;{formatCurrency(price)}</div>
						</div>

						<div
							className="subCard"
							style={{ minHeight: "190px" }}>
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
										dataKey="value"
										startAngle={0}
										endAngle={360}>
										{chartData.map((entry, index) => (
											<Cell
												key={index}
												fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>

									{needle(mcrPercent * 360, 50, 50, '#F25454')}
								</PieChart>

								<div className="label">{formatPercent(troveUtilizationRate)}</div>
							</div>

							<div className="flex-column">
								<div className="flex-row-align-left label labelSmall">
									<div className="label labelSmall">{t("liquidationAt")}</div>

									<div style={{ color: "#F25454" }}>{formatPercent(mcrPercent)}</div>
								</div>
							</div>
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
									<div>{formatCurrency(troveCollateralValue.toNumber())}</div>

									<div className="label labelSmall">{formatAsset(troveCollatera, IOTX)}</div>
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
								}}>{t("balance")}&nbsp;{formatAsset(formatAssetAmount(accountBalance, IOTX.decimals), IOTX)}</div>
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
									<div>{formatCurrency(availableBorrowDecimals)}</div>

									<div className="label labelSmall">{formatAsset(availableBorrowDecimals, WEN)}</div>
								</div>
							</div>
						</div>

						<div
							className="flex-column-align-right"
							style={{ gap: "5px" }}>
							<button
								className="primaryButton"
								onClick={handleBorrow}
								disabled={availableBorrow.lt(0.01)}>
								<img src="images/borrow-dark.png" />

								{t("borrow") + " " + WEN.symbol}
							</button>

							<div
								className="label labelSmall"
								style={{
									textAlign: "center",
									width: "100%"
								}}>{t("currentFee")}&nbsp;{formatPercent(feePct)}</div>
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
									<div>{formatCurrency(vaultDebtValuneNumber)}</div>

									<div className="label labelSmall">{formatAsset(vaultDebtValuneNumber, WEN)}</div>
								</div>
							</div>
						</div>

						<div
							className="flex-column-align-right"
							style={{ gap: "5px" }}>
							<button
								className="secondaryButton"
								onClick={handleRepay}
								disabled={maxAvailableRepay.lt(0.01) || lusdBalance.eq(0)}>
								<img src="images/repay.png" />

								{t("repay") + " " + WEN.symbol}
							</button>

							{(maxAvailableRepay.lt(0.01) || lusdBalance.eq(0)) && <div
								className="label labelSmall"
								style={{
									textAlign: "center",
									width: "100%"
								}}>
								{maxAvailableRepay.lt(0.01)
									? t("available2Repay") + ": " + maxAvailableRepay.toFixed(2)
									: (lusdBalance.eq(0) && " " + WEN.symbol + " " + t("balance") + ": 0")}
							</div>}
						</div>
					</div>

					<div
						className="flex-row-space-between"
						style={{
							alignItems: "flex-end",
							gap: "none"
						}}>
						<div className="flex-column-align-left">
							<div className="label">{t("available2Withdraw")}</div>

							<div className="flex-row-align-left">
								<img
									src="images/iotx.png"
									width="40px" />

								<div className="flex-column-align-left">
									<div>{formatCurrency(availableWithdrawalFiat)}</div>

									<div className="label labelSmall">{formatAsset(availableWithdrawalDecimals, IOTX)}</div>
								</div>
							</div>
						</div>

						<div
							className="flex-column-align-right"
							style={{ gap: "5px" }}>
							<button
								className="secondaryButton"
								onClick={handleWithdraw}
								disabled={availableWithdrawal.lt(0.01)}>
								<img src="images/withdraw.png" />

								{t("withdraw") + " " + IOTX.symbol}
							</button>
						</div>
					</div>
				</div>}
			</div>

			<div
				className="flex-column"
				style={{ gap: "40px" }}>
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
							<div>{formatPercent(totalUtilizationRate)}</div>
							<div className="comments">{t("recoveryModeAt", { recovery: formatPercent(recoveryModeAt) })}</div>
						</div>
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("totalDeposits")}&nbsp;(TVL)</div>

						<div className="flex-column-align-right">
							<div>{formatCurrency(formatedTVL * price)}</div>
							{/* <div className="comments">{formatedTVL.toFixed(globalContants.DECIMALS_2)}&nbsp;{market?.symbol}</div> */}
							<div className="comments">{formatAsset(formatedTVL)}</div>
						</div>
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("wenTotalSupply")}</div>

						<div>{formatAsset(formatAssetAmount(magmaData?.wenTotalSupply), WEN)}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("numberOfVaults")}</div>

						<div>{numberOfTroves}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("borrowFee")}</div>

						<div>{formatPercent(feePct)}</div>
					</div>

					<div className="flex-row-space-between">
						<div className="description">{t("liquidationReserve")}</div>

						<div>{formatAsset(formatAssetAmount(reserve), WEN)}</div>
					</div>

					{/* <div className="flex-row-space-between">
						<div className="description">{t("loanToValue")}&nbsp;(LTV)</div>

						<div>{total.collateral.gt(0) ? total.debt.div(total.collateral.mul(price)).mul(100).toFixed(2) : 0}%</div>
					</div> */}

					<div className="flex-row-space-between">
						<div className="description">{market.symbol}&nbsp;{t("price")}</div>

						<div>{formatCurrency(price)}</div>
					</div>
				</div>

				{txs?.length > 0 && <div
					className="card"
					style={{ gap: "24px" }}>
					<div className="flex-row-space-between">
						<h3>{t("latestTransactions")}</h3>

						<div>&nbsp;</div>
					</div>

					{txs.map(txItem => {
						return <TransactiionListItem
							key={txItem.id}
							data={txItem}
							market={market}
							price={price} />
					})}
				</div>}
			</div>
		</div>

		{changes?.length > 0 && <div
			className="flex-column-align-left"
			style={{ gap: "24px" }}>
			<h3>{t("chart")}</h3>

			<div>
				<div className="flex-row-align-left">
					<div style={{
						color: "#FE8C00",
						fontSize: "x-large"
					}}>●</div>

					<div className="label">{t("depositValue")}</div>
				</div>

				<div className="flex-row-align-left">
					<div style={{
						color: "#F25454",
						fontSize: "x-large"
					}}>●</div>

					<div className="label">{t("debt")}</div>
				</div>
			</div>

			<div>
				<AreaChart
					width={chartBoxWidth}
					height={chartBoxWidth * 2 / 5}
					data={changes}
					margin={{
						top: 0,
						right: 0,
						left: 0,
						bottom: 0
					}}>

					<defs>
						<linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#FE8C00" stopOpacity={0.8} />
							<stop offset="95%" stopColor="#FE8C00" stopOpacity={0.3} />
						</linearGradient>
						<linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#F25454" stopOpacity={0.8} />
							<stop offset="95%" stopColor="#F25454" stopOpacity={0.3} />
						</linearGradient>
					</defs>

					<XAxis dataKey="date" />

					<YAxis unit="K" />

					<CartesianGrid
						strokeDasharray="1"
						stroke="#ffffff30" />

					<Tooltip formatter={formatTooltipValue} />

					<Area type="monotone" dataKey="debtAfter" stroke="#F25454CC" fillOpacity={1} fill="url(#colorPv)" />

					<Area type="monotone" dataKey="collateralAfter" stroke="#FE8C00cc" fillOpacity={1} fill="url(#colorUv)" />
				</AreaChart>
			</div>
		</div>}

		{showDepositModal && <DepositeModal
			isOpen={showDepositModal}
			onClose={handleCloseDepositModal}
			market={market}
			accountBalance={accountBalance}
			price={price}
			vault={vault}
			fees={fees}
			onDone={handleDepositDone}
			constants={magmaData}
			depositAndBorrow={depositAndBorrow}
			liquidationPrice={liquidationPrice}
			availableWithdrawal={availableWithdrawal}
			availableBorrow={availableBorrow}
			liquidationPoint={liquidationPoint}
			appMMROffset={appMMROffset}
			recoveryMode={recoveryMode}
			ccr={CCR} />}

		{showDepositDoneModal && <TxDone
			title={t("depositedSuccessfully")}
			onClose={handleGoBackVault}
			illustration="images/deposit-successful.png"
			whereGoBack={t("back2Vault")}>
			<div className="flex-column-align-center">
				<TxLabel
					txHash={txHash}
					title={t("deposited")}
					logo="images/iotx.png"
					amount={formatAsset(formatAssetAmount(vault.collateral, market.decimals), market)} />

				{depositAndBorrow && <button
					className="textButton smallTextButton"
					style={{ textTransform: "none" }}
					onClick={handleWatchAsset}>
					{t("watchWenToWallet")}
				</button>}
			</div>
		</TxDone>}

		{showBorrowModal && <BorrowModal
			isOpen={showBorrowModal}
			onClose={handleCloseBorrowModal}
			market={market}
			price={price}
			vault={vault}
			fees={fees}
			max={availableBorrow}
			onDone={handleBorrowDone}
			constants={magmaData}
			liquidationPrice={liquidationPrice}
			availableWithdrawal={availableWithdrawal}
			recoveryMode={recoveryMode}
			liquidationPoint={appLiquidationPoint}
			availableBorrow={availableBorrow}
			ccr={CCR} />}

		{showBorrowDoneModal && <TxDone
			title={t("borrowedSuccessfully")}
			onClose={handleGoBackVault}
			illustration="images/borrow-successful.png"
			whereGoBack={t("back2Vault")}>
			<div className="flex-column-align-center">
				<TxLabel
					txHash={txHash}
					title={t("borrowed")}
					logo={WEN.logo}
					amount={formatAsset(formatAssetAmount(vault.debt, WEN.decimals), WEN)} />

				<button
					className="textButton smallTextButton"
					style={{ textTransform: "none" }}
					onClick={handleWatchAsset}>
					{t("watchWenToWallet")}
				</button>
			</div>
		</TxDone>}

		{showRepayModal && <RepayModal
			isOpen={showRepayModal}
			onClose={handleCloseRepayModal}
			market={market}
			price={price}
			vault={vault}
			fees={fees}
			max={BigNumber.min(maxAvailableRepay, lusdBalance)}
			onDone={handleRepayDone}
			constants={magmaData}
			availableWithdrawal={availableWithdrawal}
			recoveryMode={recoveryMode}
			liquidationPoint={appLiquidationPoint}
			availableBorrow={availableBorrow}
			onCloseVault={handleCloseTroveFromRepayModal} />}

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
			vault={vault}
			fees={fees}
			max={availableWithdrawal}
			onDone={handleWithdrawDone}
			availableWithdrawal={availableWithdrawal}
			recoveryMode={recoveryMode}
			// liquidationPoint={liquidationPoint}
			liquidationPoint={appLiquidationPoint}
			availableBorrow={availableBorrow}
			appMMROffset={appMMROffset}
			ccr={CCR} />}

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
			trove={vault}
			fees={fees}
			validationContext={validationContext}
			chainId={chainId}
			balance={accountBalance}
			price={price} />}
	</>
};