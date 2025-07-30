import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { clientService } from '../services/clientService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: clients, isLoading, error } = useQuery('clients', () => clientService.getClients());
  
  // Filter clients based on search term
  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
  
  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your client information and communication history.
          </p>
        </div>
        <Button to="/clients/new" className="flex items-center">
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Client
        </Button>
      </div>
      
      {/* Search bar */}
      <div className="mt-6">
        <div className="relative rounded-md shadow-sm">
          <input
            type="text"
            className="form-input block w-full pr-10 sm:text-sm"
            placeholder="Search clients by name, company, position, or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Clients list */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="col-span-full">
            <Card className="p-6 text-center text-red-600 dark:text-red-400">
              Error loading clients: {error.message}
            </Card>
          </div>
        ) : filteredClients?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No clients found"
              description={searchTerm ? "Try adjusting your search terms" : "Get started by adding your first client"}
              icon={UserGroupIcon}
              buttonText="Add Client"
              buttonTo="/clients/new"
            />
          </div>
        ) : (
          filteredClients?.map((client) => (
            <Link key={client._id || client.id} to={`/clients/${client._id || client.id}`}>
              <Card className="p-6 hover:transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-medium text-lg">
                      {client.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {client.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {client.position} at {client.company}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge variant={getRoleBadgeVariant(client.role_category)}>
                    {client.role_category.charAt(0).toUpperCase() + client.role_category.slice(1)}
                  </Badge>
                </div>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <p>{client.email}</p>
                  {client.phone && <p>{client.phone}</p>}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientsPage;
