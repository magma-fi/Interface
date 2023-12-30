import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  MINIMUM_COLLATERAL_RATIO,
  UserTrove,
  Decimal
} from "lib-base";
import { BlockPolledLiquityStoreState } from "lib-ethers";
import { useLiquitySelector } from "@liquity/lib-react";
import { shortenAddress } from "../utils";
import { useLiquity } from "../hooks/LiquityContext";
import { Icon } from "./Icon";
import { LoadingOverlay } from "./LoadingOverlay";
import { useTransactionState } from "./Transaction";
import { Abbreviation } from "./Abbreviation";
import { useLang } from "../hooks/useLang";
import { IOTX, WEN } from "../libs/globalContants";
import appConfig from "../appConfig.json";
import { LiquidatableTrove } from "../libs/types";

// const rowHeight = "40px";

// const liquidatableInNormalMode = (trove: UserTrove, price: Decimal) =>
//   [trove.collateralRatioIsBelowMinimum(price), "Collateral ratio not low enough"] as const;

// const liquidatableInRecoveryMode = (
//   trove: UserTrove,
//   price: Decimal,
//   totalCollateralRatio: Decimal,
//   lusdInStabilityPool: Decimal
// ) => {
//   const collateralRatio = trove.collateralRatio(price);

//   if (collateralRatio.gte(MINIMUM_COLLATERAL_RATIO) && collateralRatio.lt(totalCollateralRatio)) {
//     return [
//       trove.debt.lte(lusdInStabilityPool),
//       "There's not enough WEN in the Stability pool to cover the debt"
//     ] as const;
//   } else {
//     return liquidatableInNormalMode(trove, price);
//   }
// };

type RiskyTrovesProps = {
  pageSize: number;
  constants: Record<string, Decimal>;
};

const select = ({
  price,
  total,
  lusdInStabilityPool,
  blockTag
}: BlockPolledLiquityStoreState) => ({
  price,
  recoveryMode: total.collateralRatioIsBelowCritical(price),
  totalCollateralRatio: total.collateralRatio(price),
  lusdInStabilityPool,
  blockTag
});

