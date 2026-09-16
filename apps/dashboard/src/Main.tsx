import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { RouterProvider } from "@tanstack/react-router";

import ToastProvider from "@/components/Toast";
import AuthProvider from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";

import { router } from "./router";

import "@styles/global.css";

const root = document.getElementById("root");

if (!root) {
	throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<AuthProvider>
					<RouterProvider router={router} />
				</AuthProvider>
			</ToastProvider>
		</QueryClientProvider>
	</StrictMode>,
);
