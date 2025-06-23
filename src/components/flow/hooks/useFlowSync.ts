import { useEffect, useCallback } from "react";
import {
  useNodesState,
  useEdgesState,
  NodeChange,
  EdgeChange,
} from "@xyflow/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

/**
 * Handles realtime Convex sync and exposes React Flow node/edge state helpers.
 * Falls back to purely local state when no `flowId` is provided (demo mode).
 */
export function useFlowSync(flowId?: string) {
  const [nodes, setNodes, baseOnNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, baseOnEdgesChange] = useEdgesState<any>([]);

  /* ------------------------------------------------------------------
   * Convex realtime subscriptions (disabled in demo mode)
   * ------------------------------------------------------------------ */
  const dbNodes = useQuery(api.nodes.listByFlow, flowId ? ({ flowId } as any) : "skip");
  const dbEdges = useQuery(api.edges.listByFlow, flowId ? ({ flowId } as any) : "skip");

  const upsertNode = useMutation(api.nodes.upsert);
  const removeNode = useMutation(api.nodes.remove);
  const upsertEdge = useMutation(api.edges.upsert);
  const removeEdge = useMutation(api.edges.remove);

  // Sync nodes coming from backend → local state
  useEffect(() => {
    if (dbNodes) {
      setNodes(
        dbNodes.map((n: any) => ({
          id: n._id,
          type: n.type,
          position: { x: n.x, y: n.y },
          data: n.data,
        }))
      );
    }
  }, [dbNodes, setNodes]);

  // Sync edges coming from backend → local state
  useEffect(() => {
    if (dbEdges) {
      setEdges(
        dbEdges.map((e: any) => ({
          id: e._id,
          source: e.source,
          sourceHandle: e.sourceHandle ?? undefined,
          target: e.target,
          targetHandle: e.targetHandle ?? undefined,
          data: e.data,
        }))
      );
    }
  }, [dbEdges, setEdges]);

  /* ------------------------------------------------------------------
   * Outgoing persistence for user edits (drag, delete, etc.)
   * ------------------------------------------------------------------ */

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      baseOnNodesChange(changes);

      if (!flowId) return; // demo mode – no backend writes

      changes.forEach((chg) => {
        if (chg.type === "position") {
          upsertNode({
            id: chg.id as any,
            flowId: flowId as any,
            type: (nodes.find((n) => n.id === chg.id) as any)?.type ?? "",
            data: (nodes.find((n) => n.id === chg.id) as any)?.data ?? {},
            x: chg.position!.x,
            y: chg.position!.y,
          }).catch(() => {});
        }

        if (chg.type === "remove") {
          removeNode({ id: chg.id as any }).catch(() => {});
        }
      });
    },
    [baseOnNodesChange, flowId, nodes, upsertNode, removeNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      baseOnEdgesChange(changes);

      if (!flowId) return;

      changes.forEach((chg) => {
        if (chg.type === "remove") {
          removeEdge({ id: chg.id as any }).catch(() => {});
        }
      });
    },
    [baseOnEdgesChange, flowId, removeEdge]
  );

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    // Convex helpers (no-ops in demo mode)
    upsertNode,
    removeNode,
    upsertEdge,
    removeEdge,
  } as const;
} 