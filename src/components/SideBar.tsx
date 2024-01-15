import React, { useState } from "react";
import { NavLink } from "./NavLink";
import { useLang } from "../hooks/useLang";
import { WEN } from "../libs/globalContants";
import { useLocation } from "react-router-dom";
import { useLiquity } from "../hooks/LiquityContext";

export const SideBar: React.FC = ({ children }) => {
  const { urlSearch } = useLiquity();
  const { t } = useLang();
  const { pathname } = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(window.innerWidth > 575.98);

  const handleShowMenuForMobile = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <div className="sider">
      <img
        src="images/logo+text.png"
        className="logo" />

      <hr className="division" />

      <NavLink
        label={t("borrow") + " " + WEN.symbol}
        icon="images/borrow.png"
        url={"/" + urlSearch}
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/"}
        target="_self" />

      <NavLink
        label={t("stake") + " " + WEN.symbol}
        icon="images/stake.png"
        url={"/stake" + urlSearch}
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/stake"}
        target="_self" />

      {/* <NavLink
        label={t("governance")}
        icon="images/governance.png"
        url=""
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/governance"} /> */}

      <NavLink
        label={t("liquidations")}
        icon="images/liquidations.png"
        url={"/liquidations" + urlSearch}
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/liquidations"}
        target="_self" />

      <NavLink
        label={" " + t("referral")}
        icon="images/referral.png"
        url={"/referral" + urlSearch}
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/referral"}
        target="_self" />

      <div
        className="navLink mainMenuForMobile"
        onClick={handleShowMenuForMobile}>
        <img src="images/main-menu.png" />

        {t("menu")}
      </div>

      {showMobileMenu && <div className="mainMenu">
        <NavLink
          label={t("docs")}
          icon="images/docs.png"
          url="https://docs.magma.finance/"
          fullWidth={true}
          showExternalLink={true}
          active={false}
          target="_blank" />

        <NavLink
          label={t("twitter")}
          icon="images/x.png"
          url="https://twitter.com/MagmaProtocol"
          fullWidth={true}
          showExternalLink={true}
          active={false}
          target="_blank" />

        <NavLink
          label={t("audit")}
          icon="images/audit.png"
          url="https://github.com/magma-fi/Audits/blob/main/MagmaStablecoin_final_Secure3_Audit_Report.pdf"
          fullWidth={true}
          showExternalLink={true}
          active={false}
          target="_blank" />

        <hr className="division" />

        <div style={{
          marginLeft: "16px",
          display: "flex",
          gap: "8px",
          flexDirection: "column"
        }}>
          {/* <StyleModeSelect /> */}

          {/* <LangSelect /> */}
        </div>
      </div>}
    </div>
  );
};
