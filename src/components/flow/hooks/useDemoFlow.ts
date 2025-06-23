import { useEffect } from "react";
import { Node as RFNode, Edge } from "@xyflow/react";
import { generateId } from "@/lib/utils";

/**
 * Adds the hard-coded a+b sum demo flow when running in local/demo mode.
 */
export function useDemoFlow({
  initialCode,
  nodes,
  setNodes,
  setEdges,
}: {
  initialCode?: string;
  nodes: RFNode<any>[];
  setNodes: (nodes: RFNode<any>[]) => void;
  setEdges: (edges: Edge<any>[]) => void;
}) {
  useEffect(() => {
    if (!initialCode && nodes.length === 0) {
      const idSumFunc = generateId();
      const idLitA = generateId();
      const idLitB = generateId();

      const sumFuncNode: RFNode<any> = {
        id: idSumFunc,
        type: "function",
        position: { x: 300, y: 200 },
        data: {
          name: "sum",
          parameters: ["a: number", "b: number"],
          returnType: "number",
          type: "function",
        },
      };

      const litANode: RFNode<any> = {
        id: idLitA,
        type: "literal",
        position: { x: 50, y: 150 },
        data: {
          value: "2",
          literalType: "number",
          type: "literal",
        },
      };

      const litBNode: RFNode<any> = {
        id: idLitB,
        type: "literal",
        position: { x: 50, y: 250 },
        data: {
          value: "3",
          literalType: "number",
          type: "literal",
        },
      };

      const edgeAtoFunc: Edge<any> = {
        id: generateId(),
        source: idLitA,
        sourceHandle: "output",
        target: idSumFunc,
        targetHandle: "param-0",
      } as any;

      const edgeBtoFunc: Edge<any> = {
        id: generateId(),
        source: idLitB,
        sourceHandle: "output",
        target: idSumFunc,
        targetHandle: "param-1",
      } as any;

      setNodes([sumFuncNode, litANode, litBNode]);
      setEdges([edgeAtoFunc, edgeBtoFunc]);
    }
  }, [initialCode, nodes]);
} 