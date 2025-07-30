import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, CubeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { productService } from '../services/productService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: products, isLoading, error } = useQuery('products', () => productService.getProducts());
  
  // Filter products based on search term
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your product information and documentation.
          </p>
        </div>
        <Button to="/products/new" className="flex items-center">
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Product
        </Button>
      </div>
      
      {/* Search bar */}
      <div className="mt-6">
        <div className="relative rounded-md shadow-sm">
          <input
            type="text"
            className="form-input block w-full pr-10 sm:text-sm"
            placeholder="Search products by name or description"
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
      
      {/* Products list */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="col-span-full">
            <Card className="p-6 text-center text-red-600 dark:text-red-400">
              Error loading products: {error.message}
            </Card>
          </div>
        ) : filteredProducts?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No products found"
              description={searchTerm ? "Try adjusting your search terms" : "Get started by adding your first product"}
              icon={CubeIcon}
              buttonText="Add Product"
              buttonTo="/products/new"
            />
          </div>
        ) : (
          filteredProducts?.map((product) => (
            <Link key={product._id || product.id} to={`/products/${product._id || product.id}`}>
              <Card className="p-6 hover:transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <CubeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <p className="line-clamp-3">{product.description}</p>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mr-4">
                    <span className="mr-1">{product.features?.length || 0}</span>
                    <span>Features</span>
                  </div>
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    <span>{product.documentation_urls?.length || 0}</span>
                    <span className="ml-1">Docs</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
