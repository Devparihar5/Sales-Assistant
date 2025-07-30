import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CubeIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Clients', href: '/clients', icon: UserGroupIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: UserIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Sidebar = () => {
  const { user } = useAuth();
  
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-primary-700 dark:bg-gray-800">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-800 dark:bg-gray-900">
            <img
              className="h-8 w-auto"
              src="/logo.svg"
              alt="Sales Assistant"
            />
            <span className="ml-2 text-white font-semibold text-lg">Sales Assistant</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => classNames(
                    isActive
                      ? 'bg-primary-800 dark:bg-gray-900 text-white'
                      : 'text-primary-100 dark:text-gray-300 hover:bg-primary-600 dark:hover:bg-gray-700 hover:text-white',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-6 w-6 text-primary-300 dark:text-gray-400"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
              
              {/* Special link for message generation */}
              <NavLink
                to="/messages/generate"
                className={({ isActive }) => classNames(
                  isActive
                    ? 'bg-primary-800 dark:bg-gray-900 text-white'
                    : 'text-primary-100 dark:text-gray-300 hover:bg-primary-600 dark:hover:bg-gray-700 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md mt-6'
                )}
              >
                <PlusCircleIcon
                  className="mr-3 flex-shrink-0 h-6 w-6 text-primary-300 dark:text-gray-400"
                  aria-hidden="true"
                />
                Generate Message
              </NavLink>
              
              {/* Admin navigation */}
              {user && user.role === 'admin' && (
                <div className="pt-6 mt-6 border-t border-primary-600 dark:border-gray-700">
                  <p className="px-2 text-xs font-semibold text-primary-200 dark:text-gray-400 uppercase tracking-wider">
                    Admin
                  </p>
                  <div className="mt-2 space-y-1">
                    {adminNavigation.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) => classNames(
                          isActive
                            ? 'bg-primary-800 dark:bg-gray-900 text-white'
                            : 'text-primary-100 dark:text-gray-300 hover:bg-primary-600 dark:hover:bg-gray-700 hover:text-white',
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                      >
                        <item.icon
                          className="mr-3 flex-shrink-0 h-6 w-6 text-primary-300 dark:text-gray-400"
                          aria-hidden="true"
                        />
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
