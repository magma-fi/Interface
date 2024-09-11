import { useState } from "react";
import { AmountInput } from "../components/AmountInput";
import { globalContants, USDT, WEN } from "../libs/globalContants";
import { Coin } from "../libs/types";
import { formatAsset, formatAssetAmount } from "../utils";
import { useLang } from "../hooks/useLang";

export const PSM = ({ magmaData }: {
	magmaData?: Record<string, any>;
}) => {
	const { t } = useLang();
	const [fromToken, setFromToken] = useState<Coin>(WEN);
	const [toToken, setToToken] = useState<Coin>(USDT);
	const maxWenNumber = formatAssetAmount(magmaData?.lusdBalance || globalContants.BIG_NUMBER_0, WEN.decimals);

	return <div
		className="mainContainer"
		style={{ alignItems: "center" }}>
		<div className="centerBox">
			<div className="titleBar">
				<h2>PSM</h2>

				<div>Swap USDT for WEN</div>
			</div>

			<div>
				<AmountInput
					coin={fromToken}
					price={0}
					allowSwap={false}
					valueForced={0}
					onInput={function (val: number): void {
						throw new Error("Function not implemented.");
					}}
					max={maxWenNumber}
					warning="" />

				<div
					className="label flex-row-space-between"
					style={{ marginTop: "1rem" }}>
					<div>{t("walletBalance")}</div>

					<div>{formatAsset(maxWenNumber, WEN)}</div>
				</div>
			</div>

			<img
				src="images/swap.png"
				width="16px" />

			<div>
				<AmountInput
					coin={toToken}
					price={0}
					allowSwap={false}
					valueForced={0}
					onInput={function (val: number): void {
						throw new Error("Function not implemented.");
					}}
					max={0}
					warning="" />

				<div
					className="label flex-row-space-between"
					style={{ marginTop: "1rem" }}>
					<div>{t("walletBalance")}</div>

					<div>{formatAsset(0, USDT)}</div>
				</div>
			</div>

			<button>Approve</button>
		</div>
	</div>
};