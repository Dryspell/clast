"use client";

import React from "react";
import { FlowCanvas } from "./FlowCanvas";
import { FlowSidebar } from "./FlowSidebar";
import { AstNode } from "@/lib/ast/types";

export interface FlowEditorProps {
	/** Optional Convex flow document ID. When omitted, FlowEditor operates in local-only/demo mode. */
	flowId?: string;
	onSave?: (code: string) => void;
	initialCode?: string;
}

/**
 * Thin wrapper that arranges the flow canvas on the left and the code / runtime
 * sidebar on the right. All heavy lifting now lives in dedicated components &
 * hooks to keep this file tiny.
 */
export function FlowEditor({ flowId, onSave, initialCode = "" }: FlowEditorProps) {
	const [nodes, setNodes] = React.useState<AstNode[]>([]);

	return (
		<div className="grid h-full grid-cols-[1fr_400px]">
			<FlowCanvas
				flowId={flowId}
				initialCode={initialCode}
				onNodesChange={setNodes}
			/>

			<FlowSidebar
				nodes={nodes}
				initialCode={initialCode}
				flowId={flowId}
				onSave={onSave}
			/>
		</div>
	);
}
