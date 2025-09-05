// Updated 2024-12-20: Personal preferences tab for user-specific settings like date format

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Calendar, Globe } from "lucide-react";
import { formatDateForDisplayWithLocale } from "@/lib/utils/billing-dates";

interface UserPreferences {
  id?: string;
  user_id: string;
  date_format_preference: 'US' | 'EU' | 'ISO';
  visible_subscription_columns?: string[];
  visible_ltd_columns?: string[];
  default_filters?: Record<string, any>;
  dashboard_layout?: Record<string, any>;
}

interface PersonalPreferencesTabProps {
  preferences: UserPreferences | null;
  onUpdate?: (preferences: UserPreferences) => void;
}

export function PersonalPreferencesTab({ preferences, onUpdate }: PersonalPreferencesTabProps) {
  const [formData, setFormData] = useState({
    date_format_preference: preferences?.date_format_preference || 'US'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      // Update or create user preferences
      const preferencesData = {
        user_id: user.id,
        date_format_preference: formData.date_format_preference,
        // Preserve existing preferences
        ...(preferences?.visible_subscription_columns && { 
          visible_subscription_columns: preferences.visible_subscription_columns 
        }),
        ...(preferences?.visible_ltd_columns && { 
          visible_ltd_columns: preferences.visible_ltd_columns 
        }),
        ...(preferences?.default_filters && { 
          default_filters: preferences.default_filters 
        }),
        ...(preferences?.dashboard_layout && { 
          dashboard_layout: preferences.dashboard_layout 
        }),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("user_preferences")
        .upsert(preferencesData, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      toast.success("Personal preferences updated successfully");
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate({
          ...preferences,
          ...preferencesData
        } as UserPreferences);
      }

    } catch (error: any) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Example date for preview
  const exampleDate = new Date('2025-08-04');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Personal Preferences
          </CardTitle>
          <CardDescription>
            Customize your personal settings and display preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Date Format Preference */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Label htmlFor="date_format_preference">Date Display Format</Label>
              </div>
              <Select 
                value={formData.date_format_preference} 
                onValueChange={(value: 'US' | 'EU' | 'ISO') => 
                  setFormData(prev => ({ ...prev, date_format_preference: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">
                    <div className="flex flex-col">
                      <span>US Format</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDateForDisplayWithLocale(exampleDate, 'en-US', 'US')}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="EU">
                    <div className="flex flex-col">
                      <span>European Format</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDateForDisplayWithLocale(exampleDate, 'en-GB', 'EU')}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ISO">
                    <div className="flex flex-col">
                      <span>ISO Format</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDateForDisplayWithLocale(exampleDate, 'en-US', 'ISO')}
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This affects how dates are displayed throughout the application. 
                Date inputs will always use the unambiguous YYYY-MM-DD format.
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="text-sm text-muted-foreground">
                <p>Start date will display as: <span className="font-medium">
                  {formatDateForDisplayWithLocale(exampleDate, 'en-US', formData.date_format_preference)}
                </span></p>
                <p>Next billing date will display as: <span className="font-medium">
                  {formatDateForDisplayWithLocale(new Date('2025-09-04'), 'en-US', formData.date_format_preference)}
                </span></p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Preferences
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
