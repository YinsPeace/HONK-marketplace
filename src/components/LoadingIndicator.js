import React from 'react';

const LoadingIndicator = () => (
  <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
    <span>Loading more heroes...</span>
  </div>
);

export default LoadingIndicator;
