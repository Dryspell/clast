"use client";

import React, { useCallback } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Variable,
  FunctionSquare,
  Box,
  Globe,
  Divide,
  Quote,
  TerminalSquare,
  PlayCircle,
  Circle,
  HelpCircle,
} from "lucide-react";

interface Props {
  onCreate: (type: string, position: { x: number; y: number }) => void;
  /**
   * The DOM element that React-Flow is mounted in. We use it to compute the
   * viewport center when creating nodes from the menu.
   */
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

export function FlowContextMenu({ onCreate, wrapperRef, children }: Props) {
  const create = useCallback(
    (type: string) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) {
        console.warn("No wrapper found, creating at origin");
        onCreate(type, { x: 100, y: 100 });
        return;
      }

      const rect = wrapper.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      console.log(`Creating ${type} node at position:`, { x: centerX, y: centerY });
      onCreate(type, { x: centerX, y: centerY });
    },
    [onCreate, wrapperRef]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={() => create("variable")} className="flex items-center gap-2">
          <Variable className="h-4 w-4" />
          <span>Add Variable</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => create("function")} className="flex items-center gap-2">
          <FunctionSquare className="h-4 w-4" />
          <span>Add Function</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => create("interface")} className="flex items-center gap-2">
          <Box className="h-4 w-4" />
          <span>Add Interface</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => create("api")} className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>Add API Endpoint</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => create("console")} className="flex items-center gap-2">
          <TerminalSquare className="h-4 w-4" />
          <span>Add Console Log</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => create("call")} className="flex items-center gap-2">
          <PlayCircle className="h-4 w-4" />
          <span>Call Function</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => create("binaryOp")} className="flex items-center gap-2">
          <Divide className="h-4 w-4" />
          <span>Add Binary Operation</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => create("literal")} className="flex items-center gap-2">
          <Quote className="h-4 w-4" />
          <span>Add Literal</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => create("object")} className="flex items-center gap-2">
          <Box className="h-4 w-4" />
          <span>Add Object Literal</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => create("propertyAccess")} className="flex items-center gap-2">
          <Circle className="h-4 w-4" />
          <span>Property Access</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => create("conditional")} className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          <span>Conditional</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
} 