"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { Box } from "lucide-react";
import { Input } from "../../ui/input";

export type InterfaceNodeData = {
	name: string;
	members: Array<string | { name: string; type?: string }>;
	text?: string;
};

const InterfaceNode = memo(({ data, isConnectable, id }: NodeProps<any>) => {
	const typedData = data as InterfaceNodeData;

	const [name, setName] = useState(typedData.name);
	const { setNodes } = useReactFlow();

	const updateNodeName = React.useCallback((val: string) => {
		setNodes(nodes => nodes.map(n => n.id === id ? { ...n, data: { ...n.data, name: val } } : n))
	}, [id, setNodes]);

	return (
		<div className="relative min-w-[250px] rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
			<Handle
				type="target"
				position={Position.Top}
				isConnectable={isConnectable}
				className="!bg-muted-foreground"
			/>
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<div className="flex h-6 w-6 items-center justify-center rounded bg-green-500/10">
						<Box className="h-4 w-4 text-green-500" />
					</div>
					<Input
						value={name}
						onChange={(e) => {
							const val = e.target.value;
							setName(val);
							updateNodeName(val);
						}}
						className="h-7 text-xs"
						placeholder="Interface name"
						onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
					/>
				</div>
				<div className="space-y-2 rounded-md bg-muted/30 p-2">
					<div className="text-xs text-muted-foreground">
						Members:
					</div>
					<div className="space-y-1.5">
						{typedData.members.map((member, index) => {
							const label = typeof member === 'string' ? member : `${member.name}${member.type ? `: ${member.type}` : ''}`
							return (
								<div
									key={index}
									className="rounded border bg-background px-2 py-1 text-xs font-mono text-muted-foreground shadow-sm"
								>
									{label}
								</div>
							)
						})}
					</div>
				</div>
			</div>
			<Handle
				id="output"
				type="source"
				position={Position.Right}
				isConnectable={isConnectable}
				className="!right-0 !h-3 !w-3 !rounded-full !bg-green-500"
				title="Drag from here to use this interface type"
			/>
		</div>
	);
});

InterfaceNode.displayName = "InterfaceNode";

export { InterfaceNode };
