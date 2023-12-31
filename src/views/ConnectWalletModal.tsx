/* eslint-disable @typescript-eslint/no-empty-function */
import { useConnect } from "wagmi";
import { useLang } from "../hooks/useLang";
import { Modal } from "../components/Modal";

export const ConnectWalletModal = ({
	isOpen = false,
	onClose = () => { }
}) => {
	const { t } = useLang();
	const { connect, connectors, isLoading, pendingConnector } = useConnect();

	const handleConnect: React.MouseEventHandler<HTMLButtonElement> = (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		evt.stopPropagation();
		evt.preventDefault();
		connect({ connector: connectors[parseInt(evt.currentTarget.id)] });
	};

	return isOpen ? <Modal
		title={t("connectWallet")}
		onClose={onClose}>
		{connectors.map((connector, index) => {
			return <button
				key={connector.name}
				id={String(index)}
				disabled={!connector.ready || isLoading}
				className="textButton"
				onClick={handleConnect}>
				{connector.name}
				{connector.id === pendingConnector?.id && " (" + t("connecting") + ")"}
			</button>
		})}
	</Modal> : <></>
};