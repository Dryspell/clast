"use client";

import React from "react";
import { FlowCanvas } from "./FlowCanvas";
import { FlowSidebar } from "./FlowSidebar";
import { AstNode } from "@/lib/ast/types";
import { Parser } from "@/lib/ast/parser";
import { Node as RFNode, Edge as RFEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from "@xyflow/react";
import { generateCodeSync } from "@/lib/generateCodeSync";
import { applyDagreLayout } from "./utils/applyDagreLayout";
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
	// ---------- SINGLE SOURCE OF TRUTH ----------
	const [code, setCode] = React.useState(initialCode ?? "");

	// ---------- PARSER ----------
	const parserRef = React.useRef<Parser>(new Parser());

  // If a flowId is provided, use realtime Convex-backed state; otherwise run in demo mode
  const isDemoMode = !flowId;
  const flowSync = flowId ? useFlowSync(flowId) : null;

	// Helper: convert AST → graph and vice-versa
	const astToGraph = React.useCallback((ast: AstNode[]) => {
    const rfNodes: RFNode<any>[] = ast.map((n, idx) => ({
      id: n.id,
      type: n.type,
      // Children render inside their parent using React Flow's parentNode + extent
      parentNode: n.parentId,
      extent: n.parentId ? 'parent' : undefined,
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

  // DEMO MODE: local graph derived from code
  const graphInitial = React.useMemo(() => {
    if (!isDemoMode) return { rfNodes: [], rfEdges: [] };
    try {
      const ast = parserRef.current.parseCode(code);
      const g = astToGraph(ast);
      return { rfNodes: applyDagreLayout(g.rfNodes, g.rfEdges), rfEdges: g.rfEdges };
    } catch {
      return { rfNodes: [], rfEdges: [] };
    }
  }, []); // run once on mount

  const [demoNodes, setDemoNodes] = React.useState<RFNode<any>[]>(graphInitial.rfNodes);
  const [demoEdges, setDemoEdges] = React.useState<RFEdge<any>[]>(graphInitial.rfEdges);

  // Select nodes/edges sources depending on mode
  const nodes = isDemoMode ? demoNodes : flowSync!.nodes;
  const setNodes = isDemoMode ? setDemoNodes : flowSync!.setNodes;
  const edges = isDemoMode ? demoEdges : flowSync!.edges;
  const setEdges = isDemoMode ? setDemoEdges : flowSync!.setEdges;

	// --------- When CODE changes (from editor) -> refresh graph ---------
  React.useEffect(() => {
    if (!isDemoMode) return; // persisted flows do not derive graph from code
    try {
      const ast = parserRef.current.parseCode(code);
      const { rfNodes, rfEdges } = astToGraph(ast);
      // First run Dagre layout for all nodes
      const laidOut = applyDagreLayout(rfNodes, rfEdges);
      // Then restore previous positions where available to avoid jitter
      const merged = laidOut.map((n) => {
        const existing = demoNodes.find((e) => e.id === n.id);
        return existing ? { ...n, position: existing.position } : n;
      });

      // Only update if nodes have actually changed in meaningful ways
      const nodesSame = merged.length === demoNodes.length &&
        merged.every((n, i) => {
          const existing = demoNodes[i];
          return existing &&
            n.id === existing.id &&
            n.type === existing.type &&
            JSON.stringify(n.data) === JSON.stringify(existing.data);
        });

      if (!nodesSame) {
        // Set flag to prevent the nodes effect from triggering code regeneration
        updatingFromCodeRef.current = true;
        setDemoNodes(merged);
        setDemoEdges(rfEdges);
      }
    } catch {
      // ignore parse errors – keep current graph
    }
    // Only depend on code changes in demo mode
  }, [code, isDemoMode, demoNodes]);

	// --------- When NODES change (canvas edits) -> regenerate code ---------
	const updateCodeFromNodes = React.useCallback(
		(nextNodes: RFNode<any>[]) => {
    const astNodes: AstNode[] = nextNodes.map((n) => ({
				id: n.id,
				type: n.type ?? "",
      parentId: (n as any).parentNode ?? (n as any).parentId,
				data: n.data as any,
			}));
			generateCodeSync(astNodes).then(setCode);
		},
		[]
	);

  const onNodesChange = React.useCallback(
    (changes: NodeChange[]) => {
      if (!isDemoMode) {
        // Persisted mode: delegate to flowSync then regenerate from current nodes
        flowSync!.onNodesChange(changes);
        updateCodeFromNodes(flowSync!.nodes);
        return;
      }
      setDemoNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        updateCodeFromNodes(updated);
        return updated;
      });
    },
    [isDemoMode, flowSync, updateCodeFromNodes]
  );

  const onEdgesChange = React.useCallback(
    (changes: EdgeChange[]) => {
      if (!isDemoMode) {
        flowSync!.onEdgesChange(changes);
        updateCodeFromNodes(flowSync!.nodes);
        return;
      }
      setDemoEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds);
        updateCodeFromNodes(demoNodes);
        return updated;
      });
    },
    [isDemoMode, flowSync, updateCodeFromNodes, demoNodes]
  );

	// onCodeChange handler from sidebar simply sets code
  const handleCodeChange = React.useCallback((newCode: string) => {
    if (!isDemoMode) return; // ignore manual code edits in persisted mode
    setCode(newCode);
  }, [isDemoMode]);

	// Keep code in sync if nodes changed elsewhere (e.g., via setNodes in connect handler)
	// Use a ref to track if we're in the middle of a code->nodes update to prevent loops
	const updatingFromCodeRef = React.useRef(false);
	const lastGeneratedCodeRef = React.useRef<string>('');
	
  React.useEffect(() => {
    // Always derive code from nodes, both in demo and persisted modes
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
      if (regenerated !== code && regenerated !== lastGeneratedCodeRef.current) {
        lastGeneratedCodeRef.current = regenerated;
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
