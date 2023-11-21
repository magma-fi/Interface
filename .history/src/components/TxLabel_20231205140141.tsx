import { useChainId, usePublicClient } from "wagmi";
import { useLang } from "../hooks/useLang";
import { PublicClient } from "viem";

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
	const { t } = useLang();
	const chainId = useChainId();
	const client: PublicClient = usePublicClient({ chainId });

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

		<a
			className="textButton"
			href={client.chain?.blockExplorers?.default.url + "/tx/" + txHash}
			target="_blank">
			{t("viewInExplorer")}

			<img src="images/external-orange.png" />
		</a>
	</div>
};