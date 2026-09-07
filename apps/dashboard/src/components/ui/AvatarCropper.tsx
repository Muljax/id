import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";

type AvatarCropperProps = {
	file: File | null;
	open: boolean;
	onCancel: () => void;
	onApply: (file: File) => void;
};

const OUTPUT_SIZE = 512;
const VIEWPORT_SIZE = 360;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

type Point = {
	x: number;
	y: number;
};

export default function AvatarCropper({
	file,
	open,
	onCancel,
	onApply,
}: AvatarCropperProps) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const imageRef = useRef<HTMLImageElement | null>(null);
	const dragStartRef = useRef<Point | null>(null);
	const positionStartRef = useRef<Point>({ x: 0, y: 0 });

	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [zoom, setZoom] = useState(MIN_ZOOM);
	const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
	const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
	const [dragging, setDragging] = useState(false);
	const [applying, setApplying] = useState(false);

	useEffect(() => {
		if (!file || !open) {
			setImageUrl(null);
			imageRef.current = null;
			return;
		}

		const url = URL.createObjectURL(file);
		setImageUrl(url);
		setZoom(MIN_ZOOM);
		setPosition({ x: 0, y: 0 });
		setDragging(false);

		return () => {
			URL.revokeObjectURL(url);
		};
	}, [file, open]);

	useEffect(() => {
		if (!open) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape" && !applying) {
				onCancel();
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [applying, onCancel, open]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const previousOverflow = document.body.style.overflow;

		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [open]);

	if (!open || !file || !imageUrl) {
		return null;
	}

	function getBaseScale() {
		if (!imageSize.width || !imageSize.height) {
			return 1;
		}

		return Math.max(
			VIEWPORT_SIZE / imageSize.width,
			VIEWPORT_SIZE / imageSize.height,
		);
	}

	function getScaledSize() {
		const scale = getBaseScale() * zoom;

		return {
			width: imageSize.width * scale,
			height: imageSize.height * scale,
		};
	}

	function clampPosition(nextPosition: Point, nextZoom = zoom) {
		if (!imageSize.width || !imageSize.height) {
			return nextPosition;
		}

		const scale = getBaseScale() * nextZoom;

		const width = imageSize.width * scale;
		const height = imageSize.height * scale;

		const maxX = Math.max(0, (width - VIEWPORT_SIZE) / 2);
		const maxY = Math.max(0, (height - VIEWPORT_SIZE) / 2);

		return {
			x: Math.min(maxX, Math.max(-maxX, nextPosition.x)),
			y: Math.min(maxY, Math.max(-maxY, nextPosition.y)),
		};
	}

	function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
		const image = event.currentTarget;

		imageRef.current = image;

		setImageSize({
			width: image.naturalWidth,
			height: image.naturalHeight,
		});

		setPosition({ x: 0, y: 0 });
	}

	function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
		if (applying) {
			return;
		}

		event.currentTarget.setPointerCapture(event.pointerId);

		dragStartRef.current = {
			x: event.clientX,
			y: event.clientY,
		};

		positionStartRef.current = position;
		setDragging(true);
	}

	function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
		if (!dragStartRef.current || applying) {
			return;
		}

		const deltaX = event.clientX - dragStartRef.current.x;
		const deltaY = event.clientY - dragStartRef.current.y;

		setPosition(
			clampPosition({
				x: positionStartRef.current.x + deltaX,
				y: positionStartRef.current.y + deltaY,
			}),
		);
	}

	function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}

		dragStartRef.current = null;
		setDragging(false);
	}

	function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
		event.preventDefault();

		const direction = event.deltaY > 0 ? -1 : 1;

		setZoom((currentZoom) => {
			const nextZoom = Math.min(
				MAX_ZOOM,
				Math.max(
					MIN_ZOOM,
					Number((currentZoom + direction * ZOOM_STEP).toFixed(2)),
				),
			);

			setPosition((currentPosition) =>
				clampPosition(currentPosition, nextZoom),
			);

			return nextZoom;
		});
	}

	function handleZoomChange(event: React.ChangeEvent<HTMLInputElement>) {
		const nextZoom = Number(event.target.value);

		setZoom(nextZoom);
		setPosition((currentPosition) => clampPosition(currentPosition, nextZoom));
	}

	async function createCroppedFile(): Promise<File> {
		const image = imageRef.current;

		if (!image) {
			throw new Error("The selected image is not ready.");
		}

		const canvas = document.createElement("canvas");
		canvas.width = OUTPUT_SIZE;
		canvas.height = OUTPUT_SIZE;

		const context = canvas.getContext("2d");

		if (!context) {
			throw new Error("Unable to create image canvas.");
		}

		const baseScale = getBaseScale();
		const displayScale = baseScale * zoom;

		const sourceScale = OUTPUT_SIZE / VIEWPORT_SIZE;

		const imageWidth = image.naturalWidth * displayScale;
		const imageHeight = image.naturalHeight * displayScale;

		const drawX = (VIEWPORT_SIZE - imageWidth) / 2 + position.x;

		const drawY = (VIEWPORT_SIZE - imageHeight) / 2 + position.y;

		context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

		context.drawImage(
			image,
			drawX * sourceScale,
			drawY * sourceScale,
			imageWidth * sourceScale,
			imageHeight * sourceScale,
		);

		const blob = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(result) => {
					if (result) {
						resolve(result);
					} else {
						reject(new Error("Unable to create cropped image."));
					}
				},
				"image/webp",
				0.9,
			);
		});

		return new File([blob], "avatar.webp", {
			type: "image/webp",
			lastModified: Date.now(),
		});
	}

	async function handleApply() {
		setApplying(true);

		try {
			const croppedFile = await createCroppedFile();
			onApply(croppedFile);
		} catch {
			setApplying(false);
		}
	}

	const scaledSize = getScaledSize();

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="avatar-cropper-title"
		>
			<div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
				<div className="border-b border-white/8 px-6 py-5">
					<h2
						id="avatar-cropper-title"
						className="text-base font-medium text-white"
					>
						Adjust profile picture
					</h2>

					<p className="mt-1 text-sm text-zinc-500">
						Drag the image to position it within the circle.
					</p>
				</div>

				<div className="px-6 py-6">
					<div
						ref={viewportRef}
						className={`relative mx-auto h-90 w-90 max-w-full touch-none select-none overflow-hidden rounded-xl bg-zinc-900 ${
							dragging ? "cursor-grabbing" : "cursor-grab"
						}`}
						onPointerDown={handlePointerDown}
						onPointerMove={handlePointerMove}
						onPointerUp={handlePointerUp}
						onPointerCancel={handlePointerUp}
						onWheel={handleWheel}
					>
						<img
							src={imageUrl}
							alt=""
							draggable={false}
							onLoad={handleImageLoad}
							className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
							style={{
								width: scaledSize.width,
								height: scaledSize.height,
								transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
							}}
						/>

						<div className="pointer-events-none absolute inset-0">
							<div className="absolute inset-0 bg-black/45" />

							<div className="absolute left-1/2 top-1/2 h-70 w-70 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
						</div>
					</div>

					<div className="mt-6">
						<div className="mb-2 flex items-center justify-between">
							<label
								htmlFor="avatar-zoom"
								className="text-xs font-medium text-zinc-400"
							>
								Zoom
							</label>

							<span className="text-xs tabular-nums text-zinc-600">
								{Math.round(zoom * 100)}%
							</span>
						</div>

						<input
							id="avatar-zoom"
							type="range"
							min={MIN_ZOOM}
							max={MAX_ZOOM}
							step={ZOOM_STEP}
							value={zoom}
							onChange={handleZoomChange}
							disabled={applying}
							className="w-full accent-violet-400"
						/>

						<p className="mt-2 text-xs text-zinc-600">
							You can also use your mouse wheel to zoom.
						</p>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3 border-t border-white/8 px-6 py-4">
					<Button
						type="button"
						variant="ghost"
						onClick={onCancel}
						disabled={applying}
					>
						Cancel
					</Button>

					<Button
						type="button"
						onClick={() => void handleApply()}
						disabled={applying || !imageRef.current}
					>
						{applying ? "Applying..." : "Apply"}
					</Button>
				</div>
			</div>
		</div>
	);
}
