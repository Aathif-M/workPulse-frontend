// import CustomSelect from '../components/CustomSelect';

// <CustomSelect
//     value={selectedValue}
//     onChange={(e) => setSelectedValue(e.target.value)}
//     options={[
//         { value: 'option1', label: 'Option 1' },
//         { value: 'option2', label: 'Option 2' },
//     ]}
//     placeholder="Select an option..."
// />

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ value, onChange, options = [], placeholder = 'Select...', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Find the selected option object to display its label
    const selectedOption = options.find(opt => opt.value == value); // loose equality for string/number mix

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue) => {
        // mimic standard event object
        const e = {
            target: {
                value: optionValue
            }
        };
        onChange(e);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 border border-blue-900/20 bg-white rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-blue-400 text-left"
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`ml-2 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100">
                    <ul className="py-1">
                        {options.map((option) => (
                            <li
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`
                                    relative cursor-pointer select-none py-2 pl-3 pr-9
                                    transition-colors duration-150
                                    ${option.value == value ? 'bg-blue-50 text-blue-900' : 'text-gray-900 hover:bg-gray-50'}
                                `}
                            >
                                <span className={`block truncate ${option.value == value ? 'font-medium' : 'font-normal'}`}>
                                    {option.label}
                                </span>
                                {option.value == value && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                                        <Check size={16} />
                                    </span>
                                )}
                            </li>
                        ))}
                        {options.length === 0 && (
                            <li className="text-gray-500 p-2 text-center text-sm">No options</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
