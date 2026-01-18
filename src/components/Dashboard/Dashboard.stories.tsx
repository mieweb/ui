import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

// Import components
import { Alert } from '../Alert';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../Card';
import { DateInput } from '../DateInput';
import { Dropdown, DropdownItem } from '../Dropdown';
import { Input } from '../Input';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../Tabs';
import { Select } from '../Select';
import { Checkbox, CheckboxGroup } from '../Checkbox';
import { RadioGroup, Radio } from '../Radio';
import { Switch } from '../Switch';
import { Textarea } from '../Textarea';
import { Progress, CircularProgress } from '../Progress';
import { Skeleton, SkeletonText, SkeletonCard } from '../Skeleton';
import { Spinner, SpinnerWithLabel } from '../Spinner';
import { Breadcrumb } from '../Breadcrumb';
import { Pagination, SimplePagination } from '../Pagination';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../Table';
import { Text } from '../Text';
import { Tooltip } from '../Tooltip';
import { QuickAction, QuickActionGroup } from '../QuickAction';
import { PhoneInput } from '../PhoneInput';
import { ThemeProvider } from '../ThemeProvider';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta = {
  title: 'Examples/Dashboard',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// ============================================================================
// Dashboard Story Component
// ============================================================================

function DashboardStory() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div className="bg-background min-h-screen p-6">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <Text as="h1" size="3xl" weight="bold">
            Dashboard
          </Text>
          <Breadcrumb
            items={[
              { label: 'Home', href: '#' },
              { label: 'Admin', href: '#' },
              { label: 'Dashboard' },
            ]}
          />
        </div>
        <div className="flex items-center gap-4">
          <Dropdown
            trigger={
              <Button variant="ghost" size="icon">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </Button>
            }
          >
            <DropdownItem>New notification</DropdownItem>
            <DropdownItem>View all notifications</DropdownItem>
          </Dropdown>
          <Avatar
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop"
            alt="User avatar"
            size="md"
          />
        </div>
      </header>

      {/* Alert */}
      <Alert variant="info" className="mb-6">
        <strong>Welcome back!</strong> You have 3 new notifications.
      </Alert>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <Text size="3xl" weight="bold">
              $45,231.89
            </Text>
            <Badge variant="success" className="mt-2">
              +20.1% from last month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <Text size="3xl" weight="bold">
              +2,350
            </Text>
            <Badge variant="success" className="mt-2">
              +180.1% from last month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sales</CardDescription>
          </CardHeader>
          <CardContent>
            <Text size="3xl" weight="bold">
              +12,234
            </Text>
            <Badge variant="success" className="mt-2">
              +19% from last month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Now</CardDescription>
          </CardHeader>
          <CardContent>
            <Text size="3xl" weight="bold">
              +573
            </Text>
            <Badge variant="warning" className="mt-2">
              +201 since last hour
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Settings</CardTitle>
            <CardDescription>
              Update your account settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="First Name" placeholder="John" />
                  <Input label="Last Name" placeholder="Doe" />
                </div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                />
                <Select
                  label="Role"
                  placeholder="Select role"
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'moderator', label: 'Moderator' },
                    { value: 'user', label: 'User' },
                  ]}
                />
                <DateInput label="Date of Birth" />
                <Textarea
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  maxLength={200}
                />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Text weight="medium">Email Notifications</Text>
                    <Text size="sm" className="text-muted-foreground">
                      Receive email updates
                    </Text>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Text weight="medium">Push Notifications</Text>
                    <Text size="sm" className="text-muted-foreground">
                      Receive push updates
                    </Text>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Text weight="medium">SMS Notifications</Text>
                    <Text size="sm" className="text-muted-foreground">
                      Receive text messages
                    </Text>
                  </div>
                  <Switch />
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="Enter current password"
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm new password"
                />
                <CheckboxGroup label="Two-Factor Authentication">
                  <Checkbox value="sms">SMS</Checkbox>
                  <Checkbox value="authenticator">Authenticator App</Checkbox>
                  <Checkbox value="email">Email</Checkbox>
                </CheckboxGroup>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        {/* Right Column - Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                user: 'John Doe',
                action: 'updated profile',
                time: '2 minutes ago',
              },
              {
                user: 'Jane Smith',
                action: 'added new project',
                time: '1 hour ago',
              },
              {
                user: 'Bob Johnson',
                action: 'completed task',
                time: '3 hours ago',
              },
              {
                user: 'Alice Brown',
                action: 'left a comment',
                time: '5 hours ago',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <Avatar name={item.user} size="sm" />
                <div className="flex-1">
                  <Text size="sm" weight="medium">
                    {item.user}
                  </Text>
                  <Text size="xs" className="text-muted-foreground">
                    {item.action}
                  </Text>
                </div>
                <Text size="xs" className="text-muted-foreground">
                  {item.time}
                </Text>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>A list of recent orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  id: 'ORD-001',
                  customer: 'John Doe',
                  status: 'completed',
                  amount: '$250.00',
                },
                {
                  id: 'ORD-002',
                  customer: 'Jane Smith',
                  status: 'pending',
                  amount: '$150.00',
                },
                {
                  id: 'ORD-003',
                  customer: 'Bob Johnson',
                  status: 'cancelled',
                  amount: '$75.00',
                },
              ].map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === 'completed'
                          ? 'success'
                          : order.status === 'pending'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalHeader>
          <ModalTitle>Edit Profile</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <Input label="Name" placeholder="Enter your name" />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setModalOpen(false)}>Save</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export const Dashboard: StoryObj = {
  render: () => <DashboardStory />,
};

// ============================================================================
// Dashboard Dark Story
// ============================================================================

export const DashboardDark: StoryObj = {
  render: () => (
    <ThemeProvider defaultTheme="dark" storageKey="storybook-dashboard-theme">
      <div className="bg-background min-h-screen p-6">
        <Text as="h1" size="3xl" weight="bold" className="mb-6">
          Dark Mode Dashboard
        </Text>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <Text size="3xl" weight="bold">
                $45,231
              </Text>
              <Progress value={75} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Text size="3xl" weight="bold">
                2,350
              </Text>
              <Progress value={60} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <Text size="3xl" weight="bold">
                12,234
              </Text>
              <Progress value={90} className="mt-4" />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActionGroup>
              <QuickAction
                title="Complete Task"
                subtitle="Mark items as done"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                }
                color="green"
              />
              <QuickAction
                title="View Report"
                subtitle="Analytics overview"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                }
                color="blue"
              />
              <QuickAction
                title="Add New"
                subtitle="Create new item"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                }
                color="purple"
              />
            </QuickActionGroup>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  ),
};

// ============================================================================
// All Components Story
// ============================================================================

export const AllComponents: StoryObj = {
  render: () => (
    <div className="bg-background min-h-screen p-8">
      <Text as="h1" size="3xl" weight="bold" className="mb-8">
        Component Showcase
      </Text>

      {/* Alerts */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Alerts
        </Text>
        <div className="space-y-4">
          <Alert variant="info">This is an info alert.</Alert>
          <Alert variant="success">This is a success alert.</Alert>
          <Alert variant="warning">This is a warning alert.</Alert>
          <Alert variant="danger">This is a danger alert.</Alert>
        </div>
      </section>

      {/* Badges */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Badges
        </Text>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Buttons */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Buttons
        </Text>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Form Controls */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Form Controls
        </Text>
        <div className="grid max-w-md gap-4">
          <Input label="Text Input" placeholder="Enter text..." />
          <Input label="With Error" error="This field is required" />
          <Textarea label="Textarea" placeholder="Enter description..." />
          <DateInput label="Date Input" />
          <Select
            label="Select"
            placeholder="Choose an option"
            options={[
              { value: '1', label: 'Option 1' },
              { value: '2', label: 'Option 2' },
              { value: '3', label: 'Option 3' },
            ]}
          />
          <PhoneInput label="Phone" placeholder="(555) 123-4567" />
        </div>
      </section>

      {/* Checkboxes & Radio */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Checkboxes & Radio
        </Text>
        <div className="grid gap-6 md:grid-cols-2">
          <CheckboxGroup label="Interests">
            <Checkbox value="sports">Sports</Checkbox>
            <Checkbox value="music">Music</Checkbox>
            <Checkbox value="art">Art</Checkbox>
          </CheckboxGroup>
          <RadioGroup label="Size" defaultValue="md">
            <Radio value="sm">Small</Radio>
            <Radio value="md">Medium</Radio>
            <Radio value="lg">Large</Radio>
          </RadioGroup>
        </div>
      </section>

      {/* Progress */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Progress
        </Text>
        <div className="space-y-4">
          <Progress value={25} label="25%" />
          <Progress value={50} label="50%" />
          <Progress value={75} label="75%" />
          <div className="flex gap-4">
            <CircularProgress value={25} size="sm" />
            <CircularProgress value={50} size="md" />
            <CircularProgress value={75} size="lg" />
          </div>
        </div>
      </section>

      {/* Spinners */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Spinners
        </Text>
        <div className="flex items-center gap-4">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <SpinnerWithLabel label="Loading..." />
        </div>
      </section>

      {/* Skeleton */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Skeleton
        </Text>
        <div className="max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <SkeletonText lines={3} />
          <SkeletonCard />
        </div>
      </section>

      {/* Tooltips */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Tooltips
        </Text>
        <div className="flex gap-4">
          <Tooltip content="Top tooltip" placement="top">
            <Button variant="outline">Top</Button>
          </Tooltip>
          <Tooltip content="Right tooltip" placement="right">
            <Button variant="outline">Right</Button>
          </Tooltip>
          <Tooltip content="Bottom tooltip" placement="bottom">
            <Button variant="outline">Bottom</Button>
          </Tooltip>
          <Tooltip content="Left tooltip" placement="left">
            <Button variant="outline">Left</Button>
          </Tooltip>
        </div>
      </section>

      {/* Pagination */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Pagination
        </Text>
        <div className="space-y-4">
          <Pagination page={1} totalPages={10} onPageChange={() => {}} />
          <SimplePagination page={1} totalPages={10} onPageChange={() => {}} />
        </div>
      </section>
    </div>
  ),
};

// ============================================================================
// All Components Dark Story
// ============================================================================

export const AllComponentsDark: StoryObj = {
  render: () => (
    <ThemeProvider
      defaultTheme="dark"
      storageKey="storybook-all-components-dark"
    >
      <div className="bg-background min-h-screen p-8">
        <Text as="h1" size="3xl" weight="bold" className="mb-8">
          Component Showcase (Dark)
        </Text>
        <Text className="text-muted-foreground">
          View the AllComponents story for the full showcase.
        </Text>
      </div>
    </ThemeProvider>
  ),
};
