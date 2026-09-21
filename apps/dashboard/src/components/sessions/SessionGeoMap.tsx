import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Expand, Globe } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { Session } from "@/lib/api/sessions";

interface SessionGeoMapProps {
	sessions: Session[];
	highlightedSessionId?: string | null;
	onHoverSession?: (sessionId: string | null) => void;
	onSelectSession?: (session: Session) => void;
	title?: string;
	description?: string;
	className?: string;
}

interface ResolvedLocation {
	session: Session;
	lat: number;
	lon: number;
	label: string;
	isCurrent: boolean;
}

function createMarkerIcon(isCurrent: boolean, isHighlighted: boolean) {
	const iconHtml = `
		<div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
			${
				isCurrent
					? '<span class="absolute inline-flex h-7 w-7 animate-ping rounded-full bg-emerald-400 opacity-40"></span>'
					: ""
			}
			${
				isHighlighted
					? '<span class="absolute inline-flex h-9 w-9 animate-pulse rounded-full bg-violet-400 opacity-50 ring-2 ring-violet-300"></span>'
					: ""
			}
			<div class="relative flex h-4 w-4 items-center justify-center rounded-full border-2 ${
				isCurrent
					? "border-emerald-300 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]"
					: isHighlighted
						? "border-violet-300 bg-violet-500 shadow-[0_0_14px_rgba(139,92,246,1)] scale-125"
						: "border-indigo-300 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]"
			} transition-all duration-200 hover:scale-125">
				<div class="h-1 w-1 rounded-full bg-white"></div>
			</div>
		</div>
	`;

	return L.divIcon({
		html: iconHtml,
		className: "custom-session-marker",
		iconSize: [24, 24],
		iconAnchor: [12, 12],
	});
}

