"use client";

import React, { useCallback, useRef, useState } from "react";
import {
	ReactFlow,
	Background,
	Controls,
	MiniMap,
	Node as RFNode,
	Edge as RFEdge,
	Connection,
	useNodesState,
	useEdgesState,
	addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "../ui/button";
import { generateId } from "@/lib/utils";
import { FunctionNode } from "./nodes/FunctionNode";
import { VariableNode } from "./nodes/VariableNode";
import { InterfaceNode } from "./nodes/InterfaceNode";
import { ApiNode } from "./nodes/ApiNode";
import { CodePreview } from "./CodePreview";
import { Parser } from "@/lib/ast/parser";
import { AstNode } from "@/lib/ast/types";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
	Variable,
	FunctionSquare,
	Box,
	Globe,
	Divide,
	Quote,
} from "lucide-react";
import { BinaryOpNode } from "./nodes/BinaryOpNode";
import { LiteralNode } from "./nodes/LiteralNode";
import { LabeledGroupNode } from "./nodes/LabeledGroupNode";

// Custom node types
const nodeTypes = {
	function: FunctionNode,
	variable: VariableNode,
	interface: InterfaceNode,
	api: ApiNode,
	binaryOp: BinaryOpNode,
	literal: LiteralNode,
	labeledGroup: LabeledGroupNode,
};

export interface FlowEditorProps {
	onSave?: (code: string) => void;
	initialCode?: string;
}

