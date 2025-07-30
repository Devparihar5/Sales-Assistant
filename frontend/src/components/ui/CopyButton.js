import React, { useState } from 'react';
import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { copyToClipboard } from '../../utils/textUtils';

/**
 * A button that copies text to clipboard when clicked
 * @param {Object} props - Component props
 * @param {string} props.text - The text to copy
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.size='sm'] - Button size ('sm', 'md', 'lg')
 * @param {string} [props.tooltip='Copy to clipboard'] - Tooltip text
 * @param {number} [props.successDuration=2000] - How long to show success state in ms
 */
const CopyButton = ({ 
  text, 
  className = '', 
  size = 'sm', 
  tooltip = 'Copy to clipboard',
  successDuration = 2000
}) => {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), successDuration);
    }
  };
  
  // Determine icon size based on the size prop
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  const iconSize = iconSizes[size] || iconSizes.sm;
  
  // Button size classes
  const buttonSizes = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };
  
  const buttonSize = buttonSizes[size] || buttonSizes.sm;
  
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleCopy}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${buttonSize} rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
        aria-label={tooltip}
      >
        {copied ? (
          <ClipboardDocumentCheckIcon className={`${iconSize} text-green-500`} />
        ) : (
          <ClipboardDocumentIcon className={`${iconSize} text-gray-500 dark:text-gray-400`} />
        )}
      </button>
      
      {showTooltip && !copied && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
          {tooltip}
        </div>
      )}
      
      {showTooltip && copied && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap">
          Copied!
        </div>
      )}
    </div>
  );
};

export default CopyButton;
