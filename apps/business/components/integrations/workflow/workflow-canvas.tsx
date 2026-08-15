'use client';

import '@xyflow/react/dist/style.css';
import '@/components/integrations/workflow/workflow-canvas.css';

import { useCallback, useRef } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
} from '@xyflow/react';
import type { WorkflowEditorState } from '@/components/integrations/workflow/use-workflow-editor';
import { workflowNodeTypes } from '@/components/integrations/workflow/workflow-node-types';
import type { WorkflowNodeData, WorkflowNodeType } from '@/lib/workflows/types';

function WorkflowCanvasInner({ editor }: { editor: WorkflowEditorState }) {
  const reactFlow = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType;
      if (!type) return;

      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = reactFlow.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      editor.addNode(type, position);
    },
    [editor, reactFlow],
  );

  return (
    <div ref={wrapperRef} className="absolute inset-0">
      <ReactFlow
        nodes={editor.nodes}
        edges={editor.edges}
        nodeTypes={workflowNodeTypes}
        onNodesChange={editor.onNodesChange}
        onEdgesChange={editor.onEdgesChange}
        onConnect={editor.onConnect}
        onNodeClick={(_, node) => editor.setSelectedNodeId(node.id)}
        onPaneClick={() => editor.setSelectedNodeId(null)}
        onMoveEnd={(_, viewport) => editor.onViewportChange(viewport)}
        onNodeDragStop={editor.onNodeDragStop}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.25}
        maxZoom={1.75}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
        className="workflow-canvas"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} className="workflow-controls" />
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas({ editor }: { editor: WorkflowEditorState }) {
  return (
    <ReactFlowProvider>
      <div className="absolute inset-0">
        <WorkflowCanvasInner editor={editor} />
      </div>
    </ReactFlowProvider>
  );
}

export function startNodeDrag(
  event: React.DragEvent,
  type: WorkflowNodeType,
) {
  event.dataTransfer.setData('application/reactflow', type);
  event.dataTransfer.effectAllowed = 'move';
}

export type { Node };
