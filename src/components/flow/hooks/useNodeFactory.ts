import { useCallback } from "react";
import { Node as RFNode } from "@xyflow/react";
import { generateId } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

// Provides a memoised function to create a new node at a position
export function useNodeFactory(flowId: string | undefined, setNodes: (updater: (nodes: RFNode<any>[]) => RFNode<any>[]) => void) {
  const upsertNode = useMutation(api.nodes.upsert);

  return useCallback(
    async (type: string, position: { x: number; y: number }) => {
      let defaultData: any = {};
      switch (type) {
        case "variable":
          defaultData = { name: "newVar", variableType: "number", type };
          break;
        case "function":
          defaultData = {
            name: "myFunction",
            parameters: [],
            returnType: undefined,
            async: false,
            type,
          };
          break;
        case "binaryOp":
          defaultData = { operator: "+", type };
          break;
        case "literal":
          defaultData = { value: "0", literalType: "number", type };
          break;
        case "api":
          defaultData = {
            label: "fetchData",
            method: "GET",
            endpoint: "https://api.example.com/endpoint",
            headers: {},
            type,
          };
          break;
        case "console":
          defaultData = { label: "log", type };
          break;
        case "call":
          defaultData = { funcName: undefined, args: [], type };
          break;
        case "propertyAccess":
          defaultData = { property: "prop", type };
          break;
        case "object":
          defaultData = {
            name: "obj",
            properties: [
              { key: "id", value: "''" },
              { key: "name", value: "''" },
            ],
            type,
          };
          break;
        default:
          defaultData = { name: `New${type.charAt(0).toUpperCase() + type.slice(1)}`, type };
          break;
      }

      let newId: string;
      if (flowId) {
        newId = (await upsertNode({
          flowId: flowId as any,
          type,
          data: defaultData,
          x: position.x,
          y: position.y,
        })) as unknown as string;
      } else {
        newId = generateId();
      }

      const newNode: RFNode<any> = {
        id: newId,
        type,
        position,
        data: defaultData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [flowId, setNodes, upsertNode]
  );
} 