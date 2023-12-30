import { useAccount, useConnect } from "wagmi";

type WalletConnectorProps = {
  loader?: React.ReactNode;
};

export const WalletConnector: React.FC<WalletConnectorProps> = ({ children }) => {
  const { connect, connectors, isLoading, pendingConnector } = useConnect();
  const { address, isConnected } = useAccount();

  // return (
  //   <ConnectKitButton.Custom>
  //     {connectKit =>
  //       connectKit.isConnected ? (
  //         children
  //       ) : (
  //         <Flex sx={{ height: "100vh", justifyContent: "center", alignItems: "center" }}>
  //           <button
  //             disabled={connectors[0].ready}
  //             onClick={connectKit.show}>
  //             <Icon name="plug" size="lg" />
  //             <Box sx={{ ml: 2 }}>Connect wallet</Box>
  //           </button>
  //         </Flex>
  //       )
  //     }
  //   </ConnectKitButton.Custom>
  // );

  return <>
    {isConnected ? children : <div>
      {connectors.map((connector) => (
        <button
          disabled={!connector.ready}
          key={connector.id}
          onClick={() => connect({ connector })}>
          {connector.name}
          {!connector.ready && ' (unsupported)'}
          {isLoading &&
            connector.id === pendingConnector?.id &&
            ' (connecting)'}
        </button>
      ))}
    </div>}
  </>
};
