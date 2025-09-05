// Updated 2024-12-20: Shared component for client and project display patterns
// Implements PRD requirements: "Client A +3 more" pattern, color coding

'use client';

import { Badge } from '@/components/ui/badge';

interface Client {
  id: string;
  name: string;
  color_hex: string;
}

interface Project {
  id: string;
  name: string;
  color_hex: string;
}

interface ClientDisplayProps {
  clients: Client[];
  maxDisplay?: number;
  showCount?: boolean;
}

interface ProjectDisplayProps {
  projects: Project[];
  maxDisplay?: number;
  showCount?: boolean;
}

interface ClientProjectDisplayProps {
  client?: Client;
  project?: Project;
  showInternal?: boolean;
}

// Client display component with "Client A +3 more" pattern
export function ClientDisplay({ 
  clients, 
  maxDisplay = 1,
  showCount = false
}: ClientDisplayProps) {
  if (!clients || clients.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const displayClients = clients.slice(0, maxDisplay);
  const remainingCount = clients.length - maxDisplay;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {displayClients.map((client, index) => (
        <div key={client.id} className="flex items-center gap-1.5 min-w-0">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: client.color_hex }}
          />
          <span className="text-sm truncate">{client.name}</span>
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-muted-foreground flex-shrink-0">
          +{remainingCount} more
        </span>
      )}
      {showCount && clients.length > 1 && (
        <Badge variant="secondary" className="ml-2">
          {clients.length}
        </Badge>
      )}
    </div>
  );
}

// Project display component with color coding
export function ProjectDisplay({ 
  projects, 
  maxDisplay = 1,
  showCount = false
}: ProjectDisplayProps) {
  if (!projects || projects.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const displayProjects = projects.slice(0, maxDisplay);
  const remainingCount = projects.length - maxDisplay;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {displayProjects.map((project, index) => (
        <div key={project.id} className="flex items-center gap-1.5 min-w-0">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: project.color_hex }}
          />
          <span className="text-sm truncate">{project.name}</span>
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-muted-foreground flex-shrink-0">
          +{remainingCount} more
        </span>
      )}
      {showCount && projects.length > 1 && (
        <Badge variant="secondary" className="ml-2">
          {projects.length}
        </Badge>
      )}
    </div>
  );
}

// Combined client and project display (for subscriptions/lifetime deals)
export function ClientProjectDisplay({ 
  client, 
  project, 
  showInternal = true 
}: ClientProjectDisplayProps) {
  if (!client && !project) {
    return showInternal ? (
      <span className="text-sm text-muted-foreground">Internal</span>
    ) : (
      <span className="text-muted-foreground text-sm">-</span>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      {client && (
        <div className="flex items-center gap-1.5 min-w-0">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: client.color_hex }}
          />
          <span className="text-sm truncate">{client.name}</span>
        </div>
      )}
      {client && project && (
        <span className="text-muted-foreground">•</span>
      )}
      {project && (
        <div className="flex items-center gap-1.5 min-w-0">
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0" 
            style={{ backgroundColor: project.color_hex }}
          />
          <span className="text-sm text-muted-foreground truncate">{project.name}</span>
        </div>
      )}
    </div>
  );
}

// Color indicator component for tables and lists
export function ColorIndicator({ 
  color, 
  size = 'sm',
  className = '' 
}: { 
  color: string; 
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3', 
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex-shrink-0 ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}

// Status badge with color coding
export function StatusBadge({ 
  status, 
  variant = 'default' 
}: { 
  status: string;
  variant?: 'default' | 'outline';
}) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'inactive':
      case 'cancelled':
      case 'paused':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'resold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Badge 
      variant={variant as any} 
      className={getStatusColor(status)}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

