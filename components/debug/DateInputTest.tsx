// Debug component to test DateInput with different formats
"use client";

import { useState } from 'react';
import { DateInput } from '@/components/ui/date-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DateInputTest() {
  const [testDate, setTestDate] = useState('2025-08-04');
  const [currentFormat, setCurrentFormat] = useState<'US' | 'EU' | 'ISO'>('US');

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Date Input Format Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            variant={currentFormat === 'US' ? 'default' : 'outline'}
            onClick={() => setCurrentFormat('US')}
          >
            US Format
          </Button>
          <Button 
            variant={currentFormat === 'EU' ? 'default' : 'outline'}
            onClick={() => setCurrentFormat('EU')}
          >
            EU Format
          </Button>
          <Button 
            variant={currentFormat === 'ISO' ? 'default' : 'outline'}
            onClick={() => setCurrentFormat('ISO')}
          >
            ISO Format
          </Button>
        </div>

        <DateInput
          label={`Test Date (${currentFormat} format)`}
          value={testDate}
          onChange={setTestDate}
          dateFormat={currentFormat}
        />

        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Current Values:</h3>
          <p><strong>Format:</strong> {currentFormat}</p>
          <p><strong>Raw Value:</strong> {testDate}</p>
          <p><strong>Expected Helper Text:</strong> {
            currentFormat === 'US' ? 'Format: YYYY-MM-DD (e.g., 2025-08-04 for Aug 4, 2025)' :
            currentFormat === 'EU' ? 'Format: YYYY-MM-DD (e.g., 2025-08-04 for 4 Aug 2025)' :
            'Format: YYYY-MM-DD (ISO standard)'
          }</p>
        </div>
      </CardContent>
    </Card>
  );
}
