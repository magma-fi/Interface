/* eslint-disable @typescript-eslint/no-empty-function */
import { ReactElement } from "react";
import { useLang } from "../hooks/useLang";

export const TxDone = ({
  children,
  title = "",
  onClose = () => { }
}: {
  children: ReactElement | ReactElement[];
  title: string;
  onClose: () => void;
}) => {
  const { t } = useLang();

  return <div className="modalOverlay">
    <div className="txDoneModal">
      {children}
    </div>
  </div>
};