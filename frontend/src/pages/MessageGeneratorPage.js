import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { clientService } from '../services/clientService';
import { productService } from '../services/productService';
import { messageService } from '../services/messageService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import CopyButton from '../components/ui/CopyButton';
import { stripMarkdown } from '../utils/textUtils';
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  DocumentTextIcon, 
  EnvelopeIcon, 
  UserCircleIcon 
} from '@heroicons/react/24/outline';

const MessageGeneratorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedMessage, setGeneratedMessage] = useState(null);
  const [error, setError] = useState(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  
  // Get URL parameters
  const clientIdFromUrl = searchParams.get('client_id');
  const productIdFromUrl = searchParams.get('product_id');
  
  // Set default values from URL parameters
  useEffect(() => {
    if (clientIdFromUrl) {
      setValue('client_id', clientIdFromUrl);
    }
    if (productIdFromUrl) {
      setValue('product_id', productIdFromUrl);
    }
  }, [clientIdFromUrl, productIdFromUrl, setValue]);
  
  // Get form values
  const selectedClientId = watch('client_id');
  const selectedProductId = watch('product_id');
  const messageType = watch('message_type');
  const isFollowUp = watch('is_follow_up');
  const previousMessageId = watch('previous_message_id');
  
  // Get selected client and product objects
  // const selectedClient = selectedClientId ? clients?.find(client => (client._id || client.id) === selectedClientId) : null;
  // const selectedProduct = selectedProductId ? products?.find(product => (product._id || product.id) === selectedProductId) : null;
  
  // Fetch clients and products
  const { data: clients, isLoading: isLoadingClients } = useQuery('clients', () => clientService.getClients());
  const { data: products, isLoading: isLoadingProducts } = useQuery('products', () => productService.getProducts());
  
  // Fetch previous messages if follow-up is selected
  const { data: previousMessages, isLoading: isLoadingPreviousMessages } = useQuery(
    ['previousMessages', selectedClientId],
    () => messageService.getMessages({ client_id: selectedClientId }),
    {
      enabled: !!selectedClientId && isFollowUp,
    }
  );
  
  // Generate message mutation
  const generateMessageMutation = useMutation(
    (data) => messageService.generateMessage(data),
    {
      onSuccess: (data) => {
        setGeneratedMessage(data);
        setCurrentStep(3);
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'Failed to generate message. Please try again.');
      },
    }
  );
  
  // Save message mutation
  const saveMessageMutation = useMutation(
    (data) => {
      const messageId = generatedMessage._id || generatedMessage.id;
      console.log(`Saving message with ID: ${messageId}`, data);
      return messageService.updateMessage(messageId, data);
    },
    {
      onSuccess: (data) => {
        const messageId = data._id || data.id;
        navigate(`/messages/${messageId}`);
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'Failed to save message. Please try again.');
      },
    }
  );
  
  const onSubmit = (data) => {
    console.log('Form data:', data);
    console.log('Client ID:', data.client_id);
    console.log('Product ID:', data.product_id);
    
    if (currentStep === 1) {
      // Move to the next step
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Make sure we're sending valid IDs
      const clientId = data.client_id;
      const productId = data.product_id;
      
      console.log('Client ID before sending:', clientId);
      console.log('Product ID before sending:', productId);
      
      // Validate that we have proper IDs
      if (!clientId || !productId) {
        setError('Invalid client or product selection. Please select valid options.');
        return;
      }
      
      // Check if the client and product exist in our data
      const clientExists = clients?.some(client => (client._id || client.id) === clientId);
      const productExists = products?.some(product => (product._id || product.id) === productId);
      
      if (!clientExists || !productExists) {
        setError('Selected client or product not found. Please go back and select again.');
        return;
      }
      
      generateMessageMutation.mutate({
        client_id: clientId,
        product_id: productId,
        message_type: data.message_type,
        tone: data.tone,
        custom_instructions: data.custom_instructions,
        is_follow_up: data.is_follow_up,
        previous_message_id: data.is_follow_up ? data.previous_message_id : null,
      });
    } else if (currentStep === 3) {
      saveMessageMutation.mutate({
        content: data.content,
        subject: data.subject,
      });
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleRegenerate = () => {
    // Make sure we're sending valid IDs
    const clientId = watch('client_id');
    const productId = watch('product_id');
    
    console.log('Regenerating message with client ID:', clientId);
    console.log('Regenerating message with product ID:', productId);
    
    // Check if the client and product exist in our data
    const clientExists = clients?.some(client => (client._id || client.id) === clientId);
    const productExists = products?.some(product => (product._id || product.id) === productId);
    
    if (!clientExists || !productExists) {
      setError('Selected client or product not found. Please go back and select again.');
      return;
    }
    
    const formData = {
      client_id: clientId,
      product_id: productId,
      message_type: watch('message_type'),
      tone: watch('tone'),
      custom_instructions: watch('custom_instructions'),
      is_follow_up: watch('is_follow_up'),
      previous_message_id: watch('previous_message_id'),
    };
    
    generateMessageMutation.mutate(formData);
  };
  
  // Get selected client and product objects
  const selectedClient = selectedClientId ? clients?.find(client => (client._id || client.id) === selectedClientId) : null;
  const selectedProduct = selectedProductId ? products?.find(product => (product._id || product.id) === selectedProductId) : null;
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Generate Message</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create personalized messages for your clients based on their role and product information.
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
      
      {/* Progress steps */}
      <div className="mt-8 mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center relative">
            <li className={`flex items-center ${currentStep > 1 ? 'text-primary-600 dark:text-primary-400' : 'text-primary-600 dark:text-primary-400'}`}>
              <div className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep > 1 ? 'bg-primary-600 dark:bg-primary-700' : 'bg-primary-600 dark:bg-primary-700'
                }`}>
                  <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <span className="ml-2 text-sm font-medium">Client & Product</span>
              </div>
              <div className="hidden sm:block w-16 h-0.5 mx-3 bg-primary-600 dark:bg-primary-700"></div>
            </li>
            
            <li className={`flex items-center ${currentStep > 2 ? 'text-primary-600 dark:text-primary-400' : currentStep === 2 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
              <div className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep > 2 ? 'bg-primary-600 dark:bg-primary-700' : 
                  currentStep === 2 ? 'bg-primary-600 dark:bg-primary-700' : 
                  'bg-gray-300 dark:bg-gray-700'
                }`}>
                  {currentStep > 2 ? (
                    <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  ) : (
                    <span className="text-white">2</span>
                  )}
                </div>
                <span className="ml-2 text-sm font-medium">Message Options</span>
              </div>
              <div className="hidden sm:block w-16 h-0.5 mx-3 bg-gray-300 dark:bg-gray-700"></div>
            </li>
            
            <li className={`flex items-center ${currentStep === 3 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
              <div className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === 3 ? 'bg-primary-600 dark:bg-primary-700' : 'bg-gray-300 dark:bg-gray-700'
                }`}>
                  <span className="text-white">3</span>
                </div>
                <span className="ml-2 text-sm font-medium">Review & Save</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      
      <Card className="mt-6 p-6 overflow-visible">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Client and Product Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="client_id" className="form-label">Client</label>
                <select
                  id="client_id"
                  className="form-input"
                  disabled={isLoadingClients}
                  {...register('client_id', { required: 'Client is required' })}
                >
                  <option value="">Select a client</option>
                  {clients?.map((client) => (
                    <option key={client._id || client.id} value={client._id || client.id}>
                      {client.name} - {client.company} ({client.role_category})
                    </option>
                  ))}
                </select>
                {errors.client_id && <p className="form-error">{errors.client_id.message}</p>}
              </div>
              
              <div>
                <label htmlFor="product_id" className="form-label">Product</label>
                <select
                  id="product_id"
                  className="form-input"
                  disabled={isLoadingProducts}
                  {...register('product_id', { required: 'Product is required' })}
                >
                  <option value="">Select a product</option>
                  {products?.map((product) => (
                    <option key={product._id || product.id} value={product._id || product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {errors.product_id && <p className="form-error">{errors.product_id.message}</p>}
              </div>
              
              {selectedClient && selectedProduct && (
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                      <h3 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                        {selectedClient.name}
                      </h3>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <p><span className="font-medium">Company:</span> {selectedClient.company}</p>
                      <p><span className="font-medium">Position:</span> {selectedClient.position}</p>
                      <p><span className="font-medium">Role:</span> {selectedClient.role_category}</p>
                      <p><span className="font-medium">Email:</span> {selectedClient.email}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                      <h3 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                        {selectedProduct.name}
                      </h3>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <p>{selectedProduct.description}</p>
                      <p className="mt-2"><span className="font-medium">Features:</span> {selectedProduct.features?.length || 0}</p>
                      <p><span className="font-medium">Documents:</span> {selectedProduct.documentation_urls?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Message Options */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Hidden fields to preserve client and product selection */}
              <input type="hidden" {...register('client_id')} />
              <input type="hidden" {...register('product_id')} />
              <div>
                <label htmlFor="message_type" className="form-label">Message Type</label>
                <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="relative">
                    <input
                      type="radio"
                      id="message_type_email"
                      value="email"
                      className="sr-only"
                      {...register('message_type', { required: 'Message type is required' })}
                    />
                    <label
                      htmlFor="message_type_email"
                      className={`relative block cursor-pointer rounded-lg border ${
                        messageType === 'email' 
                          ? 'border-primary-600 dark:border-primary-400 ring-2 ring-primary-600 dark:ring-primary-400' 
                          : 'border-gray-300 dark:border-gray-700'
                      } bg-white dark:bg-gray-800 px-6 py-4 shadow-sm focus:outline-none`}
                    >
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                          <EnvelopeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                        </div>
                        <div className="ml-4">
                          <span className="block text-sm font-medium text-gray-900 dark:text-white">Email Message</span>
                          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                            Create a formal email with subject line and body
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="message_type_linkedin"
                      value="linkedin"
                      className="sr-only"
                      {...register('message_type')}
                    />
                    <label
                      htmlFor="message_type_linkedin"
                      className={`relative block cursor-pointer rounded-lg border ${
                        messageType === 'linkedin' 
                          ? 'border-primary-600 dark:border-primary-400 ring-2 ring-primary-600 dark:ring-primary-400' 
                          : 'border-gray-300 dark:border-gray-700'
                      } bg-white dark:bg-gray-800 px-6 py-4 shadow-sm focus:outline-none`}
                    >
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                          <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <span className="block text-sm font-medium text-gray-900 dark:text-white">LinkedIn Message</span>
                          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                            Create a concise message optimized for LinkedIn
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                {errors.message_type && <p className="form-error">{errors.message_type.message}</p>}
              </div>
              
              <div>
                <label htmlFor="tone" className="form-label">Message Tone</label>
                <select
                  id="tone"
                  className="form-input"
                  {...register('tone', { required: 'Tone is required' })}
                >
                  <option value="">Select a tone</option>
                  <option value="professional">Professional</option>
                  <option value="technical">Technical</option>
                  <option value="formal">Formal</option>
                </select>
                {errors.tone && <p className="form-error">{errors.tone.message}</p>}
              </div>
              
              <div>
                <div className="flex items-center">
                  <input
                    id="is_follow_up"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                    {...register('is_follow_up')}
                  />
                  <label htmlFor="is_follow_up" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    This is a follow-up message
                  </label>
                </div>
              </div>
              
              {isFollowUp && (
                <div>
                  <label htmlFor="previous_message_id" className="form-label">Previous Message</label>
                  <select
                    id="previous_message_id"
                    className="form-input"
                    disabled={isLoadingPreviousMessages}
                    {...register('previous_message_id', { required: isFollowUp ? 'Previous message is required' : false })}
                  >
                    <option value="">Select a previous message</option>
                    {previousMessages?.map((message) => (
                      <option key={message._id || message.id} value={message._id || message.id}>
                        {message.message_type === 'email' ? `Email: ${message.subject || 'No subject'}` : 'LinkedIn message'} - {new Date(message.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  {errors.previous_message_id && <p className="form-error">{errors.previous_message_id.message}</p>}
                </div>
              )}
              
              <div>
                <label htmlFor="custom_instructions" className="form-label">Custom Instructions (Optional)</label>
                <textarea
                  id="custom_instructions"
                  rows={3}
                  className="form-input"
                  placeholder="Add any specific instructions for message generation"
                  {...register('custom_instructions')}
                />
              </div>
            </div>
          )}
          
          {/* Step 3: Review and Save */}
          {currentStep === 3 && generatedMessage && (
            <div className="space-y-6 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generated Message</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex items-center"
                    onClick={handleRegenerate}
                    disabled={generateMessageMutation.isLoading}
                  >
                    <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${generateMessageMutation.isLoading ? 'animate-spin' : ''}`} />
                    {generateMessageMutation.isLoading ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                </div>
                
                {generatedMessage.message_type === 'email' && (
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center">
                        <label htmlFor="subject" className="form-label">Subject</label>
                        <CopyButton text={generatedMessage.subject} tooltip="Copy subject" />
                      </div>
                      <input
                        type="text"
                        id="subject"
                        className="form-input w-full"
                        defaultValue={generatedMessage.subject}
                        {...register('subject')}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <label htmlFor="content" className="form-label">Email Body</label>
                        <CopyButton 
                          text={stripMarkdown(generatedMessage.content)} 
                          tooltip="Copy email body" 
                        />
                      </div>
                      <textarea
                        id="content"
                        rows={10}
                        className="form-input w-full"
                        defaultValue={stripMarkdown(generatedMessage.content)}
                        {...register('content')}
                      />
                    </div>
                  </div>
                )}
                
                {generatedMessage.message_type === 'linkedin' && (
                  <div>
                    <div className="flex justify-between items-center">
                      <label htmlFor="content" className="form-label">LinkedIn Message</label>
                      <CopyButton 
                        text={stripMarkdown(generatedMessage.content)} 
                        tooltip="Copy LinkedIn message" 
                      />
                    </div>
                    <textarea
                      id="content"
                      rows={8}
                      className="form-input w-full"
                      defaultValue={stripMarkdown(generatedMessage.content)}
                      {...register('content')}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Form buttons */}
          <div className="mt-8 pt-4 flex justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
              >
                Back
              </Button>
            ) : (
              <div></div>
            )}
            
            <div className="flex space-x-3">
              {currentStep === 3 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRegenerate}
                  disabled={generateMessageMutation.isLoading}
                >
                  {generateMessageMutation.isLoading ? (
                    <>
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="-ml-1 mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={
                  currentStep === 2 && generateMessageMutation.isLoading ||
                  currentStep === 3 && saveMessageMutation.isLoading
                }
              >
                {currentStep === 1 && 'Next'}
                {currentStep === 2 && (
                  generateMessageMutation.isLoading ? (
                    <>
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : 'Generate Message'
                )}
                {currentStep === 3 && (
                  saveMessageMutation.isLoading ? (
                    <>
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : 'Save Message'
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MessageGeneratorPage;
