// Updated 2024-12-19: Created ClientFilterBar component for client filtering and search

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Client {
  id: string;
  name: string;
  color_hex?: string;
}

interface ClientFilterBarProps {
  clients: Client[];
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
}

export function ClientFilterBar({
  clients,
  selectedClientId,
  onClientChange,
  searchTerm,
  onSearchChange,
}: ClientFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedClient = selectedClientId 
    ? clients.find(client => client.id === selectedClientId)
    : null;

  const displayText = selectedClient ? selectedClient.name : "All Clients";

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-white rounded-lg border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by client:</span>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="justify-between min-w-[200px]"
                aria-label="Select client filter"
              >
                <div className="flex items-center gap-2">
                  {selectedClient?.color_hex && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedClient.color_hex }}
                    />
                  )}
                  <span>{displayText}</span>
                </div>
                <svg
                  className="w-4 h-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuItem
                onClick={() => {
                  onClientChange(null);
                  setIsOpen(false);
                }}
                className={selectedClientId === null ? "bg-gray-100" : ""}
              >
                All Clients
              </DropdownMenuItem>
              {clients.map((client) => (
                <DropdownMenuItem
                  key={client.id}
                  onClick={() => {
                    onClientChange(client.id);
                    setIsOpen(false);
                  }}
                  className={selectedClientId === client.id ? "bg-gray-100" : ""}
                >
                  <div className="flex items-center gap-2">
                    {client.color_hex && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: client.color_hex }}
                      />
                    )}
                    <span>{client.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-none">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="text"
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full sm:w-[300px]"
            aria-label="Search subscriptions"
          />
        </div>
      </div>
    </div>
  );
}



