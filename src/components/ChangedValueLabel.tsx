export const ChangedValueLabel = ({
	previousValue = "",
	newValue = ""
}: {
	previousValue: string | number;
	newValue: string | number;
}) => {
	return <div className="flex-row-align-left">
		<div className="label labelSmall">{previousValue}</div>

		<div
			className="label"
			style={{ color: "#F6F6F7" }}>
			{newValue}
		</div>
	</div>
};