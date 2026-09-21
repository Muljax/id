import { MDXProvider } from "@mdx-js/react";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import * as mdxComponents from "./components/mdx";

import { router } from "./router";

import "./styles/global.css";

const root = document.getElementById("root");

if (!root) {
	throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
	<StrictMode>
		<MDXProvider components={mdxComponents}>
			<RouterProvider router={router} />
		</MDXProvider>
	</StrictMode>,
);
