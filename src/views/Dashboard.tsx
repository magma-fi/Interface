/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLiquity } from "../hooks/LiquityContext";
import { useLang } from "../hooks/useLang";
import { WEN, globalContants } from "../libs/globalContants";
import { magma } from "../libs/magma";
import { formatAssetAmount, formatCurrency } from "../utils";
import { TokenCard } from "./TokenCard";
import { TokenStakedCard } from "./TokenStakedCard";

export const Dashboard = ({ magmaData }: {
	magmaData?: Record<string, any>;
}) => {
	const { t } = useLang();
	const TVL = magmaData ? magma.calculateTVL() : 0;
	const wenTotalSupply = magmaData?.wenTotalSupply || globalContants.BIG_NUMBER_0;
	const lusdInStabilityPool = magmaData ? magma.calculateTotalWENStaked() : 0;
	const { account } = useLiquity();
	const tokens = Object.values(magma.tokens) || [];

	const tvlOfAllVaults = magmaData ? magma.calculateTVLOfAllVault(magmaData.vaults, magmaData.price) : 0;
	const totalStakedOfAllVaults = magmaData ? magma.calculateTotalStakedOfAllVault() : 0;
	const totalLoanOfAllVaults = magmaData ? magma.calculateTotalLoanOfAllVault(magmaData.vaults) : 0;

	const handleOpenVault = (token: string) => {
		window.localStorage.setItem(globalContants.TARGET_TOKEN, token);
		window.location.href = "/borrow";
	};

	const handleOpenPool = (token: string) => {
		window.localStorage.setItem(globalContants.TARGET_TOKEN, token);
		window.location.href = "/stake";
	};

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
						<h5>{formatCurrency(TVL)}</h5>

						<div className="description">{t("totalDeposited")}</div>
					</div>

					<div>
						<h5>{formatCurrency(lusdInStabilityPool)}</h5>

						<div className="description">{t("totalStaked")}</div>
					</div>

					<div>
						<h5>{formatCurrency(formatAssetAmount(wenTotalSupply, WEN.decimals))}</h5>

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