import React, { useState } from "react";
import { NavLink } from "./NavLink";
import { useLang } from "../hooks/useLang";
import { WEN } from "../libs/globalContants";
import { useLocation } from "react-router-dom";
import { LangSelect } from "./LangSelect";
import { StyleModeSelect } from "./StyleModeSelect";

// const logoHeight = "32px";

// const select = ({ frontend }: LiquityStoreState) => ({
//   frontend
// });

export const SideBar: React.FC = ({ children }) => {
  const { t } = useLang();
  const { pathname } = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(window.innerWidth > 575.98);
  // const {
  //   config: { frontendTag }
  // } = useLiquity();
  // const { frontend } = useLiquitySelector(select);
  // const isFrontendRegistered = frontendTag === AddressZero || frontend.status === "registered";

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
        url="/"
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/"} />

      <NavLink
        label={t("stake") + " " + WEN.symbol}
        icon="images/stake.png"
        url="/stake"
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/stake"} />

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
        url="/liquidations"
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/liquidations"} />

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
          url="https://twitter.com/"
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
          <StyleModeSelect />

          <LangSelect />
        </div>

        <hr className="division" />

        {children}
      </div>}
    </div>
  );
};
