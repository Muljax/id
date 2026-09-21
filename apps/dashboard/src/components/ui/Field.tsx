import type { ComponentProps } from "react";
import Input from "@/components/ui/Input";

export type FieldProps = {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	description?: string;
	error?: string;
} & Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange">;

export default function Field({
	id,
	label,
	value,
	onChange,
	description,
	error,
	...props
}: FieldProps) {
	return (
		<div className="space-y-2">
			<label htmlFor={id} className="block text-sm font-medium text-zinc-300">
				{label}
			</label>

			<Input
				{...props}
				id={id}
				value={value}
				hasError={Boolean(error)}
				onChange={(event) => onChange(event.target.value)}
			/>

			{error ? (
				<p className="text-xs text-red-400">{error}</p>
			) : description ? (
				<p className="text-xs text-zinc-500">{description}</p>
			) : null}
		</div>
	);
}
