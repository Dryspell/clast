"use client";

import React, { useCallback } from "react";
import { CodePreview } from "./CodePreview";
import { SandboxRunner } from "./SandboxRunner";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface Props {
  code: string;
  flowId?: string;
  onCodeChange: (code: string) => void;
  onSave?: (code: string) => void;
}

export function FlowSidebar({ code, flowId, onCodeChange, onSave }: Props) {
  const updatePreview = useMutation(api.flows.updatePreview);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      onCodeChange(newCode);
      onSave?.(newCode);

      if (flowId) {
        updatePreview({ flowId: flowId as any, code: newCode }).catch(() => {});
      }
    },
    [onCodeChange, onSave, flowId, updatePreview]
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-hidden">
        <CodePreview code={code} onCodeChange={handleCodeChange} />
      </div>
      <div className="h-48 border-t">
        <SandboxRunner code={code} />
      </div>
    </div>
  );
} 