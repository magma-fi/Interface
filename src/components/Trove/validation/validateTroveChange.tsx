import {
  Decimal,
  LUSD_MINIMUM_DEBT,
  LUSD_MINIMUM_NET_DEBT,
  Trove,
  TroveAdjustmentParams,
  TroveChange,
  Percent,
  MINIMUM_COLLATERAL_RATIO,
  CRITICAL_COLLATERAL_RATIO,
  LiquityStoreState,
  TroveClosureParams,
  TroveCreationParams
} from "lib-base";

import { COIN } from "../../../strings";

import { ActionDescription, Amount } from "../../ActionDescription";
import { ErrorDescription } from "../../ErrorDescription";
import { ErrorMessage } from "../../../libs/types";
import { WEN } from "../../../libs/globalContants";

type TroveAdjustmentDescriptionParams = {
  params: TroveAdjustmentParams<Decimal>;
};

const TroveChangeDescription: React.FC<TroveAdjustmentDescriptionParams> = ({ params }) => (
  <ActionDescription>
    {params.depositCollateral && params.borrowLUSD ? (
      <>
        You will deposit <Amount>{params.depositCollateral.prettify()} ETH</Amount> and receive{" "}
        <Amount>
          {params.borrowLUSD.prettify()} {COIN}
        </Amount>
      </>
    ) : params.repayLUSD && params.withdrawCollateral ? (
      <>
        You will pay{" "}
        <Amount>
          {params.repayLUSD.prettify()} {COIN}
        </Amount>{" "}
        and receive <Amount>{params.withdrawCollateral.prettify()} ETH</Amount>
      </>
    ) : params.depositCollateral && params.repayLUSD ? (
      <>
        You will deposit <Amount>{params.depositCollateral.prettify()} ETH</Amount> and pay{" "}
        <Amount>
          {params.repayLUSD.prettify()} {COIN}
        </Amount>
      </>
    ) : params.borrowLUSD && params.withdrawCollateral ? (
      <>
        You will receive <Amount>{params.withdrawCollateral.prettify()} ETH</Amount> and{" "}
        <Amount>
          {params.borrowLUSD.prettify()} {COIN}
        </Amount>
      </>
    ) : params.depositCollateral ? (
      <>
        You will deposit <Amount>{params.depositCollateral.prettify()} ETH</Amount>
      </>
    ) : params.withdrawCollateral ? (
      <>
        You will receive <Amount>{params.withdrawCollateral.prettify()} ETH</Amount>
      </>
    ) : params.borrowLUSD ? (
      <>
        You will receive{" "}
        <Amount>
          {params.borrowLUSD.prettify()} {COIN}
        </Amount>
      </>
    ) : (
      <>
        You will pay{" "}
        <Amount>
          {params.repayLUSD.prettify()} {COIN}
        </Amount>
      </>
    )}
    .
  </ActionDescription>
);

export const selectForTroveChangeValidation = ({
  price,
  total,
  accountBalance,
  lusdBalance,
  numberOfTroves
}: LiquityStoreState) => ({ price, total, accountBalance, lusdBalance, numberOfTroves });

type TroveChangeValidationSelectedState = ReturnType<typeof selectForTroveChangeValidation>;

interface TroveChangeValidationContext extends TroveChangeValidationSelectedState {
  originalTrove: Trove;
  resultingTrove: Trove;
  recoveryMode: boolean;
  wouldTriggerRecoveryMode: boolean;
}

export const validateTroveChange = (
  originalTrove: Trove,
  adjustedTrove: Trove,
  borrowingRate: Decimal,
  selectedState: TroveChangeValidationSelectedState,
  constants?: Record<string, Decimal>
): [
    validChange: Exclude<TroveChange<Decimal>, { type: "invalidCreation" }> | undefined,
    description: JSX.Element | ErrorMessage | undefined
  ] => {
  const wenMinimumDebt = constants?.MIN_NET_DEBT.add(constants?.LUSD_GAS_COMPENSATION) || LUSD_MINIMUM_DEBT;
  const { total, price } = selectedState;
  const change = originalTrove.whatChanged(adjustedTrove, borrowingRate);

  if (!change) {
    return [undefined, undefined];
  }

  // Reapply change to get the exact state the Trove will end up in (which could be slightly
  // different from `edited` due to imprecision).
  const resultingTrove = originalTrove.apply(change, borrowingRate);
  const recoveryMode = total.collateralRatioIsBelowCritical(price);

  const wouldTriggerRecoveryMode = total.subtract(originalTrove).add(resultingTrove).collateralRatioIsBelowCritical(price);

  const context: TroveChangeValidationContext = {
    ...selectedState,
    originalTrove,
    resultingTrove,
    recoveryMode,
    wouldTriggerRecoveryMode
  };

  if (change.type === "invalidCreation") {
    // Trying to create a Trove with negative net debt
    return [
      undefined,
      // <ErrorDescription>
      //   Total debt must be at least{" "}
      //   <Amount>
      //     {LUSD_MINIMUM_DEBT.toString()} {COIN}
      //   </Amount>
      //   .
      // </ErrorDescription>
      {
        key: "debtMustBe",
        values: { amount: wenMinimumDebt.toString() + " " + WEN.symbol }
      } as ErrorMessage
    ];
  }

  const errorDescription =
    change.type === "creation"
      ? validateTroveCreation(change.params, context, constants)
      : change.type === "closure"
        ? validateTroveClosure(change.params, context, constants)
        : validateTroveAdjustment(change.params, context, constants);


  if (errorDescription) {
    return [undefined, errorDescription];
  }

  return [change, <TroveChangeDescription params={change.params} />];
};

