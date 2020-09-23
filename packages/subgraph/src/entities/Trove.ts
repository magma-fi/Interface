import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts";

import { Trove, TroveChange } from "../../generated/schema";

import {
  decimalize,
  BIGINT_SCALING_FACTOR,
  BIGINT_ZERO,
  BIGINT_MAX_UINT256,
  DECIMAL_ZERO
} from "../utils/bignumbers";
import { calculateCollateralRatio } from "../utils/collateralRatio";

import { isLiquidation, isRedemption } from "../types/TroveOperation";

import { getChangeSequenceNumber } from "./Global";
import { initChange, finishChange } from "./Change";
import { getCurrentPrice, updateSystemStateByTroveChange } from "./SystemState";
import { getCurrentLiquidation } from "./Liquidation";
import { getCurrentRedemption } from "./Redemption";
import { getUser } from "./User";

function getCurrentTroveOfOwner(_user: Address): Trove {
  let owner = getUser(_user);
  let currentTrove: Trove;

  if (owner.currentTrove == null) {
    let troveSubId = owner.troveCount++;

    currentTrove = new Trove(_user.toHexString() + "-" + troveSubId.toString());
    currentTrove.owner = owner.id;
    currentTrove.status = "open";
    currentTrove.collateral = DECIMAL_ZERO;
    currentTrove.debt = DECIMAL_ZERO;
    owner.currentTrove = currentTrove.id;
    owner.save();
  } else {
    currentTrove = Trove.load(owner.currentTrove) as Trove;
  }

  return currentTrove;
}

function closeCurrentTroveOfOwner(_user: Address): void {
  let owner = getUser(_user);

  owner.currentTrove = null;
  owner.save();
}

function createTroveChange(event: ethereum.Event): TroveChange {
  let sequenceNumber = getChangeSequenceNumber();
  let troveChange = new TroveChange(sequenceNumber.toString());
  initChange(troveChange, event, sequenceNumber);

  return troveChange;
}

function finishTroveChange(troveChange: TroveChange): void {
  finishChange(troveChange);
  troveChange.save();
}

export function updateTrove(
  event: ethereum.Event,
  operation: string,
  _user: Address,
  _coll: BigInt,
  _debt: BigInt,
  stake: BigInt,
  snapshotETH: BigInt,
  snapshotCLVDebt: BigInt
): void {
  let trove = getCurrentTroveOfOwner(_user);
  let newCollateral = decimalize(_coll);
  let newDebt = decimalize(_debt);

  if (newCollateral == trove.collateral && newDebt == trove.debt) {
    return;
  }

  let price = getCurrentPrice();
  let troveChange = createTroveChange(event);

  troveChange.trove = trove.id;
  troveChange.troveOperation = operation;

  troveChange.collateralBefore = trove.collateral;
  troveChange.debtBefore = trove.debt;
  troveChange.collateralRatioBefore = calculateCollateralRatio(trove.collateral, trove.debt, price);

  trove.collateral = newCollateral;
  trove.debt = newDebt;

  troveChange.collateralAfter = trove.collateral;
  troveChange.debtAfter = trove.debt;
  troveChange.collateralRatioAfter = calculateCollateralRatio(trove.collateral, trove.debt, price);

  troveChange.collateralChange = troveChange.collateralAfter - troveChange.collateralBefore;
  troveChange.debtChange = troveChange.debtAfter - troveChange.debtBefore;

  if (isLiquidation(operation)) {
    let currentLiquidation = getCurrentLiquidation(event);
    troveChange.liquidation = currentLiquidation.id;
  }

  if (isRedemption(operation)) {
    let currentRedemption = getCurrentRedemption(event);
    troveChange.redemption = currentRedemption.id;
  }

  updateSystemStateByTroveChange(troveChange);
  finishTroveChange(troveChange);

  trove.rawCollateral = _coll;
  trove.rawDebt = _debt;
  trove.rawStake = stake;
  trove.rawSnapshotOfTotalRedistributedCollateral = snapshotETH;
  trove.rawSnapshotOfTotalRedistributedDebt = snapshotCLVDebt;

  if (_debt != BIGINT_ZERO) {
    trove.rawCollateralPerDebt = (_coll * BIGINT_SCALING_FACTOR) / _debt;
  } else {
    trove.rawCollateralPerDebt = BIGINT_MAX_UINT256;
  }

  if (_coll == BIGINT_ZERO) {
    closeCurrentTroveOfOwner(_user);

    if (isLiquidation(operation)) {
      trove.status = "closedByLiquidation";
    } else {
      trove.status = "closedByOwner";
    }
  }

  trove.save();
}