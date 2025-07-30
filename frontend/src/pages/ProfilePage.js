import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMutation } from 'react-query';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    password: '',
    confirm_password: '',
  });
  
  const updateProfileMutation = useMutation(
    (data) => updateProfile(data),
    {
      onSuccess: () => {
        setSuccess('Profile updated successfully');
        setFormData(prev => ({
          ...prev,
          password: '',
          confirm_password: '',
        }));
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'Failed to update profile');
      }
    }
  );
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate passwords match if provided
    if (formData.password && formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    
    // Prepare update data
    const updateData = {
      full_name: formData.full_name,
      email: formData.email,
    };
    
    // Only include password if provided
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    updateProfileMutation.mutate(updateData);
  };
  
  if (!user) {
    return (
      <div className="page-container">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Your Profile</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account settings and preferences.
        </p>
      </div>
      
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="mt-4"
        />
      )}
      
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
          className="mt-4"
        />
      )}
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <UserCircleIcon className="h-16 w-16 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                {user.full_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                  {user.role === 'admin' ? 'Admin' : 'Sales Team'}
                </span>
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account created</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {new Date(user.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last updated</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Edit Profile
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    className="form-input mt-1"
                    value={formData.full_name}
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
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Change Password
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Leave blank if you don't want to change your password.
                  </p>
                  
                  <div className="mt-4 space-y-6">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        className="form-input mt-1"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        id="confirm_password"
                        className="form-input mt-1"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isLoading}
                  >
                    {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
