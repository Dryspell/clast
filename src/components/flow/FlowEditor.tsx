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
import { applyDagreLayout } from "./utils/applyDagreLayout";

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
			const g = astToGraph(ast);
			return { rfNodes: applyDagreLayout(g.rfNodes, g.rfEdges), rfEdges: g.rfEdges };
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
			// First run Dagre layout for all nodes
			const laidOut = applyDagreLayout(rfNodes, rfEdges);
			// Then restore previous positions where available to avoid jitter
			const merged = laidOut.map((n) => {
				const existing = nodes.find((e) => e.id === n.id);
				return existing ? { ...n, position: existing.position } : n;
			});
			// Set flag to prevent the nodes effect from triggering code regeneration
			updatingFromCodeRef.current = true;
			setNodes(merged);
			setEdges(rfEdges);
		} catch {
			// ignore parse errors – keep current graph
		}
		// Only depend on code changes, not nodes or astToGraph to avoid circular updates
	}, [code]);

	// --------- When NODES change (canvas edits) -> regenerate code ---------
	const updateCodeFromNodes = React.useCallback(
		(nextNodes: RFNode<any>[]) => {
			const astNodes: AstNode[] = nextNodes.map((n) => ({
				id: n.id,
				type: n.type ?? "",
				parentId: (n as any).parentId,
				data: n.data as any,
			}));
			generateCodeSync(astNodes).then(setCode);
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
	// Use a ref to track if we're in the middle of a code->nodes update to prevent loops
	const updatingFromCodeRef = React.useRef(false);
	React.useEffect(() => {
		// Skip if we're currently updating nodes from code to prevent circular updates
		if (updatingFromCodeRef.current) {
			updatingFromCodeRef.current = false;
			return;
		}
		
		const astNodes: AstNode[] = nodes.map((n) => ({
			id: n.id,
			type: n.type ?? "",
			parentId: (n as any).parentId,
			data: n.data as any,
		}));
		generateCodeSync(astNodes).then((regenerated) => {
			if (regenerated !== code) {
				setCode(regenerated);
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [nodes]);

	const [errorIds, setErrorIds] = React.useState<Set<string>>(new Set());

	const handleDiagnostics = React.useCallback((diags: any[]) => {
		const ids = new Set<string>();
		try {
			const ast = parserRef.current.parseCode(code);
			for (const d of diags) {
				if (typeof d.start !== 'number') continue;
				const n = ast.find((n) => d.start >= (n.pos ?? 0) && d.start <= (n.end ?? 0));
				if (n) ids.add(n.id);
			}
		} catch {}
		setErrorIds(ids);
	}, [code]);

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
				errorIds={errorIds}
			/>

			<FlowSidebar
				code={code}
				flowId={flowId}
				onSave={onSave}
				onCodeChange={handleCodeChange}
				onDiagnostics={handleDiagnostics}
			/>
		</div>
	);
}
