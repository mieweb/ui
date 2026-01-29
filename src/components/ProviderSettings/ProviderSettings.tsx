'use client';

import * as React from 'react';
import { Button } from '../Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';
import { Input } from '../Input/Input';
import { Textarea } from '../Textarea/Textarea';
import { Switch } from '../Switch/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs/Tabs';
import { Badge } from '../Badge/Badge';

export interface ProviderSettingsData {
  /** General settings */
  general: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    website?: string;
    npi?: string;
    taxId?: string;
  };
  /** Address settings */
  address: {
    street: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  /** Notification preferences */
  notifications: {
    emailNewOrders: boolean;
    emailOrderUpdates: boolean;
    emailInvoices: boolean;
    smsNewOrders: boolean;
    smsOrderUpdates: boolean;
  };
  /** Scheduling settings */
  scheduling: {
    acceptingNewPatients: boolean;
    requireAppointment: boolean;
    appointmentBuffer: number; // minutes
    maxDailyAppointments: number;
  };
  /** Payment settings */
  payments: {
    acceptsCreditCard: boolean;
    acceptsACH: boolean;
    acceptsCash: boolean;
    acceptsCheck: boolean;
    paymentTerms: number; // days
  };
}

export interface ProviderSettingsProps {
  /** Current settings data */
  settings: ProviderSettingsData;
  /** Handler for saving settings */
  onSave?: (settings: ProviderSettingsData) => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Whether settings are loading */
  isLoading?: boolean;
  /** Default active tab */
  defaultTab?: 'general' | 'notifications' | 'scheduling' | 'payments';
  /** Additional CSS classes */
  className?: string;
}

/**
 * ProviderSettings displays and manages provider configuration settings.
 */
export function ProviderSettings({
  settings: initialSettings,
  onSave,
  isSaving = false,
  isLoading = false,
  defaultTab = 'general',
  className = '',
}: ProviderSettingsProps) {
  const [settings, setSettings] =
    React.useState<ProviderSettingsData>(initialSettings);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setSettings(initialSettings);
    setHasChanges(false);
  }, [initialSettings]);

  const updateGeneral = <K extends keyof ProviderSettingsData['general']>(
    field: K,
    value: ProviderSettingsData['general'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateAddress = <K extends keyof ProviderSettingsData['address']>(
    field: K,
    value: ProviderSettingsData['address'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateNotifications = <
    K extends keyof ProviderSettingsData['notifications']
  >(
    field: K,
    value: ProviderSettingsData['notifications'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateScheduling = <K extends keyof ProviderSettingsData['scheduling']>(
    field: K,
    value: ProviderSettingsData['scheduling'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      scheduling: { ...prev.scheduling, [field]: value },
    }));
    setHasChanges(true);
  };

  const updatePayments = <K extends keyof ProviderSettingsData['payments']>(
    field: K,
    value: ProviderSettingsData['payments'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      payments: { ...prev.payments, [field]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(settings);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 animate-pulse ${className}`}>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Provider Settings
        </h1>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="warning">Unsaved changes</Badge>
          )}
          {onSave && (
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Provider Name
                  </label>
                  <Input
                    value={settings.general.name}
                    onChange={(e) => updateGeneral('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={settings.general.description || ''}
                    onChange={(e) =>
                      updateGeneral('description', e.target.value)
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      NPI Number
                    </label>
                    <Input
                      value={settings.general.npi || ''}
                      onChange={(e) => updateGeneral('npi', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax ID
                    </label>
                    <Input
                      value={settings.general.taxId || ''}
                      onChange={(e) => updateGeneral('taxId', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={settings.general.phone || ''}
                    onChange={(e) => updateGeneral('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={settings.general.email || ''}
                    onChange={(e) => updateGeneral('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={settings.general.website || ''}
                    onChange={(e) => updateGeneral('website', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address
                    </label>
                    <Input
                      value={settings.address.street}
                      onChange={(e) => updateAddress('street', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address 2
                    </label>
                    <Input
                      value={settings.address.street2 || ''}
                      onChange={(e) => updateAddress('street2', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <Input
                      value={settings.address.city}
                      onChange={(e) => updateAddress('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <Input
                      value={settings.address.state}
                      onChange={(e) => updateAddress('state', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ZIP Code
                    </label>
                    <Input
                      value={settings.address.zip}
                      onChange={(e) => updateAddress('zip', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <Input
                      value={settings.address.country || 'USA'}
                      onChange={(e) => updateAddress('country', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Email Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        New Orders
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive email when a new order is placed
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.emailNewOrders}
                      onCheckedChange={(checked) =>
                        updateNotifications('emailNewOrders', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        Order Updates
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive email when an order status changes
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.emailOrderUpdates}
                      onCheckedChange={(checked) =>
                        updateNotifications('emailOrderUpdates', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        Invoice Notifications
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive email for invoice activity
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.emailInvoices}
                      onCheckedChange={(checked) =>
                        updateNotifications('emailInvoices', checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  SMS Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        New Orders
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive SMS when a new order is placed
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.smsNewOrders}
                      onCheckedChange={(checked) =>
                        updateNotifications('smsNewOrders', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        Order Updates
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive SMS when an order status changes
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.smsOrderUpdates}
                      onCheckedChange={(checked) =>
                        updateNotifications('smsOrderUpdates', checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scheduling Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      Accepting New Patients
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow new patients to schedule appointments
                    </p>
                  </div>
                  <Switch
                    checked={settings.scheduling.acceptingNewPatients}
                    onCheckedChange={(checked) =>
                      updateScheduling('acceptingNewPatients', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      Require Appointment
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Patients must schedule before arriving
                    </p>
                  </div>
                  <Switch
                    checked={settings.scheduling.requireAppointment}
                    onCheckedChange={(checked) =>
                      updateScheduling('requireAppointment', checked)
                    }
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Appointment Buffer (minutes)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.scheduling.appointmentBuffer}
                    onChange={(e) =>
                      updateScheduling('appointmentBuffer', parseInt(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum time between appointments
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Daily Appointments
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.scheduling.maxDailyAppointments}
                    onChange={(e) =>
                      updateScheduling(
                        'maxDailyAppointments',
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Maximum appointments allowed per day
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Accepted Payment Methods
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-8 h-8 text-gray-600 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Credit Card
                      </span>
                    </div>
                    <Switch
                      checked={settings.payments.acceptsCreditCard}
                      onCheckedChange={(checked) =>
                        updatePayments('acceptsCreditCard', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-8 h-8 text-gray-600 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        ACH / Bank Transfer
                      </span>
                    </div>
                    <Switch
                      checked={settings.payments.acceptsACH}
                      onCheckedChange={(checked) =>
                        updatePayments('acceptsACH', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-8 h-8 text-gray-600 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Cash
                      </span>
                    </div>
                    <Switch
                      checked={settings.payments.acceptsCash}
                      onCheckedChange={(checked) =>
                        updatePayments('acceptsCash', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-8 h-8 text-gray-600 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Check
                      </span>
                    </div>
                    <Switch
                      checked={settings.payments.acceptsCheck}
                      onCheckedChange={(checked) =>
                        updatePayments('acceptsCheck', checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Terms (days)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.payments.paymentTerms}
                    onChange={(e) =>
                      updatePayments('paymentTerms', parseInt(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Number of days until invoice is due (e.g., Net 30)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProviderSettings;
