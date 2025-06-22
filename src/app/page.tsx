"use client";

import { FlowEditor } from "@/components/flow/FlowEditor";

const INITIAL_CODE = `interface User {
  id: string;
  name: string;
  email: string;
}

function createUser(name: string, email: string): User {
  return {
    id: Math.random().toString(36).substring(7),
    name,
    email,
  };
}

const defaultUser = createUser("John Doe", "john@example.com");

console.log(defaultUser);
`;

export default function Home() {
	const handleSave = (code: string) => {
		console.log("Generated code:", code);
	};

	return (
		<main className="flex h-[100dvh] flex-col">
			<div className="flex-1 overflow-hidden">
				<FlowEditor initialCode={INITIAL_CODE} onSave={handleSave} />
			</div>
		</main>
	);
}
