import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { classMapping } from '../utils/heroUtils';
import './styles/SidebarWithFilters.css';

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

  useEffect(() => {
    // Update range slider fills when switching tabs or when filters change
    const updateRangeSliderFills = () => {
      const sliders = document.querySelectorAll('.relative[data-filter]');
      sliders.forEach(slider => {
        const filterType = slider.getAttribute('data-filter').toLowerCase();
        const fill = slider.querySelector('.range-slider-fill');
        const minInput = slider.querySelector('.range-input-min');
        const maxInput = slider.querySelector('.range-input-max');
        
        if (fill && minInput && maxInput) {
          const min = parseInt(minInput.min);
          const max = parseInt(maxInput.max);
          const minVal = parseInt(minInput.value);
          const maxVal = parseInt(maxInput.value);
          
          // Adjust the percentage calculation to account for slider width
          const range = max - min;
          const minPercent = ((minVal - min) / range) * 92 + 5; // Add 5% offset from left
          const maxPercent = ((maxVal - min) / range) * 92 + 5; // Add 5% offset from left
          
          fill.style.left = `${minPercent}%`;
          fill.style.width = `${maxPercent - minPercent}%`;
        }
      });
    };

    // Run on mount and when activeTab or filters change
    updateRangeSliderFills();
  }, [activeTab, filters]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const isActiveTab = (tabName) => {
    return location.pathname === (tabName === 'buy' ? '/' : '/sell');
  };

  const handleFilterChange = (filterKey, value) => {
    onFiltersChange(filterKey, value);
  };

  const handleSortChange = (value) => {
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
    <div className="mb-2">
      <h3 className="text-sm font-medium text-gray-300 mb-1">{filterType}</h3>
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

  const classOptions = [
    'Warrior',
    'Knight',
    'Thief',
    'Archer',
    'Priest',
    'Wizard',
    'Monk',
    'Pirate',
    'Berserker',
    'Seer',
    'Legionnaire',
    'Scholar',
    'Paladin',
    'DarkKnight',
    'Summoner',
    'Ninja',
    'Shapeshifter',
    'Dragoon',
    'Sage',
    'Spellbow',
    'Dreadknight'
  ];

  const professionOptions = [
    'Mining',
    'Gardening',
    'Fishing',
    'Foraging',
  ];

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
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-300 mb-1">{sectionTitles[filterType]}</h3>
        <div className={`grid ${columnClass} gap-1`}>
          {options.map((option) => (
            <label key={option} className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={filters[filterType]?.map(f => f.toLowerCase()).includes(option.toLowerCase())}
                onChange={() => {
                  const updatedFilter = filters[filterType]?.includes(option)
                    ? filters[filterType].filter((item) => item.toLowerCase() !== option.toLowerCase())
                    : [...(filters[filterType] || []), option];
                  handleFilterChange(filterType, updatedFilter);
                }}
                disabled={disabled}
                className="mr-1"
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
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'main' && (
          <>
            {/* Absolute positioned search and clear */}
            <div className="absolute top-2 right-0 flex space-x-2">
              <input
                type="text"
                placeholder="Hero ID"
                value={filters.heroId || ''}
                onChange={(e) => handleFilterChange('heroId', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="w-28 px-2 py-1 text-sm bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleClearFilters}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear
              </button>
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Class</h3>
              <div className={`grid grid-cols-3 gap-1.5`}>
                {classOptions.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.class?.map(f => f.toLowerCase()).includes(option.toLowerCase())}
                      onChange={() => {
                        const updatedFilter = filters.class?.includes(option)
                          ? filters.class.filter((item) => item.toLowerCase() !== option.toLowerCase())
                          : [...(filters.class || []), option];
                        handleFilterChange('class', updatedFilter);
                      }}
                      disabled={disabled}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-400">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Sub Class</h3>
              <div className={`grid grid-cols-3 gap-1.5`}>
                {classOptions.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.subclass?.map(f => f.toLowerCase()).includes(option.toLowerCase())}
                      onChange={() => {
                        const updatedFilter = filters.subclass?.includes(option)
                          ? filters.subclass.filter((item) => item.toLowerCase() !== option.toLowerCase())
                          : [...(filters.subclass || []), option];
                        handleFilterChange('subclass', updatedFilter);
                      }}
                      disabled={disabled}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-400">{option}</span>
                  </label>
                ))}
              </div>
            </div>
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
            {renderDualRangeSlider(
              'Summons Remaining',
              0,
              10,
              1,
              ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
              'summonsRemainingMin',
              'summonsRemainingMax'
            )}
            <div className="space-y-1.5 mb-5">
              <label className="block text-sm font-medium text-gray-300">Level Range</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={filters.levelMin}
                  onChange={(e) => handleFilterChange('levelMin', parseInt(e.target.value))}
                  disabled={disabled}
                  className="w-1/2 p-1.5 text-sm bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span>-</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={filters.levelMax}
                  onChange={(e) => handleFilterChange('levelMax', parseInt(e.target.value))}
                  disabled={disabled}
                  className="w-1/2 p-1.5 text-sm bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </>
        )}
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

  const defaultFilters = {
    class: [],
    subclass: [],
    profession: [],
    crafting1: [],
    crafting2: [],
    levelMin: 1,
    levelMax: 100,
    rarityMin: 0,
    rarityMax: 4,
    generationMin: 0,
    generationMax: 11,
    summonsRemainingMin: 0,
    summonsRemainingMax: 10,
    hideQuesting: false,
  };

  const handleClearFilters = () => {
    onFiltersChange('class', defaultFilters.class);
    onFiltersChange('subclass', defaultFilters.subclass);
    onFiltersChange('profession', defaultFilters.profession);
    onFiltersChange('crafting1', defaultFilters.crafting1);
    onFiltersChange('crafting2', defaultFilters.crafting2);
    onFiltersChange('rarityMin', defaultFilters.rarityMin);
    onFiltersChange('rarityMax', defaultFilters.rarityMax);
    onFiltersChange('generationMin', defaultFilters.generationMin);
    onFiltersChange('generationMax', defaultFilters.generationMax);
    onFiltersChange('levelMin', defaultFilters.levelMin);
    onFiltersChange('levelMax', defaultFilters.levelMax);
    onFiltersChange('summonsRemainingMin', defaultFilters.summonsRemainingMin);
    onFiltersChange('summonsRemainingMax', defaultFilters.summonsRemainingMax);
    onFiltersChange('hideQuesting', defaultFilters.hideQuesting);
    onFiltersChange('hideListedHeroes', defaultFilters.hideListedHeroes);
    onFiltersChange('heroId', '');
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
            {activeTab === 'main' ? renderMainFilters() : renderProfessionFilters()}

            <div className={`sort-section space-y-2 mb-2 ${activeTab === 'main' ? 'sort-section-main' : ''}`}>
              <label className="block text-sm font-medium text-gray-300">Sort By</label>
              <select
                onChange={(e) => handleSortChange(e.target.value)}
                value={sortOrder}
                disabled={disabled}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-1 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
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
