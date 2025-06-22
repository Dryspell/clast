"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy load FlowEditor because it uses browser-only APIs like React Flow
const FlowEditor = dynamic(() => import("@/components/flow/FlowEditor").then(m => m.FlowEditor), { ssr: false });

export default function FlowEditorPage() {
  const params = useParams();
  const flowId = params.id as string;

  if (!flowId) return <p>Invalid flow id</p>;

  return (
    <div className="h-screen">
      <FlowEditor flowId={flowId} />
    </div>
  );
} 