export default function SessionGeoMap({
	sessions,
	highlightedSessionId,
	onHoverSession,
	onSelectSession,
	title = "Geographic Session Activity",
	description = "Live interactive map of active device locations",
	className = "",
}: SessionGeoMapProps) {
	const mapContainerRef = useRef<HTMLDivElement | null>(null);
	const mapInstanceRef = useRef<L.Map | null>(null);
	const markersLayerRef = useRef<L.LayerGroup | null>(null);
	const markersMapRef = useRef<
		Map<string, { marker: L.Marker; loc: ResolvedLocation }>
	>(new Map());

	const onHoverRef = useRef(onHoverSession);
	onHoverRef.current = onHoverSession;

	const onSelectRef = useRef(onSelectSession);
	onSelectRef.current = onSelectSession;

	const { locations, unknownCount } = useMemo(() => {
		const resolved: ResolvedLocation[] = [];
		let unknown = 0;

		for (const session of sessions) {
			const lat =
				typeof session.latitude === "number" ? session.latitude : null;
			const lon =
				typeof session.longitude === "number" ? session.longitude : null;

			if (
				lat === null ||
				lon === null ||
				Number.isNaN(lat) ||
				Number.isNaN(lon)
			) {
				unknown++;
				continue;
			}

			const duplicateCount = resolved.filter(
				(item) =>
					Math.abs(item.lat - lat) < 0.005 && Math.abs(item.lon - lon) < 0.005,
			).length;

			const jitterLat = duplicateCount > 0 ? (Math.random() - 0.5) * 0.08 : 0;
			const jitterLon = duplicateCount > 0 ? (Math.random() - 0.5) * 0.08 : 0;

			const label =
				[session.city, session.region, session.country]
					.filter(Boolean)
					.join(", ") || "Unknown Location";

			resolved.push({
				session,
				lat: lat + jitterLat,
				lon: lon + jitterLon,
				label,
				isCurrent: Boolean(session.current),
			});
		}

		return { locations: resolved, unknownCount: unknown };
	}, [sessions]);

	const hasCurrentDevice = useMemo(() => {
		return locations.some((loc) => loc.isCurrent);
	}, [locations]);

	const fitBounds = useCallback(() => {
		const map = mapInstanceRef.current;
		if (!map) return;

		if (locations.length === 0) {
			map.setView([20, 0], 2);
			return;
		}

		if (locations.length === 1) {
			map.setView([locations[0].lat, locations[0].lon], 5, { animate: true });
			return;
		}

		const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lon]));
		map.fitBounds(bounds, {
			padding: [45, 45],
			maxZoom: 7,
			animate: true,
		});
	}, [locations]);

	useEffect(() => {
		if (!mapContainerRef.current) return;

		if (!mapInstanceRef.current) {
			const map = L.map(mapContainerRef.current, {
				center: [20, 0],
				zoom: 2,
				minZoom: 1,
				maxZoom: 18,
				zoomControl: false,
				attributionControl: false,
				worldCopyJump: true,
			});

			L.tileLayer(
				"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
				{
					maxZoom: 16,
				},
			).addTo(map);

			L.tileLayer(
				"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
				{
					maxZoom: 16,
				},
			).addTo(map);

			L.control
				.zoom({
					position: "topright",
				})
				.addTo(map);

			const layer = L.layerGroup().addTo(map);
			markersLayerRef.current = layer;
			mapInstanceRef.current = map;
		}

		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
				markersLayerRef.current = null;
				markersMapRef.current.clear();
			}
		};
	}, []);

	useEffect(() => {
		const map = mapInstanceRef.current;
		const markersLayer = markersLayerRef.current;
		if (!map || !markersLayer) return;

		markersLayer.clearLayers();
		markersMapRef.current.clear();

		for (const loc of locations) {
			const customIcon = createMarkerIcon(loc.isCurrent, false);
			const marker = L.marker([loc.lat, loc.lon], { icon: customIcon });

			const popupContent = `
				<div class="p-3 bg-zinc-950 text-white rounded-xl border border-white/10 shadow-2xl min-w-[210px] text-xs font-sans">
					<div class="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
						<span class="font-semibold text-zinc-100 flex items-center gap-1.5">
							${loc.session.browser || "Web Browser"}
						</span>
						${
							loc.isCurrent
								? '<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Current</span>'
								: '<span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">Active</span>'
						}
					</div>
					<div class="mt-2 space-y-1.5 text-zinc-300">
						<div class="flex items-center justify-between">
							<span class="text-zinc-500">Device:</span>
							<span class="font-medium text-zinc-200">${loc.session.os || "Unknown"}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-zinc-500">Location:</span>
							<span class="font-medium text-zinc-200">${loc.label}</span>
						</div>
						${
							loc.session.ipAddress
								? `<div class="flex items-center justify-between">
								<span class="text-zinc-500">IP Address:</span>
								<span class="font-mono text-zinc-400">${loc.session.ipAddress}</span>
							</div>`
								: ""
						}
					</div>
				</div>
			`;

			marker.bindPopup(popupContent, {
				className: "custom-session-popup",
				closeButton: false,
				offset: [0, -8],
			});

			marker.on("mouseover", () => {
				onHoverRef.current?.(loc.session.id);
				marker.openPopup();
			});

			marker.on("mouseout", () => {
				onHoverRef.current?.(null);
				marker.closePopup();
			});

			marker.on("click", () => {
				onSelectRef.current?.(loc.session);
				map.panTo([loc.lat, loc.lon], { animate: true });
			});

			marker.addTo(markersLayer);
			markersMapRef.current.set(loc.session.id, { marker, loc });
		}

		fitBounds();
	}, [locations, fitBounds]);

	useEffect(() => {
		for (const [id, { marker, loc }] of markersMapRef.current.entries()) {
			const isHighlighted = highlightedSessionId === id;
			marker.setIcon(createMarkerIcon(loc.isCurrent, isHighlighted));

			if (isHighlighted) {
				marker.openPopup();
			} else {
				marker.closePopup();
			}
		}
	}, [highlightedSessionId]);

	return (
		<div
			className={`relative flex flex-col rounded-2xl border border-white/8 bg-zinc-950/90 overflow-hidden shadow-2xl backdrop-blur-md ${className}`}
		>
			<style>{`
				.leaflet-container {
					background: #09090b !important;
					font-family: inherit;
				}
				.leaflet-control-zoom {
					border: 1px solid rgba(255, 255, 255, 0.1) !important;
					border-radius: 8px !important;
					overflow: hidden;
					box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6) !important;
				}
				.leaflet-control-zoom a {
					background-color: rgba(24, 24, 27, 0.9) !important;
					color: #e4e4e7 !important;
					border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
				}
				.leaflet-control-zoom a:hover {
					background-color: rgba(39, 39, 42, 1) !important;
					color: #ffffff !important;
				}
				.leaflet-popup-content-wrapper {
					background: transparent !important;
					box-shadow: none !important;
					padding: 0 !important;
				}
				.leaflet-popup-content {
					margin: 0 !important;
					line-height: 1.4 !important;
				}
				.leaflet-popup-tip-container {
					display: none !important;
				}
				.custom-session-marker {
					display: flex;
					align-items: center;
					justify-content: center;
				}
			`}</style>

			<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/6 bg-white/[0.02]">
				<div className="flex items-center gap-2.5">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-zinc-900/80 shadow-inner">
						<Globe className="h-4 w-4 text-violet-400" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="text-sm font-semibold text-white">{title}</span>
							<span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
								{locations.length}{" "}
								{locations.length === 1
									? "Active Location"
									: "Active Locations"}
							</span>
						</div>
						<p className="text-xs text-zinc-400">{description}</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-white/5">
						{hasCurrentDevice ? (
							<>
								<div className="flex items-center gap-1.5">
									<span className="relative flex h-2.5 w-2.5">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
										<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
									</span>
									<span className="text-zinc-300">This Device</span>
								</div>
								<div className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
									<span className="text-zinc-300">Other Active</span>
								</div>
							</>
						) : (
							<div className="flex items-center gap-1.5">
								<span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
								<span className="text-zinc-300">Active Session</span>
							</div>
						)}
					</div>

					<button
						type="button"
						onClick={fitBounds}
						title="Fit all session locations"
						className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
					>
						<Expand className="h-3.5 w-3.5 text-zinc-400" />
						<span>Fit View</span>
					</button>
				</div>
			</div>

			<div className="relative w-full h-[320px] sm:h-[380px] bg-[#09090b]">
				<div ref={mapContainerRef} className="w-full h-full z-0" />

				{unknownCount > 0 && (
					<div className="absolute bottom-3 left-3 z-[1000] rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 backdrop-blur-md">
						{unknownCount} session(s) with unmapped geolocation
					</div>
				)}

				<div className="absolute bottom-1 right-2 z-[1000] text-[10px] text-zinc-500 select-none">
					© Esri · © OpenStreetMap
				</div>
			</div>
		</div>
	);
}
