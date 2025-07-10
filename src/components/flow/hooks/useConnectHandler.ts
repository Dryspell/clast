import { useCallback, useRef } from "react";
import { Connection, addEdge, Edge as RFEdge, Node as RFNode } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

/**
 * Returns an `onConnect` callback that both updates canvas UI and applies
 * CLAST business-rules for various connection combinations.
 */
export function useConnectHandler({
  flowId,
  nodes,
  setNodes,
  setEdges,
}: {
  flowId?: string;
  nodes: RFNode<any>[];
  setNodes: (updater: (nodes: RFNode<any>[]) => RFNode<any>[]) => void;
  setEdges: (updater: (edges: RFEdge<any>[]) => RFEdge<any>[]) => void;
}) {
  const prevNodesRef = useRef(nodes);
  const upsertEdge = useMutation(api.edges.upsert);

  // Helper to build an identifier expression for any node
  const getExpr = (n: RFNode<any>): string => {
    switch (n.type) {
      case "variable":
        return (n.data as any)?.name ?? "";
      case "literal": {
        const lit = n.data as any;
        return lit.literalType === "string" ? `"${lit.value}"` : lit.value;
      }
      case "function":
        return `${(n.data as any)?.name ?? ""}()`;
      case "binaryOp":
        return `bin_${n.id.replace(/-/g, "_")}`;
      case "console":
        return `log_${n.id.replace(/-/g, "_")}`;
      case "call":
        return `call_${n.id.replace(/-/g, "_")}`;
      case "propertyAccess":
        return `prop_${n.id.replace(/-/g, "_")}`;
      case "conditional":
        return `cond_${n.id.replace(/-/g, "_")}`;
      default:
        return "";
    }
  };

  return useCallback(
    (params: Connection) => {
      // 1. Visually draw edge
      setEdges((eds) => addEdge(params, eds));

      // 2. Apply metadata updates
      setNodes((nds) => {
        const sourceNode = nds.find((n) => n.id === params.source);
        const targetNode = nds.find((n) => n.id === params.target);
        if (!sourceNode || !targetNode) return nds;

        // VARIABLE TYPE CONNECTION
        if (
          targetNode.type === "variable" &&
          params.targetHandle === "type" &&
          (sourceNode.type === "interface" || sourceNode.type === "type")
        ) {
          const updated = nds.map((n) =>
            n.id === targetNode.id
              ? {
                  ...n,
                  data: { ...n.data, variableType: (sourceNode.data as any).name },
                }
              : n
          );
          prevNodesRef.current = updated;
          return updated;
        }

        // CONSOLE VALUE CONNECTION
        if (targetNode.type === "console" && params.targetHandle === "value") {
          const updated = nds.map((n) =>
            n.id === targetNode.id
              ? { ...n, data: { ...n.data, valueExpr: getExpr(sourceNode) } }
              : n
          );
          prevNodesRef.current = updated;
          return updated;
        }

        // VARIABLE INITIALIZER CONNECTION
        if (
          targetNode.type === "variable" &&
          params.targetHandle === "value"
        ) {
          const updated = nds.map((n) =>
            n.id === targetNode.id
              ? { ...n, data: { ...n.data, initializer: getExpr(sourceNode) } }
              : n
          );
          prevNodesRef.current = updated;
          return updated;
        }

        // CALL NODE CONNECTIONS
        if (targetNode.type === "call") {
          // func reference
          if (params.targetHandle === "func" && sourceNode.type === "function") {
            const sourceData = sourceNode.data as any;
            let expectedArgs: string[] = [];
            
            // Extract parameters from function node
            if (Array.isArray(sourceData.parameters)) {
              expectedArgs = sourceData.parameters;
            } else if (typeof sourceData.parameters === 'string') {
              expectedArgs = sourceData.parameters.split(',').map((p: string) => p.trim()).filter(Boolean);
            }
            
            const updated = nds.map((n) =>
              n.id === targetNode.id
                ? { 
                    ...n, 
                    data: { 
                      ...n.data, 
                      funcName: sourceData?.name ?? "",
                      expectedArgs,
                      args: [] // Reset args when function changes
                    } 
                  }
                : n
            );
            prevNodesRef.current = updated;
            return updated;
          }

          // argX handling
          if (params.targetHandle?.startsWith("arg")) {
            const argIndex = Number(params.targetHandle.slice(3));
            if (!Number.isNaN(argIndex)) {
              const updated = nds.map((n) => {
                if (n.id !== targetNode.id) return n;
                const args = [...((n.data as any).args ?? [])];
                args[argIndex] = getExpr(sourceNode);
                return { ...n, data: { ...n.data, args } };
              });
              prevNodesRef.current = updated;
              return updated;
            }
          }
        }

        // BINARY-OP OPERAND
        if (targetNode.type === "binaryOp" && (params.targetHandle === "lhs" || params.targetHandle === "rhs")) {
          const key = params.targetHandle === "lhs" ? "lhs" : "rhs";
          const updated = nds.map((n) =>
            n.id === targetNode.id ? { ...n, data: { ...n.data, [key]: getExpr(sourceNode) } } : n
          );
          prevNodesRef.current = updated;
          return updated;
        }

        // PROPERTY ACCESS OBJECT CONNECTION
        if (targetNode.type === "propertyAccess" && params.targetHandle === "obj") {
          const updated = nds.map((n) =>
            n.id === targetNode.id ? { ...n, data: { ...n.data, objExpr: getExpr(sourceNode) } } : n
          );
          prevNodesRef.current = updated;
          return updated;
        }

        // CONDITIONAL NODE CONNECTIONS
        if (targetNode.type === "conditional") {
          if (params.targetHandle === "test") {
            const updated = nds.map((n) =>
              n.id === targetNode.id ? { ...n, data: { ...n.data, testExpr: getExpr(sourceNode) } } : n
            );
            prevNodesRef.current = updated;
            return updated;
          }
          if (params.targetHandle === "whenTrue") {
            const updated = nds.map((n) =>
              n.id === targetNode.id ? { ...n, data: { ...n.data, whenTrue: getExpr(sourceNode) } } : n
            );
            prevNodesRef.current = updated;
            return updated;
          }
          if (params.targetHandle === "whenFalse") {
            const updated = nds.map((n) =>
              n.id === targetNode.id ? { ...n, data: { ...n.data, whenFalse: getExpr(sourceNode) } } : n
            );
            prevNodesRef.current = updated;
            return updated;
          }
        }

        // FUNCTION PARAMETER CONNECTIONS
        if (targetNode.type === "function" && params.targetHandle?.startsWith("param-")) {
          // Don't make the function a child of the variable - just allow the connection for visual feedback
          // The parameter connection is handled by the visual edge only
          return nds;
        }

        // Default: Only treat as parent-child for specific cases to avoid unwanted node hiding
        // This is now much more restrictive to prevent accidental node deletion
        return nds;
      });

      // 3. Persist new edge (backend only)
      if (flowId) {
        upsertEdge({
          flowId: flowId as any,
          source: params.source as any,
          sourceHandle: params.sourceHandle ?? undefined,
          target: params.target as any,
          targetHandle: params.targetHandle ?? undefined,
          data: {},
        }).catch(() => {});
      }
    },
    [flowId, nodes, setNodes, setEdges, upsertEdge]
  );
} 