/* eslint-disable @typescript-eslint/no-empty-function */
import React, { useCallback, useEffect, useState } from "react";
import { Coin } from "../libs/types"
import { IconButton } from "./IconButton";
import { globalContants } from "../libs/globalContants";
import { Decimal } from "lib-base/dist/src/Decimal";
import { debounce } from "../libs/debounce";

export const AmountInput = ({
	coin = null,
	price = Decimal.ZERO,
	allowSwap = false,
	valueForced = 0,
	onInput = () => { },
	max = 0,
	error,
	warning,
	allowReduce = true,
	currentValue = 0,
	allowIncrease = true
}: {
	coin: Coin | null;
	price: Decimal;
	allowSwap: boolean;
	valueForced: number;
	onInput: (val: number) => void;
	max: number;
	warning: string | undefined;
	error: string | undefined;
	allowReduce: boolean;
	currentValue: number;
	allowIncrease: boolean;
}) => {
	const [inputValue, setInputValue] = useState<string>("");
	const [fiatValue, setFiatValue] = useState("0");

	const sendBack = useCallback(val => {
		if (
			(!allowIncrease && val <= currentValue)
			|| (!allowReduce && val >= currentValue)
		) {
			// onInput(val);
			debounce.run(onInput, 1000, val);
		}
	}, [allowIncrease, allowReduce, currentValue, onInput])

	const updateValue = useCallback(val => {
		setInputValue(String(val));
		setFiatValue(price.mul(val).toString(2));

		sendBack(val);
	}, [sendBack, price]);

	useEffect(() => {
		if (valueForced > 0) {
			updateValue(valueForced);
		}
	}, [updateValue, valueForced]);

	const handleChange = (evt: React.FormEvent<HTMLInputElement>) => {
		const val = Number(evt.currentTarget.value);
		if (!isNaN(val) && ((max > 0 && val <= max) || max === 0)) {
			updateValue(val);
		}
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

					<div className="label labelSmall">{fiatValue}&nbsp;{globalContants.USD}</div>
				</div>
			</div>

			{allowSwap && <IconButton
				icon="images/swap.png" />}
		</div>

		{error && <p className="errorText">{error}</p>}

		{warning && <p className="warnText">{warning}</p>}
	</div>
}