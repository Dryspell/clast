import dagre from 'dagre'
import { Node as RFNode, Edge as RFEdge } from '@xyflow/react'

const nodeWidth = 180
const nodeHeight = 60

export function applyDagreLayout(
  nodes: RFNode<any>[],
  edges: RFEdge<any>[],
  direction: 'TB' | 'LR' | 'BT' | 'RL' = 'TB'
): RFNode<any>[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const coord = g.node(node.id) as { x: number; y: number }
    if (coord) {
      node.position = { x: coord.x - nodeWidth / 2, y: coord.y - nodeHeight / 2 }
    }
    return node
  })
} 