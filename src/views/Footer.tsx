import { useLang } from "../hooks/useLang";

export const Footer = () => {
	const { t } = useLang();

	return <div
		className="footer"
		style={{ marginTop: "1.5rem" }}>
		<img
			src="images/logo+text.png"
			height="24px" />

		<div className="flex-row-align-left">
			<a
				href="https://github.com/magma-fi/Audits/blob/main/MagmaStablecoin_final_Secure3_Audit_Report.pdf"
				target="_blank">
				{t("audit")}
			</a>

			<div className="label">Designed and built with ❤️ by the FilDA team 🌏</div>
		</div>
	</div>
};