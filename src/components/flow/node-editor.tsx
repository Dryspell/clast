'use client'

import React from 'react'
import { Node } from '@xyflow/react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { VariableNodeData } from './nodes/VariableNode'

export interface FunctionNodeData {
  name: string
  returnType?: string
  parameters?: string
  async?: boolean
  text: string
  type: 'function'
  [key: string]: unknown
}

export interface InterfaceNodeData {
  name: string
  properties?: string
  extends?: string
  text: string
  type: 'interface'
  [key: string]: unknown
}

export interface ApiNodeData {
  endpoint: string
  method: string
  headers?: string
  body?: string
  text: string
  type: 'api'
  [key: string]: unknown
}

export type NodeData = VariableNodeData | FunctionNodeData | InterfaceNodeData | ApiNodeData

interface NodeEditorProps {
  node: Node<NodeData> | null
  onClose: () => void
  onUpdate: (node: Node<NodeData>) => void
}

export function NodeEditor({ node, onClose, onUpdate }: NodeEditorProps) {
  if (!node || !node.type) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const updatedNode = { ...node }

    switch (node.type) {
      case 'variable':
        updatedNode.data = {
          ...node.data,
          name: formData.get('name') as string,
          variableType: formData.get('type') as string,
          initializer: formData.get('initializer') as string,
          text: node.data.text,
          type: 'variable'
        } as VariableNodeData
        break
      case 'function':
        updatedNode.data = {
          ...node.data,
          name: formData.get('name') as string,
          returnType: formData.get('returnType') as string,
          parameters: formData.get('parameters') as string,
          async: formData.get('async') === 'on',
          text: node.data.text,
          type: 'function'
        } as FunctionNodeData
        break
      case 'interface':
        updatedNode.data = {
          ...node.data,
          name: formData.get('name') as string,
          properties: formData.get('properties') as string,
          extends: formData.get('extends') as string,
          text: node.data.text,
          type: 'interface'
        } as InterfaceNodeData
        break
      case 'api':
        updatedNode.data = {
          ...node.data,
          endpoint: formData.get('endpoint') as string,
          method: formData.get('method') as string,
          headers: formData.get('headers') as string,
          body: formData.get('body') as string,
          text: node.data.text,
          type: 'api'
        } as ApiNodeData
        break
    }

    onUpdate(updatedNode as Node<NodeData>)
    onClose()
  }

  const renderVariableForm = (data: VariableNodeData) => (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs">Variable Name</Label>
        <Input id="name" name="name" defaultValue={data.name} required className="h-8" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="type" className="text-xs">Type</Label>
        <Input id="type" name="type" defaultValue={data.variableType} placeholder="e.g. string, number" className="h-8" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="initializer" className="text-xs">Initial Value</Label>
        <Input id="initializer" name="initializer" defaultValue={data.initializer} placeholder="e.g. 'Hello' or 42" className="h-8" />
      </div>
    </>
  )

  const renderFunctionForm = (data: FunctionNodeData) => (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs">Function Name</Label>
        <Input id="name" name="name" defaultValue={data.name} required className="h-8" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="returnType" className="text-xs">Return Type</Label>
        <Input id="returnType" name="returnType" defaultValue={data.returnType} placeholder="e.g. void, Promise<string>" className="h-8" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="parameters" className="text-xs">Parameters</Label>
        <Input id="parameters" name="parameters" defaultValue={data.parameters} placeholder="e.g. id: string, count: number" className="h-8" />
      </div>
      <div className="flex items-center space-x-2 pt-1">
        <Switch id="async" name="async" defaultChecked={data.async} className="h-4 w-7" />
        <Label htmlFor="async" className="text-xs">Async Function</Label>
      </div>
    </>
  )

  const renderInterfaceForm = (data: InterfaceNodeData) => (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs">Interface Name</Label>
        <Input id="name" name="name" defaultValue={data.name} required className="h-8" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="properties" className="text-xs">Properties</Label>
        <Input id="properties" name="properties" defaultValue={data.properties} placeholder="e.g. id: string; name: string;" className="h-8" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="extends" className="text-xs">Extends</Label>
        <Input id="extends" name="extends" defaultValue={data.extends} placeholder="e.g. BaseInterface" className="h-8" />
      </div>
    </>
  )

  const renderApiForm = (data: ApiNodeData) => (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="endpoint" className="text-xs">API Endpoint</Label>
        <Input id="endpoint" name="endpoint" defaultValue={data.endpoint} required placeholder="e.g. /api/users" className="h-8" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="method" className="text-xs">HTTP Method</Label>
        <Input id="method" name="method" defaultValue={data.method} required placeholder="e.g. GET, POST" className="h-8" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="headers" className="text-xs">Headers</Label>
        <Input id="headers" name="headers" defaultValue={data.headers} placeholder="e.g. Content-Type: application/json" className="h-8" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body" className="text-xs">Request Body</Label>
        <Input id="body" name="body" defaultValue={data.body} placeholder="e.g. { 'userId': '123' }" className="h-8" />
      </div>
    </>
  )

  const renderForm = () => {
    switch (node.type) {
      case 'variable':
        return renderVariableForm(node.data as VariableNodeData)
      case 'function':
        return renderFunctionForm(node.data as FunctionNodeData)
      case 'interface':
        return renderInterfaceForm(node.data as InterfaceNodeData)
      case 'api':
        return renderApiForm(node.data as ApiNodeData)
      default:
        return <div>Unsupported node type: {node.type}</div>
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {renderForm()}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm">Save Changes</Button>
      </div>
    </form>
  )
} 