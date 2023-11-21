/* eslint-disable @typescript-eslint/no-empty-function */
import React, { ReactElement } from "react";
import { useLang } from "../hooks/useLang";

export const Modal = ({
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
    <div className="modal">
      <div className="titleBar">
        <h2>{title}</h2>

        <button
          className="textButton"
          onClick={onClose}>
          {t("close")}

          <img src="images/close.png" />
        </button>
      </div>

      {children}
    </div>
  </div>
};