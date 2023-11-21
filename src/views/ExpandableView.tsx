import { ReactElement } from "react";

export const ExpandableView = ({
	coverView = <></>,
	hiddenView = <></>,
	expand = false
}: {
	coverView: ReactElement;
	hiddenView: ReactElement;
	expand: boolean;
}) => {
	return <div
		className="flex-column"
		style={{
			width: "100%",
			padding: "1rem"
		}}>
		{coverView}

		{expand && <>
			<hr className="division" />

			{hiddenView}
		</>}
	</div>
};