const validateTroveCreation = (
  { depositCollateral, borrowLUSD }: TroveCreationParams<Decimal>,
  {
    resultingTrove,
    recoveryMode,
    wouldTriggerRecoveryMode,
    accountBalance,
    price
  }: TroveChangeValidationContext,
  constants?: Record<string, Decimal>
): JSX.Element | ErrorMessage | null => {
  const wenMinimumNetDebt = constants?.MIN_NET_DEBT || LUSD_MINIMUM_NET_DEBT;
  const wenTotalSupply = constants?.wenTotalSupply;
  const ccrPercent = new Percent(constants?.CCR || CRITICAL_COLLATERAL_RATIO).toString(0);
  const mcr = constants?.MCR || MINIMUM_COLLATERAL_RATIO;
  const mcrPercent = new Percent(mcr).toString(0);

  if (wenTotalSupply?.add(borrowLUSD || 0).gt(1000000)) {
    return { key: "limit1M" } as ErrorMessage;
  }

  if (borrowLUSD.lt(wenMinimumNetDebt)) {
    // return (
    //   <ErrorDescription>
    //     You must borrow at least{" "}
    //     <Amount>
    //       {LUSD_MINIMUM_NET_DEBT.toString()} {COIN}
    //     </Amount>
    //     .
    //   </ErrorDescription>
    // );
    return {
      key: "mustBorrowAtLeast",
      values: { amount: wenMinimumNetDebt.toString() + " " + WEN.symbol }
    } as ErrorMessage;
  }

  if (recoveryMode) {
    if (!resultingTrove.isOpenableInRecoveryMode(price)) {
      // return (
      //   <ErrorDescription>
      //     You're not allowed to open a Trove with less than <Amount>{ccrPercent}</Amount> Collateral
      //     Ratio during recovery mode. Please increase your Trove's Collateral Ratio.
      //   </ErrorDescription>
      // );
      return {
        key: "noOpenning",
        values: { ccrPercent }
      } as ErrorMessage;
    }
  } else {
    // if (resultingTrove.collateralRatioIsBelowMinimum(price)) {
    if (resultingTrove.collateralRatio(price).lt(mcr)) {
      // return (
      //   <ErrorDescription>
      //     Collateral ratio must be at least <Amount>{mcrPercent}</Amount>.
      //   </ErrorDescription>
      // );
      return {
        key: "collateralRatioMustBeAtLeast",
        values: { percent: mcrPercent }
      } as ErrorMessage;
    }

    if (wouldTriggerRecoveryMode) {
      // return (
      //   <ErrorDescription>
      //     You're not allowed to open a Trove that would cause the Total Collateral Ratio to fall
      //     below <Amount>{ccrPercent}</Amount>. Please increase your Trove's Collateral Ratio.
      //   </ErrorDescription>
      // );
      return {
        key: "noOpenningToFall",
        values: { ccrPercent }
      } as ErrorMessage;
    }
  }

  if (depositCollateral.gt(accountBalance)) {
    return (
      <ErrorDescription>
        The amount you're trying to deposit exceeds your balance by{" "}
        <Amount>{depositCollateral.sub(accountBalance).prettify()} ETH</Amount>.
      </ErrorDescription>
    );
  }

  return null;
};

