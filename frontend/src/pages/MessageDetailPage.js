import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeftIcon, 
  TrashIcon, 
  PaperAirplaneIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { messageService } from '../services/messageService';
import { clientService } from '../services/clientService';
import { productService } from '../services/productService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import CopyButton from '../components/ui/CopyButton';
import { stripMarkdown } from '../utils/textUtils';

const MessageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [clientResponse, setClientResponse] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  
  // Fetch message data
  const { 
    data: message, 
    isLoading: isLoadingMessage, 
    error: messageError 
  } = useQuery(['message', id], () => messageService.getMessage(id), {
    onSuccess: (data) => {
      setEditedContent(data.content);
      setEditedSubject(data.subject || '');
    },
    retry: 1,
    onError: (error) => {
      console.error('Error fetching message:', error);
    }
  });
  
  // Get client and product IDs from message or embedded objects
  const clientId = message?.client?._id || message?.client?.id || message?.client_id;
  const productId = message?.product?._id || message?.product?.id || message?.product_id;
  
  // Fetch client and product data
  const { data: client } = useQuery(
    ['client', clientId],
    () => {
      console.log(`Fetching client with ID: ${clientId}`);
      return clientService.getClient(clientId);
    },
    { 
      enabled: !!clientId,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching client:', error);
      }
    }
  );
  
  const { data: product } = useQuery(
    ['product', productId],
    () => {
      console.log(`Fetching product with ID: ${productId}`);
      return productService.getProduct(productId);
    },
    { 
      enabled: !!productId,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching product:', error);
      }
    }
  );
  
  // Delete message mutation
  const deleteMessageMutation = useMutation(
    () => messageService.deleteMessage(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('messages');
        navigate('/messages');
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'Failed to delete message');
      }
    }
  );
  
  // Update message mutation
  const updateMessageMutation = useMutation(
    (data) => messageService.updateMessage(id, data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['message', id]);
        setIsEditing(false);
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'Failed to update message');
      }
    }
  );
  
  // Record client response mutation
  const recordResponseMutation = useMutation(
    (responseContent) => messageService.recordClientResponse(id, responseContent),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['message', id]);
        setClientResponse('');
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'Failed to record client response');
      }
    }
  );
  
  // Mark message as sent mutation
  const markAsSentMutation = useMutation(
    () => messageService.updateMessage(id, { status: 'sent' }),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['message', id]);
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'Failed to mark message as sent');
      }
    }
  );
  
  const handleDeleteMessage = () => {
    if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      deleteMessageMutation.mutate();
    }
  };
  
  const handleSaveEdits = () => {
    updateMessageMutation.mutate({
      content: editedContent,
      subject: message.message_type === 'email' ? editedSubject : undefined
    });
  };
  
  const handleRecordResponse = () => {
    if (clientResponse.trim()) {
      recordResponseMutation.mutate(clientResponse);
    }
  };
  
  const handleMarkAsSent = () => {
    markAsSentMutation.mutate();
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
  
  const getClientResponseSentiment = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return { variant: 'success', label: 'Positive' };
      case 'neutral':
        return { variant: 'info', label: 'Neutral' };
      case 'negative':
        return { variant: 'danger', label: 'Negative' };
      default:
        return { variant: 'default', label: 'Unknown' };
    }
  };
  
  if (isLoadingMessage) {
    return (
      <div className="page-container">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }
  
  if (messageError) {
    return (
      <div className="page-container">
        <Alert
          type="error"
          title="Error loading message"
          message={messageError.message}
        />
        <div className="mt-4">
          <Button to="/messages" variant="secondary" className="flex items-center">
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
            Back to Messages
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
        <Button to="/messages" variant="secondary" className="flex items-center">
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Back to Messages
        </Button>
        
        <div className="flex space-x-2">
          {message.status === 'draft' && (
            <Button
              variant="primary"
              className="flex items-center"
              onClick={handleMarkAsSent}
              disabled={markAsSentMutation.isLoading}
            >
              {markAsSentMutation.isLoading ? (
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
              ) : (
                <PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" />
              )}
              Mark as Sent
            </Button>
          )}
          
          {!isEditing ? (
            <Button
              variant="secondary"
              className="flex items-center"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon className="-ml-1 mr-2 h-5 w-5" />
              Edit
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="flex items-center"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          )}
          
          <Button
            variant="danger"
            className="flex items-center"
            onClick={handleDeleteMessage}
            disabled={deleteMessageMutation.isLoading}
          >
            {deleteMessageMutation.isLoading ? (
              <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
            ) : (
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
            )}
            Delete
          </Button>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Message content */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  {message.message_type === 'email' ? (
                    <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {message.message_type === 'email' ? 'Email Message' : 'LinkedIn Message'}
                  </h2>
                  <div className="flex items-center mt-1">
                    <Badge variant={getMessageStatusBadgeVariant(message.status)}>
                      {message.status}
                    </Badge>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {isEditing && (
                <Button
                  onClick={handleSaveEdits}
                  disabled={updateMessageMutation.isLoading}
                >
                  {updateMessageMutation.isLoading ? (
                    <>
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </Button>
              )}
            </div>
            
            {message.message_type === 'email' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-gray-900 dark:text-white flex justify-between items-center">
                    <span>{message.subject}</span>
                    <CopyButton text={message.subject} tooltip="Copy subject" />
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
              </label>
              {isEditing ? (
                <textarea
                  className="form-input font-mono"
                  rows={12}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
              ) : (
                <div className="relative">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-gray-900 dark:text-white whitespace-pre-wrap">
                    {stripMarkdown(message.content)}
                  </div>
                  <div className="absolute top-2 right-2">
                    <CopyButton text={stripMarkdown(message.content)} tooltip="Copy content" />
                  </div>
                </div>
              )}
            </div>
            
            {message.status === 'sent' && !message.client_response && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Record Client Response
                </h3>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Enter the client's response here..."
                  value={clientResponse}
                  onChange={(e) => setClientResponse(e.target.value)}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={handleRecordResponse}
                    disabled={!clientResponse.trim() || recordResponseMutation.isLoading}
                  >
                    {recordResponseMutation.isLoading ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Recording...
                      </>
                    ) : 'Record Response'}
                  </Button>
                </div>
              </div>
            )}
            
            {message.client_response && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Client Response
                </h3>
                <div className="relative">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-gray-900 dark:text-white whitespace-pre-wrap">
                    {message.client_response.content}
                  </div>
                  <div className="absolute top-2 right-2">
                    <CopyButton text={message.client_response.content} tooltip="Copy response" />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Response Analysis
                  </h4>
                  
                  {message.client_response.analysis && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sentiment</span>
                          <Badge variant={getClientResponseSentiment(message.client_response.analysis.sentiment).variant}>
                            {getClientResponseSentiment(message.client_response.analysis.sentiment).label}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Interest Level</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {message.client_response.analysis.interest_level}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Questions/Concerns</span>
                        <ul className="mt-1 text-sm text-gray-500 dark:text-gray-400 list-disc list-inside">
                          {message.client_response.analysis.questions?.map((question, index) => (
                            <li key={index}>{question}</li>
                          ))}
                          {message.client_response.analysis.questions?.length === 0 && (
                            <li>No specific questions identified</li>
                          )}
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md sm:col-span-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested Next Steps</span>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {message.client_response.analysis.next_steps}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      to={`/messages/generate?follow_up=true&previous_message=${message._id || message.id}`}
                      className="flex items-center"
                    >
                      <ChatBubbleLeftRightIcon className="-ml-1 mr-2 h-5 w-5" />
                      Create Follow-up
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
        
        {/* Client and product info */}
        <div className="lg:col-span-1">
          {client && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Client Information
              </h3>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-medium text-lg">
                    {client.name.charAt(0)}
                  </span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {client.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {client.position} at {client.company}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{client.email}</dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                    <dd className="text-sm text-gray-900 dark:text-white capitalize">{client.role_category}</dd>
                  </div>
                  {client.phone && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{client.phone}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="mt-4">
                <Button
                  to={`/clients/${message?.client?._id || message?.client?.id || client?._id || client?.id || message?.client_id}`}
                  variant="secondary"
                  className="w-full"
                >
                  View Client Profile
                </Button>
              </div>
            </Card>
          )}
          
          {product && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Product Information
              </h3>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </h4>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {product.description}
                </p>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Features
                </h4>
                <ul className="mt-2 space-y-2">
                  {product.features?.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{feature.name}:</span> {feature.description}
                    </li>
                  ))}
                  {product.features?.length === 0 && (
                    <li className="text-sm text-gray-500 dark:text-gray-400">
                      No features specified
                    </li>
                  )}
                </ul>
              </div>
              <div className="mt-4">
                <Button
                  to={`/products/${message?.product?._id || message?.product?.id || product?._id || product?.id || message?.product_id}`}
                  variant="secondary"
                  className="w-full"
                >
                  View Product Details
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageDetailPage;
