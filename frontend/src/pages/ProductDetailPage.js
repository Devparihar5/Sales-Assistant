import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentTextIcon,
  DocumentPlusIcon,
  ArrowUpTrayIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { productService } from '../services/productService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    features: [],
    benefits: [],
    documentation_urls: []
  });
  const [featureInput, setFeatureInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  
  const isNewProduct = id === 'new';
  
  // Fetch product data (only if not a new product)
  const { 
    data: product, 
    isLoading, 
    error: productError 
  } = useQuery(['product', id], () => productService.getProduct(id), {
    enabled: !isNewProduct,
    retry: 1,
    onError: (error) => {
      console.error('Error fetching product:', error);
    }
  });
  
  // Update form data when product data is loaded
  React.useEffect(() => {
    if (product && !isNewProduct) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        // Extract feature names from Feature objects
        features: product.features?.map(feature => feature.name) || [],
        benefits: product.benefits || [],
        documentation_urls: product.documentation_urls || []
      });
    }
  }, [product, isNewProduct]);
  
  // Create product mutation
  const createProductMutation = useMutation(
    (data) => productService.createProduct(data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('products');
        // Handle both _id and id formats from the API
        const productId = data._id || data.id;
        if (productId) {
          navigate(`/products/${productId}`);
        } else {
          console.error('Product created but no ID returned:', data);
          setError('Product created but could not retrieve product ID');
          navigate('/products');
        }
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to create product';
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
    }
  );
  
  // Update product mutation
  const updateProductMutation = useMutation(
    (data) => productService.updateProduct(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product', id]);
        queryClient.invalidateQueries('products');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to update product';
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
    }
  );
  
  // Delete product mutation
  const deleteProductMutation = useMutation(
    () => productService.deleteProduct(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        navigate('/products');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete product';
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
    }
  );
  
  // Upload document mutation
  const uploadDocumentMutation = useMutation(
    (file) => productService.uploadDocument(id, file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product', id]);
        setUploadingFile(false);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to upload document';
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        setUploadingFile(false);
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
  
  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()]
      });
      setFeatureInput('');
    }
  };
  
  const handleRemoveFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };
  
  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, benefitInput.trim()]
      });
      setBenefitInput('');
    }
  };
  
  const handleRemoveBenefit = (index) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index)
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format the data to match the backend expectations
    const formattedData = {
      ...formData,
      // Convert string features to Feature objects
      features: formData.features.map(featureStr => ({
        name: featureStr,
        description: featureStr,
        benefits: {
          "executive": [],
          "technical": [],
          "finance": [],
          "marketing": [],
          "sales": [],
          "operations": []
        }
      }))
    };
    
    if (isNewProduct) {
      createProductMutation.mutate(formattedData);
    } else {
      updateProductMutation.mutate(formattedData);
    }
  };
  
  const handleDeleteProduct = () => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteProductMutation.mutate();
    }
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploadingFile(true);
    uploadDocumentMutation.mutate(file);
  };
  
  if (isLoading && !isNewProduct) {
    return (
      <div className="page-container">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }
  
  if (productError && !isNewProduct) {
    const errorMessage = typeof productError === 'string' 
      ? productError 
      : productError.message || 'Error loading product';
      
    return (
      <div className="page-container">
        <Alert
          type="error"
          title="Error loading product"
          message={errorMessage}
        />
        <div className="mt-4">
          <Button to="/products" variant="secondary" className="flex items-center">
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
            Back to Products
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
        <Button to="/products" variant="secondary" className="flex items-center">
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Back to Products
        </Button>
        
        {!isNewProduct && (
          <div className="flex space-x-2">
            <Button
              variant="danger"
              className="flex items-center"
              onClick={handleDeleteProduct}
              disabled={deleteProductMutation.isLoading}
            >
              {deleteProductMutation.isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
              )}
              Delete
            </Button>
          </div>
        )}
      </div>
      
      {/* Product Form */}
      <Card className="mt-6 p-6">
        <h2 className="text-xl font-semibold mb-4">
          {isNewProduct ? 'Add New Product' : 'Product Details'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Name
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
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="form-textarea block w-full"
                required
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Features
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  className="form-input block w-full"
                  placeholder="Add a feature"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="ml-2"
                  onClick={handleAddFeature}
                >
                  Add
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span>{feature}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Benefits
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  className="form-input block w-full"
                  placeholder="Add a benefit"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="ml-2"
                  onClick={handleAddBenefit}
                >
                  Add
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span>{benefit}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveBenefit(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              className="ml-3"
              disabled={createProductMutation.isLoading || updateProductMutation.isLoading}
            >
              {createProductMutation.isLoading || updateProductMutation.isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : isNewProduct ? 'Create Product' : 'Update Product'}
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Only show documentation section if not a new product */}
      {!isNewProduct && product && (
        <Card className="mt-6 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Documentation</h2>
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt"
              />
              <label
                htmlFor="file-upload"
                className={`btn btn-primary flex items-center cursor-pointer ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
                    Upload Document
                  </>
                )}
              </label>
            </div>
          </div>
          
          {product.documentation_urls?.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No documentation uploaded yet. Upload PDF, DOCX, or TXT files.
            </div>
          ) : (
            <div className="space-y-4">
              {product.documentation_urls?.map((url, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{url.split('/').pop()}</span>
                  </div>
                  <div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center"
                      as="a"
                      href={url}
                      target="_blank"
                    >
                      <DocumentPlusIcon className="-ml-1 mr-1 h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ProductDetailPage;
