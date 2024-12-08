import { useLang } from "../hooks/useLang";
import { version } from "../../package.json";
import { globalContants, WEN } from "../libs/globalContants";
import BigNumber from "bignumber.js";
import { formatAssetAmount, formatCurrency } from "../utils";
import { PopupView } from "../components/PopupView";

export const Footer = ({
	TVL = 0,
	wenTotalSupply = globalContants.BIG_NUMBER_0,
	lusdInStabilityPool = 0,
	tvlV2 = 0,
	wenTotalSupplyV2 = globalContants.BIG_NUMBER_0,
	lusdInStabilityPoolV2 = 0
}: {
	TVL?: number;
	wenTotalSupply?: BigNumber;
	lusdInStabilityPool?: number;
	tvlV2?: number;
	wenTotalSupplyV2?: BigNumber;
	lusdInStabilityPoolV2?: number;
}) => {
	const { t } = useLang();

	return <div className="footer">
		<div className="scores">
			<div className="scoreLabel">
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

			<div className="scoreLabel">
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

			<div className="scoreLabel">
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

		<div className="bottomRow">
			<div className="flex-row-align-left">
				<img
					src="images/logo+text.png"
					height="24px" />

				<div className="label smallLabel">v{version}</div>
			</div>


			<div className="flex-row-align-left">
				<div className="label">{t("footerInfo")}</div>
			</div>
		</div>

		<p>&nbsp;</p>
	</div>
};