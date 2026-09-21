import { Check, Copy, Key, Lock, Shield, Terminal } from "lucide-react";
import { useState } from "react";
import { API_URL } from "../../lib/config";

export interface ParameterItem {
	name: string;
	in: "query" | "header" | "path" | "cookie";
	type?: string;
	required?: boolean;
	description?: string;
	example?: unknown;
}

export interface ResponseItem {
	status: string;
	description: string;
	contentType?: string;
	example?: unknown;
	schema?: unknown;
}

export interface RequestBodyItem {
	contentType: string;
	description?: string;
	required?: boolean;
	example?: unknown;
	schema?: unknown;
}

export interface EndpointCardProps {
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | string;
	path: string;
	summary?: string;
	description?: string;
	auth?: "public" | "session" | "bearer" | "basic" | string;
	parameters?: ParameterItem[];
	requestBody?: RequestBodyItem;
	responses?: ResponseItem[];
	curlSnippet?: string;
}

const methodStyles: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	GET: {
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/25",
		text: "text-emerald-400",
	},
	POST: {
		bg: "bg-violet-500/10",
		border: "border-violet-500/25",
		text: "text-violet-300",
	},
	PUT: {
		bg: "bg-amber-500/10",
		border: "border-amber-500/25",
		text: "text-amber-400",
	},
	PATCH: {
		bg: "bg-orange-500/10",
		border: "border-orange-500/25",
		text: "text-orange-400",
	},
	DELETE: {
		bg: "bg-red-500/10",
		border: "border-red-500/25",
		text: "text-red-400",
	},
};

