// Updated 2024-12-19: Created WorkspaceSettingsTab component for workspace configuration

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

interface WorkspaceSettingsTabProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  isAdmin: boolean;
}

export function WorkspaceSettingsTab({ profile, onUpdate, isAdmin }: WorkspaceSettingsTabProps) {
  const [formData, setFormData] = useState({
    company_name: profile.company_name || '',
    financial_year_end: profile.financial_year_end || '',
    tax_rate: profile.tax_rate || 0,
    currency_preference: profile.currency_preference || 'USD',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currencies = [
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar (C$)', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar (A$)', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen (¥)', symbol: '¥' },
    { code: 'CHF', name: 'Swiss Franc (CHF)', symbol: 'CHF' },
    { code: 'SEK', name: 'Swedish Krona (kr)', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone (kr)', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone (kr)', symbol: 'kr' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          company_name: formData.company_name,
          financial_year_end: formData.financial_year_end,
          tax_rate: formData.tax_rate,
          currency_preference: formData.currency_preference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const updatedProfile = {
        ...profile,
        ...data,
      };
      onUpdate(updatedProfile);

      setMessage({
        type: 'success',
        text: 'Workspace settings updated successfully.'
      });
    } catch (error: any) {
      console.error('Error updating workspace settings:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update workspace settings. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>
            Configure your workspace preferences and financial settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="company_name">Workspace Name</Label>
              <Input
                id="company_name"
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                disabled={!isAdmin}
                required
              />
              {!isAdmin && (
                <p className="text-sm text-gray-500 mt-1">
                  Only workspace admins can change the workspace name.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="financial_year_end">Financial Year End</Label>
                <Input
                  id="financial_year_end"
                  type="date"
                  value={formData.financial_year_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, financial_year_end: e.target.value }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Used for annual reporting and tax calculations.
                </p>
              </div>

              <div>
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Default tax rate for new subscriptions.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="currency">Currency Preference</Label>
              <Select
                value={formData.currency_preference}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency_preference: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Default currency for new subscriptions and reporting.
              </p>
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

            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Workspace Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Workspace Information */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Information</CardTitle>
          <CardDescription>
            Current workspace details and subscription tier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Subscription Tier</Label>
              <p className="text-sm text-gray-900 capitalize">
                {profile.subscription_tier?.replace('_', ' ') || 'Free'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Workspace ID</Label>
              <p className="text-sm text-gray-900 font-mono">
                {profile.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
