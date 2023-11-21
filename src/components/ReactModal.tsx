import React from "react";
import Modal from "react-modal";

const modalStyle = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "620px",
    width: "580px",
    maxHeight: "94vh",
    overflow: "visible"
  },
  overlay: { zIndex: 2 }
};

type ModalProps = {
  onDismiss: () => void;
  style?: React.CSSProperties;
  isOpen: boolean;
};

export const ReactModal: React.FC<ModalProps> = ({ children, onDismiss, style, isOpen = true }) => {
  const handleDismiss = () => onDismiss();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleDismiss}
      style={{
        ...modalStyle,
        content: { ...modalStyle.content, ...style }
      }}
    >
      <div
        style={{
          position: "static",
          overflowY: "scroll",
          maxHeight: "90vh"
        }}
      >
        {children}
      </div>
    </Modal>
  );
};
