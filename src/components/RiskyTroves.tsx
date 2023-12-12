import React, { useState, useEffect, useCallback } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Card, Button, Text, Box, Heading, Flex } from "theme-ui";

import {
  Percent,
  MINIMUM_COLLATERAL_RATIO,
  CRITICAL_COLLATERAL_RATIO,
  UserTrove,
  Decimal
} from "lib-base";
import { BlockPolledLiquityStoreState } from "lib-ethers";
import { useLiquitySelector } from "@liquity/lib-react";

import { shortenAddress } from "../utils";
import { useLiquity } from "../hooks/LiquityContext";
import { COIN } from "../strings";

import { Icon } from "./Icon";
import { LoadingOverlay } from "./LoadingOverlay";
import { Transaction } from "./Transaction";
import { Tooltip } from "./Tooltip";
import { Abbreviation } from "./Abbreviation";
import { useLang } from "../hooks/useLang";
import { PublicClient, useChainId, usePublicClient } from "wagmi";
import { IOTX, WEN } from "../libs/globalContants";

const rowHeight = "40px";

const liquidatableInNormalMode = (trove: UserTrove, price: Decimal) =>
  [trove.collateralRatioIsBelowMinimum(price), "Collateral ratio not low enough"] as const;

const liquidatableInRecoveryMode = (
  trove: UserTrove,
  price: Decimal,
  totalCollateralRatio: Decimal,
  lusdInStabilityPool: Decimal
) => {
  const collateralRatio = trove.collateralRatio(price);

  if (collateralRatio.gte(MINIMUM_COLLATERAL_RATIO) && collateralRatio.lt(totalCollateralRatio)) {
    return [
      trove.debt.lte(lusdInStabilityPool),
      "There's not enough WEN in the Stability pool to cover the debt"
    ] as const;
  } else {
    return liquidatableInNormalMode(trove, price);
  }
};

type RiskyTrovesProps = {
  pageSize: number;
};

const select = ({
  numberOfTroves,
  price,
  total,
  lusdInStabilityPool,
  blockTag
}: BlockPolledLiquityStoreState) => ({
  numberOfTroves,
  price,
  recoveryMode: total.collateralRatioIsBelowCritical(price),
  totalCollateralRatio: total.collateralRatio(price),
  lusdInStabilityPool,
  blockTag
});

