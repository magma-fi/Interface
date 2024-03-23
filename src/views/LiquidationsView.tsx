/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useLang } from "../hooks/useLang";
import { RiskyTroves } from "../components/RiskyTroves";
import { Decimal } from "lib-base";

export const LiquidationsView = ({ magmaData, refreshTrigger }: {
	magmaData?: Record<string, any>;
	refreshTrigger: () => void;
}) => {
	const { t } = useLang();

	return <div className="mainContainer">
		<div className="titleBox">
			<img
				className="viewIcon"
				src="images/liquidations.png" />

			<h1>{t("liquidations")}</h1>
		</div>

		<RiskyTroves
			pageSize={7}
			constants={magmaData}
			refreshTrigger={refreshTrigger} />
	</div>
};