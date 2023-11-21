export const TxLabel = ({
	txHash,
	title,
	logo,
	value,
	amount
}: {
	txHash: string;
	title: string;
	logo: string;
	value: string;
	amount: string;
}) => {
	return <div className="txLabel">
		<div className="flex-column-align-left">
			<div className="label">{title}</div>

			<div className="flex-row-align-left">
				<img
					src={logo}
					width="40px" />

				<div className="flex-column-align-left">
					<div>{value}</div>

					<div className="label labelSmall">{amount}</div>
				</div>
			</div>
		</div>
	</div>
};