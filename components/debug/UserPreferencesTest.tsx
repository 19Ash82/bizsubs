// Debug component to test user_preferences table access
"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UserPreferencesTest() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTableAccess = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      console.log('Testing user_preferences table access...');
      
      // Test 1: Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth check:', { user: user?.id, authError });
      
      if (!user) {
        setResults({ error: 'No authenticated user' });
        return;
      }

      // Test 2: Try to select existing preferences
      console.log('Attempting to select preferences...');
      const { data: selectData, error: selectError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('Select result:', { data: selectData, error: selectError });

      // Test 3: Try to insert/upsert a test record
      console.log('Attempting to upsert preferences...');
      const testPreferences = {
        user_id: user.id,
        date_format_preference: 'US'
      };
      
      const { data: upsertData, error: upsertError } = await supabase
        .from('user_preferences')
        .upsert(testPreferences, { onConflict: 'user_id' })
        .select()
        .single();
      
      console.log('Upsert result:', { data: upsertData, error: upsertError });

      setResults({
        userId: user.id,
        selectData,
        selectError,
        upsertData,
        upsertError,
        success: !upsertError
      });

    } catch (error) {
      console.error('Test failed:', error);
      setResults({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>User Preferences Debug Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testTableAccess} disabled={loading}>
          {loading ? 'Testing...' : 'Test Table Access'}
        </Button>
        
        {results && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
