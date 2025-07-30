import React from 'react';
import Button from './Button';

const EmptyState = ({
  title,
  description,
  icon: Icon,
  buttonText,
  buttonTo,
  buttonOnClick,
}) => {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
          <Icon className="h-full w-full" aria-hidden="true" />
        </div>
      )}
      <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {buttonText && (buttonTo || buttonOnClick) && (
        <div className="mt-6">
          <Button
            variant="primary"
            to={buttonTo}
            onClick={buttonOnClick}
          >
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
