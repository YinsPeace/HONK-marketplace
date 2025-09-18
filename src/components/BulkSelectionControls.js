import React from 'react';

const BulkSelectionControls = ({
  isBulkMode,
  toggleBulkMode,
  selectedHeroes,
  selectAllHeroes,
  clearAllSelections,
  onOpenBulkModal,
  visibleHeroes,
  totalHeroes,
  isSellBulkMode,
  toggleSellBulkMode,
  hideBulkSelect = false,
  onRefresh,
  loading,
}) => {
  const selectedCount = selectedHeroes.size;

  return (
    <div className="mb-3 bg-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSellBulkMode}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                isSellBulkMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {isSellBulkMode ? 'Individual View' : 'Bulk View'}
            </button>

            {!hideBulkSelect && (
            <span className="text-gray-400 text-sm">
              {isSellBulkMode ? `${totalHeroes} bulk listings` : `${totalHeroes} heroes`}
            </span>
          )}
          </div>

          {/* Bulk Selection Mode Toggle (only show in individual view) */}
          {!hideBulkSelect && !isSellBulkMode && (
            <>
              <div className="w-px h-6 bg-gray-600"></div>
              <button
                onClick={toggleBulkMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isBulkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {isBulkMode ? 'Exit Bulk Select' : 'Bulk Select'}
              </button>
              {/* Refresh button next to Bulk Select */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className={`ml-2 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1 ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  title="Refresh hero data"
                  aria-label="Refresh hero data"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Selection info and actions (only show when in bulk selection mode) */}
        {!hideBulkSelect && isBulkMode && !isSellBulkMode && (
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 text-sm">{selectedCount} selected (max 50)</span>

            {selectedCount > 0 && (
              <>
                <button
                  onClick={() => selectAllHeroes(visibleHeroes.map((h) => h.id))}
                  className="px-3 py-1 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 text-sm"
                  disabled={selectedCount >= 50}
                >
                  Select All Visible
                </button>

                <button
                  onClick={clearAllSelections}
                  className="px-3 py-1 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 text-sm"
                >
                  Clear All
                </button>

                <button
                  onClick={onOpenBulkModal}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  List {selectedCount} Heroes
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Instructions based on current mode */}
      <div className="text-xs text-gray-500">
        {isSellBulkMode
          ? 'Viewing grouped bulk listings. Click on a bulk listing to manage or cancel it.'
          : !hideBulkSelect && isBulkMode
            ? 'Bulk selection mode: Click heroes to select them for bulk listing. Maximum 50 heroes can be selected at once.'
            : !hideBulkSelect
              ? 'Individual view: Click heroes to list them individually, or use "Bulk Select" to list multiple heroes at once.'
              : 'Toggle between individual and bulk listings.'}
      </div>
    </div>
  );
};

export default BulkSelectionControls;
