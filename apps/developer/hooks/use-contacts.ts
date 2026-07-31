'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from '@/lib/api/contacts';

export const contactsKeys = {
  all: ['developer-contacts'] as const,
  list: (search?: string, page?: number) =>
    [...contactsKeys.all, search ?? '', page ?? 1] as const,
};

export function useContacts(search?: string, page = 1) {
  return useQuery({
    queryKey: contactsKeys.list(search, page),
    queryFn: () => listContacts({ search, page, limit: 20 }),
  });
}

export function useContactMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: contactsKeys.all });
  };

  return {
    createMutation: useMutation({
      mutationFn: createContact,
      onSuccess: invalidate,
    }),
    updateMutation: useMutation({
      mutationFn: ({
        id,
        body,
      }: {
        id: string;
        body: Parameters<typeof updateContact>[1];
      }) => updateContact(id, body),
      onSuccess: invalidate,
    }),
    deleteMutation: useMutation({
      mutationFn: deleteContact,
      onSuccess: invalidate,
    }),
  };
}
