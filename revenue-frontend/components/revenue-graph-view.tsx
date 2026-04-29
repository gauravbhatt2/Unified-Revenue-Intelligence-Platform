'use client';

import { useMemo } from 'react';
import type { Account, Interaction } from '@/lib/types';

type GraphNodeType = 'account' | 'contact' | 'interaction';

interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

interface RevenueGraphViewProps {
  account: Account;
  interactions: Interaction[];
}

const WIDTH = 980;
const HEIGHT = 500;

export function RevenueGraphView({ account, interactions }: RevenueGraphViewProps) {
  const { nodes, edges } = useMemo(() => {
    const accountNode: GraphNode = {
      id: `account-${account.id}`,
      label: account.name,
      type: 'account',
      x: 120,
      y: HEIGHT / 2,
    };

    const interactionMap = new Map<string, Interaction>();
    interactions.forEach((i) => interactionMap.set(i.id, i));

    const contactMap = new Map<string, { id: string; email: string }>();
    interactions.forEach((i) => {
      i.participants.forEach((p) => {
        if (!contactMap.has(p.contactId)) {
          contactMap.set(p.contactId, {
            id: p.contactId,
            email: p.contact?.email || p.email,
          });
        }
      });
    });

    const interactionNodes: GraphNode[] = [...interactionMap.values()].map((i, idx) => ({
      id: `interaction-${i.id}`,
      label: `${i.type.toUpperCase()} ${new Date(i.timestamp).toLocaleDateString()}`,
      type: 'interaction',
      x: WIDTH - 220,
      y: 70 + idx * ((HEIGHT - 140) / Math.max(1, interactions.length - 1 || 1)),
    }));

    const contacts = [...contactMap.values()];
    const contactNodes: GraphNode[] = contacts.map((c, idx) => ({
      id: `contact-${c.id}`,
      label: c.email,
      type: 'contact',
      x: WIDTH / 2,
      y: 70 + idx * ((HEIGHT - 140) / Math.max(1, contacts.length - 1 || 1)),
    }));

    const accountEdges: GraphEdge[] = contactNodes.map((c) => ({
      from: accountNode.id,
      to: c.id,
    }));

    const interactionEdges: GraphEdge[] = [];
    interactions.forEach((i) => {
      i.participants.forEach((p) => {
        interactionEdges.push({
          from: `contact-${p.contactId}`,
          to: `interaction-${i.id}`,
        });
      });
    });

    return {
      nodes: [accountNode, ...contactNodes, ...interactionNodes],
      edges: [...accountEdges, ...interactionEdges],
    };
  }, [account, interactions]);

  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 overflow-auto">
      <p className="text-sm font-semibold text-gray-800 mb-3">Revenue Graph View</p>
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="min-w-[980px]"
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
          </marker>
        </defs>

        {edges.map((edge, idx) => {
          const from = nodeById.get(edge.from);
          const to = nodeById.get(edge.to);
          if (!from || !to) return null;

          return (
            <line
              key={`${edge.from}-${edge.to}-${idx}`}
              x1={from.x + 85}
              y1={from.y}
              x2={to.x - 85}
              y2={to.y}
              stroke="#d1d5db"
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
          );
        })}

        {nodes.map((node) => {
          const color =
            node.type === 'account'
              ? 'fill-indigo-50 stroke-indigo-300'
              : node.type === 'contact'
                ? 'fill-emerald-50 stroke-emerald-300'
                : 'fill-violet-50 stroke-violet-300';

          const textColor =
            node.type === 'account'
              ? 'fill-indigo-800'
              : node.type === 'contact'
                ? 'fill-emerald-800'
                : 'fill-violet-800';

          return (
            <g key={node.id} transform={`translate(${node.x - 85}, ${node.y - 24})`}>
              <rect
                width={170}
                height={48}
                rx={10}
                className={`${color}`}
                strokeWidth={1.5}
              />
              <text x={10} y={20} className={`text-[11px] font-semibold ${textColor}`}>
                {node.type.toUpperCase()}
              </text>
              <text x={10} y={36} className="text-[11px] fill-gray-700">
                {node.label.length > 28 ? `${node.label.slice(0, 28)}...` : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
