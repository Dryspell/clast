"use client";

import { FlowEditor } from "@/components/flow/FlowEditor";

export default function Home() {
	const handleSave = (code: string) => {
		console.log("Generated code:", code);
	};

	return (
		<main className="flex h-[100dvh] flex-col">
			<div className="flex-1 overflow-hidden">
				<FlowEditor onSave={handleSave} />
			</div>
		</main>
	);
}
