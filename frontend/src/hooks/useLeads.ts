"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type {
  Appointment,
  FollowUp,
  Lead,
  LeadQualification,
  LeadSource,
  LeadStatus,
  Message,
  Qualification,
  Urgency
} from "@/types";

export type LeadWithRelations = Lead & {
  qualificationResult?: LeadQualification | null;
  messages?: Message[];
  appointments?: Appointment[];
  followUps?: FollowUp[];
};

export type LeadFilters = {
  status?: LeadStatus | "";
  source?: LeadSource | "";
  qualification?: Qualification | "";
  search?: string;
  page?: number;
  limit?: number;
};

export type LeadFormData = {
  name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  service?: string;
  urgency?: Urgency | "";
  budget?: string;
  notes?: string;
};

type LeadsResponse = {
  success: boolean;
  leads: LeadWithRelations[];
  total: number;
  page: number;
  limit: number;
  error?: string;
};

type LeadResponse = {
  success: boolean;
  lead: LeadWithRelations;
  error?: string;
};

const defaultFilters: LeadFilters = {
  page: 1,
  limit: 20
};

function compactFilters(filters: LeadFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value));
    }
  });

  return params;
}

export function useLeads(initialFilters: LeadFilters = defaultFilters) {
  const [leads, setLeads] = useState<LeadWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialFilters.page ?? 1);
  const [limit, setLimit] = useState(initialFilters.limit ?? 20);
  const [filters, setFilterState] = useState<LeadFilters>({
    ...defaultFilters,
    ...initialFilters
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(
    async (nextFilters: LeadFilters = filters) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = compactFilters({
          ...nextFilters,
          page: nextFilters.page ?? 1,
          limit: nextFilters.limit ?? 20
        });
        const response = await api.get<LeadsResponse>(`/leads?${params.toString()}`);

        setLeads(response.data.leads);
        setTotal(response.data.total);
        setPage(response.data.page);
        setLimit(response.data.limit);
      } catch (err: any) {
        setError(err.response?.data?.error ?? "Unable to load leads");
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  const setFilters = useCallback((nextFilters: LeadFilters) => {
    setFilterState((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
      page: nextFilters.page ?? (nextFilters.search !== undefined ? 1 : currentFilters.page)
    }));
  }, []);

  const createLead = useCallback(async (data: LeadFormData) => {
    const response = await api.post<LeadResponse>("/leads", data);
    return response.data.lead;
  }, []);

  const updateLead = useCallback(async (id: string, data: Partial<LeadFormData & Lead>) => {
    const response = await api.put<LeadResponse>(`/leads/${id}`, data);
    return response.data.lead;
  }, []);

  const deleteLead = useCallback(
    async (id: string) => {
      await api.delete(`/leads/${id}`);
      await fetchLeads(filters);
    },
    [fetchLeads, filters]
  );

  useEffect(() => {
    fetchLeads(filters);
  }, [fetchLeads, filters]);

  return useMemo(
    () => ({
      leads,
      total,
      page,
      limit,
      isLoading,
      error,
      filters,
      fetchLeads,
      createLead,
      updateLead,
      deleteLead,
      setFilters
    }),
    [
      leads,
      total,
      page,
      limit,
      isLoading,
      error,
      filters,
      fetchLeads,
      createLead,
      updateLead,
      deleteLead,
      setFilters
    ]
  );
}
