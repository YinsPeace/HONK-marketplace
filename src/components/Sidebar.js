import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FilterSortForm from './FilterSortForm';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Sidebar = ({
  onFiltersChange,
  onSortChange,
  filters,
  sortOrder,
  disabled,
  isBuyTab,
  isOpen,
  setIsOpen,
}) => {
  const [activeTab, setActiveTab] = useState('main');
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const isActiveTab = (tabName) => {
    return location.pathname === (tabName === 'buy' ? '/' : '/sell');
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-gray-900 text-gray-300 transition-all duration-300 ease-in-out ${isOpen ? 'w-96' : 'w-16'} flex flex-col z-50 shadow-lg`}
    >
      <div className="sticky top-0 bg-gray-800 w-full">
        <div className="p-2 flex justify-between items-center">
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isOpen ? '' : 'w-full flex flex-col items-center'}`}
          >
            {isOpen ? (
              <FaChevronLeft />
            ) : (
              <>
                <FaChevronRight />
                <span className="text-xs mt-1 filters-expand">Filter</span>
              </>
            )}
          </button>
          {isOpen && (
            <div className="flex space-x-4">
              <Link
                to="/"
                className={`py-2 px-4 rounded ${isActiveTab('buy') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Buy Heroes
              </Link>
              <Link
                to="/sell"
                className={`py-2 px-4 rounded ${isActiveTab('sell') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Sell Heroes
              </Link>
            </div>
          )}
        </div>
        {isOpen && (
          <div className="flex w-full">
            <button
              onClick={() => setActiveTab('main')}
              className={`flex-1 py-2 px-4 ${activeTab === 'main' ? 'bg-gray-900 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-tl-lg rounded-tr-lg'} ${
                activeTab === 'main' ? 'rounded-tl-lg rounded-tr-lg' : ''
              }`}
            >
              Main
            </button>
            <button
              onClick={() => setActiveTab('profession')}
              className={`flex-1 py-2 px-4 ${activeTab === 'profession' ? 'bg-gray-900 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-tl-lg rounded-tr-lg'} ${
                activeTab === 'profession' ? 'rounded-tl-lg rounded-tr-lg' : ''
              }`}
            >
              Profession
            </button>
          </div>
        )}
      </div>
      {isOpen && (
        <div
          className="bg-gray-900 p-4 flex-grow overflow-y-scroll custom-scrollbar"
          style={{ height: 'calc(100vh - 116px)' }}
        >
          <FilterSortForm
            onFiltersChange={onFiltersChange}
            onSortChange={onSortChange}
            filters={filters}
            sortOrder={sortOrder}
            disabled={disabled}
            isBuyTab={isBuyTab}
            activeTab={activeTab}
          />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
