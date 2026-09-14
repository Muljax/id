import { Link } from "@tanstack/react-router";
import Button from "@/components/ui/Button";

export default function NotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
			<div className="w-full max-w-md rounded-2xl border border-white/8 bg-zinc-900/40 p-8 text-center backdrop-blur-sm shadow-2xl">
				<p className="font-mono text-5xl font-bold tracking-tight text-zinc-600">
					404
				</p>

				<h1 className="mt-4 text-xl font-semibold text-white">
					Page not found
				</h1>

				<p className="mt-2 text-sm text-zinc-400">
					The page you are looking for does not exist or has been moved.
				</p>

				<div className="mt-6">
					<Link to="/">
						<Button variant="primary">Back to dashboard</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
