import { globalContants } from "../libs/globalContants";

export const ChangedValueLabel = ({
	previousValue = 0,
	newValue = 0,
	previousPostfix,
	nextPostfix,
	positive = true,
	showArrow = true
}: {
	previousValue: number;
	newValue: number;
	previousPostfix?: string;
	nextPostfix?: string;
	positive?: boolean;
	showArrow?: boolean;
}) => {
	return <div
		className="flex-row-align-left"
		style={{
			justifyContent: "center",
			alignItems: "center",
			whiteSpace: "nowrap"
		}}>
		<div
			className="label labelSmall"
			style={{ textDecoration: "line-through" }}>
			{previousValue.toLocaleString("en-US", { maximumFractionDigits: globalContants.DECIMALS_2 })}

			{previousPostfix && ((previousPostfix !== "%" ? " " : "") + previousPostfix)}
		</div>

		<img
			src="images/arrow-small-right.png"
			width="6px" />

		<div
			className="label"
			style={{ color: "#F6F6F7" }}>
			{newValue.toLocaleString("en-US", { maximumFractionDigits: globalContants.DECIMALS_2 })}

			{nextPostfix && ((nextPostfix !== "%" ? " " : "") + nextPostfix)}
		</div>

		{(showArrow || previousValue.toFixed(globalContants.DECIMALS_2) !== newValue.toFixed(globalContants.DECIMALS_2)) && <img
			src={"images/" + (positive ? (
				previousValue > newValue ? "green-down" : "green-up"
			) : (
				previousValue > newValue ? "red-down" : "red-up"
			)) + ".png"}
			width="9px" />}
	</div>
};