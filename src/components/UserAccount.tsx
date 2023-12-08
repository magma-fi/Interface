/* eslint-disable @typescript-eslint/no-empty-function */
import { shortenAddress } from "../utils";
import { useLang } from "../hooks/useLang";
import { Chain, useAccount, useDisconnect, useSwitchNetwork } from "wagmi";
import { DropdownMenu } from "./DropdownMenu";
import { useMemo } from "react";
import { OptionItem } from "../libs/types";

// const select = ({ accountBalance, lusdBalance, lqtyBalance }: LiquityStoreState) => ({
//   accountBalance,
//   lusdBalance,
//   lqtyBalance
// });

export const UserAccount = ({
  onConnect = () => { },
  isSupportedNetwork = true,
  chains = []
}) => {
  const { t } = useLang();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();
  // const { connect, connectors } = useConnect();
  // const { account } = useLiquity();
  // const { accountBalance, lusdBalance: realLusdBalance, lqtyBalance } = useLiquitySelector(select);
  // const { bLusdBalance, lusdBalance: customLusdBalance } = useBondView();
  // const { LUSD_OVERRIDE_ADDRESS } = useBondAddresses();
  // const lusdBalance = LUSD_OVERRIDE_ADDRESS === null ? realLusdBalance : customLusdBalance;

  const chainOptions = useMemo(() => {
    return chains.map((item: Chain) => {
      return { title: item.name } as OptionItem;
    })
  }, [chains]);

  const handleConnectWallet = () => {
    onConnect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSwitchNetwork = (idx: number) => {
    switchNetwork && switchNetwork((chains[idx] as Chain).id);
  };

  return (
    <div style={{ marginLeft: "16px" }}>
      {/* <ConnectKitButton.Custom>
        {connectKit => (
          <Button
            variant="outline"
            sx={{ alignItems: "center", p: 2, mr: 3 }}
            onClick={connectKit.show}
          >
            <Icon name="user-circle" size="lg" />
            <Text as="span" sx={{ ml: 2, fontSize: 1 }}>
              {shortenAddress(account)}
            </Text>
          </Button>
        )}
      </ConnectKitButton.Custom> */}

      {!isConnected && <button
        className="primaryButton"
        onClick={handleConnectWallet}>
        {t("connectWallet")}
      </button>}

      {address && <div style={{
        display: "flex",
        flexDirection: "row",
        gap: "8px",
        justifyContent: "flex-start",
        alignItems: "center"
      }}>
        <img
          src="images/wallet.png"
          width="21px"
          height="18px" />

        <div className="propertyText">{shortenAddress(address)}</div>

        {isSupportedNetwork ? <button
          className="textButton"
          onClick={handleDisconnect}>
          {t("disconnect")}
        </button> : <DropdownMenu
          options={chainOptions}
          onChange={handleSwitchNetwork}>
          <button className="textButton">{t("switchNetwork")}</button>
        </DropdownMenu>}

        {/* {([
          ["ETH", accountBalance],
          // [COIN, Decimal.from(lusdBalance || 0)],
          [COIN, Decimal.from(0)],
          // [GT, Decimal.from(lqtyBalance)],
          [GT, Decimal.from(0)],
          // ["bLUSD", Decimal.from(bLusdBalance || 0)]
          ["bLUSD", Decimal.from(0)]
        ] as const).map(([currency, balance], i) => (
          <div key={i} sx={{ ml: 3, flexDirection: "column" }}>
            <Heading sx={{ fontSize: 1 }}>{currency}</Heading>
            <Text sx={{ fontSize: 1 }}>{balance.prettify()}</Text>
          </div>
        ))} */}
      </div>}
    </div>
  );
};
