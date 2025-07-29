import React from 'react';
import { FrontendDatabaseTest } from '@/components/FrontendDatabaseTest';

const DatabaseTest: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Frontend Database Communication Test</h1>
        <p className="text-gray-600">
          This page tests the frontend's ability to communicate with the backend database APIs using the actual TypeScript code.
        </p>
      </div>
      
      <FrontendDatabaseTest />
    </div>
  );
};

export default DatabaseTest; 