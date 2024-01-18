const dbManager = {
	_dbConnector: null,
	_db: null,

	open: function (dbName, version) {
		return new Promise((resolve, reject) => {
			this._dbConnector = indexedDB.open(dbName, version);

			this._dbConnector.onerror = event => {
				console.error('数据库打开报错', event);
				reject(event);
			};

			this._dbConnector.onsuccess = () => {
				this._db = this._dbConnector.result;
				resolve(this._db);
			};

			this._dbConnector.onupgradeneeded = event => {
				console.warn("数据库升级成功！");

				this._db = event.target.result;

				const objectStore = this._db.createObjectStore("history", { keyPath: "date" });

				objectStore.createIndex("date", "date", { unique: true });
				objectStore.createIndex("collateral", "collateral", { unique: false });
				objectStore.createIndex("debt", "debt", { unique: false });

				resolve(this._db);
			}
		});
	},

	read: function (db, table, field, condition) {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([table], "readonly");
			const objectStore = transaction.objectStore(table);
			const index = objectStore.index(field);
			const request = index.get(condition);

			request.onerror = event => {
				console.error('事务失败', event);
				resolve(event);
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
			const request = db.transaction([table], 'readwrite')
				.objectStore(table)
				.put(dataObj);

			request.onsuccess = event => {
				return resolve(true);
			};

			request.onerror = event => {
				return reject();
			}
		});
	},

	add: function (db, table, dataObjs) {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([table], "readwrite");
			const objectStore = transaction.objectStore(table);

			let howMany = 0;
			const countWriten = () => {
				howMany += 1;

				if (howMany >= dataObjs.length) {
					resolve(true);
				}
			}

			dataObjs.forEach(element => {
				const request = objectStore.add(element);

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