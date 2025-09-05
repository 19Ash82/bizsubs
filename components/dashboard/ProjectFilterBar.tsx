// Updated 2024-12-20: Project filter bar component with client filtering
// Implements PRD requirements: advanced filtering, client integration

'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import type { Client } from '@/lib/react-query/clients';

interface ProjectFilterBarProps {
  filters: {
    search: string;
    client_id: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
  clients: Client[];
}

export function ProjectFilterBar({
  filters,
  onFiltersChange,
  clients,
}: ProjectFilterBarProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value,
    });
  };

  const handleClientChange = (value: string) => {
    onFiltersChange({
      ...filters,
      client_id: value,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search projects..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex gap-2">
        <Select value={filters.client_id} onValueChange={handleClientChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="unassigned">No Client</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: client.color_hex }}
                  />
                  <span>{client.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