export const RiskyTroves: React.FC<RiskyTrovesProps> = ({ pageSize, constants }) => {
  const { t } = useLang();
  const {
    blockTag,
    recoveryMode,
    totalCollateralRatio,
    lusdInStabilityPool,
    price
  } = useLiquitySelector(select);
  const factor = 0.95;
  const { liquity, chainId,publicClient } = useLiquity();
  const [loading, setLoading] = useState(true);
  const [troves, setTroves] = useState<UserTrove[]>();
  const [reload, setReload] = useState({});
  const forceReload = useCallback(() => setReload({}), []);
  const [page, setPage] = useState(0);
  const mcr = constants?.MCR?.gt(0) ? constants.MCR : Decimal.from(appConfig.constants[String(chainId)].MAGMA_MINIMUM_COLLATERAL_RATIO);

  const liquidatableTroves: LiquidatableTrove[] = useMemo(() => {
    const tempArr: LiquidatableTrove[] = [];
    troves?.forEach((trove) => {
      if (recoveryMode) {
        const collateralRatio = trove.collateralRatio(price);

        if (collateralRatio.gte(mcr) && collateralRatio.lt(totalCollateralRatio)) {
          (trove as LiquidatableTrove).liquidatable = true;
          tempArr.push(trove as LiquidatableTrove);
        }
      } else {
        const theRatio = trove.collateralRatio(price);

        if (theRatio.lt(mcr.div(factor))) {
          tempArr.push(trove as LiquidatableTrove);

          if (theRatio.lt(mcr)) (trove as LiquidatableTrove).liquidatable = true;
        }
      }
    });

    return tempArr;
  }, [mcr, price, recoveryMode, totalCollateralRatio, troves]);

  const numberOfTroves = liquidatableTroves?.length || 0;
  const numberOfPages = Math.ceil(numberOfTroves / pageSize) || 1;
  const clampedPage = Math.min(page, numberOfPages - 1);
  const [resetTx, setResetTx] = useState(false);
  const txId = useMemo(() => String(new Date().getTime()), [resetTx]);
  const [transactionState, setTransactionState] = useTransactionState();

  // 交易结束或失败后重置transactionState。
  useEffect(() => {
    if (transactionState.id === txId && (transactionState.type === "confirmed" || transactionState.type === "failed")) {
      setTransactionState({ type: "idle" });
      setResetTx(!resetTx);

      setTimeout(() => {
        setReload({});
      }, 5000);
    }
  }, [transactionState.id, transactionState.type, txId])

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

  // const [copied, setCopied] = useState<string>();

  // useEffect(() => {
  //   if (copied !== undefined) {
  //     let cancelled = false;

  //     setTimeout(() => {
  //       if (!cancelled) {
  //         setCopied(undefined);
  //       }
  //     }, 2000);

  //     return () => {
  //       cancelled = true;
  //     };
  //   }
  // }, [copied]);

  const handleLiquidate = (evt: React.MouseEvent<HTMLButtonElement>) => {
    const owner = evt.currentTarget.id;
    const send = liquity.send.liquidate.bind(liquity.send, owner)
    const id = txId;

    const hasMessage = (error: unknown): error is { message: string } =>
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string";

    const sendTransaction = async () => {
      setTransactionState({ type: "waitingForApproval", id });

      try {
        const tx = await send();

        setTransactionState({
          type: "waitingForConfirmation",
          id,
          tx
        });
      } catch (error) {
        if (hasMessage(error) && error.message.includes("User denied transaction signature")) {
          setTransactionState({ type: "cancelled", id });
        } else {
          console.error(error);

          setTransactionState({
            type: "failed",
            id,
            error: new Error("Failed to send transaction (try again)")
          });
        }
      }
    };

    return sendTransaction();
  };

  return <>
    {loading && <LoadingOverlay />}

    {!loading && <div style={{ width: "100%" }}>
      <div className="flex-row-space-between">
        <h3>{t("riskyTroves")}</h3>
      </div>

      {liquidatableTroves && liquidatableTroves.length > 0 && <div className="table">
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
          {liquidatableTroves.map(trove => {
            return !trove.isEmpty && <div
              className="tableRow"
              key={trove.ownerAddress}>
              <div className="tableCell">
                <div className="label">{t("owner")}</div>

                <a
                  className="textButton"
                  href={publicClient.chain?.blockExplorers?.default.url + "/address/" + trove.ownerAddress}
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
                <button
                  id={trove.ownerAddress}
                  className="secondaryButton"
                  onClick={handleLiquidate}
                  disabled={transactionState.type !== "idle" || !trove.liquidatable}>
                  {t("liquidate")}
                </button>
              </div>
            </div>
          }
          )}
        </div>
      </div>}

      {liquidatableTroves?.length === 0 && <p className="description">{t("noLiquidatableTrove")}</p>}


      <div className="paging">
        {numberOfTroves !== 0 && <>
          <Abbreviation
            short={`page ${clampedPage + 1} / ${numberOfPages}`}
            sx={{ mr: [0, 3], fontWeight: "body", fontSize: [1, 2], letterSpacing: [-1, 0] }}>
            {clampedPage * pageSize + 1}-{Math.min((clampedPage + 1) * pageSize, numberOfTroves)}{" "}
            of {numberOfTroves}
          </Abbreviation>

          <button
            className="textButton"
            onClick={previousPage}
            disabled={clampedPage <= 0}>
            <Icon name="chevron-left" size="lg" />
          </button>

          <span>&nbsp;&nbsp;</span>

          <button
            className="textButton"
            onClick={nextPage}
            disabled={clampedPage >= numberOfPages - 1}>
            <Icon name="chevron-right" size="lg" />
          </button>
        </>}

        {/* <Button
          variant="titleIcon"
          sx={{ opacity: loading ? 0 : 1, ml: [0, 3] }}
          onClick={forceReload}
        >
          <Icon name="redo" size="lg" />
        </Button> */}
      </div>
    </div>}
  </>;
};