const validateTroveAdjustment = (
  { depositCollateral, withdrawCollateral, borrowLUSD, repayLUSD }: TroveAdjustmentParams<Decimal>,
  {
    originalTrove,
    resultingTrove,
    recoveryMode,
    wouldTriggerRecoveryMode,
    price,
    accountBalance,
    lusdBalance
  }: TroveChangeValidationContext,
  constants?: Record<string, Decimal>
): JSX.Element | ErrorMessage | null => {
  const wenMinimumDebt = constants?.MIN_NET_DEBT.add(constants?.LUSD_GAS_COMPENSATION) || LUSD_MINIMUM_DEBT;
  const wenTotalSupply = constants?.wenTotalSupply;
  const ccr = constants?.CCR || CRITICAL_COLLATERAL_RATIO;
  const ccrPercent = new Percent(ccr).toString(0);
  const mcr = constants?.MCR || MINIMUM_COLLATERAL_RATIO;
  const mcrPercent = new Percent(mcr).toString(0);

  if (wenTotalSupply?.add(borrowLUSD || 0).gt(1000000)) {
    return { key: "limit1M" } as ErrorMessage;
  }

  if (recoveryMode) {
    if (withdrawCollateral) {
      // return (
      //   <ErrorDescription>
      //     You're not allowed to withdraw collateral during recovery mode.
      //   </ErrorDescription>
      // );
      return { key: "notAllowed2Withdraw" } as ErrorMessage
    }

    if (borrowLUSD) {
      // return this.collateralRatio(price).lt(CRITICAL_COLLATERAL_RATIO);
      // if (resultingTrove.collateralRatioIsBelowCritical(price)) {
      if (resultingTrove.collateralRatio(price).lt(ccr)) {
        // return (
        //   <ErrorDescription>
        //     Your collateral ratio must be at least <Amount>{ccrPercent}</Amount> to borrow during
        //     recovery mode. Please improve your collateral ratio.
        //   </ErrorDescription>
        // );
        return {
          key: "collateralRatioMust",
          values: { ccrPercent }
        } as ErrorMessage;
      }

      if (resultingTrove.collateralRatio(price).lt(originalTrove.collateralRatio(price))) {
        // return (
        //   <ErrorDescription>
        //     You're not allowed to decrease your collateral ratio during recovery mode.
        //   </ErrorDescription>
        // );
        return { key: "noDecreasing" } as ErrorMessage;
      }
    }
  } else {
    // if (resultingTrove.collateralRatioIsBelowMinimum(price)) {
    if (resultingTrove.collateralRatio(price).lt(mcr)) {
      // return (
      //   <ErrorDescription>
      //     Collateral ratio must be at least <Amount>{mcrPercent}</Amount>.
      //   </ErrorDescription>
      // );
      return {
        key: "collateralRatioMustBeAtLeast",
        values: { percent: mcrPercent }
      } as ErrorMessage
    }

    if (wouldTriggerRecoveryMode) {
      // return (
      //   <ErrorDescription>
      //     The adjustment you're trying to make would cause the Total Collateral Ratio to fall below{" "}
      //     <Amount>{ccrPercent}</Amount>. Please increase your Trove's Collateral Ratio.
      //   </ErrorDescription>
      // );
      return {
        key: "fallCR",
        values: { amount: ccrPercent }
      } as ErrorMessage;
    }
  }

  if (repayLUSD) {
    if (resultingTrove.debt.lt(wenMinimumDebt)) {
      // return (
      //   <ErrorDescription>
      //     Total debt must be at least{" "}
      //     <Amount>
      //       {LUSD_MINIMUM_DEBT.toString()} {COIN}
      //     </Amount>
      //     .
      //   </ErrorDescription>
      // );
      return {
        key: "debtMustBe",
        values: { amount: wenMinimumDebt.toString() + " " + WEN.symbol }
      } as ErrorMessage;
    }

    if (repayLUSD.gt(lusdBalance)) {
      return (
        <ErrorDescription>
          The amount you're trying to repay exceeds your balance by{" "}
          <Amount>
            {repayLUSD.sub(lusdBalance).prettify()} {COIN}
          </Amount>
          .
        </ErrorDescription>
      );
    }
  }

  if (depositCollateral?.gt(accountBalance)) {
    return (
      <ErrorDescription>
        The amount you're trying to deposit exceeds your balance by{" "}
        <Amount>{depositCollateral.sub(accountBalance).prettify()} ETH</Amount>.
      </ErrorDescription>
    );
  }

  return null;
};

const validateTroveClosure = (
  { repayLUSD }: TroveClosureParams<Decimal>,
  {
    recoveryMode,
    wouldTriggerRecoveryMode,
    numberOfTroves,
    lusdBalance
  }: TroveChangeValidationContext,
  constants?: Record<string, Decimal>
): JSX.Element | ErrorMessage | null => {
  const ccrPercent = new Percent(constants?.CCR || CRITICAL_COLLATERAL_RATIO).toString(0);

  if (numberOfTroves === 1) {
    return (
      <ErrorDescription>
        You're not allowed to close your Trove when there are no other Troves in the system.
      </ErrorDescription>
    );
  }

  if (recoveryMode) {
    // return (
    //   <ErrorDescription>
    //     You're not allowed to close your Trove during recovery mode.
    //   </ErrorDescription>
    // );
    return { key: "onClosing" } as ErrorMessage;
  }

  if (repayLUSD?.gt(lusdBalance)) {
    // return (
    //   <ErrorDescription>
    //     You need{" "}
    //     <Amount>
    //       {repayLUSD.sub(lusdBalance).prettify()} {COIN}
    //     </Amount>{" "}
    //     more to close your Trove.
    //   </ErrorDescription>
    // );
    return {
      key: "needMoreToClose",
      values: { amount: repayLUSD.sub(lusdBalance).toString() }
    } as ErrorMessage;
  }

  if (wouldTriggerRecoveryMode) {
    // return (
    //   <ErrorDescription>
    //     You're not allowed to close a Trove if it would cause the Total Collateralization Ratio to
    //     fall below <Amount>{ccrPercent}</Amount>. Please wait until the Total Collateral Ratio
    //     increases.
    //   </ErrorDescription>
    // );
    return {
      key: "noClosingToFall",
      values: { ccrPercent }
    } as ErrorMessage;
  }

  return null;
};
