export const AppLoader = () => (
  <div
    className="modalOverlay"
    style={{
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "flex-end",
      gap: "0.5rem",
      padding: "2rem",
      width:"calc(100vw - 4rem)",
      height:"calc(100vh - 4rem)"
    }}>
    <img
      src="images/loading.gif"
      height="32px" />

    <h3>Loading...</h3>
  </div>
);
