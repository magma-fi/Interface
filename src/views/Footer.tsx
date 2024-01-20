import { useLang } from "../hooks/useLang";
import { version } from "../../package.json";

export const Footer = () => {
	const { t } = useLang();

	return <div
		className="footer"
		style={{ marginTop: "1.5rem" }}>
		<div className="flex-row-align-left">
			<img
				src="images/logo+text.png"
				height="24px" />

			<div className="label smallLabel">v{version}</div>
		</div>


		<div className="flex-row-align-left">
			{/* <a
				href="https://github.com/magma-fi/Audits/blob/main/MagmaStablecoin_final_Secure3_Audit_Report.pdf"
				target="_blank">
				{t("audit")}
			</a> */}

			<div className="label">{t("footerInfo")}</div>
		</div>
	</div>
};