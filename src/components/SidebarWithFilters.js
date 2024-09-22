import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { classMapping } from '../utils/heroUtils';

const sectionTitles = {
  class: 'Class',
  subclass: 'Sub Class',
  profession: 'Profession',
  crafting1: 'Craft 1',
  crafting2: 'Craft 2',
};

const SidebarWithFilters = ({
  onFiltersChange,
  onSortChange,
  filters,
  sortOrder,
  sortOptions,
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

  const handleFilterChange = (filterKey, value) => {
    console.log('Filter changed in Sidebar:', filterKey, value);
    onFiltersChange(filterKey, value);
  };

  const handleSortChange = (value) => {
    console.log('Sort changed in Sidebar:', value);
    onSortChange(value);
  };

  const renderDualRangeSlider = (
    filterType,
    min,
    max,
    step,
    labels,
    minFilterKey,
    maxFilterKey
  ) => (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-300 mb-2">{filterType}</h3>
      <div className="relative flex space-x-2" data-filter={filterType.toLowerCase()}>
        <div className="range-slider-fill absolute top-0 h-2 bg-orange-500"></div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={filters[minFilterKey]}
          onChange={(e) => handleFilterChange(minFilterKey, parseInt(e.target.value))}
          disabled={disabled}
          className="range-input range-input-min w-full"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={filters[maxFilterKey]}
          onChange={(e) => handleFilterChange(maxFilterKey, parseInt(e.target.value))}
          disabled={disabled}
          className="range-input range-input-max w-full"
        />
      </div>
      <div className="relative mt-4 range-labels">
        <div className="flex justify-between">
          {labels.map((label, index) => (
            <span
              key={index}
              className="text-xs text-gray-400"
              style={{
                width: `${100 / labels.length}%`,
                textAlign: index === 0 ? 'left' : index === labels.length - 1 ? 'right' : 'center',
                paddingRight: index === labels.length - 1 ? '8px' : '0px',
                paddingLeft: index === 0 ? '8px' : '0px',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const classOptions = Object.values(classMapping);
  const professionOptions = ['Fishing', 'Foraging', 'Gardening', 'Mining'];
  const craftingOptions = [
    'Blacksmithing',
    'Goldsmithing',
    'Armorsmithing',
    'Woodworking',
    'Leatherworking',
    'Tailoring',
    'Enchanting',
    'Alchemy',
  ];

  const renderCheckboxGroup = (filterType, options) => {
    const columnClass =
      activeTab === 'main' && (filterType === 'class' || filterType === 'subclass')
        ? 'grid-cols-3'
        : 'grid-cols-2';

    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-2">{sectionTitles[filterType]}</h3>
        <div className={`grid ${columnClass} gap-2`}>
          {options.map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={filters[filterType].includes(option)}
                onChange={() => {
                  const updatedFilter = filters[filterType].includes(option)
                    ? filters[filterType].filter((item) => item !== option)
                    : [...filters[filterType], option];
                  handleFilterChange(filterType, updatedFilter);
                }}
                disabled={disabled}
                className="mr-2"
              />
              <span className="text-sm text-gray-400">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderMainFilters = () => (
    <>
      {renderCheckboxGroup('class', classOptions)}
      {renderCheckboxGroup('subclass', classOptions)}
      {renderDualRangeSlider(
        'Rarity',
        0,
        4,
        1,
        ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'],
        'rarityMin',
        'rarityMax'
      )}
      {renderDualRangeSlider(
        'Generation',
        0,
        11,
        0.5,
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11+'],
        'generationMin',
        'generationMax'
      )}
      <div className="space-y-2 mb-6">
        <label className="block text-sm font-medium text-gray-300">Level Range</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            max="100"
            value={filters.levelMin}
            onChange={(e) => handleFilterChange('levelMin', parseInt(e.target.value))}
            disabled={disabled}
            className="w-1/2 p-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span>-</span>
          <input
            type="number"
            min="1"
            max="100"
            value={filters.levelMax}
            onChange={(e) => handleFilterChange('levelMax', parseInt(e.target.value))}
            disabled={disabled}
            className="w-1/2 p-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </>
  );

  const renderProfessionFilters = () => (
    <>
      {renderCheckboxGroup('profession', professionOptions)}
      {renderCheckboxGroup('crafting1', craftingOptions)}
      {renderCheckboxGroup('crafting2', craftingOptions)}
    </>
  );

  useEffect(() => {
    const updateRangeSliderFill = (filterName) => {
      const container = document.querySelector(`[data-filter="${filterName}"]`);
      if (!container) return;

      const minInput = container.querySelector('.range-input-min');
      const maxInput = container.querySelector('.range-input-max');
      const fillElement = container.querySelector('.range-slider-fill');

      const range = parseFloat(maxInput.max) - parseFloat(maxInput.min);
      const minPosition =
        ((parseFloat(minInput.value) - parseFloat(minInput.min)) / range) * 95 + 5;
      const maxPosition =
        ((parseFloat(maxInput.value) - parseFloat(minInput.min)) / range) * 95 + 5;

      fillElement.style.left = `${minPosition}%`;
      fillElement.style.width = `${maxPosition - minPosition}%`;
    };

    updateRangeSliderFill('rarity');
    updateRangeSliderFill('generation');
  }, [filters.rarityMin, filters.rarityMax, filters.generationMin, filters.generationMax]);

  const handleClearFilters = () => {
    onFiltersChange('class', []);
    onFiltersChange('subclass', []);
    onFiltersChange('profession', []);
    onFiltersChange('crafting1', []);
    onFiltersChange('crafting2', []);
    onFiltersChange('rarityMin', 0);
    onFiltersChange('rarityMax', 4);
    onFiltersChange('generationMin', 0);
    onFiltersChange('generationMax', 11);
    onFiltersChange('levelMin', 1);
    onFiltersChange('levelMax', 100);
    onFiltersChange('hideQuesting', false);
    onFiltersChange('hideListedHeroes', false);
    onSortChange('price-asc');
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-gray-900 text-gray-300 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-96' : 'w-16'
      } flex flex-col z-50 shadow-lg`}
    >
      <div className="sticky top-0 bg-gray-800 w-full">
        <div className="p-2 flex justify-between items-center">
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isOpen ? '' : 'w-full flex flex-col items-center'
            }`}
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
                className={`py-2 px-4 rounded ${
                  isActiveTab('buy')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Buy Heroes
              </Link>
              <Link
                to="/sell"
                className={`py-2 px-4 rounded ${
                  isActiveTab('sell')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
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
              className={`flex-1 py-2 px-4 ${
                activeTab === 'main'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-tl-lg rounded-tr-lg'
              } ${activeTab === 'main' ? 'rounded-tl-lg rounded-tr-lg' : ''}`}
            >
              Main
            </button>
            <button
              onClick={() => setActiveTab('profession')}
              className={`flex-1 py-2 px-4 ${
                activeTab === 'profession'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-tl-lg rounded-tr-lg'
              } ${activeTab === 'profession' ? 'rounded-tl-lg rounded-tr-lg' : ''}`}
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
          <form className="space-y-4 relative">
            <button
              type="button"
              onClick={handleClearFilters}
              className="absolute top-0 right-0 mt-[-1rem] px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              title="Clear all filters"
            >
              Clear
            </button>

            {activeTab === 'main' ? renderMainFilters() : renderProfessionFilters()}

            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-300">Sort By</label>
              <select
                onChange={(e) => handleSortChange(e.target.value)}
                value={sortOrder}
                disabled={disabled}
                className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hideQuesting}
                  onChange={(e) => handleFilterChange('hideQuesting', e.target.checked)}
                  disabled={disabled}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-300">Hide Questing Heroes</span>
              </label>
              {!isBuyTab && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hideListedHeroes}
                    onChange={(e) => handleFilterChange('hideListedHeroes', e.target.checked)}
                    disabled={disabled}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-300">Hide Listed Heroes</span>
                </label>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SidebarWithFilters;
