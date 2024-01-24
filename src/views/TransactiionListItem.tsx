import { useMemo } from "react";
import { Coin, TroveChangeTx, TroveOperation } from "../libs/types";
import { Badge } from "../components/Badge";
import { BadgeType, WEN, globalContants } from "../libs/globalContants";
import { Decimal } from "lib-base";
import { useLiquity } from "../hooks/LiquityContext";

export const TransactiionListItem = ({
	data,
	market,
	price = Decimal.ONE
}: {
	data: TroveChangeTx;
	market: Coin;
	price: Decimal;
}) => {
	const { chainId, publicClient } = useLiquity();
	const theTime = useMemo(() => new Date(data.transaction.timestamp * 1000), [data.transaction.timestamp]);
	const date = theTime.toLocaleDateString();
	const time = theTime.getHours() + ":" + theTime.getMinutes();
	const col = Number(data.collateralChange);
	const deb = Number(data.debtChange);

	const badgeTypes = useMemo(() => {
		const type: BadgeType[] = [];

		switch (data.troveOperation) {
			case TroveOperation.OpenTrove:
			case TroveOperation.AdjustTrove:
			case TroveOperation.CloseTrove:
			case TroveOperation.RedeemCollateral:
			case TroveOperation.LiquidateInNormalMode:
				if (col > 0) {
					type.push(BadgeType.Deposit);
				}

				if (col < 0) {
					type.push(BadgeType.Withdraw);
				}

				if (deb > 0) {
					type.push(BadgeType.Borrow);
				}

				if (deb < 0) {
					type.push(BadgeType.Repay);
				}

				break;

			default:
				console.warn("未匹配的troveOperation", data.troveOperation);
				break;
		}

		return type;
	}, [col, data.troveOperation, deb]);

	const twoBadgeTypes = useMemo(() => {
		if (badgeTypes.length !== 2) return "";

		let str = "";
		badgeTypes.forEach((item, idx) => {
			str += item.toString() + (idx === 0 ? " & " : "");
		});
		return str;
	}, [badgeTypes]);

	return <a
		className="transactionListItem"
		href={publicClient?.chain?.blockExplorers?.default.url + "/tx/" + data.transaction.id}
		target="_blank">
		{badgeTypes.length === 1 && <>
			<div
				className="flex-column-align-left"
				style={{ gap: "8px" }}>
				<div
					className="flex-row-align-left"
					style={{ alignItems: "flex-end" }}>
					<div>{date}</div>
					<div className="label smallLabel">{time}</div>
				</div>

				{badgeTypes && <div className="flex-row-align-left">
					{badgeTypes.map((badge, idx) => {
						return <Badge
							key={badge + idx}
							type={badge} />
					})}
				</div>}
			</div>

			<div className="txValues">
				<div className="flex-row-align-left">
					{col !== 0 && <div>
						{Math.abs(col).toFixed(2)}&nbsp;{market.symbol}
					</div>}

					{deb !== 0 && <div>
						{Math.abs(deb).toFixed(2)}&nbsp;{WEN.symbol}
					</div>}
				</div>

				<div className="flex-row-align-left">
					{col !== 0 && <div className="label smallLabel">
						{(col < 0 ? "-" : "") + price.mul(Math.abs(col)).shorten()}&nbsp;{globalContants.USD}
					</div>}

					{deb !== 0 && <div className="label smallLabel">
						{(deb < 0 ? "-" : "") + Decimal.from(Math.abs(deb)).shorten()}&nbsp;{globalContants.USD}
					</div>}
				</div>
			</div>
		</>}

		{badgeTypes.length === 2 && <>
			<div
				className="flex-column-align-left"
				style={{ gap: "8px" }}>
				<div
					className="flex-row-align-left"
					style={{ alignItems: "flex-end" }}>
					<div>{date}</div>
					<div className="label smallLabel">{time}</div>
				</div>

				{col !== 0 && <div>
					{Math.abs(col).toFixed(2)}&nbsp;{market.symbol}
				</div>}

				{col !== 0 && <div className="label smallLabel">
					{price.mul(Math.abs(col)).shorten()}&nbsp;{globalContants.USD}
				</div>}

				<Badge type={badgeTypes[0]} />
			</div>

			<div className="txValues">
				<Badge label={twoBadgeTypes} />


				{deb !== 0 && <div>
					{Math.abs(deb).toFixed(2)}&nbsp;{WEN.symbol}
				</div>}

				{deb !== 0 && <div className="label smallLabel">
					{Decimal.from(Math.abs(deb)).shorten()}&nbsp;{globalContants.USD}
				</div>}

				<Badge type={badgeTypes[1]} />

			</div>
		</>}
	</a>
};