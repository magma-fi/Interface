/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useState } from "react";
import { Tab } from "../components/Tab";
import { useLang } from "../hooks/useLang";
import { Troves, WEN, globalContants } from "../libs/globalContants";
import { Coin } from "../libs/types";
import { MarketView } from "./MarketView";
import { Decimal } from "lib-base";

export const BorrowView = ({ constants, isReferrer }: {
	constants: Record<string, Decimal>;
	isReferrer: boolean;
}) => {
	const { t } = useLang();
	const [currentTrove, setCurrentTrove] = useState<Coin>(globalContants.COINS.IOTX);

	const handleSelectTrove = (idx: number) => {
		setCurrentTrove(globalContants.COINS[Troves[idx].title!])
	}

	return <div className="mainContainer">
		<div className="titleBox">
			<img
				className="viewIcon"
				src="images/borrow.png" />

			<h1>{t("borrow")}&nbsp;{WEN.symbol}</h1>

			<div className="description">{t("depositAndGet", { symbol: currentTrove?.symbol || "" })}</div>
		</div>

		<Tab
			name="troveTabs"
			options={Troves}
			onSelect={handleSelectTrove} />

		<MarketView
			isReferrer={isReferrer}
			market={currentTrove}
			constants={constants} />
	</div>
};