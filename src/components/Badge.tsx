import { useMemo } from "react";
import { BadgeType } from "../libs/globalContants";
import { useLang } from "../hooks/useLang";

export const Badge = ({ type, values }: {
  type: BadgeType,
  values?: Record<string, any>
}) => {
  const { t } = useLang();
  const colors: {
    bg: string;
    fg: string;
    icon: string;
  } = useMemo(() => {
    let bg = "";
    let fg = "";
    let icon = ""

    switch (type) {
      case BadgeType.Deposit:
        bg = "#10120d";
        fg = "#8ED434";
        icon = "images/deposit-green.png";
        break;

      case BadgeType.Borrow:
        bg = "#211816";
        fg = "#E4BC62";
        icon = "images/borrow-yellow.png";
        break;

      case BadgeType.Repay:
        bg = "#1a1c22";
        fg = "#59CDFF";
        icon = "images/repay-blue.png";
        break;

      case BadgeType.Withdraw:
        bg = "#170e0d";
        fg = "##FF9407";
        icon = "images/withdraw-orange.png";
        break;

      default:
        break;
    }

    return { bg, fg, icon };
  }, [type]);

  return <div
    className="badge"
    style={{
      backgroundColor: colors.bg,
      color: colors.fg
    }}>
    {colors.icon && <img src={colors.icon} />}

    {t(type, values)}
  </div>;
};
