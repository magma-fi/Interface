/* eslint-disable no-undef */
// import { graphQLFetch } from "./graphql-fetch";
importScripts("./graphql-fetch.js");
importScripts("./db-manager.js");

const table = "history";
let db = null;
let historyCap = 7;
let currentCalling = 0;
const sequenceNumbers = [];

const getSystemStateWithSequenceNumbers = async () => {
	const idList = sequenceNumbers.map(item => item.id).flat();
	const res = await graphQLFetch.requestSystemStateWithDay(...idList);
	if (res?.systemStates?.length > 0) {
		const dataObjs = [];

		for (let idx = 0; idx < res.systemStates.length; idx++) {
			const item = res.systemStates[idx];

			const dataObj = {
				date: sequenceNumbers[idx].date,
				collateral: Number(item.totalCollateral),
				debt: Number(item.totalDebt),
				updateTime: sequenceNumbers[idx].updateTime
			};

			dataObjs.push(dataObj);
		}

		if (dataObjs.length > 0) {
			return await dbManager.add(db, table, dataObjs);
		}

		return;
	}
};

const getHistoryByDate = async (day) => {
	if (currentCalling >= historyCap) {
		return await getSystemStateWithSequenceNumbers();
	}

	const dayStr = day.toLocaleDateString();
	const beginOfDay = Math.floor(new Date(dayStr).getTime() / 1000);
	const endOfDay = beginOfDay + 86399;
	const hasVal = await dbManager.read(db, table, "date", dayStr);

	if (!hasVal || !hasVal.updateTime || hasVal.updateTime < (endOfDay - 21600000)) {
		// 没有已存数据，或已存数据存储于当天18:00前，则更新当天数据。
		const sns = await graphQLFetch.requestSequenceNumbersWithDay(beginOfDay, endOfDay);
		if (sns?.troveChanges?.length > 0) {
			sequenceNumbers.push({
				date: dayStr,
				id: sns.troveChanges[0].id,
				forceUpdate: true,
				updateTime: Date.now()
			});
		}
	}

	currentCalling += 1;

	await getHistoryByDate(new Date(day - 86400000));
};

const main = async (chainId) => {
	db = await dbManager.open("magma-db-" + chainId, 1);

	graphQLFetch.init(chainId);

	if (db) {
		await getHistoryByDate(new Date(), true);
		db.close();
	}

};

this.addEventListener('message', async e => {
	if (e.data.cmd === "fetch") {
		await main(e.data.params);

		this.postMessage("fetched");
		this.close();
	}
});