export const RiskyTroves: React.FC<RiskyTrovesProps> = ({ pageSize }) => {
  const { t } = useLang();
  const {
    blockTag,
    numberOfTroves,
    recoveryMode,
    totalCollateralRatio,
    lusdInStabilityPool,
    price
  } = useLiquitySelector(select);
  const { liquity } = useLiquity();

  const [loading, setLoading] = useState(true);
  const [troves, setTroves] = useState<UserTrove[]>();

  const [reload, setReload] = useState({});
  const forceReload = useCallback(() => setReload({}), []);

  const [page, setPage] = useState(0);
  const numberOfPages = Math.ceil(numberOfTroves / pageSize) || 1;
  const clampedPage = Math.min(page, numberOfPages - 1);
  const chainId = useChainId();
  const client: PublicClient = usePublicClient({ chainId });

  const nextPage = () => {
    if (clampedPage < numberOfPages - 1) {
      setPage(clampedPage + 1);
    }
  };

  const previousPage = () => {
    if (clampedPage > 0) {
      setPage(clampedPage - 1);
    }
  };

  useEffect(() => {
    if (page !== clampedPage) {
      setPage(clampedPage);
    }
  }, [page, clampedPage]);

  useEffect(() => {
    let mounted = true;

    setLoading(true);

    liquity
      .getTroves(
        {
          first: pageSize,
          sortedBy: "ascendingCollateralRatio",
          startingAt: clampedPage * pageSize
        },
        { blockTag }
      )
      .then(troves => {
        if (mounted) {
          setTroves(troves);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
    // Omit blockTag from deps on purpose
    // eslint-disable-next-line
  }, [liquity, clampedPage, pageSize, reload]);

  useEffect(() => {
    forceReload();
  }, [forceReload, numberOfTroves]);

  const [copied, setCopied] = useState<string>();

  useEffect(() => {
    if (copied !== undefined) {
      let cancelled = false;

      setTimeout(() => {
        if (!cancelled) {
          setCopied(undefined);
        }
      }, 2000);

      return () => {
        cancelled = true;
      };
    }
  }, [copied]);

  return (
    <div style={{ width: "100%" }}>
      <div className="flex-row-space-between">
        <h3>{t("riskyTroves")}</h3>

        {/* <Flex sx={{ alignItems: "center" }}>
          {numberOfTroves !== 0 && (
            <>
              <Abbreviation
                short={`page ${clampedPage + 1} / ${numberOfPages}`}
                sx={{ mr: [0, 3], fontWeight: "body", fontSize: [1, 2], letterSpacing: [-1, 0] }}
              >
                {clampedPage * pageSize + 1}-{Math.min((clampedPage + 1) * pageSize, numberOfTroves)}{" "}
                of {numberOfTroves}
              </Abbreviation>

              <Button variant="titleIcon" onClick={previousPage} disabled={clampedPage <= 0}>
                <Icon name="chevron-left" size="lg" />
              </Button>

              <Button
                variant="titleIcon"
                onClick={nextPage}
                disabled={clampedPage >= numberOfPages - 1}
              >
                <Icon name="chevron-right" size="lg" />
              </Button>
            </>
          )}

          <Button
            variant="titleIcon"
            sx={{ opacity: loading ? 0 : 1, ml: [0, 3] }}
            onClick={forceReload}
          >
            <Icon name="redo" size="lg" />
          </Button>
        </Flex> */}
      </div>

      {troves && troves.length > 0 && <div className="table">
        {/* <div className="tableHeader">
          <tr>
            <th>Owner</th>
            <th>
              <Abbreviation short="Coll.">Collateral</Abbreviation>
              <Box sx={{ fontSize: [0, 1], fontWeight: "body", opacity: 0.5 }}>ETH</Box>
            </th>
            <th>
              Debt
              <Box sx={{ fontSize: [0, 1], fontWeight: "body", opacity: 0.5 }}>{COIN}</Box>
            </th>
            <th>
              Coll.
              <br />
              Ratio
            </th>
            <th></th>
          </tr>
        </div> */}

        <div className="tableBody">
          {troves.map(
            trove =>
              !trove.isEmpty && ( // making sure the Trove hasn't been liquidated
                // (WONT-FIX: remove check after we can fetch multiple Troves in one call)
                <div
                  className="tableRow"
                  key={trove.ownerAddress}>
                  <div className="tableCell">
                    <div className="label">{t("owner")}</div>

                    <a
                      className="textButton"
                      href={client.chain?.blockExplorers?.default.url + "/address/" + trove.ownerAddress}
                      target="_blank">
                      {shortenAddress(trove.ownerAddress)}

                      <img src="images/external-orange.png" />
                    </a>
                  </div>

                  <div className="tableCell">
                    <div className="label">{t("collateral")}</div>

                    <div>{trove.collateral.prettify(4) + " " + IOTX.symbol}</div>
                  </div>

                  <div className="tableCell">
                    <div className="label">{t("debt")}</div>

                    <div>{trove.debt.prettify() + " " + WEN.symbol}</div>
                  </div>

                  <div className="tableCell">
                    <div className="label">{t("utilizationRate")}</div>

                    <div>{Decimal.ONE.div(trove.collateralRatio(price)).mul(100).toString(2)}%</div>
                  </div>

                  <div className="tableCell">
                    <Transaction
                      id={`liquidate-${trove.ownerAddress}`}
                      tooltip="Liquidate"
                      requires={[
                        recoveryMode ? liquidatableInRecoveryMode(
                          trove,
                          price,
                          totalCollateralRatio,
                          lusdInStabilityPool
                        ) : liquidatableInNormalMode(trove, price)
                      ]}
                      send={liquity.send.liquidate.bind(liquity.send, trove.ownerAddress)}>
                      <button className="secondaryButton">{t("liquidate")}</button>
                    </Transaction>
                  </div>
                </div>
              )
          )}
        </div>
      </div>}

      {loading && <LoadingOverlay />}
    </div>
  );
};
