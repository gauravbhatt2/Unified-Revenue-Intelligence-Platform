'use client';

import { useMemo, useState } from 'react';
import type { Account, Interaction } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

type GraphNodeType = 'account' | 'contact' | 'interaction';

interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  x: number;
  y: number;
  data?: any;
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
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const { nodes, edges } = useMemo(() => {
    const accountNode: GraphNode = {
      id: `account-${account.id}`,
      label: account.name,
      type: 'account',
      x: 120,
      y: HEIGHT / 2,
      data: account,
    };

    const interactionMap = new Map<string, Interaction>();
    interactions.forEach((i) => interactionMap.set(i.id, i));

    const contactMap = new Map<string, { id: string; email: string; name?: string }>();
    interactions.forEach((i) => {
      i.participants.forEach((p) => {
        if (!contactMap.has(p.contactId)) {
          contactMap.set(p.contactId, {
            id: p.contactId,
            email: p.contact?.email || p.email,
            name: [p.contact?.firstName, p.contact?.lastName].filter(Boolean).join(' '),
          });
        }
      });
    });

    const interactionNodes: GraphNode[] = [...interactionMap.values()].map((i, idx) => ({
      id: `interaction-${i.id}`,
      label: i.subject || i.type,
      type: 'interaction',
      x: WIDTH - 220,
      y: 70 + idx * ((HEIGHT - 140) / Math.max(1, interactions.length - 1 || 1)),
      data: i,
    }));

    const contacts = [...contactMap.values()];
    const contactNodes: GraphNode[] = contacts.map((c, idx) => ({
      id: `contact-${c.id}`,
      label: c.name || c.email,
      type: 'contact',
      x: WIDTH / 2,
      y: 70 + idx * ((HEIGHT - 140) / Math.max(1, contacts.length - 1 || 1)),
      data: c,
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
    <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Revenue Graph View</h3>
          <p className="text-[10px] text-gray-500">Visual mapping of account, contacts, and interactions</p>
        </div>
        <div className="flex gap-4 text-[10px] font-medium uppercase tracking-wider text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Account</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Contact</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Interaction</span>
        </div>
      </div>

      <div className="overflow-auto scrollbar-hide">
        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="min-w-[980px]"
        >
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
            </marker>
          </defs>

          {edges.map((edge, idx) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            if (!from || !to) return null;

            return (
              <motion.line
                key={`${edge.from}-${edge.to}-${idx}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                x1={from.x + 85}
                y1={from.y}
                x2={to.x - 85}
                y2={to.y}
                stroke="#e2e8f0"
                strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />
            );
          })}

          {nodes.map((node) => {
            const isAccount = node.type === 'account';
            const isContact = node.type === 'contact';
            
            const color = isAccount
              ? 'fill-blue-50 stroke-blue-500'
              : isContact
                ? 'fill-emerald-50 stroke-emerald-500'
                : 'fill-violet-50 stroke-violet-500';

            const textColor = isAccount
              ? 'fill-blue-900'
              : isContact
                ? 'fill-emerald-900'
                : 'fill-violet-900';

            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x - 85}, ${node.y - 24})`}
                className="cursor-help"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <motion.rect
                  whileHover={{ scale: 1.05 }}
                  width={170}
                  height={48}
                  rx={10}
                  className={`${color} transition-colors`}
                  strokeWidth={hoveredNode?.id === node.id ? 2.5 : 1.5}
                />
                <text x={12} y={18} className={`text-[9px] font-bold tracking-widest ${textColor} opacity-60`}>
                  {node.type.toUpperCase()}
                </text>
                <text x={12} y={34} className="text-[11px] font-semibold fill-gray-800">
                  {node.label.length > 24 ? `${node.label.slice(0, 24)}...` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip Overlay */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-4 right-4 w-64 bg-white/90 backdrop-blur shadow-xl border border-gray-100 rounded-lg p-3 z-20"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{hoveredNode.type}</p>
            <p className="text-sm font-bold text-gray-900 mb-2 truncate">{hoveredNode.label}</p>
            <div className="space-y-1">
              {hoveredNode.type === 'interaction' && (
                <>
                  <p className="text-[10px] text-gray-500">Date: {new Date(hoveredNode.data.timestamp).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">Type: {hoveredNode.data.type}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2 italic">"{hoveredNode.data.summary}"</p>
                </>
              )}
              {hoveredNode.type === 'contact' && (
                <>
                  <p className="text-[10px] text-gray-500">Email: {hoveredNode.data.email}</p>
                  {hoveredNode.data.name && <p className="text-[10px] text-gray-500">Name: {hoveredNode.data.name}</p>}
                </>
              )}
              {hoveredNode.type === 'account' && (
                <>
                  <p className="text-[10px] text-gray-500">Domain: {hoveredNode.data.domain}</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

