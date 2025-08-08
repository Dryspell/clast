"use client";

import React, { memo, useState } from "react";
import {
	Handle,
	Position,
	NodeProps,
	useReactFlow,
	Node,
	Edge,
} from "@xyflow/react";
import { Button } from "../../ui/button";
import { FunctionSquare } from "lucide-react";
import { VariableNode } from "./VariableNode";
import { InterfaceNode } from "./InterfaceNode";
import { Input } from "../../ui/input";
import { Switch } from "../../ui/switch";
import { BinaryOpNode } from "./BinaryOpNode";
import { LiteralNode } from "./LiteralNode";
import { generateId } from "@/lib/utils";
import {
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Variable, Divide, Quote, PlayCircle, Plus, Code } from "lucide-react";

interface FunctionNodeProps extends NodeProps {
	data: FunctionNodeData;
	id: string;
	xPos?: number;
	yPos?: number;
}

// Local type for node data
interface FunctionNodeData {
	name: string;
	returnType?: string;
	parameters?: string | string[];
	async?: boolean;
	text?: string;
	type?: "function";
	[key: string]: unknown;
}

/**
 * TODO: Function Node Improvements
 * 1. Add expand/collapse functionality for function body preview
 * 2. Add visual indicators for parameter types (with proper type validation)
 * 3. Add validation indicators for connected parameters
 * 4. Implement view action to show full function code
 * 5. Add quick parameter addition UI
 * 6. Implement nested flow visualization for function body
 * 7. Add scope visualization for external references
 * 8. Add proper types for nested flow data
 * 9. Implement drag-and-drop for parameter reordering
 * 10. Add parameter type inference from connections
 */
