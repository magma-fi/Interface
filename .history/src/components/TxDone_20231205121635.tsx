/* eslint-disable @typescript-eslint/no-empty-function */
import { ReactElement } from "react";
import { useLang } from "../hooks/useLang";

export const TxDone = ({
  children,
  title = "",
  onClose = () => { },
  illustration
}: {
  children: ReactElement | ReactElement[];
  title: string;
  onClose: () => void;
  illustration: string;
}) => {
  const { t } = useLang();

  return <div className="modalOverlay">
    <div className="txDoneModal">
      {illustration && <img src={illustration} />}

      {children}
    </div>
  </div>
};