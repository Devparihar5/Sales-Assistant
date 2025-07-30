import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';

const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const typeClasses = {
    success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
  };
  
  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-green-400 dark:text-green-500" aria-hidden="true" />,
    error: <XCircleIcon className="h-5 w-5 text-red-400 dark:text-red-500" aria-hidden="true" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 dark:text-yellow-500" aria-hidden="true" />,
    info: <InformationCircleIcon className="h-5 w-5 text-blue-400 dark:text-blue-500" aria-hidden="true" />,
  };
  
  return (
    <div className={`rounded-md p-4 ${typeClasses[type]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          {message && (
            <div className="text-sm mt-1">
              {typeof message === 'string' ? message : JSON.stringify(message)}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                  type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                  type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
                  'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
                onClick={onClose}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
