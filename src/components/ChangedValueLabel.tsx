export const ChangedValueLabel = ({
	previousValue = "",
	newValue = ""
}: {
	previousValue: string | number;
	newValue: string | number;
}) => {
	return <div
		className="flex-row-align-left"
		style={{
			justifyContent: "center",
			alignItems: "center",
			whiteSpace: "nowrap"
		}}>
		<div className="label labelSmall">{previousValue}</div>

		<div>→</div>

		<div
			className="label"
			style={{ color: "#F6F6F7" }}>
			{newValue}
		</div>
	</div>
};