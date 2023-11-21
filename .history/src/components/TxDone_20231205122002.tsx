/* eslint-disable @typescript-eslint/no-empty-function */
import { ReactElement } from "react";
import { useLang } from "../hooks/useLang";

export const TxDone = ({
  children,
  title = "",
  onClose = () => { },
  illustration,
  whereGoBack = "go back"
}: {
  children: ReactElement | ReactElement[];
  title: string;
  onClose: () => void;
  illustration: string;
  whereGoBack: string;
}) => {
  return <div className="modalOverlay">
    <div className="txDoneModal">
      {illustration && <img
        className="illustration"
        src={illustration} />}

      <h2>{title}</h2>

      {children}

      <button
        className="primaryButton bigButton"
        onClick={onClose}>{whereGoBack}</button>
    </div>
  </div>
};