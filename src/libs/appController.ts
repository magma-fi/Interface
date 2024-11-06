/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Langs, globalContants } from "./globalContants";
import appConfig from "../appConfig.json"
import { JsonObject, LPScoreObject } from "./types";
import { graphqlAsker } from "./graphqlAsker";
import { LoadStateErrorType } from "viem/_types/actions/test/loadState";

export const appController: {
	lang: Langs | null;
	worker?: Worker;
	init: () => void;
	detectLang: () => void;
	changeLang: (lng: Langs) => void;
	relaunch: () => void;
	employWorkers: (chainId: number, onDone?: () => void) => void;
	_dbConnector: IDBOpenDBRequest | undefined;
	_db: IDBDatabase | undefined;
	openDB: (chainId: number, onDone: () => void) => void;
	readAll: (onDone: (arg?: IDBCursor) => void) => void;
	getUserPoints: (chainId: number, user: string, referrer: string, onDone: (point: number, resObject: Record<string, any>) => void) => void;
	_getUserWENScore: (chainId: number, user: string) => Promise<number>;
	_getLPScore: (chainId: number, user: string) => Promise<{ totalLPScores: number, lpScores: LPScoreObject[] }>;
	_getUserStabilityAndLpScore: (chainId: number, user: string, onDone: (res: Record<string, any>) => void) => void;
} = {
	_dbConnector: undefined,
	_db: undefined,
	lang: null,

	init: function () {
		this.detectLang();
	},

	detectLang: function () {
		if (!this.lang) {
			this.lang = window.localStorage.getItem(globalContants.APP_LANG) as Langs;
		}

		if (!this.lang) {
			this.lang = Langs.English;
		}
	},

	changeLang: function (lng: Langs) {
		this.lang = lng;
		window.localStorage.setItem(globalContants.APP_LANG, lng);
	},

	relaunch: function () {
		window.location.reload();
	},

	employWorkers: function (chainId, onDone?: () => void) {
		this.worker = new Worker("/workers/get-history.js", {
			type: "classic"
		});

		this.worker.addEventListener("message", e => {
			if (e.data === "openned") onDone && onDone();
			if (e.data === "fetched") this.worker?.terminate();
		});

		this.worker.addEventListener('error', err => {
			console.error(err);
		});

		this.worker.addEventListener('messageerror', err => {
			console.error(err);
		});

		this.worker.postMessage({
			cmd: "fetch",
			params: chainId
		});
	},

	openDB: function (chainId, onDone: () => void) {
		this._dbConnector = window.indexedDB.open("magma-db-" + chainId, 1);

		this._dbConnector.onerror = event => {
			console.error('数据库打开出错', event);
		};

		this._dbConnector.onsuccess = () => {
			this._db = this._dbConnector?.result;
			return onDone && onDone();
		};
	},

	readAll: function (onDone) {
		let objectStore = null;

		try {
			objectStore = this._db?.transaction("history", "readonly").objectStore("history");
		} catch (error) {
			console.warn(error);
		}

		if (objectStore) {
			objectStore.openCursor().onsuccess = (event) => {
				const cursor: IDBCursor = event.target.result;
				if (cursor) {
					return onDone && onDone(cursor);
				}
			};
		} else {
			return onDone && onDone();
		}
	},

	getUserPoints: function (chainId, user, referrer, onDone): void {
		this._getUserStabilityAndLpScore(chainId, user, res => {
			if (!referrer) return onDone && onDone(res.stabilityScore + res.lpScore, res);

			// 根据referrer取得用户的下线。
			let myUsersPoints = 0;
			const query = graphqlAsker.requestUsersWithReferrer(referrer);
			graphqlAsker.ask(chainId, query, (result: any) => {
				if (result?.users?.length > 0) {
					const myUsers = result.users.map((item: { id: string; }) => '"' + item.id + '"');

					if (myUsers.length > 0) {
						const cfg = (appConfig.subgraph as JsonObject)[String(chainId)];

						const stabilityScoreGraph = cfg?.stabilityScore;
						const question4Wen = graphqlAsker.requestWENScoreOfUsers(myUsers);
						graphqlAsker.ask(
							chainId,
							question4Wen,
							async (stabilityScoreRes: any) => {
								if (stabilityScoreRes?.users) {
									stabilityScoreRes?.users.forEach((element: any) => {
										const p = Number(element.point.point);
										if (!isNaN(p)) myUsersPoints += p;

										const d = Number(element.stabilityDeposit.depositedAmount);
										if (!isNaN(d)) myUsersPoints += d
											* 10
											* Math.floor((Date.now() - element.point.timestamp * 1000) / 3600000);
									});
								}

								const lpsConfig: any[] = Object.values(cfg?.lpScore);
								let referrerPoints = 0;
								for (let i = 0; i < lpsConfig.length; i++) {
									const lpConfig = lpsConfig[i];
									const question = graphqlAsker.requestLPScoreOfUsers(myUsers, lpConfig.staking);
									const lpScoreRes = await graphqlAsker.askAsync(chainId, question, lpConfig.url);

									if (lpScoreRes?.users) {
										lpScoreRes.users.forEach((element: any) => {
											myUsersPoints += (
												Number(element.point.point)
												+ ((Number(element.balance.balance) + Number(element.staking?.amount || 0)) / 10 ** 18)
												* lpConfig.pointsPerHour
												* Math.floor((Date.now() - element.point.timestamp * 1000) / 3600000)
											);
										});
									}
								}

								referrerPoints += myUsersPoints * 0.01;

								return onDone && onDone(
									res.stabilityScore + res.lpScore + myUsersPoints * 0.1,
									{
										...res,
										referrerPoints
									}
								);
							},
							stabilityScoreGraph
						);
					} else {
						return onDone && onDone(res.stabilityScore + res.lpScore);
					}
				} else {
					return onDone && onDone(res.stabilityScore + res.lpScore, res);
				}
			});
		});
	},

	_getUserStabilityAndLpScore: async function (chainId, user, onDone) {
		const res: any = {};

		res.stabilityScore = await this._getUserWENScore(chainId, user);
		const result = await this._getLPScore(chainId, user);
		res.lpScore = result.totalLPScores;
		res.lps = result.lpScores;

		return onDone && onDone(res);
	},

	_getUserWENScore: function (chainId, user) {
		return new Promise((resolve) => {
			const cfg = (appConfig.subgraph as JsonObject)[String(chainId)];
			const stabilityScoreGraph = cfg?.stabilityScore;
			let stabilityScore = 0;
			if (stabilityScoreGraph) {
				const query = graphqlAsker.requestUserWENScore(user);
				graphqlAsker.ask(
					chainId,
					query,
					(data: any) => {
						// 基础积分 = subgraph里的point字段 + AMOUNT * (当前时间 - timestamp ) * 10 / 3600000
						if (data.user) {

							const p = Number(data.user.point.point);
							if (!isNaN(p)) stabilityScore = p;

							const d = Number(data.user.stabilityDeposit.depositedAmount);
							if (!isNaN(d)) stabilityScore += d
								* 10
								* Math.floor((Date.now() - data.user.point.timestamp * 1000) / 3600000);
						}

						resolve(stabilityScore);
					},
					stabilityScoreGraph
				);
			} else {
				resolve(0);
			}
		});
	},

	_getLPScore: function (chainId, user) {
		return new Promise(async resolve => {
			const lpScores: LPScoreObject[] = [];
			let totalLPScores = 0;
			const cfg = (appConfig.subgraph as JsonObject)[String(chainId)];
			const lpScoreGraphs = Object.entries(cfg?.lpScore);
			if (lpScoreGraphs) {
				for (let i = 0; i < lpScoreGraphs.length; i++) {
					const tmp: any = lpScoreGraphs[i][1];
					const lpScoreGraph = {
						name: lpScoreGraphs[i][0],
						staking: tmp?.staking,
						url: tmp?.url,
						link: tmp?.link,
						pointsPerHour: tmp?.pointsPerHour,
						endsIn: tmp?.endsIn ? new Date(tmp?.endsIn).getTime() / 1000 : 0
					} as LPScoreObject;

					if (lpScoreGraph.url) {
						const query = graphqlAsker.requestUserLPScore(user, lpScoreGraph.staking);
						const data = await graphqlAsker.askAsync(chainId, query, lpScoreGraph.url);

						if (
							data?.user
							&& (lpScoreGraph.endsIn === 0 || lpScoreGraph.endsIn < Number(data?.user?.point.timestamp))
						) {
							lpScoreGraph.points = Number(data.user.point.point)
								+ ((Number(data.user.balance.balance) + Number(data.user.staking?.amount || 0)) / 10 ** 18)
								* lpScoreGraph.pointsPerHour
								* Math.floor((Date.now() - data.user.point.timestamp * 1000) / 3600000);
							totalLPScores += lpScoreGraph.points;
						}

						lpScores.push(lpScoreGraph);
					}
				}

				resolve({ totalLPScores, lpScores });
			}

		});
	}
};