const FunctionNode = memo(
	({ data, isConnectable, id, xPos, yPos }: FunctionNodeProps) => {
		const { setNodes, setEdges, getNodes, getEdges, fitView } =
			useReactFlow();
		const [isEditingParams, setIsEditingParams] = useState(false);
		const [isBodyExpanded, setIsBodyExpanded] = useState(false);
		const [paramsInput, setParamsInput] = useState(() => {
			if (!data.parameters) return "";
			if (Array.isArray(data.parameters)) {
				if (
					data.parameters.length &&
					typeof data.parameters[0] === "object"
				) {
					return (data.parameters as any[])
						.map((p) => `${p.name}${p.type ? `: ${p.type}` : ""}`)
						.join(", ");
				}
				return (data.parameters as string[]).join(", ");
			}
			if (typeof data.parameters === "string") return data.parameters;
			return "";
		});

		const updateNodeData = React.useCallback(
			(partial: Partial<FunctionNodeData>) => {
				setNodes((nodes) =>
					nodes.map((n) =>
						n.id === id
							? { ...n, data: { ...n.data, ...partial } }
							: n
					)
				);
			},
			[id, setNodes]
		);

		// Helper to normalise parameters into an array of strings
		const normalisedParameters = React.useMemo<string[]>(() => {
			if (!data.parameters) return [];

			// Array case
			if (Array.isArray(data.parameters)) {
				// If objects, convert to "name: type" strings for display
				if (
					data.parameters.length &&
					typeof data.parameters[0] === "object"
				) {
					return (data.parameters as any[]).map(
						(p) => `${p.name}${p.type ? `: ${p.type}` : ""}`
					);
				}
				return data.parameters as string[];
			}

			// String case
			if (typeof data.parameters === "string") {
				return data.parameters
					.split(",")
					.map((p) => p.trim())
					.filter(Boolean);
			}

			return [];
		}, [data.parameters]);

		// We now embed the sub-flow directly inside the function node itself. All
		// child nodes use the function node id as their `parentId` so that React
		// Flow keeps them together.

		// helper to build parameter and binary nodes inside a group and add to global flow
		const ensureBodyNodes = React.useCallback(() => {
			const existingNodes = getNodes();
			// if we already created the parameter nodes for this function, simply unhide them
			if (existingNodes.some((n) => n.parentId === id)) {
				// If they exist but were hidden, unhide them
				setNodes((ns) =>
					ns.map((n) =>
						n.parentId === id ? { ...n, hidden: false } : n
					)
				);
				setEdges((es) =>
					es.map((e) =>
						e.target?.startsWith(`sum-${id}`) ||
						e.id.startsWith(`e-${id}-`)
							? { ...e, hidden: false }
							: e
					)
				);
				return;
			}

			// Currently we don't auto-generate placeholder nodes inside the
			// function body.  This avoids showing duplicate "parameter"
			// variables (which are already represented in the header) and
			// lets users decide what logic to add.

			// If no child nodes exist yet, there's nothing to add – we simply
			// return after ensuring the viewport is centred once.

			// make sure the viewport centers on the node itself when first
			// expanded so the user isn't left staring at empty canvas space.
			setTimeout(() => {
				const currentNodes = getNodes().filter(
					(n) => n.id === id || n.parentId === id
				);
				if (currentNodes.length) {
					fitView({ nodes: currentNodes, padding: 0.2 });
				}
			}, 0);

			return; // Nothing else to do for now.
		}, [getNodes, id, setEdges, setNodes, fitView]);

		// create body nodes on mount / when parameters change
		React.useEffect(() => {
			ensureBodyNodes();
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [normalisedParameters]);

		// Calculate usage count (how many CallNodes reference this function)
		const usageCount = React.useMemo(() => {
			const nodes = getNodes();
			return nodes.filter(n => 
				n.type === 'call' && n.data.funcName === data.name
			).length;
		}, [getNodes, data.name]);

		// Quick call function
		const createQuickCall = React.useCallback(() => {
			const callNodeId = generateId();
			
			// Get current function node position to place call node to the right
			const currentNodes = getNodes();
			const currentNode = currentNodes.find(n => n.id === id);
			const baseX = currentNode?.position.x || 0;
			const baseY = currentNode?.position.y || 0;
			const newCallNode: Node = {
				id: callNodeId,
				type: 'call',
				position: { x: baseX + 650, y: baseY },
				data: { 
					funcName: data.name,
					expectedArgs: normalisedParameters,
					args: new Array(normalisedParameters.length).fill(''),
					label: `call_${data.name}`,
					type: 'call'
				}
			} as Node;
			// Add the node first
			setNodes(nodes => [...nodes, newCallNode]);
			
			// Add the connection - this should trigger the connection handler
			const newEdge = {
				id: generateId(),
				source: id,
				sourceHandle: 'output',
				target: callNodeId,
				targetHandle: 'func',
				type: 'default'
			};
			// Use setTimeout to ensure the node is added before creating the edge
			setTimeout(() => {
				setEdges(edges => [...edges, newEdge]);
			}, 10);
			
		}, [id, data.name, normalisedParameters, getNodes, setNodes, setEdges]);

		const clickPosRef = React.useRef<{ x: number; y: number }>({
			x: 0,
			y: 0,
		});

		const handleContextMenu = React.useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				const rect = (
					e.currentTarget as HTMLDivElement
				).getBoundingClientRect();
				clickPosRef.current = {
					x: e.clientX - rect.left,
					y: e.clientY - rect.top,
				};
			},
			[]
		);

		const addChildNode = React.useCallback(
			(type: string) => {
				const { x, y } = clickPosRef.current;
				const idNew = generateId();
				let nodeData: any = { type };
				if (type === "variable")
					nodeData = { name: "newVar", variableType: "number", type };
				if (type === "literal")
					nodeData = { value: "0", literalType: "number", type };
				if (type === "binaryOp") nodeData = { operator: "+", type };
                const newNode: Node = {
					id: idNew,
					type,
                  // Use React Flow's parentNode for proper in-place rendering
                  parentNode: id,
					extent: "parent",
					position: { x, y },
					data: nodeData,
				} as Node;
				setNodes((ns) => [...ns, newNode]);
			},
			[id, setNodes]
		);

		// Get child nodes (function body)
        const bodyNodes = React.useMemo(() => {
          const nodes = getNodes();
          return nodes.filter(n => (n as any).parentNode === id || (n as any).parentId === id);
        }, [getNodes, id]);

		return (
			<>
				<div className="relative w-[600px] min-h-[500px] rounded-lg border-2 border-purple-200 bg-card shadow-lg transition-shadow hover:shadow-xl">
					{/* Function Header */}
					<div className="p-3 border-b">
						<div className="flex gap-2 items-center mb-2">
							<div className="flex justify-center items-center w-6 h-6 rounded bg-purple-500/10">
								<FunctionSquare className="w-4 h-4 text-purple-500" />
							</div>
							<Input
								value={data.name || "anonymous"}
								onChange={(e) => {
									const val = e.target.value;
									updateNodeData({ name: val });
								}}
								className="flex-1 h-7 text-xs"
								placeholder="Function name"
								onKeyDown={(e) => {
									if (e.key === "Enter") e.preventDefault();
								}}
							/>
							<Switch
								id={`${id}-async`}
								checked={data.async}
								onCheckedChange={(checked) =>
									updateNodeData({ async: checked })
								}
								className="w-8 h-4"
								title="Toggle async"
							/>
						</div>
						{/* Usage stats and quick actions */}
						<div className="flex justify-between items-center">
							<div className="text-xs text-muted-foreground">
								Used in {usageCount} place{usageCount !== 1 ? 's' : ''}
							</div>
							<Button
								size="sm"
								variant="ghost"
								onClick={createQuickCall}
								className="px-2 h-6 text-xs"
								title="Create a call to this function"
							>
								<PlayCircle className="mr-1 w-3 h-3" />
								Call
							</Button>
						</div>
					</div>

					{/* Parameters Section */}
					<div className="relative p-3 border-b">
						<div className="flex justify-between items-center mb-2">
							<div className="text-xs font-medium text-muted-foreground">
								Input Parameters {isEditingParams && <span className="text-blue-600">(editing...)</span>}
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="p-0 w-5 h-5 edit-params-btn"
								onClick={() => {
									if (isEditingParams) {
										// Save parameters when clicking checkmark
										const paramArr = paramsInput
											.split(",")
											.map((p) => p.trim())
											.filter(Boolean);
										updateNodeData({ parameters: paramArr });
									}
									setIsEditingParams(!isEditingParams);
								}}
								title={isEditingParams ? "Save parameters" : "Edit parameters"}
							>
								<span className="text-xs">
									{isEditingParams ? "✔" : "+"}
								</span>
							</Button>
						</div>
						{isEditingParams ? (
							<Input
								value={paramsInput}
								onChange={(e) => {
									const val = e.target.value;
									setParamsInput(val);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										// split into array and save
										const paramArr = paramsInput
											.split(",")
											.map((p) => p.trim())
											.filter(Boolean);
										updateNodeData({ parameters: paramArr });
										setIsEditingParams(false);
									} else if (e.key === "Escape") {
										setIsEditingParams(false);
									}
								}}
								onBlur={(e) => {
									// Only close if we're not clicking on the edit button
									const relatedTarget = e.relatedTarget as HTMLElement;
									if (!relatedTarget || !relatedTarget.closest('.edit-params-btn')) {
										// split into array and save
										const paramArr = paramsInput
											.split(",")
											.map((p) => p.trim())
											.filter(Boolean);
										updateNodeData({ parameters: paramArr });
										setIsEditingParams(false);
									}
								}}
								className="h-7 text-xs"
								placeholder="e.g. id: string, count: number (press Enter to save)"
								autoFocus
							/>
						) : (
							<div
								className="flex flex-wrap gap-2"
								onDoubleClick={() => setIsEditingParams(true)}
							>
								{normalisedParameters.length ? (
									normalisedParameters.map(
										(param: string, index: number) => (
											<div
												key={index}
												className="relative group"
											>
												<div className="relative px-3 py-2 text-xs rounded-md border transition-colors bg-muted hover:bg-purple-50">
													<span className="font-medium">{param.trim()}</span>
													<div className="absolute left-0 top-1/2 w-2 h-2 bg-purple-500 rounded-full opacity-60 transform -translate-x-1 -translate-y-1/2"></div>
												</div>
											</div>
										)
									)
								) : (
									<div className="text-xs italic text-muted-foreground">
										No parameters - click + to add
									</div>
								)}
							</div>
						)}
						
						{/* Parameter connection handles - only render when not editing */}
						{!isEditingParams && normalisedParameters.map((param: string, index: number) => (
							<Handle
								key={`param-handle-${index}`}
								type="target"
								position={Position.Left}
								id={`param-${index}`}
								isConnectable={isConnectable}
								className="!absolute !bg-purple-500 !w-4 !h-4 !rounded-full !border-2 !border-white !opacity-80 hover:!opacity-100 transition-opacity"
								style={{ 
									left: -8,
									top: `${20 + index * 40}px`,
								}}
								title={`Connect a variable to parameter: ${param.trim()}`}
							/>
						))}
					</div>

					{/* Function Body Section */}
					<div className="p-3 border-t">
						<div className="flex justify-between items-center mb-2">
							<div className="text-xs font-medium text-muted-foreground">
								Function Body ({bodyNodes.length} node{bodyNodes.length !== 1 ? 's' : ''})
							</div>
							<div className="flex gap-1">
								<Button
									variant="ghost"
									size="sm"
									className="p-0 w-5 h-5"
									onClick={() => setIsBodyExpanded(!isBodyExpanded)}
									title={isBodyExpanded ? "Collapse body" : "Expand body"}
								>
									<span className="text-xs">
										{isBodyExpanded ? "−" : "+"}
									</span>
								</Button>
							</div>
						</div>

						{/* Function body preview */}
						{bodyNodes.length > 0 && (
							<div className="p-2 mb-3 bg-purple-50 rounded border border-purple-200">
								<div className="mb-1 text-xs font-medium text-purple-800">Implementation Preview:</div>
								<div className="font-mono text-xs text-purple-700">
									{bodyNodes.length === 1 
										? `return ${bodyNodes[0].data.name || 'result'};`
										: `${bodyNodes.length} implementation nodes`
									}
								</div>
							</div>
						)}

						{/* Function body interaction area with context menu */}
						<ContextMenu>
							<ContextMenuTrigger
								className={`w-full ${isBodyExpanded ? 'h-[400px]' : 'h-[200px]'} border-2 border-dashed border-purple-200 rounded flex items-center justify-center transition-all`}
								onContextMenu={handleContextMenu}
							>
								<div className="text-center text-muted-foreground">
									{bodyNodes.length === 0 ? (
										<div>
											<Code className="mx-auto mb-2 w-8 h-8 opacity-50" />
											<div className="text-sm">Right-click to add function logic</div>
											<div className="text-xs">Variables, operations, return values</div>
										</div>
									) : (
										<div>
											<div className="text-sm">Function implementation area</div>
											<div className="text-xs">Right-click to add more logic</div>
										</div>
									)}
								</div>
							</ContextMenuTrigger>
							<ContextMenuContent className="w-48">
								<ContextMenuItem
									onSelect={() => addChildNode("variable")}
									className="flex gap-2 items-center"
								>
									<Variable className="w-4 h-4" />
									<span>Add Variable</span>
								</ContextMenuItem>
								<ContextMenuItem
									onSelect={() => addChildNode("literal")}
									className="flex gap-2 items-center"
								>
									<Quote className="w-4 h-4" />
									<span>Add Literal</span>
								</ContextMenuItem>
								<ContextMenuSeparator />
								<ContextMenuItem
									onSelect={() => addChildNode("binaryOp")}
									className="flex gap-2 items-center"
								>
									<Divide className="w-4 h-4" />
									<span>Add Binary Operation</span>
								</ContextMenuItem>
								<ContextMenuItem
									onSelect={() => addChildNode("call")}
									className="flex gap-2 items-center"
								>
									<PlayCircle className="w-4 h-4" />
									<span>Call Function</span>
								</ContextMenuItem>
							</ContextMenuContent>
						</ContextMenu>
					</div>

					{/* Output handle pinned to middle right */}
					<Handle
						id="output"
						type="source"
						position={Position.Right}
						isConnectable={isConnectable}
						className="!h-4 !w-4 !rounded-full !bg-purple-500 !border-2 !border-white !opacity-90 hover:!opacity-100 transition-opacity"
						style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
						title="Drag to call this function or use its return value"
					/>
				</div>
			</>
		);
	}
);

FunctionNode.displayName = "FunctionNode";

export { FunctionNode };
