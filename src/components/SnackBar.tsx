export const SnackBar = ({ type = "infoSnackBar", text }: {
	type: "infoSnackBar" | "successSnackBar" | "warningSnackBar" | "errorSnackBar";
	text: string;
}) => {
	return <div className={"snackBar " + type}>
		<img src={"/images/" + type + ".png"} />

		{text}
	</div>
};