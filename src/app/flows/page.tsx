"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function FlowsPage() {
  // ensure user exists and capture id
  const ensureUser = useMutation(api.users.ensure);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      let anonId = localStorage.getItem("anonId");
      if (!anonId) {
        anonId = crypto.randomUUID();
        localStorage.setItem("anonId", anonId);
      }
      const id = await ensureUser({ anonId });
      setUserId(id);
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flows = useQuery(api.flows.listMine, userId ? { ownerId: userId as any } : "skip");

  const createFlow = useMutation(api.flows.create);
  const renameFlow = useMutation(api.flows.rename);
  const deleteFlow = useMutation(api.flows.remove);

  const handleCreate = async () => {
    if (!userId) return;
    const newId = await createFlow({ ownerId: userId as any, title: "Untitled flow" });
    router.push(`/flows/${newId}`);
  };

  return (
    <div className="p-8">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Flows</h1>
        <Button onClick={handleCreate}>+ New Flow</Button>
      </div>
      {flows ? (
        <ul className="space-y-2">
          {flows.map((f: any) => (
            <li key={f._id} className="border px-4 py-2 rounded flex justify-between gap-2 hover:bg-accent">
              <span className="flex-1 cursor-pointer" onClick={() => router.push(`/flows/${f._id}`)}>
                {f.title || "Untitled"}
              </span>
              <input
                className="border rounded px-1 text-sm w-32"
                defaultValue={f.title}
                onBlur={e => renameFlow({ flowId: f._id, title: e.target.value })}
              />
              <Button variant="destructive" size="sm" onClick={() => deleteFlow({ flowId: f._id })}>Delete</Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading…</p>
      )}
    </div>
  );
} 