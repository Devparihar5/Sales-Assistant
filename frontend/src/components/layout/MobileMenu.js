import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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

const MobileMenu = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  
  return (
    <Transition.Root show={sidebarOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 flex z-40 md:hidden" onClose={setSidebarOpen}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="transition ease-in-out duration-300 transform"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-primary-700 dark:bg-gray-800">
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
            </Transition.Child>
            <div className="flex-shrink-0 flex items-center px-4">
              <img
                className="h-8 w-auto"
                src="/logo.svg"
                alt="Sales Assistant"
              />
              <span className="ml-2 text-white font-semibold text-lg">Sales Assistant</span>
            </div>
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <nav className="px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => classNames(
                      isActive
                        ? 'bg-primary-800 dark:bg-gray-900 text-white'
                        : 'text-primary-100 dark:text-gray-300 hover:bg-primary-600 dark:hover:bg-gray-700 hover:text-white',
                      'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className="mr-4 flex-shrink-0 h-6 w-6 text-primary-300 dark:text-gray-400"
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
                    'group flex items-center px-2 py-2 text-base font-medium rounded-md mt-6'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <PlusCircleIcon
                    className="mr-4 flex-shrink-0 h-6 w-6 text-primary-300 dark:text-gray-400"
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
                            'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon
                            className="mr-4 flex-shrink-0 h-6 w-6 text-primary-300 dark:text-gray-400"
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
        </Transition.Child>
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Dummy element to force sidebar to shrink to fit close icon */}
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default MobileMenu;
