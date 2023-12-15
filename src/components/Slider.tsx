import React, { useCallback, useEffect, useState } from "react";
import { debounce } from "../libs/debounce";

export const Slider = ({
	min,
	max,
	onChange,
	forcedValue = -1,
	allowReduce = true,
	limitValue = 0,
	allowIncrease = true
}: {
	min: number;
	max: number;
	onChange?: (val: number) => void;
	forcedValue: number;
	allowReduce: boolean;
	limitValue: number;
	allowIncrease: boolean;
}) => {
	const [value, setValue] = useState(0);

	const sendBack = useCallback((val: number) => {
		if (onChange) {
			debounce.run(onChange, 1000, val);
		}
	}, [onChange]);

	const updateValue = useCallback((val: number, send = false) => {
		if (
			(allowIncrease && allowReduce)
			|| (
				(!allowIncrease && val <= limitValue)
				|| (!allowReduce && val >= limitValue)
			)
		) {
			setValue(val);
			send && sendBack(val);
		} else {
			setValue(limitValue);
		}
	}, [allowIncrease, allowReduce, limitValue, sendBack]);

	const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
		const val = Number(evt.currentTarget.value);
		updateValue(val, true);
	};

	useEffect(() => {
		if (forcedValue >= 0) {
			// setValue(forcedValue);
			updateValue(forcedValue, false);
		}
	}, [forcedValue, updateValue])

	return (<div
		className="flex-row-space-between"
		style={{ gap: "11px" }}>
		<div className="slider">
			<input
				type="range"
				min={min}
				max={max}
				step={0.01}
				onChange={handleChange}
				value={value}
				defaultValue={value} />
		</div>

		<div className="sliderValue label big fat">
			{(value * 100).toFixed(2)}%
		</div>
	</div>);
};