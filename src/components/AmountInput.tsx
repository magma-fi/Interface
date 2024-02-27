/* eslint-disable @typescript-eslint/no-empty-function */
import React, { useCallback, useEffect, useState } from "react";
import { Coin } from "../libs/types"
import { IconButton } from "./IconButton";
import { debounce } from "../libs/debounce";
import { formatCurrency } from "../utils";

export const AmountInput = ({
	coin = null,
	price = 0,
	allowSwap = false,
	valueForced = -1,
	onInput = () => { },
	max = 0,
	error,
	warning,
	allowReduce = true,
	currentValue = 0,
	allowIncrease = true
}: {
	coin: Coin | null;
	price: number;
	allowSwap: boolean;
	valueForced: number;
	onInput: (val: number) => void;
	max: number;
	warning: string | undefined;
	error?: string | undefined;
	allowReduce?: boolean;
	currentValue?: number;
	allowIncrease?: boolean;
}) => {
	const [inputValue, setInputValue] = useState<string>("");
	const [fiatValue, setFiatValue] = useState(0);

	const sendBack = useCallback(val => {
		if (
			(!allowIncrease && val <= currentValue)
			|| (!allowReduce && val >= currentValue)
			|| (allowReduce && allowIncrease)
		) {
			onInput(val);
		} else {
			onInput(currentValue);
		}
	}, [allowIncrease, allowReduce, currentValue, onInput])

	const updateValue = useCallback((val, send = true) => {
		if (!isNaN(val) && ((max > 0 && val <= max) || max === 0)) {
			if (send) {
				sendBack(val);
			}
		} else {
			updateValue(0, true);
		}
	}, [max, sendBack]);

	useEffect(() => {
		if (valueForced >= 0) {
			setInputValue(String(valueForced));
			setFiatValue(price * valueForced);

			updateValue(valueForced, false);
		}
	}, [price, updateValue, valueForced]);

	const handleChange = (evt: React.FormEvent<HTMLInputElement>) => {
		const inputStr = evt.currentTarget.value;
		const val = Number(inputStr);

		setInputValue(inputStr);
		setFiatValue(price * val);

		debounce.run(updateValue, 1500, val);
	};

	return <div className="amountInputLayout">
		<div
			className="flex-row-space-between amountInputBox"
			style={{ border: error ? "1px solid #F25454" : (warning ? "1px solid #E4BC62" : "") }}>
			<div className="flex-row-align-left">
				<img
					src={coin?.logo}
					width="32px" />

				<div
					className="flex-column-align-left"
					style={{ gap: "4px" }}>
					<input
						type="number"
						className="amountInput label labelBig fat"
						placeholder={"0 " + coin?.symbol}
						value={inputValue}
						onInput={handleChange} />

					<div className="label labelSmall">{formatCurrency(fiatValue)}</div>
				</div>
			</div>

			{allowSwap && <IconButton
				icon="images/swap.png" />}
		</div>

		{error && <p className="errorText">{error}</p>}

		{warning && <p className="warnText">{warning}</p>}
	</div>
}