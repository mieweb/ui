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
                  <Checkbox value="sms" label="SMS" />
                  <Checkbox value="authenticator" label="Authenticator App" />
                  <Checkbox value="email" label="Email" />
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
            <Checkbox value="sports" label="Sports" />
            <Checkbox value="music" label="Music" />
            <Checkbox value="art" label="Art" />
          </CheckboxGroup>
          <RadioGroup label="Size" defaultValue="md">
            <Radio value="sm" label="Small" />
            <Radio value="md" label="Medium" />
            <Radio value="lg" label="Large" />
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

      {/* ============================================================ */}
      {/* TYPOGRAPHY SECTION */}
      {/* ============================================================ */}
      <div className="border-border mb-8 border-t pt-8">
        <Text as="h1" size="3xl" weight="bold" className="mb-2">
          Typography
        </Text>
        <Text variant="muted" className="mb-8">
          A comprehensive typography system using the Text component with
          flexible sizing, weights, and semantic variants.
        </Text>
      </div>

      {/* Headings Hierarchy */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Heading Hierarchy
        </Text>
        <Text variant="muted" className="mb-6">
          Use semantic heading elements (h1-h6) with appropriate sizing for
          document structure.
        </Text>
        <div className="bg-muted/30 space-y-4 rounded-lg p-6">
          <Text as="h1" size="3xl" weight="bold">
            Heading 1 — Main Page Title
          </Text>
          <Text as="h2" size="2xl" weight="bold">
            Heading 2 — Section Title
          </Text>
          <Text as="h3" size="xl" weight="semibold">
            Heading 3 — Subsection Title
          </Text>
          <Text as="h4" size="lg" weight="semibold">
            Heading 4 — Card or Panel Title
          </Text>
          <Text as="h5" size="base" weight="semibold">
            Heading 5 — Minor Section
          </Text>
          <Text as="h6" size="sm" weight="semibold">
            Heading 6 — Small Label
          </Text>
        </div>
      </section>

      {/* Font Sizes */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Font Sizes
        </Text>
        <Text variant="muted" className="mb-6">
          Seven size options from xs (12px) to 3xl (30px).
        </Text>
        <div className="bg-muted/30 space-y-3 rounded-lg p-6">
          <div className="border-border flex items-baseline justify-between border-b pb-2">
            <Text size="xs">Extra Small (xs)</Text>
            <Text variant="muted" size="xs">
              text-xs · 12px
            </Text>
          </div>
          <div className="border-border flex items-baseline justify-between border-b pb-2">
            <Text size="sm">Small (sm)</Text>
            <Text variant="muted" size="xs">
              text-sm · 14px
            </Text>
          </div>
          <div className="border-border flex items-baseline justify-between border-b pb-2">
            <Text size="base">Base (base)</Text>
            <Text variant="muted" size="xs">
              text-base · 16px
            </Text>
          </div>
          <div className="border-border flex items-baseline justify-between border-b pb-2">
            <Text size="lg">Large (lg)</Text>
            <Text variant="muted" size="xs">
              text-lg · 18px
            </Text>
          </div>
          <div className="border-border flex items-baseline justify-between border-b pb-2">
            <Text size="xl">Extra Large (xl)</Text>
            <Text variant="muted" size="xs">
              text-xl · 20px
            </Text>
          </div>
          <div className="border-border flex items-baseline justify-between border-b pb-2">
            <Text size="2xl">2X Large (2xl)</Text>
            <Text variant="muted" size="xs">
              text-2xl · 24px
            </Text>
          </div>
          <div className="flex items-baseline justify-between">
            <Text size="3xl">3X Large (3xl)</Text>
            <Text variant="muted" size="xs">
              text-3xl · 30px
            </Text>
          </div>
        </div>
      </section>

      {/* Font Weights */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Font Weights
        </Text>
        <Text variant="muted" className="mb-6">
          Four weight options for visual emphasis and hierarchy.
        </Text>
        <div className="bg-muted/30 rounded-lg p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 text-center">
              <Text size="xl" weight="normal">
                Normal
              </Text>
              <Text variant="muted" size="xs">
                font-normal · 400
              </Text>
            </div>
            <div className="space-y-2 text-center">
              <Text size="xl" weight="medium">
                Medium
              </Text>
              <Text variant="muted" size="xs">
                font-medium · 500
              </Text>
            </div>
            <div className="space-y-2 text-center">
              <Text size="xl" weight="semibold">
                Semibold
              </Text>
              <Text variant="muted" size="xs">
                font-semibold · 600
              </Text>
            </div>
            <div className="space-y-2 text-center">
              <Text size="xl" weight="bold">
                Bold
              </Text>
              <Text variant="muted" size="xs">
                font-bold · 700
              </Text>
            </div>
          </div>
        </div>
      </section>

      {/* Text Variants */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Semantic Variants
        </Text>
        <Text variant="muted" className="mb-6">
          Color variants that convey meaning and adapt to the theme.
        </Text>
        <div className="bg-muted/30 grid gap-4 rounded-lg p-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <Text variant="default" weight="medium">
                Default
              </Text>
              <Text variant="muted" size="sm">
                Standard foreground text color for body content.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <Text variant="muted" weight="medium">
                Muted
              </Text>
              <Text variant="muted" size="sm">
                Secondary text, descriptions, and captions.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <Text variant="primary" weight="medium">
                Primary
              </Text>
              <Text variant="muted" size="sm">
                Brand color for emphasis and links.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <Text variant="success" weight="medium">
                Success
              </Text>
              <Text variant="muted" size="sm">
                Positive states, confirmations, and completed items.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <Text variant="warning" weight="medium">
                Warning
              </Text>
              <Text variant="muted" size="sm">
                Cautionary messages and pending states.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <Text variant="destructive" weight="medium">
                Destructive
              </Text>
              <Text variant="muted" size="sm">
                Errors, deletions, and critical actions.
              </Text>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Text Alignment */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Text Alignment
        </Text>
        <div className="bg-muted/30 grid gap-4 rounded-lg p-6 md:grid-cols-3">
          <div className="border-border rounded border p-4">
            <Text align="left" weight="medium">
              Left Aligned
            </Text>
            <Text variant="muted" size="sm" align="left">
              Default alignment for LTR languages. Used for body text and form
              labels.
            </Text>
          </div>
          <div className="border-border rounded border p-4">
            <Text align="center" weight="medium">
              Center Aligned
            </Text>
            <Text variant="muted" size="sm" align="center">
              Hero sections, headings, and empty states.
            </Text>
          </div>
          <div className="border-border rounded border p-4">
            <Text align="right" weight="medium">
              Right Aligned
            </Text>
            <Text variant="muted" size="sm" align="right">
              Numeric data, prices, and table columns.
            </Text>
          </div>
        </div>
      </section>

      {/* Body Text Examples */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Body Text Examples
        </Text>
        <div className="bg-muted/30 max-w-2xl space-y-4 rounded-lg p-6">
          <Text>
            This is a paragraph of regular body text. It uses the default
            foreground color and base font size. The line height is optimized
            for readability in longer passages.
          </Text>
          <Text variant="muted">
            This muted paragraph provides secondary information. It&apos;s
            useful for descriptions, helper text, and supplementary content that
            shouldn&apos;t compete with primary content.
          </Text>
          <Text size="sm">
            Smaller text can be used for captions, footnotes, and fine print. It
            maintains readability while taking up less visual space.
          </Text>
          <Text size="lg" weight="medium">
            Larger text with medium weight works well for lead paragraphs or
            introductory content that needs to stand out.
          </Text>
        </div>
      </section>

      {/* Truncation */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Text Truncation
        </Text>
        <Text variant="muted" className="mb-6">
          Use the truncate prop to clip overflowing text with an ellipsis.
        </Text>
        <div className="max-w-sm space-y-4">
          <Card>
            <CardContent className="pt-4">
              <Text weight="medium" truncate>
                This is a very long title that will be truncated when it exceeds
                the container width
              </Text>
              <Text variant="muted" size="sm" truncate>
                And this description will also truncate gracefully without
                breaking the layout
              </Text>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BRANDING & COLORS SECTION */}
      {/* ============================================================ */}
      <div className="border-border mb-8 border-t pt-8">
        <Text as="h1" size="3xl" weight="bold" className="mb-2">
          Branding & Colors
        </Text>
        <Text variant="muted" className="mb-8">
          The @mieweb/ui design system supports multiple brand themes. Each
          brand defines its own color palette, typography, and design tokens.
        </Text>
      </div>

      {/* Current Brand Colors */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Primary Color Scale
        </Text>
        <Text variant="muted" className="mb-6">
          The current brand&apos;s primary color with 50-950 shades.
        </Text>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-11">
          <div className="text-center">
            <div className="bg-primary-50 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              50
            </Text>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              100
            </Text>
          </div>
          <div className="text-center">
            <div className="bg-primary-200 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              200
            </Text>
          </div>
          <div className="text-center">
            <div className="bg-primary-300 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              300
            </Text>
          </div>
          <div className="text-center">
            <div className="bg-primary-400 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              400
            </Text>
          </div>
          <div className="text-center">
            <div className="bg-primary-500 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              500
            </Text>
          </div>
          <div className="text-center">
            <div className="bg-primary-600 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              600
            </Text>
          </div>
          <div className="text-center">
            <div className="bg-primary-700 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              700
            </Text>
          </div>
          <div className="text-center">
            <div className="bg-primary-800 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              800
            </Text>
          </div>
          <div className="text-center">
            <div className="bg-primary-900 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              900
            </Text>
          </div>
          <div className="text-center">
            <div className="bg-primary-950 mb-1 h-12 w-full rounded-lg" />
            <Text size="xs" variant="muted">
              950
            </Text>
          </div>
        </div>
      </section>

      {/* Semantic Colors */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Semantic Colors
        </Text>
        <Text variant="muted" className="mb-6">
          Colors that adapt based on context and theme.
        </Text>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="bg-background border-border mb-2 h-16 rounded border" />
              <Text weight="medium">Background</Text>
              <Text variant="muted" size="xs">
                Page background
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="bg-muted mb-2 h-16 rounded" />
              <Text weight="medium">Muted</Text>
              <Text variant="muted" size="xs">
                Subtle backgrounds
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="bg-card border-border mb-2 h-16 rounded border" />
              <Text weight="medium">Card</Text>
              <Text variant="muted" size="xs">
                Card backgrounds
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="bg-border mb-2 h-16 rounded" />
              <Text weight="medium">Border</Text>
              <Text variant="muted" size="xs">
                Borders & dividers
              </Text>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Status Colors */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Status Colors
        </Text>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-primary-500 text-primary-foreground flex h-24 items-center justify-center rounded-lg">
            <Text weight="semibold" className="text-white">
              Primary
            </Text>
          </div>
          <div className="bg-success text-success-foreground flex h-24 items-center justify-center rounded-lg">
            <Text weight="semibold" className="text-white">
              Success
            </Text>
          </div>
          <div className="bg-warning text-warning-foreground flex h-24 items-center justify-center rounded-lg">
            <Text weight="semibold" className="text-white">
              Warning
            </Text>
          </div>
          <div className="bg-destructive text-destructive-foreground flex h-24 items-center justify-center rounded-lg">
            <Text weight="semibold" className="text-white">
              Destructive
            </Text>
          </div>
        </div>
      </section>

      {/* Available Brands */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Available Brands
        </Text>
        <Text variant="muted" className="mb-6">
          Use the brand switcher in the Storybook toolbar to preview components
          with different brands.
        </Text>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#27aae1]" />
                <div>
                  <Text weight="semibold">BlueHive</Text>
                  <Text variant="muted" size="xs">
                    #27aae1 · Nunito
                  </Text>
                </div>
              </div>
              <Text variant="muted" size="sm">
                DOT Physical scheduling and healthcare compliance platform.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#27ae60]" />
                <div>
                  <Text weight="semibold">MieWeb</Text>
                  <Text variant="muted" size="xs">
                    #27ae60 · Inter
                  </Text>
                </div>
              </div>
              <Text variant="muted" size="sm">
                Healthcare software and services company.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#6E2B68]" />
                <div>
                  <Text weight="semibold">Enterprise Health</Text>
                  <Text variant="muted" size="xs">
                    #6E2B68 · Jost
                  </Text>
                </div>
              </div>
              <Text variant="muted" size="sm">
                Employee health and occupational medicine platform.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#f5841f]" />
                <div>
                  <Text weight="semibold">WebChart</Text>
                  <Text variant="muted" size="xs">
                    #f5841f · Inter
                  </Text>
                </div>
              </div>
              <Text variant="muted" size="sm">
                Future-ready electronic health record system.
              </Text>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Font Families */}
      <section className="mb-12">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Typography Families
        </Text>
        <Text variant="muted" className="mb-6">
          Each brand can define custom font families.
        </Text>
        <div className="bg-muted/30 grid gap-6 rounded-lg p-6 md:grid-cols-2">
          <div>
            <Text weight="semibold" className="mb-2">
              Sans Serif (Default)
            </Text>
            <Text
              className="font-sans"
              size="lg"
              style={{
                fontFamily:
                  'var(--mieweb-font-sans, Inter, ui-sans-serif, system-ui, sans-serif)',
              }}
            >
              The quick brown fox jumps over the lazy dog. 0123456789
            </Text>
            <Text variant="muted" size="xs" className="mt-1">
              Used for headings, body text, and UI elements.
            </Text>
          </div>
          <div>
            <Text weight="semibold" className="mb-2">
              Monospace
            </Text>
            <Text
              size="lg"
              style={{
                fontFamily:
                  'var(--mieweb-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
              }}
            >
              const message = &quot;Hello, World!&quot;;
            </Text>
            <Text variant="muted" size="xs" className="mt-1">
              Used for code, technical data, and tabular numbers.
            </Text>
          </div>
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
    <div className="dark bg-background min-h-screen p-8">
      <Text as="h1" size="3xl" weight="bold" className="mb-2">
        Component Showcase (Dark Mode)
      </Text>
      <Text variant="muted" className="mb-8">
        All components automatically adapt to the dark theme. Use the theme
        toggle in the toolbar to switch themes, or view the AllComponents story
        for the full showcase in light mode.
      </Text>

      {/* Sample Components in Dark Mode */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Sample Components
        </Text>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dark Mode Card</CardTitle>
              <CardDescription>
                Cards and other components automatically adapt their colors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input label="Input" placeholder="Enter text..." />
              <Select
                label="Select"
                placeholder="Choose..."
                options={[{ value: '1', label: 'Option 1' }]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Alerts in Dark Mode */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Alerts
        </Text>
        <div className="space-y-2">
          <Alert variant="info">Info alert in dark mode.</Alert>
          <Alert variant="success">Success alert in dark mode.</Alert>
          <Alert variant="warning">Warning alert in dark mode.</Alert>
          <Alert variant="danger">Danger alert in dark mode.</Alert>
        </div>
      </section>

      {/* Typography in Dark Mode */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Typography
        </Text>
        <div className="space-y-3">
          <Text>Default foreground text adapts to dark theme.</Text>
          <Text variant="muted">Muted text remains readable.</Text>
          <Text variant="primary">Primary text uses brand colors.</Text>
          <Text variant="success">Success text stays green.</Text>
          <Text variant="warning">Warning text stays amber.</Text>
          <Text variant="destructive">Destructive text stays red.</Text>
        </div>
      </section>
    </div>
  ),
};
