/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { Text, Flex, Box, Heading, Button } from "theme-ui";

import { Decimal, LiquityStoreState } from "lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { COIN, GT } from "../strings";
import { useLiquity } from "../hooks/LiquityContext";
import { shortenAddress } from "../utils";

import { Icon } from "./Icon";
import { useBondView } from "./Bonds/context/BondViewContext";
import { useBondAddresses } from "./Bonds/context/BondAddressesContext";
import { ConnectKitButton } from "connectkit";
import { useLang } from "../hooks/useLang";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const select = ({ accountBalance, lusdBalance, lqtyBalance }: LiquityStoreState) => ({
  accountBalance,
  lusdBalance,
  lqtyBalance
});

export const UserAccount = ({ onConnect = () => { } }) => {
  const { t } = useLang();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  // const { account } = useLiquity();
  // const { accountBalance, lusdBalance: realLusdBalance, lqtyBalance } = useLiquitySelector(select);
  // const { bLusdBalance, lusdBalance: customLusdBalance } = useBondView();
  // const { LUSD_OVERRIDE_ADDRESS } = useBondAddresses();

  // const lusdBalance = LUSD_OVERRIDE_ADDRESS === null ? realLusdBalance : customLusdBalance;

  const handleConnectWallet = () => {
    onConnect();
  };

  const handleDisconnect = () => {
    disconnect();
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

        <button
          className="textButton"
          onClick={handleDisconnect}>
          {t("disconnect")}
        </button>

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
