/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useState } from "react";
import { useLang } from "../hooks/useLang";
import { Troves, WEN, globalContants } from "../libs/globalContants";
import { Coin } from "../libs/types";
import { RiskyTroves } from "../components/RiskyTroves";

export const LiquidationsView = () => {
	const { t } = useLang();
	const [currentTrove, setCurrentTrove] = useState<Coin>(globalContants.COINS.IOTX);

	const handleSelectTrove = (idx: number) => {
		setCurrentTrove(globalContants.COINS[Troves[idx].title!])
	}

	return <div className="mainContainer">
		<div className="titleBox">
			<img
				className="viewIcon"
				src="images/liquidations.png" />

			<h1>{t("liquidations")}</h1>
		</div>

		<RiskyTroves pageSize={10} />
	</div>
};