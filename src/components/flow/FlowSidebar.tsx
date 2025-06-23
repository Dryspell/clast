"use client";

import React, { useCallback, useState } from "react";
import { CodePreview } from "./CodePreview";
import { SandboxRunner } from "./SandboxRunner";
import { AstNode } from "@/lib/ast/types";
import { Node as RFNode } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface Props {
  nodes: RFNode<any>[];
  initialCode?: string;
  flowId?: string;
  onSave?: (code: string) => void;
  onCodeEdited?: (code: string) => void;
}

export function FlowSidebar({ nodes, initialCode, flowId, onSave, onCodeEdited }: Props) {
  const [code, setCode] = useState(initialCode ?? "");

  const updatePreview = useMutation(api.flows.updatePreview);

  // Map React Flow nodes to AstNodes for code generation
  const astNodes = React.useMemo<AstNode[]>(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: n.type ?? "",
        parentId: (n as any).parentId,
        data: n.data as any,
      })),
    [nodes]
  );

  const handleCodeChange = useCallback(
    (newCode: string) => {
      if (newCode !== code) {
        setCode(newCode);
        onSave?.(newCode);
        onCodeEdited?.(newCode);
      }

      if (flowId) {
        updatePreview({ flowId: flowId as any, code: newCode }).catch(() => {});
      }
    },
    [code, onSave, onCodeEdited, flowId, updatePreview]
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-hidden">
        <CodePreview nodes={astNodes} initialCode={initialCode} onCodeChange={handleCodeChange} />
      </div>
      <div className="h-48 border-t">
        <SandboxRunner code={code} />
      </div>
    </div>
  );
} 