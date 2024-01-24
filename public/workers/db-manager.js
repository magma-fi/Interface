const dbManager = {
	_db: null,

	open: function (dbName, version) {
		return new Promise((resolve, reject) => {
			const dbConnector = indexedDB.open(dbName, version);

			dbConnector.onerror = event => {
				console.error('数据库打开报错', event.target.errorCode);
				reject(event);
			};

			dbConnector.onsuccess = () => {
				this._db = dbConnector.result;
				console.warn('数据库打开成功 version =', this._db.version);
				resolve(this._db);
			};

			dbConnector.onupgradeneeded = event => {
				this._db = event.target.result;
				const transaction = event.target.transaction;

				this._db.onerror = evt => {
					console.error('数据库打开报错', JSON.stringify(evt));
				};

				// 0: history数据表
				const tableName = "history";
				const objectStore = this._db.createObjectStore(tableName, { keyPath: "date" });
				objectStore.createIndex("date", "date", { unique: true });
				objectStore.createIndex("collateral", "collateral", { unique: false });
				objectStore.createIndex("debt", "debt", { unique: false });
				objectStore.createIndex("updateTime", "updateTime", { unique: false });

				// if (event.oldVersion < 8) {
				// 	let objectStore = event.currentTarget.transaction.objectStore(tableName);
				// 	if (!objectStore) {
				// 		objectStore = this._db.createObjectStore(tableName, { keyPath: "date" });
				// 		objectStore.createIndex("date", "date", { unique: true });
				// 		objectStore.createIndex("collateral", "collateral", { unique: false });
				// 		objectStore.createIndex("debt", "debt", { unique: false });
				// 	}

				// 	objectStore.createIndex("updateTime", "updateTime", { unique: false });
				// }

				transaction.oncomplete = () => {
					console.warn("数据库升级成功", event.newVersion);
					resolve(this._db);
				};

			}
		});
	},

	read: function (db, table, field, condition) {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(table, "readonly");
			const objectStore = transaction.objectStore(table);
			const index = objectStore.index(field);
			const request = index.get(condition);

			request.onerror = event => {
				console.error('事务失败', event);
				reject(event);
			};

			request.onsuccess = event => {
				const result = event.target.result;
				if (result) {
					resolve(result);
				} else {
					resolve();
				}
			};
		});
	},

	update: function (db, table, dataObj) {
		return new Promise((resolve, reject) => {
			const request = db.transaction(table, 'readwrite')
				.objectStore(table)
				.put(dataObj);

			request.onsuccess = () => {
				return resolve(true);
			};

			request.onerror = event => {
				return reject();
			}
		});
	},

	add: function (db, table, dataObjs) {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(table, "readwrite");
			const objectStore = transaction.objectStore(table);

			let howMany = 0;
			const countWriten = () => {
				howMany += 1;

				if (howMany >= dataObjs.length) {
					resolve(true);
				}
			}

			dataObjs.forEach(element => {
				const request = objectStore.put(element);

				request.onsuccess = event => {
					countWriten();
				};

				request.onerror = event => {
					console.error('数据写入失败', event);
					return reject();
				}
			});
		});
	}
}