/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useState } from "react";
import { Tab } from "../components/Tab";
import { useLang } from "../hooks/useLang";
import { Troves, WEN, globalContants } from "../libs/globalContants";
import { Coin } from "../libs/types";
import { PoolView } from "./PoolView";
import { Record } from "../components/Bonds/Record";
import { Decimal } from "lib-base";

export const StakeView = ({ constants }: { constants: Record<string, Decimal> }) => {
	const { t } = useLang();
	const [currentTrove, setCurrentTrove] = useState<Coin>(globalContants.COINS.IOTX);

	const handleSelectTrove = (idx: number) => {
		setCurrentTrove(globalContants.COINS[Troves[idx].title!])
	}

	return <div className="mainContainer">
		<div className="titleBox">
			<img
				className="viewIcon"
				src="images/stake.png" />

			<h1>{t("stabilityPool")}</h1>
		</div>

		<Tab
			name="troveTabs"
			options={Troves}
			onSelect={handleSelectTrove} />

		<PoolView
			market={currentTrove}
			constants={constants} />
	</div>
};