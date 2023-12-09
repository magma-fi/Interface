import { createApolloFetch } from "apollo-fetch";
import appConfig from "../appConfig.json";

export const graphqlAsker = {
	ask: function (chainId: number, query: string, doneCallback: (data: unknown) => void) {
		const uri = this._getGraph(chainId);
		const fetcher = createApolloFetch({ uri });
		fetcher({ query }).then(result => {
			const { data, errors } = result;
			if (!errors && doneCallback) {
				return doneCallback(data);
			}
		}).catch(error => {
			console.error(error)
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
				collateralBefore
				collateralAfter
				debtBefore
				debtAfter
				sequenceNumber
				transaction {
					id
					timestamp
				}
			}
		}
		`;
	},

	_getGraph: function (chainId: number) {
		return appConfig.subgraph[String(chainId)].graphql;
	}
};