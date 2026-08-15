'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type Viewport,
} from '@xyflow/react';
import { appToast } from '@/lib/app-toast';
import {
  createWorkflow,
  deleteWorkflow as deleteWorkflowApi,
  getWorkflow,
  listWorkflows,
  updateWorkflow,
} from '@/lib/workflows/api';
import { WORKFLOW_NODE_CATALOG } from '@/lib/workflows/catalog';
import {
  buildDefaultNodeData,
  createStarterWorkflowDefinition,
  createWorkflowNodeId,
} from '@/lib/workflows/factory';
import type {
  WorkflowDefinition,
  WorkflowDetail,
  WorkflowNodeData,
  WorkflowNodeType,
  WorkflowSummary,
} from '@/lib/workflows/types';

type HistoryEntry = {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
};

export function useWorkflowEditor() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('سير عمل جديد');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const viewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const pushHistory = useCallback(
    (nextNodes: Node<WorkflowNodeData>[], nextEdges: Edge[]) => {
      const snapshot = {
        nodes: structuredClone(nextNodes),
        edges: structuredClone(nextEdges),
      };
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(snapshot);
      if (historyRef.current.length > 40) {
        historyRef.current.shift();
      } else {
        historyIndexRef.current += 1;
      }
    },
    [],
  );

  const loadDefinition = useCallback(
    (definition: WorkflowDefinition) => {
      setNodes(definition.nodes ?? []);
      setEdges(definition.edges ?? []);
      viewportRef.current = definition.viewport ?? { x: 0, y: 0, zoom: 1 };
      historyRef.current = [
        {
          nodes: structuredClone(definition.nodes ?? []),
          edges: structuredClone(definition.edges ?? []),
        },
      ];
      historyIndexRef.current = 0;
      setDirty(false);
    },
    [setEdges, setNodes],
  );

  const refreshWorkflowList = useCallback(async () => {
    const list = await listWorkflows();
    setWorkflows(list);
    return list;
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      let list = await listWorkflows();
      if (list.length === 0) {
        const created = await createWorkflow({
          name: 'سير عمل Instagram',
          description: 'رد تلقائي على رسائل Instagram',
          definition: createStarterWorkflowDefinition(),
        });
        list = [created, ...list];
      }
      setWorkflows(list);
      const first = list[0];
      const detail = await getWorkflow(first.id);
      setActiveWorkflowId(detail.id);
      setWorkflowName(detail.name);
      loadDefinition(detail.definition as WorkflowDefinition);
    } catch (error) {
      appToast.fromError(error, 'تعذر تحميل سير العمل');
    } finally {
      setLoading(false);
    }
  }, [loadDefinition]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const markDirty = useCallback(() => setDirty(true), []);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => {
        const next = addEdge({ ...connection, animated: true }, current);
        pushHistory(nodes, next);
        return next;
      });
      markDirty();
    },
    [markDirty, nodes, pushHistory, setEdges],
  );

  const addNode = useCallback(
    (type: WorkflowNodeType, position: { x: number; y: number }) => {
      const catalogItem = WORKFLOW_NODE_CATALOG.find((item) => item.type === type);
      const newNode: Node<WorkflowNodeData> = {
        id: createWorkflowNodeId(type),
        type,
        position,
        data: buildDefaultNodeData(type),
        ...(type === 'note'
          ? { style: { width: 220, height: 100 } }
          : {}),
      };
      setNodes((current) => {
        const next = [...current, newNode];
        pushHistory(next, edges);
        return next;
      });
      setSelectedNodeId(newNode.id);
      markDirty();
    },
    [edges, markDirty, pushHistory, setNodes],
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((current) => {
      const nextNodes = current.filter((node) => node.id !== selectedNodeId);
      setEdges((currentEdges) => {
        const nextEdges = currentEdges.filter(
          (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId,
        );
        pushHistory(nextNodes, nextEdges);
        return nextEdges;
      });
      return nextNodes;
    });
    setSelectedNodeId(null);
    markDirty();
  }, [markDirty, pushHistory, selectedNodeId, setEdges, setNodes]);

  const updateSelectedNodeConfig = useCallback(
    (patch: Partial<WorkflowNodeData>) => {
      if (!selectedNodeId) return;
      setNodes((current) =>
        current.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...patch,
                  config: { ...node.data.config, ...patch.config },
                },
              }
            : node,
        ),
      );
      markDirty();
    },
    [markDirty, selectedNodeId, setNodes],
  );

  const selectWorkflow = useCallback(
    async (id: string) => {
      if (id === activeWorkflowId) return;
      try {
        const detail = await getWorkflow(id);
        setActiveWorkflowId(detail.id);
        setWorkflowName(detail.name);
        loadDefinition(detail.definition as WorkflowDefinition);
        setSelectedNodeId(null);
      } catch (error) {
        appToast.fromError(error, 'تعذر فتح سير العمل');
      }
    },
    [activeWorkflowId, loadDefinition],
  );

  const createNewWorkflow = useCallback(async () => {
    try {
      const created = await createWorkflow({
        name: `سير عمل ${workflows.length + 1}`,
        definition: createStarterWorkflowDefinition(),
      });
      await refreshWorkflowList();
      setActiveWorkflowId(created.id);
      setWorkflowName(created.name);
      loadDefinition(created.definition);
      setSelectedNodeId(null);
      appToast.success('تم إنشاء سير عمل جديد');
    } catch (error) {
      appToast.fromError(error, 'تعذر إنشاء سير العمل');
    }
  }, [loadDefinition, refreshWorkflowList, workflows.length]);

  const saveWorkflow = useCallback(async (silent = false) => {
    if (!activeWorkflowId) return;
    setSaving(true);
    try {
      const definition: WorkflowDefinition = {
        nodes,
        edges,
        viewport: viewportRef.current,
      };
      const updated = await updateWorkflow(activeWorkflowId, {
        name: workflowName,
        definition,
      });
      setWorkflowName(updated.name);
      setDirty(false);
      await refreshWorkflowList();
      if (!silent) {
        appToast.success('تم حفظ سير العمل');
      }
    } catch (error) {
      appToast.fromError(error, 'تعذر حفظ سير العمل');
    } finally {
      setSaving(false);
    }
  }, [activeWorkflowId, edges, nodes, refreshWorkflowList, workflowName]);

  const removeActiveWorkflow = useCallback(async () => {
    if (!activeWorkflowId) return;
    try {
      await deleteWorkflowApi(activeWorkflowId);
      const list = await refreshWorkflowList();
      if (list.length === 0) {
        const created = await createWorkflow({
          name: 'سير عمل جديد',
          definition: createStarterWorkflowDefinition(),
        });
        setActiveWorkflowId(created.id);
        setWorkflowName(created.name);
        loadDefinition(created.definition);
        await refreshWorkflowList();
      } else {
        await selectWorkflow(list[0].id);
      }
      appToast.success('تم حذف سير العمل');
    } catch (error) {
      appToast.fromError(error, 'تعذر حذف سير العمل');
    }
  }, [activeWorkflowId, loadDefinition, refreshWorkflowList, selectWorkflow]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    setNodes(structuredClone(snapshot.nodes));
    setEdges(structuredClone(snapshot.edges));
    markDirty();
  }, [markDirty, setEdges, setNodes]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    setNodes(structuredClone(snapshot.nodes));
    setEdges(structuredClone(snapshot.edges));
    markDirty();
  }, [markDirty, setEdges, setNodes]);

  const onViewportChange = useCallback((viewport: Viewport) => {
    viewportRef.current = viewport;
  }, []);

  const onNodeDragStop = useCallback(() => {
    pushHistory(nodes, edges);
    markDirty();
  }, [edges, markDirty, nodes, pushHistory]);

  useEffect(() => {
    if (!dirty || !activeWorkflowId || saving || loading) return;
    const timer = window.setTimeout(() => {
      void saveWorkflow(true);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [activeWorkflowId, dirty, edges, loading, nodes, saveWorkflow, saving, workflowName]);

  return {
    workflows,
    activeWorkflowId,
    workflowName,
    setWorkflowName,
    loading,
    saving,
    dirty,
    nodes,
    edges,
    onNodesChange: (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      markDirty();
    },
    onEdgesChange,
    onConnect,
    addNode,
    deleteSelectedNode,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    updateSelectedNodeConfig,
    selectWorkflow,
    createNewWorkflow,
    saveWorkflow,
    removeActiveWorkflow,
    undo,
    redo,
    onViewportChange,
    onNodeDragStop,
  };
}

export type WorkflowEditorState = ReturnType<typeof useWorkflowEditor>;