export function EndpointCard({
	method,
	path,
	summary,
	description,
	auth = "public",
	parameters = [],
	requestBody,
	responses = [],
	curlSnippet,
}: EndpointCardProps) {
	const normalizedMethod = method.toUpperCase();
	const style = methodStyles[normalizedMethod] || methodStyles.GET;

	const [copiedPath, setCopiedPath] = useState(false);
	const [activeTab, setActiveTab] = useState<
		"params" | "headers" | "body" | "responses" | "curl"
	>(() => {
		if (parameters.some((p) => p.in === "path" || p.in === "query"))
			return "params";
		if (requestBody) return "body";
		if (responses.length > 0) return "responses";
		return "curl";
	});

	const [activeResponseIdx, setActiveResponseIdx] = useState(0);
	const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

	const queryAndPathParams = parameters.filter(
		(p) => p.in === "path" || p.in === "query",
	);
	const headerParams = parameters.filter((p) => p.in === "header");

	function handleCopyPath() {
		navigator.clipboard.writeText(path);
		setCopiedPath(true);
		setTimeout(() => setCopiedPath(false), 2000);
	}

	function handleCopySnippet(key: string, text: string) {
		navigator.clipboard.writeText(text);
		setCopiedSnippet(key);
		setTimeout(() => setCopiedSnippet(null), 2000);
	}

	const activeResponse = responses[activeResponseIdx] || responses[0];

	// Generate default curl if not provided
	const baseUrl = API_URL || "http://localhost:8787";
	const generatedCurl =
		curlSnippet ||
		`curl -X ${normalizedMethod} "${baseUrl}${path}" ${
			auth === "bearer" ? '-H "Authorization: Bearer <token>" ' : ""
		}${auth === "session" ? '-H "Cookie: session=<cookie>" ' : ""}${
			requestBody
				? `-H "Content-Type: ${requestBody.contentType}" \\\n  -d '${JSON.stringify(requestBody.example || {}, null, 2)}'`
				: ""
		}`.trim();

	return (
		<div className="my-8 rounded-2xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm shadow-xl shadow-black/20 overflow-hidden not-prose">
			{/* Top Bar / Header */}
			<div className="p-5 sm:p-6 border-b border-white/6 bg-white/[0.015]">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						{/* HTTP Method Badge */}
						<span
							className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1 font-mono text-xs font-bold tracking-wider select-none ${style.bg} ${style.border} ${style.text}`}
						>
							{normalizedMethod}
						</span>

						{/* Path with Copy Button */}
						<div className="flex items-center gap-2 min-w-0">
							<code className="font-mono text-sm sm:text-base font-semibold text-white tracking-tight truncate">
								{path}
							</code>
							<button
								type="button"
								onClick={handleCopyPath}
								className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
								title="Copy path"
							>
								{copiedPath ? (
									<Check size={14} className="text-emerald-400" />
								) : (
									<Copy size={14} />
								)}
							</button>
						</div>
					</div>

					{/* Auth badge */}
					<div className="flex items-center gap-2">
						{auth === "public" ? (
							<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
								<Shield size={12} />
								Public
							</span>
						) : auth === "session" ? (
							<span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
								<Lock size={12} />
								Session Cookie
							</span>
						) : (
							<span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-400">
								<Key size={12} />
								{auth.toUpperCase()}
							</span>
						)}
					</div>
				</div>

				{/* Summary & Description */}
				{(summary || description) && (
					<div className="mt-3 text-sm text-zinc-300 leading-relaxed">
						{summary && (
							<p className="font-medium text-zinc-200 m-0">{summary}</p>
						)}
						{description && (
							<p className="text-xs text-zinc-400 mt-1 m-0">{description}</p>
						)}
					</div>
				)}
			</div>

			{/* Navigation Tabs */}
			<div className="flex border-b border-white/6 bg-white/[0.01] px-4 pt-2 gap-1 overflow-x-auto">
				{queryAndPathParams.length > 0 && (
					<button
						type="button"
						onClick={() => setActiveTab("params")}
						className={`px-3.5 py-2 text-xs font-medium rounded-t-xl transition-all duration-150 border-t border-x cursor-pointer whitespace-nowrap ${
							activeTab === "params"
								? "bg-zinc-950 text-violet-300 border-white/10 -mb-px font-semibold shadow-sm"
								: "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.03]"
						}`}
					>
						Parameters ({queryAndPathParams.length})
					</button>
				)}

				{headerParams.length > 0 && (
					<button
						type="button"
						onClick={() => setActiveTab("headers")}
						className={`px-3.5 py-2 text-xs font-medium rounded-t-xl transition-all duration-150 border-t border-x cursor-pointer whitespace-nowrap ${
							activeTab === "headers"
								? "bg-zinc-950 text-violet-300 border-white/10 -mb-px font-semibold shadow-sm"
								: "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.03]"
						}`}
					>
						Headers ({headerParams.length})
					</button>
				)}

				{requestBody && (
					<button
						type="button"
						onClick={() => setActiveTab("body")}
						className={`px-3.5 py-2 text-xs font-medium rounded-t-xl transition-all duration-150 border-t border-x cursor-pointer whitespace-nowrap ${
							activeTab === "body"
								? "bg-zinc-950 text-violet-300 border-white/10 -mb-px font-semibold shadow-sm"
								: "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.03]"
						}`}
					>
						Request Body
					</button>
				)}

				{responses.length > 0 && (
					<button
						type="button"
						onClick={() => setActiveTab("responses")}
						className={`px-3.5 py-2 text-xs font-medium rounded-t-xl transition-all duration-150 border-t border-x cursor-pointer whitespace-nowrap ${
							activeTab === "responses"
								? "bg-zinc-950 text-violet-300 border-white/10 -mb-px font-semibold shadow-sm"
								: "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.03]"
						}`}
					>
						Responses ({responses.length})
					</button>
				)}

				<button
					type="button"
					onClick={() => setActiveTab("curl")}
					className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-t-xl transition-all duration-150 border-t border-x cursor-pointer whitespace-nowrap ${
						activeTab === "curl"
							? "bg-zinc-950 text-violet-300 border-white/10 -mb-px font-semibold shadow-sm"
							: "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.03]"
					}`}
				>
					<Terminal size={12} />
					<span>cURL</span>
				</button>
			</div>

			{/* Tab Contents */}
			<div className="p-5 sm:p-6 bg-zinc-950/60">
				{/* Parameters Tab */}
				{activeTab === "params" && (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs border-collapse">
							<thead>
								<tr className="border-b border-white/8 text-zinc-400 font-mono">
									<th className="pb-3 pr-4 font-semibold">Parameter</th>
									<th className="pb-3 px-4 font-semibold">In</th>
									<th className="pb-3 px-4 font-semibold">Type</th>
									<th className="pb-3 px-4 font-semibold">Required</th>
									<th className="pb-3 pl-4 font-semibold">Description</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/4">
								{queryAndPathParams.map((p) => (
									<tr key={p.name} className="hover:bg-white/[0.02]">
										<td className="py-3 pr-4 font-mono font-medium text-violet-300">
											{p.name}
										</td>
										<td className="py-3 px-4 text-zinc-500 font-mono">
											{p.in}
										</td>
										<td className="py-3 px-4 font-mono text-zinc-400">
											{p.type || "string"}
										</td>
										<td className="py-3 px-4">
											{p.required ? (
												<span className="text-red-400 font-medium">
													required
												</span>
											) : (
												<span className="text-zinc-500">optional</span>
											)}
										</td>
										<td className="py-3 pl-4 text-zinc-300">
											{p.description || "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Headers Tab */}
				{activeTab === "headers" && (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs border-collapse">
							<thead>
								<tr className="border-b border-white/8 text-zinc-400 font-mono">
									<th className="pb-3 pr-4 font-semibold">Header</th>
									<th className="pb-3 px-4 font-semibold">Type</th>
									<th className="pb-3 px-4 font-semibold">Required</th>
									<th className="pb-3 pl-4 font-semibold">Description</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/4">
								{headerParams.map((p) => (
									<tr key={p.name} className="hover:bg-white/[0.02]">
										<td className="py-3 pr-4 font-mono font-medium text-violet-300">
											{p.name}
										</td>
										<td className="py-3 px-4 font-mono text-zinc-400">
											{p.type || "string"}
										</td>
										<td className="py-3 px-4">
											{p.required ? (
												<span className="text-red-400 font-medium">
													required
												</span>
											) : (
												<span className="text-zinc-500">optional</span>
											)}
										</td>
										<td className="py-3 pl-4 text-zinc-300">
											{p.description || "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Request Body Tab */}
				{activeTab === "body" && requestBody && (
					<div className="space-y-4">
						<div className="flex items-center justify-between text-xs">
							<span className="font-mono text-zinc-400">
								Content-Type:{" "}
								<code className="text-violet-300">
									{requestBody.contentType}
								</code>
							</span>
							<button
								type="button"
								onClick={() =>
									handleCopySnippet(
										"body",
										typeof requestBody.example === "string"
											? requestBody.example
											: JSON.stringify(requestBody.example || {}, null, 2),
									)
								}
								className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
							>
								{copiedSnippet === "body" ? (
									<>
										<Check size={12} className="text-emerald-400" />
										<span>Copied</span>
									</>
								) : (
									<>
										<Copy size={12} />
										<span>Copy JSON</span>
									</>
								)}
							</button>
						</div>

						{requestBody.description && (
							<p className="text-xs text-zinc-400">{requestBody.description}</p>
						)}

						<pre className="rounded-xl border border-white/8 bg-[#0f0f11] p-4 font-mono text-xs text-zinc-300 overflow-x-auto shadow-inner">
							{typeof requestBody.example === "string"
								? requestBody.example
								: JSON.stringify(requestBody.example || {}, null, 2)}
						</pre>
					</div>
				)}

				{/* Responses Tab */}
				{activeTab === "responses" && responses.length > 0 && (
					<div className="space-y-4">
						{/* Status Code Switcher */}
						<div className="flex flex-wrap gap-2 pb-2 border-b border-white/6">
							{responses.map((res, idx) => {
								const isSuccess = res.status.startsWith("2");
								const isSelected = idx === activeResponseIdx;
								return (
									<button
										key={res.status}
										type="button"
										onClick={() => setActiveResponseIdx(idx)}
										className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
											isSelected
												? isSuccess
													? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-sm"
													: "bg-red-500/15 border-red-500/30 text-red-300 shadow-sm"
												: "bg-white/[0.03] border-white/6 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
										}`}
									>
										<span
											className={`size-1.5 rounded-full ${
												isSuccess ? "bg-emerald-400" : "bg-red-400"
											}`}
										/>
										<span>{res.status}</span>
										<span className="text-[11px] font-normal text-zinc-500 font-sans">
											{res.description}
										</span>
									</button>
								);
							})}
						</div>

						{activeResponse && (
							<div className="space-y-3">
								<div className="flex items-center justify-between text-xs">
									<div className="text-zinc-400">
										<span className="font-semibold text-white">
											{activeResponse.description}
										</span>
										{activeResponse.contentType && (
											<span className="ml-2 font-mono text-zinc-500">
												({activeResponse.contentType})
											</span>
										)}
									</div>
									{activeResponse.example !== undefined && (
										<button
											type="button"
											onClick={() =>
												handleCopySnippet(
													"res",
													typeof activeResponse.example === "string"
														? activeResponse.example
														: JSON.stringify(activeResponse.example, null, 2),
												)
											}
											className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
										>
											{copiedSnippet === "res" ? (
												<>
													<Check size={12} className="text-emerald-400" />
													<span>Copied</span>
												</>
											) : (
												<>
													<Copy size={12} />
													<span>Copy JSON</span>
												</>
											)}
										</button>
									)}
								</div>

								{activeResponse.example !== undefined ? (
									<pre className="rounded-xl border border-white/8 bg-[#0f0f11] p-4 font-mono text-xs text-zinc-300 overflow-x-auto shadow-inner">
										{typeof activeResponse.example === "string"
											? activeResponse.example
											: JSON.stringify(activeResponse.example, null, 2)}
									</pre>
								) : (
									<div className="text-xs text-zinc-500 font-mono p-4 rounded-xl border border-white/6 bg-white/[0.02]">
										No sample payload available for this status code.
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* cURL Snippet Tab */}
				{activeTab === "curl" && (
					<div className="space-y-3">
						<div className="flex items-center justify-between text-xs">
							<span className="text-zinc-400 font-mono">cURL Command</span>
							<button
								type="button"
								onClick={() => handleCopySnippet("curl", generatedCurl)}
								className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
							>
								{copiedSnippet === "curl" ? (
									<>
										<Check size={12} className="text-emerald-400" />
										<span>Copied</span>
									</>
								) : (
									<>
										<Copy size={12} />
										<span>Copy cURL</span>
									</>
								)}
							</button>
						</div>
						<pre className="rounded-xl border border-white/8 bg-[#0f0f11] p-4 font-mono text-xs text-zinc-300 overflow-x-auto shadow-inner whitespace-pre">
							{generatedCurl}
						</pre>
					</div>
				)}
			</div>
		</div>
	);
}
