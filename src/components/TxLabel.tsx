import { useLang } from "../hooks/useLang";
import { useLiquity } from "../hooks/LiquityContext";

export const TxLabel = ({
	txHash,
	title,
	logo,
	amount
}: {
	txHash?: string;
	title: string;
	logo: string;
	amount: string;
}) => {
	const { t } = useLang();
	const { publicClient } = useLiquity();

	return <div className="txLabel">
		<div className="flex-row-align-left">
			<img
				src={logo}
				width="40px" />

			<div className="flex-column-align-left">
				<div className="label">{title}</div>

				<div className="label labelSmall">{amount}</div>
			</div>
		</div>

		{txHash && <a
			className="textButton"
			href={publicClient!.chain?.blockExplorers?.default.url + "/tx/" + txHash}
			target="_blank">
			{t("viewInExplorer")}

			<img src="images/external-orange.png" />
		</a>}
	</div>
};