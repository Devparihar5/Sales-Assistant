import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { userService } from '../services/userService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'sales',
  });
  
  // Fetch users
  const { data: users, isLoading, error: usersError } = useQuery('users', () => userService.getUsers());
  
  // Delete user mutation
  const deleteUserMutation = useMutation(
    (userId) => userService.deleteUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'Failed to delete user');
      }
    }
  );
  
  // Add user mutation
  const addUserMutation = useMutation(
    (userData) => userService.createUser(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setShowAddUserModal(false);
        setNewUser({
          email: '',
          full_name: '',
          password: '',
          role: 'sales',
        });
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'Failed to add user');
      }
    }
  );
  
  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  const handleAddUser = (e) => {
    e.preventDefault();
    addUserMutation.mutate(newUser);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage user accounts and permissions.
          </p>
        </div>
        <Button onClick={() => setShowAddUserModal(true)} className="flex items-center">
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add User
        </Button>
      </div>
      
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="mt-4"
        />
      )}
      
      {/* Users list */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : usersError ? (
          <Alert
            type="error"
            title="Error loading users"
            message={usersError.message}
          />
        ) : users?.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Add users to give them access to the Sales Assistant"
            icon={UserIcon}
            buttonText="Add User"
            buttonOnClick={() => setShowAddUserModal(true)}
          />
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {users?.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                      {user.full_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <Badge variant={user.role === 'admin' ? 'primary' : 'default'}>
                        {user.role === 'admin' ? 'Admin' : 'Sales'}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <Badge variant={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Button
                        to={`/users/${user.id}/edit`}
                        variant="ghost"
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 mr-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteUserMutation.isLoading}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <UserIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Add New User
                    </h3>
                    <div className="mt-4">
                      <form onSubmit={handleAddUser}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Full Name
                            </label>
                            <input
                              type="text"
                              name="full_name"
                              id="full_name"
                              className="form-input mt-1"
                              value={newUser.full_name}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              className="form-input mt-1"
                              value={newUser.email}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Password
                            </label>
                            <input
                              type="password"
                              name="password"
                              id="password"
                              className="form-input mt-1"
                              value={newUser.password}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Role
                            </label>
                            <select
                              name="role"
                              id="role"
                              className="form-input mt-1"
                              value={newUser.role}
                              onChange={handleInputChange}
                            >
                              <option value="sales">Sales</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  type="button"
                  onClick={handleAddUser}
                  disabled={addUserMutation.isLoading}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  {addUserMutation.isLoading ? 'Adding...' : 'Add User'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddUserModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
