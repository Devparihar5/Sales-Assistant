import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { messageService } from '../services/messageService';
import { clientService } from '../services/clientService';
import { productService } from '../services/productService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const MessagesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    messageType: '',
    status: '',
    clientId: '',
    productId: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch messages, clients, and products
  const { data: messages, isLoading: isLoadingMessages } = useQuery('messages', () => messageService.getMessages());
  const { data: clients } = useQuery('clients', () => clientService.getClients());
  const { data: products } = useQuery('products', () => productService.getProducts());
  
  // Apply filters and search
  const filteredMessages = messages?.filter(message => {
    // Get client and product for this message
    const client = clients?.find(c => c.id === message.client_id);
    const product = products?.find(p => p.id === message.product_id);
    
    // Apply search term
    const searchMatches = 
      (client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       message.content?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!searchMatches) return false;
    
    // Apply filters
    if (filters.messageType && message.message_type !== filters.messageType) return false;
    if (filters.status && message.status !== filters.status) return false;
    if (filters.clientId && message.client_id !== filters.clientId) return false;
    if (filters.productId && message.product_id !== filters.productId) return false;
    
    return true;
  });
  
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
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const clearFilters = () => {
    setFilters({
      messageType: '',
      status: '',
      clientId: '',
      productId: '',
    });
  };
  
  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage your personalized client messages.
          </p>
        </div>
        <Button to="/messages/generate" className="flex items-center">
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Generate Message
        </Button>
      </div>
      
      {/* Search and filters */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative rounded-md shadow-sm flex-1 max-w-2xl">
            <input
              type="text"
              className="form-input block w-full pr-10 sm:text-sm"
              placeholder="Search messages by client, product, or content"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <button
            type="button"
            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
            Filters
          </button>
        </div>
        
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="messageType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message Type
                </label>
                <select
                  id="messageType"
                  name="messageType"
                  className="mt-1 form-input block w-full"
                  value={filters.messageType}
                  onChange={handleFilterChange}
                >
                  <option value="">All Types</option>
                  <option value="email">Email</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 form-input block w-full"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="responded">Responded</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Client
                </label>
                <select
                  id="clientId"
                  name="clientId"
                  className="mt-1 form-input block w-full"
                  value={filters.clientId}
                  onChange={handleFilterChange}
                >
                  <option value="">All Clients</option>
                  {clients?.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="productId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product
                </label>
                <select
                  id="productId"
                  name="productId"
                  className="mt-1 form-input block w-full"
                  value={filters.productId}
                  onChange={handleFilterChange}
                >
                  <option value="">All Products</option>
                  {products?.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          </Card>
        )}
      </div>
      
      {/* Messages list */}
      <div className="mt-6">
        {isLoadingMessages ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredMessages?.length === 0 ? (
          <EmptyState
            title="No messages found"
            description={searchTerm || Object.values(filters).some(v => v) ? "Try adjusting your search or filters" : "Get started by generating your first message"}
            icon={ChatBubbleLeftRightIcon}
            buttonText="Generate Message"
            buttonTo="/messages/generate"
          />
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Client</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Subject/Content</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredMessages?.map((message) => {
                  const client = clients?.find(c => c._id === message.client_id || c.id === message.client_id);
                  const product = products?.find(p => p._id === message.product_id || p.id === message.product_id);
                  
                  return (
                    <tr 
                      key={message._id || message.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => navigate(`/messages/${message._id || message.id}`)}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                        {client?.name || 'Unknown Client'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {product?.name || 'Unknown Product'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          {message.message_type === 'email' ? (
                            <EnvelopeIcon className="h-5 w-5 mr-1 text-gray-400" />
                          ) : (
                            <svg className="h-5 w-5 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          )}
                          {message.message_type === 'email' ? 'Email' : 'LinkedIn'}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="truncate max-w-xs">
                          {message.message_type === 'email' ? message.subject : message.content.substring(0, 50) + '...'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(message.created_at).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <Badge variant={getMessageStatusBadgeVariant(message.status)}>
                          {message.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
