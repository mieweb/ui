'use client';

import * as React from 'react';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';
import { Avatar } from '../Avatar/Avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs/Tabs';

export interface EmployerContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export interface EmployerAddress {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface EmployerOrder {
  id: string;
  orderNumber: string;
  patientName: string;
  services: string[];
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  createdDate: Date | string;
  scheduledDate?: Date | string;
}

export interface EmployerInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date | string;
  paidDate?: Date | string;
}

export interface EmployerDetails {
  id: string;
  name: string;
  logoUrl?: string;
  status: 'active' | 'inactive' | 'pending';
  linkedDate: Date | string;
  address?: EmployerAddress;
  contacts: EmployerContact[];
  recentOrders: EmployerOrder[];
  recentInvoices: EmployerInvoice[];
  stats?: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    outstandingBalance: number;
  };
}

export interface EmployerViewProps {
  /** Employer data to display */
  employer: EmployerDetails;
  /** Handler for editing employer */
  onEdit?: () => void;
  /** Handler for contacting employer */
  onContact?: (contact: EmployerContact) => void;
  /** Handler for viewing order */
  onViewOrder?: (order: EmployerOrder) => void;
  /** Handler for viewing invoice */
  onViewInvoice?: (invoice: EmployerInvoice) => void;
  /** Handler for creating new order */
  onCreateOrder?: () => void;
  /** Handler for creating new invoice */
  onCreateInvoice?: () => void;
  /** Whether the view is loading */
  isLoading?: boolean;
  /** Default active tab */
  defaultTab?: 'overview' | 'orders' | 'invoices' | 'contacts';
  /** Additional CSS classes */
  className?: string;
}

/**
 * EmployerView displays detailed employer information with tabs for orders, invoices, and contacts.
 */
export function EmployerView({
  employer,
  onEdit,
  onContact,
  onViewOrder,
  onViewInvoice,
  onCreateOrder,
  onCreateInvoice,
  isLoading = false,
  defaultTab = 'overview',
  className = '',
}: EmployerViewProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'paid':
        return 'success';
      case 'pending':
      case 'scheduled':
      case 'draft':
      case 'sent':
        return 'warning';
      case 'inactive':
      case 'cancelled':
      case 'overdue':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 animate-pulse ${className}`}>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {employer.logoUrl ? (
                <img
                  src={employer.logoUrl}
                  alt={employer.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                    {employer.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {employer.name}
                  </h1>
                  <Badge variant={getStatusVariant(employer.status)}>
                    {employer.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Linked since {formatDate(employer.linkedDate)}
                </p>
                {employer.address && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {employer.address.city}, {employer.address.state}
                  </p>
                )}
              </div>
            </div>
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                Edit Employer
              </Button>
            )}
          </div>

          {/* Stats */}
          {employer.stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {employer.stats.totalOrders}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Orders
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {employer.stats.completedOrders}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Completed
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {employer.stats.pendingOrders}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pending
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(employer.stats.totalRevenue)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Revenue
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(employer.stats.outstandingBalance)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Outstanding
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Address Card */}
            {employer.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <address className="not-italic text-gray-700 dark:text-gray-300">
                    {employer.address.street}
                    {employer.address.street2 && (
                      <>
                        <br />
                        {employer.address.street2}
                      </>
                    )}
                    <br />
                    {employer.address.city}, {employer.address.state}{' '}
                    {employer.address.zip}
                  </address>
                </CardContent>
              </Card>
            )}

            {/* Primary Contact Card */}
            {employer.contacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Primary Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const primary =
                      employer.contacts.find((c) => c.isPrimary) ||
                      employer.contacts[0];
                    return (
                      <div className="flex items-center gap-3">
                        <Avatar name={primary.name} size="md" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {primary.name}
                          </p>
                          {primary.role && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {primary.role}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {primary.email}
                          </p>
                        </div>
                        {onContact && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onContact(primary)}
                          >
                            Contact
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              {onCreateOrder && (
                <Button size="sm" onClick={onCreateOrder}>
                  New Order
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {employer.recentOrders.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No orders yet
                </p>
              ) : (
                <div className="space-y-3">
                  {employer.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {order.patientName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {order.services.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(order.createdDate)}
                        </p>
                      </div>
                      {onViewOrder && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewOrder(order)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Invoices</CardTitle>
              {onCreateInvoice && (
                <Button size="sm" onClick={onCreateInvoice}>
                  New Invoice
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {employer.recentInvoices.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No invoices yet
                </p>
              ) : (
                <div className="space-y-3">
                  {employer.recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Due: {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(invoice.amount)}
                        </p>
                        <Badge variant={getStatusVariant(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      {onViewInvoice && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewInvoice(invoice)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {employer.contacts.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No contacts added
                </p>
              ) : (
                <div className="space-y-4">
                  {employer.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={contact.name} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {contact.name}
                            </p>
                            {contact.isPrimary && (
                              <Badge variant="default">Primary</Badge>
                            )}
                          </div>
                          {contact.role && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {contact.role}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {contact.email}
                          </p>
                          {contact.phone && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {contact.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {onContact && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onContact(contact)}
                        >
                          Contact
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmployerView;