export function FlowEditor({ onSave, initialCode = "" }: FlowEditorProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
	const [code, setCode] = useState(initialCode);
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const prevNodesRef = useRef<RFNode<any>[]>([]);

	// Keep previous nodes reference in sync with latest nodes
	React.useEffect(() => {
		prevNodesRef.current = nodes;
	}, [nodes]);

	// No longer need custom change detection; CodePreview regenerates on any node change
	const hasNodeDataChanged = () => true;

	// Handle node changes and detect meaningful updates
	const handleNodesChange = useCallback(
		(changes: any[]) => {
			onNodesChange(changes);

			// After the state updates, check if we had meaningful changes
			setNodes((currentNodes) => {
				const hadMeaningfulChanges = hasNodeDataChanged();
				prevNodesRef.current = currentNodes;
				return currentNodes;
			});
		},
		[onNodesChange]
	);

	// Parse initial code into AST nodes
	React.useEffect(() => {
		if (initialCode) {
			const parser = new Parser();
			const astNodes = parser.parseCode(initialCode);
			const flowNodes = astNodes.map((node: AstNode) => ({
				id: node.id,
				type: node.type,
				position: { x: 0, y: 0 }, // We'll need to implement proper layout
				data: node.data,
			}));
			setNodes(flowNodes);
		}
	}, [initialCode]);

	// Demo flow: a+b sum
	React.useEffect(() => {
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

			const edgeAtoFunc = {
				id: generateId(),
				source: idLitA,
				sourceHandle: "output",
				target: idSumFunc,
				targetHandle: "param-0",
			};

			const edgeBtoFunc = {
				id: generateId(),
				source: idLitB,
				sourceHandle: "output",
				target: idSumFunc,
				targetHandle: "param-1",
			};

			setNodes([sumFuncNode, litANode, litBNode]);
			setEdges([edgeAtoFunc as any, edgeBtoFunc as any]);
		}
	}, []);

	const onConnect = useCallback(
		(params: Connection) => {
			// 1. Draw the edge on the canvas first
			setEdges((eds: RFEdge<any>[]) => addEdge(params, eds));

			// 2. Update node metadata based on the type of connection that was made
			setNodes((nds: RFNode<any>[]) => {
				const sourceNode = nds.find((n) => n.id === params.source);
				const targetNode = nds.find((n) => n.id === params.target);

				if (!sourceNode || !targetNode) return nds;

				// VARIABLE TYPE CONNECTION
				// We treat a connection into the "type" handle of a variable node as a
				// request to set its declared type. Only Interface or Type nodes are
				// allowed as a source for this connection.
				if (
					targetNode.type === "variable" &&
					params.targetHandle === "type" &&
					(sourceNode.type === "interface" ||
						sourceNode.type === "type")
				) {
					const updated = nds.map((n) =>
						n.id === targetNode.id
							? {
									...n,
									data: {
										...n.data,
										variableType: (sourceNode.data as any)
											.name,
									},
							  }
							: n
					);
					prevNodesRef.current = updated;
					return updated;
				}

				// BINARY OPERATION OPERAND CONNECTION
				// When an edge is made into lhs or rhs handle of a binaryOp node, store operand expression
				if (
					targetNode.type === "binaryOp" &&
					(params.targetHandle === "lhs" || params.targetHandle === "rhs")
				) {
					let operandExpr = "";
					if (sourceNode.type === "variable") {
						operandExpr = (sourceNode.data as any)?.name ?? "";
					} else if (sourceNode.type === "literal") {
						const litData = sourceNode.data as any;
						operandExpr = litData.literalType === "string" ? `"${litData.value}"` : litData.value;
					} else if (sourceNode.type === "function") {
						operandExpr = `${(sourceNode.data as any)?.name ?? ""}()`;
					}

					const updated = nds.map((n) =>
						n.id === targetNode.id
							? {
									...n,
									data: {
										...n.data,
										[params.targetHandle === "lhs" ? "lhs" : "rhs"]: operandExpr,
									},
							  }
							: n
					);
					prevNodesRef.current = updated;
					return updated;
				}

				// VARIABLE VALUE CONNECTION – extend to accept binaryOp as source
				if (
					targetNode.type === "variable" &&
					params.targetHandle === "value" &&
					(sourceNode.type === "variable" ||
						sourceNode.type === "function" ||
						sourceNode.type === "binaryOp")
				) {
					let sourceExpr = "";
					if (sourceNode.type === "function") {
						sourceExpr = `${(sourceNode.data as any)?.name ?? ""}()`;
					} else if (sourceNode.type === "binaryOp") {
						sourceExpr = `bin_${sourceNode.id.replace(/-/g, "_")}`;
					} else {
						sourceExpr = (sourceNode.data as any)?.name ?? "";
					}

					const updated = nds.map((n) =>
						n.id === targetNode.id
							? {
									...n,
									data: {
										...n.data,
										initializer: sourceExpr,
									},
							  }
							: n
					);
					prevNodesRef.current = updated;
					return updated;
				}

				// Default – no metadata change required
				prevNodesRef.current = nds;
				return nds;
			});
		},
		[setEdges, setNodes]
	);

	const createNode = useCallback(
		(type: string, position: { x: number; y: number }) => {
			let defaultData: any = {};
			if (type === "variable") {
				defaultData = { name: "newVar", variableType: "number", type };
			} else if (type === "function") {
				defaultData = {
					name: "sum",
					parameters: ["a: number", "b: number"],
					returnType: "number",
					async: false,
					type,
				};
			} else if (type === "binaryOp") {
				defaultData = { operator: "+", type };
			} else if (type === "literal") {
				defaultData = { value: "0", literalType: "number", type };
			} else {
				defaultData = {
					name: `New${type.charAt(0).toUpperCase() + type.slice(1)}`,
					type,
				};
			}

			const newNode: RFNode<any> = {
				id: generateId(),
				type,
				position,
				data: defaultData,
			};

			setNodes((nds: RFNode<any>[]) => nds.concat(newNode));
		},
		[setNodes]
	);

	const handleContextMenuSelect = useCallback(
		(type: string) => {
			if (!reactFlowWrapper.current) return;

			// Get the center of the viewport for new node placement
			const bounds = reactFlowWrapper.current.getBoundingClientRect();
			const position = {
				x: bounds.width / 2,
				y: bounds.height / 2,
			};

			createNode(type, position);
		},
		[createNode]
	);

	const handleCodeChange = useCallback(
		(newCode: string) => {
			setCode(newCode);
			if (onSave) {
				onSave(newCode);
			}
		},
		[onSave]
	);

	return (
		<div className="grid h-full grid-cols-[1fr_400px]">
			<ContextMenu>
				<ContextMenuTrigger className="h-full">
					<div className="h-full w-full" ref={reactFlowWrapper}>
						<ReactFlow
							nodes={nodes}
							edges={edges}
							onNodesChange={handleNodesChange}
							onEdgesChange={onEdgesChange}
							onConnect={onConnect}
							nodeTypes={nodeTypes as any}
							fitView
						>
							<Controls />
							<MiniMap />
							<Background />
						</ReactFlow>
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent className="w-48">
					<ContextMenuItem
						onSelect={() => handleContextMenuSelect("variable")}
						className="flex items-center gap-2"
					>
						<Variable className="h-4 w-4" />
						<span>Add Variable</span>
					</ContextMenuItem>
					<ContextMenuItem
						onSelect={() => handleContextMenuSelect("function")}
						className="flex items-center gap-2"
					>
						<FunctionSquare className="h-4 w-4" />
						<span>Add Function</span>
					</ContextMenuItem>
					<ContextMenuItem
						onSelect={() => handleContextMenuSelect("interface")}
						className="flex items-center gap-2"
					>
						<Box className="h-4 w-4" />
						<span>Add Interface</span>
					</ContextMenuItem>
					<ContextMenuItem
						onSelect={() => handleContextMenuSelect("api")}
						className="flex items-center gap-2"
					>
						<Globe className="h-4 w-4" />
						<span>Add API Endpoint</span>
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						onSelect={() => handleContextMenuSelect("binaryOp")}
						className="flex items-center gap-2"
					>
						<Divide className="h-4 w-4" />
						<span>Add Binary Operation</span>
					</ContextMenuItem>
					<ContextMenuItem
						onSelect={() => handleContextMenuSelect("literal")}
						className="flex items-center gap-2"
					>
						<Quote className="h-4 w-4" />
						<span>Add Literal</span>
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
			<CodePreview
				nodes={nodes as unknown as AstNode[]}
				onCodeChange={handleCodeChange}
			/>
		</div>
	);
}
