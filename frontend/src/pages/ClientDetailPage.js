import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  LinkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { clientService } from '../services/clientService';
import { messageService } from '../services/messageService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    role_category: 'executive',
    linkedin_url: '',
    notes: ''
  });
  
  const isNewClient = id === 'new';
  
  // Fetch client data (only if not a new client)
  const { 
    data: client, 
    isLoading: isLoadingClient, 
    error: clientError 
  } = useQuery(['client', id], () => clientService.getClient(id), {
    enabled: !isNewClient,
    retry: 1,
    onError: (error) => {
      console.error('Error fetching client:', error);
    }
  });
  
  // Fetch client messages (only if not a new client)
  const { 
    data: messages, 
    isLoading: isLoadingMessages, 
    error: messagesError 
  } = useQuery(['clientMessages', id], () => messageService.getMessages({ client_id: id }), {
    enabled: !isNewClient
  });
  
  // Update form data when client data is loaded
  React.useEffect(() => {
    if (client && !isNewClient) {
      setFormData({
        name: client.name || '',
        company: client.company || '',
        position: client.position || '',
        email: client.email || '',
        phone: client.phone || '',
        role_category: client.role_category || 'executive',
        linkedin_url: client.linkedin_url || '',
        notes: client.notes || ''
      });
    }
  }, [client, isNewClient]);
  
  // Create client mutation
  const createClientMutation = useMutation(
    (data) => clientService.createClient(data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('clients');
        // Handle both _id and id formats from the API
        const clientId = data._id || data.id;
        if (clientId) {
          navigate(`/clients/${clientId}`);
        } else {
          console.error('Client created but no ID returned:', data);
          setError('Client created but could not retrieve client ID');
          navigate('/clients');
        }
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to create client';
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
    }
  );
  
  // Update client mutation
  const updateClientMutation = useMutation(
    (data) => clientService.updateClient(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['client', id]);
        queryClient.invalidateQueries('clients');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to update client';
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
    }
  );
  
  // Delete client mutation
  const deleteClientMutation = useMutation(
    () => clientService.deleteClient(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients');
        navigate('/clients');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete client';
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNewClient) {
      createClientMutation.mutate(formData);
    } else {
      updateClientMutation.mutate(formData);
    }
  };
  
  const handleDeleteClient = () => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      deleteClientMutation.mutate();
    }
  };
  
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'executive':
        return 'primary';
      case 'technical':
        return 'info';
      case 'finance':
        return 'success';
      case 'marketing':
        return 'warning';
      case 'sales':
        return 'danger';
      case 'operations':
        return 'default';
      default:
        return 'default';
    }
  };
  
  const getMessageStatusBadgeVariant = (status) => {
    switch (status) {
      case 'draft':
        return 'warning';
      case 'sent':
        return 'info';
      case 'responded':
        return 'success';
      default:
        return 'default';
    }
  };
  
  if (isLoadingClient && !isNewClient) {
    return (
      <div className="page-container">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (clientError && !isNewClient) {
    const errorMessage = typeof clientError === 'string' 
      ? clientError 
      : clientError.message || 'Error loading client';
      
    return (
      <div className="page-container">
        <Alert
          type="error"
          title="Error loading client"
          message={errorMessage}
        />
        <div className="mt-4">
          <Button to="/clients" variant="secondary" className="flex items-center">
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}
      
      <div className="flex items-center justify-between">
        <Button to="/clients" variant="secondary" className="flex items-center">
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Back to Clients
        </Button>
        
        {!isNewClient && (
          <div className="flex space-x-2">
            <Button
              variant="danger"
              className="flex items-center"
              onClick={handleDeleteClient}
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
              Delete
            </Button>
          </div>
        )}
      </div>
      
      {/* Client Form */}
      <Card className="mt-6 p-6">
        <h2 className="text-xl font-semibold mb-4">
          {isNewClient ? 'Add New Client' : 'Client Details'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input block w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="form-input block w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Position
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className="form-input block w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role Category
              </label>
              <select
                name="role_category"
                value={formData.role_category}
                onChange={handleInputChange}
                className="form-select block w-full"
                required
              >
                <option value="executive">Executive</option>
                <option value="technical">Technical</option>
                <option value="finance">Finance</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="operations">Operations</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input block w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input block w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                className="form-input block w-full"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="form-textarea block w-full"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              className="ml-3"
              disabled={createClientMutation.isLoading || updateClientMutation.isLoading}
            >
              {createClientMutation.isLoading || updateClientMutation.isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : isNewClient ? 'Create Client' : 'Update Client'}
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Only show client details and messages if not a new client */}
      {!isNewClient && client && (
        <>
          {/* Client Contact Information */}
          <Card className="mt-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                  <a href={`mailto:${client.email}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                    {client.email}
                  </a>
                </div>
              </div>
              
              {client.phone && (
                <div className="flex items-start">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              
              {client.linkedin_url && (
                <div className="flex items-start">
                  <LinkIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</p>
                    <a href={client.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                      View Profile
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          {/* Client Messages */}
          <Card className="mt-6 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Messages</h2>
              <Button
                to={`/messages/generate?client_id=${client.id}`}
                variant="primary"
                className="flex items-center"
              >
                <ChatBubbleLeftRightIcon className="-ml-1 mr-2 h-5 w-5" />
                Generate Message
              </Button>
            </div>
            
            {isLoadingMessages ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : messagesError ? (
              <Alert
                type="error"
                title="Error loading messages"
                message={messagesError.message}
              />
            ) : messages?.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No messages yet. Generate your first message for this client.
              </div>
            ) : (
              <div className="space-y-4">
                {messages?.map((message) => (
                  <Link
                    key={message.id}
                    to={`/messages/${message.id}`}
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {message.subject || 'No Subject'}
                      </h3>
                      <Badge variant={getMessageStatusBadgeVariant(message.status)}>
                        {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {message.content}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(message.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default ClientDetailPage;
