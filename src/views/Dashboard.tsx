/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useLiquity } from "../hooks/LiquityContext";
import { useLang } from "../hooks/useLang";
import { WEN, globalContants } from "../libs/globalContants";
import { magma } from "../libs/magma";
import { formatAssetAmount, formatCurrency } from "../utils";
import { TokenCard } from "./TokenCard";
import { magmaV2 } from "../libs/magmaV2";
import { JsonRpcSigner } from "@ethersproject/providers";
import BigNumber from "bignumber.js";
import { PopupView } from "../components/PopupView";

export const Dashboard = ({ magmaData }: {
	magmaData?: Record<string, any>;
}) => {
	const { t } = useLang();
	const TVL = magmaData ? magma.calculateTVL() : 0;
	const wenTotalSupply = magmaData?.wenTotalSupply || globalContants.BIG_NUMBER_0;
	const lusdInStabilityPool = magmaData ? magma.calculateTotalWENStaked() : 0;
	const [tvlV2, setTVLV2] = useState(0);
	const [lusdInStabilityPoolV2, setLusdInStabilityPoolV2] = useState(0);
	const [wenTotalSupplyV2, setWenTotalSupplyV2] = useState(globalContants.BIG_NUMBER_0);
	const { chainId, account, signer } = useLiquity();
	const tokens = Object.values(magma.tokens) || [];

	const tvlOfAllVaults = magmaData ? magma.calculateTVLOfAllVault(magmaData.vaults, magmaData.price) : 0;
	const totalStakedOfAllVaults = magmaData ? magma.calculateTotalStakedOfAllVault() : 0;
	const totalLoanOfAllVaults = magmaData ? magma.calculateTotalLoanOfAllVault(magmaData.vaults) : 0;

	const handleOpenVault = (token: string) => {
		window.localStorage.setItem(globalContants.TARGET_TOKEN, token);
		window.location.href = "/borrow";
	};

	useEffect(() => {
		// 未对magmaV2内的multicaller这一全局对象作进一步的处理，暂时保证在magma调用multicall之后再调用magmaV2的multicaller，以确保multicall的调用不会被覆盖。
		if (chainId > 0 && signer && magmaData) {
			magmaV2.init(chainId, signer as JsonRpcSigner);

			const func = async () => {
				const res = await magmaV2.getMagmaData();
				if (res) {
					setTVLV2(magmaV2.calculateTVL());
					setLusdInStabilityPoolV2(magmaV2.calculateTotalWENStaked());
					setWenTotalSupplyV2(res.wenTotalSupply);
				}
			};

			func();
		}
	}, [chainId, signer, magmaData]);

	return <div className="mainContainer dashboardLayout">
		<div className="statsBar">
			<div className="card">
				<div className="titleBar">
					<img
						src="/images/magma.png"
						width="24px" />

					<h5 className="small">{t("protocolStats")}</h5>
				</div>

				<div className="scores">
					<div>
						<h5>
							<span>{formatCurrency(TVL + tvlV2)}</span>

							{tvlV2 > 0 && <PopupView
								entryView={<span className="infoLabel">i</span>}
								showArrows={false}
								alignTop={true}
								alignLeft={true}
								popupView={<div className="statsDetails">
									<div>{t("magmaV2")}:&nbsp;{formatCurrency(tvlV2)}</div>
									<div>{t("magmaV3")}:&nbsp;{formatCurrency(TVL)}</div>
								</div>}
								forcedClass={""} />}
						</h5>

						<div className="description">{t("totalDeposited")}</div>
					</div>

					<div>
						<h5>
							<span>{formatCurrency(lusdInStabilityPool + lusdInStabilityPoolV2)}</span>

							{lusdInStabilityPoolV2 > 0 && <PopupView
								entryView={<span className="infoLabel">i</span>}
								showArrows={false}
								alignTop={true}
								alignLeft={true}
								popupView={<div className="statsDetails">
									<div>{t("magmaV2")}:&nbsp;{formatCurrency(lusdInStabilityPoolV2)}</div>
									<div>{t("magmaV3")}:&nbsp;{formatCurrency(lusdInStabilityPool)}</div>
								</div>}
								forcedClass={""} />}
						</h5>

						<div className="description">{t("totalStaked")}</div>
					</div>

					<div>
						<h5>
							<span>{formatCurrency(formatAssetAmount(wenTotalSupply.plus(wenTotalSupplyV2), WEN.decimals))}</span>

							{wenTotalSupplyV2.gt(0) && <PopupView
								entryView={<span className="infoLabel">i</span>}
								showArrows={false}
								alignTop={true}
								alignRignt={true}
								popupView={<div className="statsDetails">
									<div>{t("magmaV2")}:&nbsp;{formatCurrency(formatAssetAmount(wenTotalSupplyV2, WEN.decimals))}</div>
									<div>{t("magmaV3")}:&nbsp;{formatCurrency(formatAssetAmount(wenTotalSupply, WEN.decimals))}</div>
								</div>}
								forcedClass={""} />}
						</h5>

						<div className="description">{t("totalBorrowed")}</div>
					</div>
				</div>
			</div>

			{account && <div className="card">
				<div className="titleBar">
					<img
						src="/images/avator.png"
						height="13px" />

					<h5 className="small">{t("yourStats")}</h5>
				</div>

				<div className="scores">
					<div>
						<h5>{formatCurrency(tvlOfAllVaults)}</h5>

						<div className="description">{t("totalDeposited")}</div>
					</div>

					<div>
						<h5>{formatCurrency(totalStakedOfAllVaults)}</h5>

						<div className="description">{t("totalStaked")}</div>
					</div>

					<div>
						<h5>{formatCurrency(totalLoanOfAllVaults)}</h5>

						<div className="description">{t("totalBorrowed")}</div>
					</div>
				</div>
			</div>}
		</div>

		<div className="vaultList">
			{tokens.map(token => {
				return <div
					className="dashboardItem"
					key={token.symbol}>
					<div className="flex-row-align-left">
						<img
							src={token.logo}
							height="32px" />

						<h3>{token.symbol}</h3>
					</div>

					<TokenCard
						token={token}
						magmaData={magmaData}
						onOpenVault={handleOpenVault}
						title={t("vault")}
						showIcon={false} />

					{/* <TokenStakedCard
						token={token}
						magmaData={magmaData}
						onOpenPool={handleOpenPool}
						title={t("stabilityPool")}
						showIcon={false} /> */}
				</div>
			})}
		</div>
	</div>
};