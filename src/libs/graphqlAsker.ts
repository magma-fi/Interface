import { createApolloFetch } from "apollo-fetch";
import appConfig from "../appConfig.json";
import { JsonObject } from "./types";

export const graphqlAsker = {
	ask: function (chainId: number, query: string, doneCallback: (data: unknown) => void, graphURL = undefined) {
		const uri = graphURL ?? this._getGraph(chainId);

		if (!uri) {
			return doneCallback(null);
		}

		const fetcher = createApolloFetch({ uri });
		fetcher({ query }).then(result => {
			const { data, errors } = result;
			if (!errors && doneCallback) {
				return doneCallback(data);
			}
		}).catch(error => {
			console.error(error);
			return doneCallback(null);
		});
	},

	requestTroveChanges: function (account: string) {
		return `
		{
			troveChanges(
				first: 5
				where: {trove_contains_nocase: "${account}"}
				orderBy: sequenceNumber
				orderDirection: desc
			) {
				id
				trove {
					id
					owner {
						id
					}
				}
				troveOperation
				collateralChange
				debtChange
				sequenceNumber
				transaction {
					id
					timestamp
				}
			}
		}
		`;
	},

	requestStabilityDepositChanges: function (account: string, howMany: number) {
		return `
		{
			stabilityDepositChanges(
				first: ${howMany}
				where: {stabilityDeposit_contains_nocase: "${account}"}
				orderBy: sequenceNumber
				orderDirection: desc
			) {
				sequenceNumber
				stabilityDepositOperation
				depositedAmountChange
				transaction {
					timestamp
				}
			}
		}
		`;
	},

	requestChangeHistory: function (startTimestamp: number) {
		return `
		{
			troveChanges(
				first: 300
				where: {transaction_: {timestamp_gt: ${startTimestamp}}}
				orderBy: transaction__timestamp
				orderDirection: asc
			){
				collateralAfter
				debtAfter
				transaction {
					timestamp
				}
			}
		}
		`;
	},

	requestReferer: function (owner: string) {
		return `
		{
			frontends(
				where: {owner_contains_nocase: "${owner}"}
			) {
				owner {
					id
				}
				sequenceNumber
				code
				kickbackRate
				deposits(first: 50, orderBy: depositedAmount, orderDirection: desc) {
					id
					depositedAmount
					changes(
						first: 1
						where: {stabilityDepositOperation: "depositTokens"}
						orderBy: sequenceNumber
						orderDirection: desc
					) {
						stabilityDepositOperation
						transaction {
							id
							timestamp
						}
					}
				}
			}
		}
		`;
	},

	requestRefererWithCode: function (code: string) {
		return `
		{
			frontends(where: {code_contains_nocase: "${code}"}) {
				owner {
					id
				}
			}
		}
		`;
	},

	requestUsersWithReferrer: function (referrer: string) {
		return `
		{
			users(where: {frontend_contains_nocase: "${referrer}"}) {
				id
				stabilityDeposit {
					depositedAmount
				}
			}
		}
		`;
	},

	requestUserWENScore: function (user: string) {
		return `
		{
			user(id: "${user}") {
				point {
					point
					timestamp
				}
				stabilityDeposit {
					depositedAmount
				}
			}
		}
		`;
	},

	requestUserLPScore: function (user: string) {
		return `
		{
			user(id: "${user}") {
				id
				point {
					point
					timestamp
				}
				balance {
					balance
				}
			}
		}
		`;
	},

	requestWENScoreOfUsers: function (users: string[]) {
		return `
		{
			users(where: {id_in: [${users}]}) {
				id
				point {
					point
					timestamp
				}
				stabilityDeposit {
					depositedAmount
				}
			}
		}
		`;
	},

	requestLPScoreOfUsers: function (users: string[]) {
		return `
		{
			users(where: {id_in: [${users}]}) {
				id
				point {
					point
					timestamp
				}
				balance {
					balance
				}
			}
		}
		`;
	},

	requestVaults: function (fromIndex = 0, howMany = 100) {
		return `
		{
			troves(
				first: ${howMany}
				skip: ${fromIndex}
				where: {status: "open"}
				orderBy: collateralRatioSortKey
				orderDirection: desc
			) {
				id
				status
				rawCollateral
				rawDebt
				collateralRatioSortKey
			}
		}
		`;
	},

	_getGraph: function (chainId: number) {
		return (appConfig.subgraph as JsonObject)[String(chainId)]?.graphql;
	}
};