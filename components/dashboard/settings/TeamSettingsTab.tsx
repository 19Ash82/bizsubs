// Updated 2024-12-19: Created TeamSettingsTab component for team member management

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  subscription_tier: string;
  currency_preference: string;
  financial_year_end: string;
  tax_rate: number;
}

interface TeamMember {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  invited_at: string;
  joined_at?: string;
}

interface TeamSettingsTabProps {
  profile: UserProfile;
}

export function TeamSettingsTab({ profile }: TeamSettingsTabProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Get team members from team_members table
      const { data: teamData, error } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          status,
          invited_at,
          joined_at,
          users (
            email,
            first_name,
            last_name
          )
        `)
        .eq('team_id', profile.id) // Assuming workspace owner's ID is the team ID
        .order('invited_at', { ascending: false });

      if (error) throw error;

      const members = teamData?.map(member => ({
        id: member.id,
        email: member.users?.email || '',
        first_name: member.users?.first_name,
        last_name: member.users?.last_name,
        role: member.role,
        status: member.status,
        invited_at: member.invited_at,
        joined_at: member.joined_at,
      })) || [];

      setTeamMembers(members);
    } catch (error: any) {
      console.error('Error loading team members:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load team members.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setMessage(null);

    const supabase = createClient();

    try {
      // Check if user already exists
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', profile.id)
        .eq('email', inviteEmail)
        .single();

      if (existingMember) {
        throw new Error('This email is already invited or is a team member.');
      }

      // Create team member invitation
      const { error: inviteError } = await supabase
        .from('team_members')
        .insert({
          team_id: profile.id,
          email: inviteEmail,
          role: inviteRole,
          status: 'pending',
          invited_at: new Date().toISOString(),
        });

      if (inviteError) throw inviteError;

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: profile.id,
          action_type: 'create',
          resource_type: 'team_member',
          description: `Invited ${inviteEmail} as ${inviteRole}`,
          timestamp: new Date().toISOString(),
        });

      setMessage({
        type: 'success',
        text: `Invitation sent to ${inviteEmail} successfully.`
      });

      setInviteEmail('');
      setInviteRole('member');
      loadTeamMembers(); // Refresh the list
    } catch (error: any) {
      console.error('Error inviting team member:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send invitation. Please try again.'
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'member') => {
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: profile.id,
          action_type: 'update',
          resource_type: 'team_member',
          description: `Updated team member role to ${newRole}`,
          timestamp: new Date().toISOString(),
        });

      loadTeamMembers(); // Refresh the list
      setMessage({
        type: 'success',
        text: 'Team member role updated successfully.'
      });
    } catch (error: any) {
      console.error('Error updating team member role:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update team member role.'
      });
    }
  };

  const handleRemoveTeamMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) {
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: profile.id,
          action_type: 'delete',
          resource_type: 'team_member',
          description: `Removed ${memberEmail} from team`,
          timestamp: new Date().toISOString(),
        });

      loadTeamMembers(); // Refresh the list
      setMessage({
        type: 'success',
        text: 'Team member removed successfully.'
      });
    } catch (error: any) {
      console.error('Error removing team member:', error);
      setMessage({
        type: 'error',
        text: 'Failed to remove team member.'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite Team Member */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
          <CardDescription>
            Invite new team members to collaborate on your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteTeamMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invite_email">Email Address</Label>
                <Input
                  id="invite_email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="invite_role">Role</Label>
                <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={inviteLoading}>
              {inviteLoading ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage existing team members and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : teamMembers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No team members yet. Invite your first team member above.
            </p>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {member.first_name?.[0] || member.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.first_name && member.last_name 
                          ? `${member.first_name} ${member.last_name}`
                          : member.email
                        }
                      </p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(member.status)}
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value: 'admin' | 'member') => handleUpdateRole(member.id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTeamMember(member.id, member.email)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
