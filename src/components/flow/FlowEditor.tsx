"use client";

import React from "react";
import { FlowCanvas } from "./FlowCanvas";
import { FlowSidebar } from "./FlowSidebar";
import { AstNode } from "@/lib/ast/types";
import { Parser } from "@/lib/ast/parser";
import { Node as RFNode, Edge as RFEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from "@xyflow/react";
import { generateCodeSync } from "@/lib/generateCodeSync";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

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
	// ---------- SINGLE SOURCE OF TRUTH ----------
	const [code, setCode] = React.useState(initialCode ?? "");

	// ---------- PARSER ----------
	const parserRef = React.useRef<Parser>(new Parser());

	// Convex mutations (no-ops in demo mode)
	const upsertNode = useMutation(api.nodes.upsert);
	const removeNode = useMutation(api.nodes.remove);
	const removeEdge = useMutation(api.edges.remove);

	// Helper: convert AST → graph and vice-versa
	const astToGraph = React.useCallback((ast: AstNode[]) => {
		const rfNodes: RFNode<any>[] = ast.map((n, idx) => ({
			id: n.id,
			type: n.type,
			position: { x: 100 + (n.parentId ? 200 : 0), y: idx * 120 },
			data: n.data,
		}));

		const rfEdges: RFEdge<any>[] = ast.flatMap((n) => {
			if (!n.parentId) return [];
			return [{
				id: `${n.parentId}-${n.id}`,
				source: n.parentId,
				target: n.id,
			} as RFEdge<any>];
		});
		return { rfNodes, rfEdges };
	}, []);

	const graphInitial = React.useMemo(() => {
		try {
			const ast = parserRef.current.parseCode(code);
			return astToGraph(ast);
		} catch {
			return { rfNodes: [], rfEdges: [] };
		}
	}, []); // run once on mount

	const [nodes, setNodes] = React.useState<RFNode<any>[]>(graphInitial.rfNodes);
	const [edges, setEdges] = React.useState<RFEdge<any>[]>(graphInitial.rfEdges);

	// --------- When CODE changes (from editor) -> refresh graph ---------
	React.useEffect(() => {
		try {
			const ast = parserRef.current.parseCode(code);
			const { rfNodes, rfEdges } = astToGraph(ast);
			setNodes(rfNodes);
			setEdges(rfEdges);
		} catch {
			// ignore parse errors – keep current graph
		}
	}, [code, astToGraph]);

	// --------- When NODES change (canvas edits) -> regenerate code ---------
	const updateCodeFromNodes = React.useCallback(
		(nextNodes: RFNode<any>[]) => {
			const astNodes: AstNode[] = nextNodes.map((n) => ({
				id: n.id,
				type: n.type ?? "",
				parentId: (n as any).parentId,
				data: n.data as any,
			}));
			const newCode = generateCodeSync(astNodes);
			setCode(newCode);
		},
		[]
	);

	const onNodesChange = React.useCallback(
		(changes: NodeChange[]) => {
			setNodes((nds) => {
				const updated = applyNodeChanges(changes, nds);
				updateCodeFromNodes(updated);

				if (flowId) {
					changes.forEach((chg) => {
						if (chg.type === "position") {
							const node = updated.find((n) => n.id === (chg as any).id);
							if (node) {
								upsertNode({
									id: node.id as any,
									flowId: flowId as any,
									type: node.type ?? "",
									data: node.data,
									x: node.position.x,
									y: node.position.y,
								}).catch(() => {});
							}
						}

						if (chg.type === "remove") {
							removeNode({ id: (chg as any).id as any }).catch(() => {});
						}
					});
				}
				return updated;
			});
		},
		[updateCodeFromNodes, flowId, upsertNode, removeNode]
	);

	const onEdgesChange = React.useCallback(
		(changes: EdgeChange[]) => {
			setEdges((eds) => {
				const updated = applyEdgeChanges(changes, eds);
				// Edge removals/additions might imply parent-child adjustments already handled elsewhere.
				// Regenerate code to stay in sync even if nodes unchanged.
				updateCodeFromNodes(nodes);

				if (flowId) {
					changes.forEach((chg) => {
						if (chg.type === "remove") {
							removeEdge({ id: chg.id as any }).catch(() => {});
						}
					});
				}
				return updated;
			});
		},
		[nodes, updateCodeFromNodes, flowId, removeEdge]
	);

	// onCodeChange handler from sidebar simply sets code
	const handleCodeChange = React.useCallback((newCode: string) => setCode(newCode), []);

	// Keep code in sync if nodes changed elsewhere (e.g., via setNodes in connect handler)
	React.useEffect(() => {
		const astNodes: AstNode[] = nodes.map((n) => ({
			id: n.id,
			type: n.type ?? "",
			parentId: (n as any).parentId,
			data: n.data as any,
		}));
		const regenerated = generateCodeSync(astNodes);
		if (regenerated !== code) {
			setCode(regenerated);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [nodes]);

	return (
		<div className="grid h-full grid-cols-[1fr_400px]">
			<FlowCanvas
				nodes={nodes}
				edges={edges}
				setNodes={setNodes}
				setEdges={setEdges}
				flowId={flowId}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
			/>

			<FlowSidebar
				code={code}
				flowId={flowId}
				onSave={onSave}
				onCodeChange={handleCodeChange}
			/>
		</div>
	);
}
