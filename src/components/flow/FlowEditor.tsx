"use client";

import React from "react";
import { FlowCanvas } from "./FlowCanvas";
import { FlowSidebar } from "./FlowSidebar";
import { AstNode } from "@/lib/ast/types";
import { Parser } from "@/lib/ast/parser";
import { Node as RFNode } from "@xyflow/react";
import { useFlowSync } from "./hooks/useFlowSync";

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
export function FlowEditor({ flowId, onSave, initialCode }: FlowEditorProps) {
	const {
		nodes,
		setNodes,
		edges,
		setEdges,
	} = useFlowSync(flowId);

	// Parsed nodes coming from code edits – we feed them into FlowCanvas via
	// `overrideNodes` so that the visual graph matches manual code edits.
	const [parsedFlowNodes, setParsedFlowNodes] = React.useState<RFNode<any>[] | undefined>(undefined);

	const parserRef = React.useRef<Parser>(new Parser());

	const handleCodeEdited = React.useCallback((newCode: string) => {
		try {
			const ast = parserRef.current!.parseCode(newCode);
			// Map AST nodes → React Flow nodes (basic layout)
			const rfNodes: RFNode<any>[] = ast.map((n, idx) => ({
				id: n.id,
				type: n.type,
				position: { x: 100, y: idx * 120 },
				data: n.data,
			}));
			// Check shallow equality by ids & types length
			const same =
				parsedFlowNodes &&
				parsedFlowNodes.length === rfNodes.length &&
				parsedFlowNodes.every((p, i) => p.id === rfNodes[i].id && p.type === rfNodes[i].type);
			if (!same) {
				setParsedFlowNodes(rfNodes);
			}
		} catch (err) {
			// Ignore parse errors for now
			console.error("Failed to parse edited code", err);
		}
	}, [parsedFlowNodes]);

	return (
		<div className="grid h-full grid-cols-[1fr_400px]">
			<FlowCanvas
				nodes={parsedFlowNodes ?? nodes}
				edges={edges}
				setNodes={setNodes}
				setEdges={setEdges}
				flowId={flowId}
			/>

			<FlowSidebar
				nodes={parsedFlowNodes ?? nodes}
				flowId={flowId}
				onSave={onSave}
				onCodeEdited={handleCodeEdited}
			/>
		</div>
	);
}
