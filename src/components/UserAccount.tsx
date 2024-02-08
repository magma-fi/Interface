/* eslint-disable @typescript-eslint/no-empty-function */
import { shortenAddress } from "../utils";
import { useLang } from "../hooks/useLang";
import { Address, Chain, useAccount, useDisconnect, useSwitchNetwork } from "wagmi";
import { DropdownMenu } from "./DropdownMenu";
import { useMemo } from "react";
import { OptionItem } from "../libs/types";
import { PopupView } from "./PopupView";
import { useLiquity } from "../hooks/LiquityContext";

export const UserAccount = ({
  onConnect = () => { },
  isSupportedNetwork = true,
  chainId = 0,
  chains = [],
  points
}: {
  onConnect: () => void;
  isSupportedNetwork: boolean;
  chainId: number;
  chains: Chain[];
  points: number;
}) => {
  const { publicClient, account } = useLiquity();
  const { t } = useLang();
  const { isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();
  const chain = chains?.find(item => item.id === chainId);

  const chainOptions = useMemo(() => {
    return chains.map((item: Chain) => {
      return { title: item.name } as OptionItem;
    })
  }, [chains]);

  const handleConnectWallet = () => {
    onConnect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSwitchNetwork = (idx: number) => {
    switchNetwork && switchNetwork((chains[idx] as Chain).id);
  };

  const entryView = isConnected ? <div className="flex-row-align-left">
    <img
      src={"images/" + connector?.name + ".png"}
      width="21px"
      height="18px" />

    <div
      className="flex-column-align-left"
      style={{ gap: "4px" }}>
      <div className="label">{t("wallet")}</div>

      <div className="label bigLabel fat">{shortenAddress(account as Address, 5, 2)}</div>
    </div>
  </div> : <></>

  const popupView = <div
    className="flex-column-align-center"
    style={{ gap: "1rem" }}>
    <a
      className="textButton smallTextButton"
      style={{ color: "#FF7F1E" }}
      href={publicClient?.chain?.blockExplorers?.default.url + "/address/" + account}
      target="_blank">
      {t("viewInExplorer")}

      <img src="images/external-orange.png" />
    </a>

    <button
      className="primaryButton"
      onClick={handleDisconnect}
      style={{
        paddingLeft: "3rem",
        paddingRight: "3rem"
      }}>
      {t("disconnect")}
    </button>
  </div>

  return (
    <div className="topBar">
      <img
        className="logoOnTopBar"
        src="images/magma.png"
        height="32px" />

      <span>&nbsp;</span>

      {!isConnected && <div className="flex-row-align-left">
        <div className="selectionTrigger">
          <img
            src="images/iotx.png"
            width="24px" />

          <div
            className="flex-column-align-left"
            style={{ gap: "4px" }}>
            <div className="label">{t("network")}</div>

            <div className="label bigLabel fat">{chains[0].name}</div>
          </div>
        </div>

        <button
          className="primaryButton"
          onClick={handleConnectWallet}>
          <img src="images/wallet-dark.png" />

          {t("connectWallet")}
        </button>
      </div>}

      {isConnected && account && <div className="userAccountBox">
        {points >= 0 && <div className="flex-row-align-left points">
          <div className="label">{t("points")}:</div>
          <div className="label fat">{points.toFixed(0)}</div>
        </div>}

        <div className="flex-row-align-left">
          <DropdownMenu
            defaultValue={chains.findIndex(item => item.id === chainId)}
            options={chainOptions}
            onChange={handleSwitchNetwork}
            showArrows
            alignTop
            forcedClass="selectionTrigger">
            <div className="flex-row-align-left">
              <img
                src="images/iotx.png"
                width="24px" />

              <div
                className="flex-column-align-left"
                style={{ gap: "4px" }}>
                <div className="label">{t("network")}</div>

                <div className="label bigLabel fat chainNameLabel">{chain?.name}</div>
              </div>
            </div>
          </DropdownMenu>

          <PopupView
            entryView={entryView}
            showArrows={true}
            alignTop={true}
            popupView={popupView}
            forcedClass="selectionTrigger" />
        </div>
      </div>}
    </div>
  );
};
