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

	return isOpen ? <div className="modalOverlay">
		<div className="txDoneModal">
			<button
				className="iconButton"
				style={{
					position: "absolute",
					right: "16px",
					top: "16px"
				}}
				onClick={onClose}>
				<img src="images/close-x.png" />
			</button>

			<img
				className="illustration"
				src="images/wallet-connection.png" />

			<h2>{t("connectYourWallet")}</h2>

			<div className="label">{t("connectYourWalletDescription")}</div>

			{connectors.map((connector, index) => {
				let name = connector.name;

				// 判断是不是ioPay
				if (name === "Trust Wallet" && window.navigator.userAgent.indexOf("IoPay") >= 0) {
					name = "ioPay";
				}

				return <button
					key={connector.name}
					id={String(index)}
					disabled={!connector.ready || isLoading}
					className="secondaryButton bigButton"
					onClick={handleConnect}>
					<img src={"images/" + name + ".png"} />

					<span>
						{name}
						{connector.id === pendingConnector?.id && " (" + t("connecting") + ")"}
					</span>
				</button>
			})}
		</div>
	</div> : <></>
};