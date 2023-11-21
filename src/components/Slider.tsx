import React, { useEffect, useState } from "react";

export const Slider = ({
	min,
	max,
	currentValue,
	onChange,
	forcedValue = 0,
	allowReduce = true,
	allowIncrease = true
}: {
	min: number;
	max: number;
	currentValue: number;
	onChange: (val: number) => void;
	forcedValue: number;
	allowReduce: boolean;
	allowIncrease: boolean;
}) => {
	const [value, setValue] = useState(currentValue);

	const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
		const val = Number(evt.currentTarget.value);
		if (
			(!allowIncrease && val < currentValue)
			|| (!allowReduce && val > currentValue)
		) {
			setValue(val);
			onChange && onChange(val);
		}
	};

	useEffect(() => {
		if (forcedValue > currentValue) {
			setValue(forcedValue);
		}
	}, [currentValue, forcedValue])

	return (<div className="slider">
		<input
			type="range"
			min={min}
			max={max}
			step={0.01}
			onChange={handleChange}
			value={value} />
	</div>);
};