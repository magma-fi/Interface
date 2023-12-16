/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useEffect } from "react";
import { useLang } from "../hooks/useLang";
import { RiskyTroves } from "../components/RiskyTroves";
import { Decimal } from "lib-base";

export const LiquidationsView = ({ constants }: { constants: Record<string, Decimal> }) => {
	const { t } = useLang();
	// const [currentTrove, setCurrentTrove] = useState<Coin>(globalContants.COINS.IOTX);

	// const handleSelectTrove = (idx: number) => {
	// 	setCurrentTrove(globalContants.COINS[Troves[idx].title!])
	// }

	useEffect(() => {
		// 
	}, []);

	return <div className="mainContainer">
		<div className="titleBox">
			<img
				className="viewIcon"
				src="images/liquidations.png" />

			<h1>{t("liquidations")}</h1>
		</div>

		<RiskyTroves
			pageSize={7}
			constants={constants} />
	</div>
};