import { useEffect, useState } from "react";
import { openApiSpec as embeddedSpec } from "virtual:openapi-spec";
import { OPENAPI_URL } from "../config";
import type { OpenApiSpec } from "./types";

let cachedSpec: OpenApiSpec | null = embeddedSpec || null;
let activeFetchPromise: Promise<OpenApiSpec | null> | null = null;

async function fetchSpec(): Promise<OpenApiSpec | null> {
	if (cachedSpec) return cachedSpec;
	if (activeFetchPromise) return activeFetchPromise;

	// If no valid URL, fallback immediately to embedded spec
	if (!OPENAPI_URL || OPENAPI_URL === "/api/openapi.json") {
		cachedSpec = embeddedSpec;
		return embeddedSpec;
	}

	activeFetchPromise = fetch(OPENAPI_URL)
		.then(async (res) => {
			if (!res.ok) {
				throw new Error(
					`Failed to fetch OpenAPI spec: ${res.status} ${res.statusText}`,
				);
			}
			const json = (await res.json()) as OpenApiSpec;
			cachedSpec = json;
			return json;
		})
		.catch((err) => {
			console.warn(
				`Remote OpenAPI fetch failed (${OPENAPI_URL}), using embedded schema:`,
				err,
			);
			cachedSpec = embeddedSpec;
			return embeddedSpec;
		})
		.finally(() => {
			activeFetchPromise = null;
		});

	return activeFetchPromise;
}

export function useOpenApi() {
	const [spec, setSpec] = useState<OpenApiSpec | null>(
		cachedSpec || embeddedSpec,
	);
	const [loading, setLoading] = useState(!cachedSpec && !embeddedSpec);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (cachedSpec || embeddedSpec) {
			setSpec(cachedSpec || embeddedSpec);
			setLoading(false);
			return;
		}

		let isMounted = true;
		setLoading(true);

		fetchSpec().then((data) => {
			if (!isMounted) return;
			if (data) {
				setSpec(data);
				setError(null);
			} else {
				setError("Could not load API specification");
			}
			setLoading(false);
		});

		return () => {
			isMounted = false;
		};
	}, []);

	return { spec, loading, error };
}
