/**
 * Props for the {@link Spinner} component.
 */
interface SpinnerProps {
	/**
	 * Size of the loading spinner.
	 *
	 * @default "md"
	 */
	size?: "sm" | "md" | "lg";
}

/**
 * A reusable loading spinner component.
 *
 * Renders an animated circular indicator with an accessible loading status.
 *
 * @param props - Spinner configuration.
 * @returns A styled animated loading indicator.
 *
 * @example
 * <Spinner />
 *
 * @example
 * <Spinner size="sm" />
 *
 * @example
 * <Spinner size="lg" />
 */
export default function Spinner({ size = "md" }: SpinnerProps) {
	const sizes = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-8 w-8",
	};

	return (
		<div
			className={`${sizes[size]} animate-spin rounded-full border-2 border-zinc-700 border-t-white`}
			aria-label="Loading"
			role="status"
		/>
	);
}
