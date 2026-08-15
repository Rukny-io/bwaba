import { api } from '@/lib/api-client';
import type { WorkflowDefinition, WorkflowDetail, WorkflowSummary } from '@/lib/workflows/types';

export async function listWorkflows(): Promise<WorkflowSummary[]> {
  const { data } = await api.get<{ workflows: WorkflowSummary[] }>('/business/workflows');
  return data.workflows ?? [];
}

export async function getWorkflow(id: string): Promise<WorkflowDetail> {
  const { data } = await api.get<{ workflow: WorkflowDetail }>(`/business/workflows/${id}`);
  return data.workflow;
}

export async function createWorkflow(input: {
  name?: string;
  description?: string;
  definition?: WorkflowDefinition;
}): Promise<WorkflowDetail> {
  const { data } = await api.post<{ workflow: WorkflowDetail }>('/business/workflows', input);
  return data.workflow;
}

export async function updateWorkflow(
  id: string,
  input: {
    name?: string;
    description?: string;
    definition?: WorkflowDefinition;
    isActive?: boolean;
  },
): Promise<WorkflowDetail> {
  const { data } = await api.put<{ workflow: WorkflowDetail }>(`/business/workflows/${id}`, input);
  return data.workflow;
}

export async function deleteWorkflow(id: string): Promise<void> {
  await api.delete(`/business/workflows/${id}`);
}
