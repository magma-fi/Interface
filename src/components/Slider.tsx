import React, { useCallback, useEffect, useState } from "react";
import { debounce } from "../libs/debounce";

export const Slider = ({
	min,
	max,
	currentValue,
	onChange,
	forcedValue = -1,
	allowReduce = true,
	allowIncrease = true
}: {
	min: number;
	max: number;
	currentValue: number;
	onChange?: (val: number) => void;
	forcedValue: number;
	allowReduce: boolean;
	allowIncrease: boolean;
}) => {
	const [value, setValue] = useState(currentValue);

	const sendBack = useCallback((val: number) => {
		if (onChange) {
			debounce.run(onChange, 1000, val);
		}
	}, [onChange]);

	const updateValue = useCallback((val: number) => {
		if (
			(!allowIncrease && val <= currentValue)
			|| (!allowReduce && val >= currentValue)
		) {
			setValue(val);
			sendBack(val);
		} else {
			setValue(currentValue);
		}
	}, [allowIncrease, allowReduce, currentValue, sendBack]);

	const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
		const val = Number(evt.currentTarget.value);
		updateValue(val);
	};

	useEffect(() => {
		if (forcedValue >= 0) {
			setValue(forcedValue);
			updateValue(forcedValue);
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