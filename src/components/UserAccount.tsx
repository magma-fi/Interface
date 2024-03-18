/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { formatNumber, shortenAddress } from "../utils";
import { useLang } from "../hooks/useLang";
import { Address, Chain, useAccount, useDisconnect, usePrepareSendTransaction, useSwitchNetwork } from "wagmi";
import { DropdownMenu } from "./DropdownMenu";
import { useEffect, useMemo } from "react";
import { LPScoreObject, OptionItem } from "../libs/types";
import { PopupView } from "./PopupView";
import { useLiquity } from "../hooks/LiquityContext";
import { parseEther } from "viem";
import { globalContants } from "../libs/globalContants";
import { Link } from "react-router-dom";

export const UserAccount = ({
  onConnect = () => { },
  isSupportedNetwork = true,
  chainId = 0,
  chains = [],
  points,
  pointObject
}: {
  onConnect: () => void;
  isSupportedNetwork: boolean;
  chainId: number;
  chains: Chain[];
  points: number;
  pointObject: Record<string, any>;
}) => {
  const { publicClient, account } = useLiquity();
  const { t } = useLang();
  const { isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();
  const chain = chains?.find(item => item.id === chainId);

  const { error } = usePrepareSendTransaction({
    chainId,
    to: account,
    value: parseEther("0.0000000000001")
  });

  useEffect(() => {
    if (error?.name === "ChainMismatchError" && chainId > 0) {
      setTimeout(() => {
        switchNetwork && switchNetwork(globalContants.DEFAULT_NETWORK_ID);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, chainId]);

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

  const pointsView = <div className="flex-row-align-left">
    <img
      src="images/magma.png"
      height="18px"
      style={{ width: "34px" }} />

    <div
      className="flex-column-align-left"
      style={{ gap: "4px" }}>
      <div className="label">{t("points")}</div>

      <div className="label bigLabel fat">{formatNumber(points, 0)}</div>
    </div>
  </div>

  const pointsListView = pointObject ? <div
    className="flex-column-align-left"
    style={{
      gap: "1rem",
      padding: "1rem"
    }}>
    <div className="flex-row-space-between points">
      <div className="label">
        <Link
          className="label"
          to="/stake">
          <span>{t("stabilityPoolPoints")}&nbsp;</span>

          <img
            src="/images/external-link.png"
            style={{
              width: "0.75rem"
            }} />
        </Link>
      </div>
      <div className="label fat">{formatNumber(pointObject.stabilityScore, 0)}</div>
    </div>

    <div className="flex-row-space-between points">
      <div className="label">
        <a
          className="label"
          href="https://mimo.exchange/add/0x6c0bf4b53696b5434a0d21c7d13aa3cbf754913e/IOTX"
          target="_blank">
          <span>{t("lpPoints")}&nbsp;</span>

          <img
            src="/images/external-link.png"
            style={{
              width: "0.75rem"
            }} />
        </a>
      </div>
      <div className="label fat">{formatNumber(pointObject.lpScore, 0)}</div>
    </div>

    {pointObject.lps?.length > 0 && pointObject.lps.map((lp: LPScoreObject) => {
      return <div className="flex-row-space-between points">
        <div className="label labelSmall">
          <span>&nbsp;•&nbsp;</span>

          <a
            className="textButton inLineTextButton labelSmall"
            href={lp.link}
            target="_blank">
            <span>{lp.name}&nbsp;LP</span>

            <img
              src="/images/external-link.png"
              style={{
                width: "0.65rem"
              }} />
          </a>
        </div>
        <div className="label labelSmall">{formatNumber(lp.points || 0, 0)}</div>
      </div>
    })}

    {pointObject.referrerPoints && <div className="flex-row-space-between points">
      <div className="label">{t("referralsPoints")}</div>
      <div className="label fat">{formatNumber(pointObject.referrerPoints, 0)}</div>
    </div>}

    <div
      className="flex-row-align-right label labelSmall"
      style={{
        textAlign: "right",
        width: "100%"
      }}>
      <a
        href="https://docs.magma.finance/protocol-concepts/magma-points"
        target="_blank">
        <span>Magma Points&nbsp;</span>

        <img
          src="/images/info.png"
          width="12px" />
      </a>
    </div>
  </div> : <></>

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
        <PopupView
          forcedClass="selectionTrigger"
          entryView={pointsView}
          showArrows={true}
          alignTop={true}
          popupView={pointsListView} />

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
