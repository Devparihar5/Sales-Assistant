import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon, 
  CubeIcon, 
  ChatBubbleLeftRightIcon, 
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { clientService } from '../services/clientService';
import { productService } from '../services/productService';
import { messageService } from '../services/messageService';
import Card from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  // Fetch data
  const { data: clients } = useQuery('clients', () => clientService.getClients());
  const { data: products } = useQuery('products', () => productService.getProducts());
  const { data: messages } = useQuery('messages', () => messageService.getMessages());
  
  // Debug data
  React.useEffect(() => {
    if (clients && products && messages) {
      console.log('Dashboard data loaded:');
      console.log('Clients:', clients);
      console.log('Products:', products);
      console.log('Messages:', messages);
      
      // Check for ID format issues
      if (messages.length > 0) {
        const firstMessage = messages[0];
        console.log('First message client_id:', firstMessage.client_id);
        console.log('First message product_id:', firstMessage.product_id);
        
        const matchingClient = clients.find(c => 
          (c.id === firstMessage.client_id) || 
          (c._id === firstMessage.client_id) ||
          (firstMessage.client_id && c.id === firstMessage.client_id.toString())
        );
        
        const matchingProduct = products.find(p => 
          (p.id === firstMessage.product_id) || 
          (p._id === firstMessage.product_id) ||
          (firstMessage.product_id && p.id === firstMessage.product_id.toString())
        );
        
        console.log('Matching client:', matchingClient);
        console.log('Matching product:', matchingProduct);
      }
    }
  }, [clients, products, messages]);
  
  // Helper functions to find clients and products by ID
  const findClientById = (clientId) => {
    return clients?.find(c => 
      (c.id === clientId) || 
      (c._id === clientId) ||
      (clientId && c.id === clientId.toString()) ||
      (clientId && c._id === clientId.toString())
    );
  };
  
  const findProductById = (productId) => {
    return products?.find(p => 
      (p.id === productId) || 
      (p._id === productId) ||
      (productId && p.id === productId.toString()) ||
      (productId && p._id === productId.toString())
    );
  };
  
  // Function to calculate percentage change
  const calculatePercentageChange = (currentValue, previousValue) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    const change = ((currentValue - previousValue) / previousValue) * 100;
    return change;
  };
  
  // Function to format percentage change
  const formatPercentageChange = (change) => {
    const formattedChange = Math.abs(Math.round(change));
    return `${formattedChange}%`;
  };
  
  // Calculate stats for current month and previous month
  const [statsData, setStatsData] = useState({
    clients: { current: 0, previous: 0, change: 0, changeType: 'neutral' },
    products: { current: 0, previous: 0, change: 0, changeType: 'neutral' },
    messages: { current: 0, previous: 0, change: 0, changeType: 'neutral' },
    documents: { current: 0, previous: 0, change: 0, changeType: 'neutral' }
  });
  
  useEffect(() => {
    if (clients && products && messages) {
      // Get current date and previous month date
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      // Calculate client stats
      const currentClients = clients.filter(client => 
        new Date(client.created_at) >= currentMonthStart
      ).length;
      
      const previousClients = clients.filter(client => 
        new Date(client.created_at) >= previousMonthStart && 
        new Date(client.created_at) < currentMonthStart
      ).length;
      
      const clientChange = calculatePercentageChange(currentClients, previousClients);
      
      // Calculate product stats
      const currentProducts = products.filter(product => 
        new Date(product.created_at) >= currentMonthStart
      ).length;
      
      const previousProducts = products.filter(product => 
        new Date(product.created_at) >= previousMonthStart && 
        new Date(product.created_at) < currentMonthStart
      ).length;
      
      const productChange = calculatePercentageChange(currentProducts, previousProducts);
      
      // Calculate message stats
      const currentMessages = messages.filter(message => 
        new Date(message.created_at) >= currentMonthStart
      ).length;
      
      const previousMessages = messages.filter(message => 
        new Date(message.created_at) >= previousMonthStart && 
        new Date(message.created_at) < currentMonthStart
      ).length;
      
      const messageChange = calculatePercentageChange(currentMessages, previousMessages);
      
      // Calculate document stats
      const currentDocs = products
        .filter(product => new Date(product.created_at) >= currentMonthStart)
        .reduce((acc, product) => acc + (product.documentation_urls?.length || 0), 0);
      
      const previousDocs = products
        .filter(product => 
          new Date(product.created_at) >= previousMonthStart && 
          new Date(product.created_at) < currentMonthStart
        )
        .reduce((acc, product) => acc + (product.documentation_urls?.length || 0), 0);
      
      const docChange = calculatePercentageChange(currentDocs, previousDocs);
      
      // Update stats data
      setStatsData({
        clients: { 
          current: clients.length, 
          previous: previousClients, 
          change: clientChange, 
          changeType: clientChange >= 0 ? 'increase' : 'decrease' 
        },
        products: { 
          current: products.length, 
          previous: previousProducts, 
          change: productChange, 
          changeType: productChange >= 0 ? 'increase' : 'decrease' 
        },
        messages: { 
          current: messages.length, 
          previous: previousMessages, 
          change: messageChange, 
          changeType: messageChange >= 0 ? 'increase' : 'decrease' 
        },
        documents: { 
          current: products?.reduce((acc, product) => acc + (product.documentation_urls?.length || 0), 0) || 0, 
          previous: previousDocs, 
          change: docChange, 
          changeType: docChange >= 0 ? 'increase' : 'decrease' 
        }
      });
    }
  }, [clients, products, messages]);
  
  // Stats cards data
  const stats = [
    {
      name: 'Total Clients',
      value: statsData.clients.current,
      icon: UserGroupIcon,
      change: formatPercentageChange(statsData.clients.change),
      changeType: statsData.clients.changeType,
      to: '/clients',
    },
    {
      name: 'Total Products',
      value: statsData.products.current,
      icon: CubeIcon,
      change: formatPercentageChange(statsData.products.change),
      changeType: statsData.products.changeType,
      to: '/products',
    },
    {
      name: 'Messages Generated',
      value: statsData.messages.current,
      icon: ChatBubbleLeftRightIcon,
      change: formatPercentageChange(statsData.messages.change),
      changeType: statsData.messages.changeType,
      to: '/messages',
    },
    {
      name: 'Documents Processed',
      value: statsData.documents.current,
      icon: DocumentTextIcon,
      change: formatPercentageChange(statsData.documents.change),
      changeType: statsData.documents.changeType,
      to: '/products',
    },
  ];
  
  // Chart data
  const messagesByTypeData = {
    labels: ['Email', 'LinkedIn'],
    datasets: [
      {
        data: [
          messages?.filter(m => m.message_type === 'email').length || 0,
          messages?.filter(m => m.message_type === 'linkedin').length || 0,
        ],
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)',
          'rgba(79, 70, 229, 0.8)',
        ],
        borderColor: [
          'rgba(14, 165, 233, 1)',
          'rgba(79, 70, 229, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const messagesByRoleData = {
    labels: ['Executive', 'Technical', 'Finance', 'Marketing', 'Sales', 'Operations'],
    datasets: [
      {
        label: 'Messages by Client Role',
        data: [
          messages?.filter(m => {
            const client = findClientById(m.client_id);
            return client?.role_category === 'executive';
          }).length || 0,
          messages?.filter(m => {
            const client = findClientById(m.client_id);
            return client?.role_category === 'technical';
          }).length || 0,
          messages?.filter(m => {
            const client = findClientById(m.client_id);
            return client?.role_category === 'finance';
          }).length || 0,
          messages?.filter(m => {
            const client = findClientById(m.client_id);
            return client?.role_category === 'marketing';
          }).length || 0,
          messages?.filter(m => {
            const client = findClientById(m.client_id);
            return client?.role_category === 'sales';
          }).length || 0,
          messages?.filter(m => {
            const client = findClientById(m.client_id);
            return client?.role_category === 'operations';
          }).length || 0,
        ],
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        },
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        },
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };
  
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        },
      },
    },
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome back, {user?.full_name}! Here's an overview of your sales assistant activity.
        </p>
      </div>
      
      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.to}>
            <Card className="px-4 py-5 sm:p-6 hover:transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900/30 rounded-md p-3">
                  <stat.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.name}</dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                      <div className={`flex items-baseline text-sm ${
                        stat.changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 
                        stat.changeType === 'decrease' ? 'text-red-600 dark:text-red-400' : 
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {stat.changeType === 'increase' ? (
                          <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500 dark:text-green-400" aria-hidden="true" />
                        ) : stat.changeType === 'decrease' ? (
                          <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500 dark:text-red-400" aria-hidden="true" />
                        ) : (
                          <span className="self-center flex-shrink-0 h-4 w-4">―</span>
                        )}
                        <span className="ml-1">{stat.change}</span>
                        <span className="ml-1 text-gray-500 dark:text-gray-400">from last month</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      
      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Messages by Client Role</h2>
          <div className="h-64">
            <Bar data={messagesByRoleData} options={chartOptions} />
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Messages by Type</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48">
              <Doughnut data={messagesByTypeData} options={doughnutOptions} />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Recent activity */}
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Messages</h2>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Client</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {messages?.slice(0, 5).map((message) => {
                  const client = findClientById(message.client_id);
                  const product = findProductById(message.product_id);
                  
                  return (
                    <tr key={message.id || message._id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                        {client?.name || 'Unknown Client'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {product?.name || 'Unknown Product'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {message.message_type === 'email' ? 'Email' : 'LinkedIn'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(message.created_at).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          message.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          message.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {message.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!messages || messages.length === 0) && (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No messages found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <Link to="/messages" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
              View all messages →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
