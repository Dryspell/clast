"use client";

import React, { useCallback, useState } from "react";
import { CodePreview } from "./CodePreview";
import { SandboxRunner } from "./SandboxRunner";
import { AstNode } from "@/lib/ast/types";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface Props {
  nodes: AstNode[];
  initialCode?: string;
  flowId?: string;
  onSave?: (code: string) => void;
}

export function FlowSidebar({ nodes, initialCode, flowId, onSave }: Props) {
  const [code, setCode] = useState(initialCode ?? "");

  const updatePreview = useMutation(api.flows.updatePreview);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      onSave?.(newCode);

      if (flowId) {
        updatePreview({ flowId: flowId as any, code: newCode }).catch(() => {});
      }
    },
    [onSave, flowId, updatePreview]
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-hidden">
        <CodePreview nodes={nodes} initialCode={initialCode} onCodeChange={handleCodeChange} />
      </div>
      <div className="h-48 border-t">
        <SandboxRunner code={code} />
      </div>
    </div>
  );
} 