export const debounce: {
	_timer: NodeJS.Timeout | null;
	run: (func: (...args: any[]) => void, timpGap: number, ...args: any[]) => void;
	_cleanTime: () => void;
} = {
	_timer: null,

	run: function (func, timpGap = 1000, ...args) {
		this._cleanTime();

		this._timer = setTimeout(() => {
			func(...args);
			return this._cleanTime();
		}, timpGap || 1000);
	},

	_cleanTime: function () {
		if (debounce._timer) {
			window.clearTimeout(debounce._timer);
			debounce._timer = null;
		}
	}
};