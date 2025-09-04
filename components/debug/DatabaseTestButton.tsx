// Updated 2024-12-19: Debug component for testing database connection

"use client";

import { useState } from "react";
import { testDatabaseConnection } from "@/lib/utils/database-test";
import { Button } from "@/components/ui/button";

export function DatabaseTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const testResult = await testDatabaseConnection();
      setResult(testResult);
      console.log("Database test completed:", testResult);
    } catch (error) {
      console.error("Test failed:", error);
      setResult({ success: false, error: error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
      <h3 className="font-semibold mb-2">Database Connection Test</h3>
      <Button onClick={runTest} disabled={isLoading} size="sm">
        {isLoading ? "Testing..." : "Test Database"}
      </Button>
      
      {result && (
        <div className="mt-3">
          <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
