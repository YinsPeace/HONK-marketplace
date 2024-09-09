import React, { useEffect } from 'react';
import { classMapping } from '../utils/heroUtils';

const sectionTitles = {
  class: 'Class',
  subclass: 'Subclass',
  profession: 'Profession',
  crafting1: 'Craft 1',
  crafting2: 'Craft 2',
};

const FilterSortForm = ({
  onFiltersChange,
  onSortChange,
  filters,
  sortOrder,
  disabled,
  isBuyTab,
  activeTab,
}) => {
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
          onChange={(e) => onFiltersChange(minFilterKey, parseInt(e.target.value))}
          disabled={disabled}
          className="range-input range-input-min w-full"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={filters[maxFilterKey]}
          onChange={(e) => onFiltersChange(maxFilterKey, parseInt(e.target.value))}
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
    // Use 3 columns for Class and Subclass in Main tab, 2 columns for everything else
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
                  onFiltersChange(filterType, updatedFilter);
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
            onChange={(e) => onFiltersChange('levelMin', parseInt(e.target.value))}
            disabled={disabled}
            className="w-1/2 p-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span>-</span>
          <input
            type="number"
            min="1"
            max="100"
            value={filters.levelMax}
            onChange={(e) => onFiltersChange('levelMax', parseInt(e.target.value))}
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

  return (
    <form className="space-y-4">
      {activeTab === 'main' ? renderMainFilters() : renderProfessionFilters()}

      <div className="space-y-2 mb-6">
        <label className="block text-sm font-medium text-gray-300">Sort By</label>
        <select
          onChange={(e) => onSortChange(e.target.value)}
          value={sortOrder}
          disabled={disabled}
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.hideQuesting}
            onChange={(e) => onFiltersChange('hideQuesting', e.target.checked)}
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
              onChange={(e) => onFiltersChange('hideListedHeroes', e.target.checked)}
              disabled={disabled}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-300">Hide Listed Heroes</span>
          </label>
        )}
      </div>
    </form>
  );
};

export default FilterSortForm;
