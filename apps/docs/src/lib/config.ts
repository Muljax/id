const rawInstanceName =
	import.meta.env.VITE_INSTANCE_NAME ||
	import.meta.env.INSTANCE_NAME ||
	"Muljax ID";

export const INSTANCE_NAME: string =
	typeof rawInstanceName === "string"
		? rawInstanceName.replace(/^["']|["']$/g, "").trim()
		: "Muljax ID";

export const INSTANCE_LOGO: string =
	import.meta.env.VITE_INSTANCE_LOGO ||
	import.meta.env.INSTANCE_LOGO ||
	"/assets/logo.svg";

export const API_DOMAIN: string = (
	import.meta.env.VITE_API_DOMAIN ||
	import.meta.env.API_DOMAIN ||
	""
)
	.replace(/^https?:\/\//, "")
	.replace(/\/+$/, "");

const isLocal = import.meta.env.LOCALHOST === "true";
const protocol = isLocal ? "http" : "https";

export const API_URL: string =
	import.meta.env.VITE_API_URL ||
	(API_DOMAIN ? `${protocol}://${API_DOMAIN}` : "");

export const OPENAPI_URL: string = API_URL
	? `${API_URL.replace(/\/+$/, "")}/api/openapi.json`
	: "/api/openapi.json";

export const DASHBOARD_DOMAIN: string = (
	import.meta.env.VITE_DASHBOARD_DOMAIN ||
	import.meta.env.DASHBOARD_DOMAIN ||
	""
)
	.replace(/^https?:\/\//, "")
	.replace(/\/+$/, "");

export const DASHBOARD_URL: string = DASHBOARD_DOMAIN
	? `${protocol}://${DASHBOARD_DOMAIN}`
	: "";
