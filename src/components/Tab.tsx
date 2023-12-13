/* eslint-disable @typescript-eslint/no-empty-function */
import { ChangeEvent, useState } from "react";
import { OptionItem } from "../libs/types";

export const Tab = ({
	name = "",
	options = [],
	onSelect = () => { }
}: {
	name: string;
	options: OptionItem[];
	onSelect: (idx: number) => void;
}) => {
	const [indexSelected, setIndexSelected] = useState(0);

	const handleSelect = (evt: ChangeEvent<HTMLInputElement>) => {
		const idx = parseInt(evt.target.value);
		if (!options[idx].disabled) {
			setIndexSelected(idx);
			onSelect(idx);
		}
	};

	return <div className="tab">
		{options.map((option, index) => {
			return <div
				key={option.title}
				className={"tabItem" + (option.disabled ? " disabled" : "")}
				title={option.disabled ? "Coming soon..." : ""}>
				<input
					type="radio"
					name={name}
					id={option.title}
					checked={index === indexSelected}
					onChange={handleSelect}
					value={index} />

				<label htmlFor={option.title}>
					{option.icon && <img src={option.icon} />}

					<div>{option.title}</div>
				</label>
			</div>
		})}
	</div>
};