import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './Table';
import { Badge } from '../Badge';
import { Checkbox } from '../Checkbox';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from '../Dropdown';
import {
  FilterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeOffIcon,
  LockIcon,
  XIcon,
} from '../Icons';

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    responsive: {
      control: 'boolean',
      description:
        'Whether to make the table responsive with horizontal scroll',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Playground Story with Controls
// ============================================================================

interface PlaygroundArgs {
  columnCount: number;
  showFooter: boolean;
  pinnedColumns: number;
  selectable: boolean;
  showColumnMenus: boolean;
}

const allColumns = [
  { key: 'name', label: 'Name', footerValue: 'Total', filterable: true },
  { key: 'email', label: 'Email', footerValue: '', filterable: true },
  { key: 'role', label: 'Role', footerValue: '', filterable: true },
  { key: 'status', label: 'Status', footerValue: '', filterable: true },
  { key: 'department', label: 'Department', footerValue: '', filterable: true },
  { key: 'location', label: 'Location', footerValue: '', filterable: true },
  { key: 'phone', label: 'Phone', footerValue: '', filterable: false },
  { key: 'startDate', label: 'Start Date', footerValue: '', filterable: true },
  { key: 'salary', label: 'Salary', footerValue: '$485,000', filterable: true },
  { key: 'manager', label: 'Manager', footerValue: '', filterable: true },
  { key: 'team', label: 'Team', footerValue: '', filterable: true },
  { key: 'projects', label: 'Projects', footerValue: '23', filterable: false },
];

const playgroundData = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
    department: 'Engineering',
    location: 'New York',
    phone: '(555) 123-4567',
    startDate: '2021-03-15',
    salary: '$120,000',
    manager: 'Sarah Wilson',
    team: 'Platform',
    projects: '5',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'Active',
    department: 'Design',
    location: 'San Francisco',
    phone: '(555) 234-5678',
    startDate: '2020-07-22',
    salary: '$95,000',
    manager: 'Mike Chen',
    team: 'Product',
    projects: '3',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'Inactive',
    department: 'Marketing',
    location: 'Chicago',
    phone: '(555) 345-6789',
    startDate: '2019-11-08',
    salary: '$85,000',
    manager: 'Lisa Park',
    team: 'Growth',
    projects: '2',
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'Moderator',
    status: 'Active',
    department: 'Support',
    location: 'Austin',
    phone: '(555) 456-7890',
    startDate: '2022-01-10',
    salary: '$75,000',
    manager: 'Tom Davis',
    team: 'Customer Success',
    projects: '8',
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'User',
    status: 'Pending',
    department: 'Sales',
    location: 'Seattle',
    phone: '(555) 567-8901',
    startDate: '2023-06-01',
    salary: '$110,000',
    manager: 'Rachel Green',
    team: 'Enterprise',
    projects: '5',
  },
];

function PlaygroundTable({
  columnCount,
  showFooter,
  pinnedColumns,
  selectable,
  showColumnMenus,
}: PlaygroundArgs) {
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [hiddenColumns, setHiddenColumns] = React.useState<Set<string>>(
    new Set()
  );
  const [pinnedColumnKeys, setPinnedColumnKeys] = React.useState<Set<string>>(
    new Set()
  );
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({});

  const visibleColumns = allColumns
    .slice(0, columnCount)
    .filter((col) => !hiddenColumns.has(col.key));
  const allSelected = selectedIds.size === playgroundData.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Sort and filter data
  const filteredData = React.useMemo(() => {
    let data = [...playgroundData];

    // Apply filters
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value) {
        data = data.filter((row) =>
          String(row[key as keyof typeof row])
            .toLowerCase()
            .includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig) {
      data.sort((a, b) => {
        const aVal = String(a[sortConfig.key as keyof typeof a]);
        const bVal = String(b[sortConfig.key as keyof typeof b]);
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        return aVal.localeCompare(bVal) * direction;
      });
    }

    return data;
  }, [filterValues, sortConfig]);

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(playgroundData.map((d) => d.id)));
    }
  };

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
  };

  const handleHideColumn = (key: string) => {
    setHiddenColumns((prev) => new Set([...prev, key]));
  };

  const handleTogglePinColumn = (key: string) => {
    setPinnedColumnKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleClearFilter = (key: string) => {
    setFilterValues((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const getPinnedStyle = (
    index: number,
    colKey: string
  ): React.CSSProperties => {
    const isPinned = index < pinnedColumns || pinnedColumnKeys.has(colKey);
    if (isPinned) {
      const checkboxOffset = selectable ? 48 : 0;
      // Calculate offset based on pinned columns before this one
      let leftOffset = checkboxOffset;
      for (let i = 0; i < index; i++) {
        const prevCol = visibleColumns[i];
        if (i < pinnedColumns || pinnedColumnKeys.has(prevCol.key)) {
          leftOffset += 140;
        }
      }
      return {
        position: 'sticky',
        left: leftOffset,
        zIndex: 10,
      };
    }
    return {};
  };

  const getCheckboxPinnedStyle = (): React.CSSProperties => {
    if (pinnedColumns > 0 || selectable) {
      return {
        position: 'sticky',
        left: 0,
        zIndex: 10,
      };
    }
    return {};
  };

  // Column header with menu
  const ColumnHeader = ({
    col,
    index,
  }: {
    col: (typeof allColumns)[0];
    index: number;
  }) => {
    const isPinned = index < pinnedColumns || pinnedColumnKeys.has(col.key);
    const isSorted = sortConfig?.key === col.key;
    const hasFilter = filterValues[col.key];

    if (!showColumnMenus) {
      return (
        <TableHead
          key={col.key}
          className={isPinned ? 'bg-background min-w-[140px]' : 'min-w-[140px]'}
          style={getPinnedStyle(index, col.key)}
        >
          {col.label}
        </TableHead>
      );
    }

    return (
      <TableHead
        key={col.key}
        className={`${isPinned ? 'bg-background' : ''} min-w-[140px]`}
        style={getPinnedStyle(index, col.key)}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1">
            {col.label}
            {isSorted && (
              <span className="text-muted-foreground">
                {sortConfig.direction === 'asc' ? (
                  <ChevronUpIcon className="h-3 w-3" />
                ) : (
                  <ChevronDownIcon className="h-3 w-3" />
                )}
              </span>
            )}
            {hasFilter && <FilterIcon className="text-primary h-3 w-3" />}
          </span>
          <Dropdown
            placement="bottom-end"
            className="z-[100]"
            trigger={
              <button
                className="hover:bg-muted rounded p-0.5 transition-colors"
                aria-label={`Options for ${col.label}`}
              >
                <ChevronDownIcon className="text-muted-foreground h-4 w-4" />
              </button>
            }
          >
            <DropdownContent>
              <DropdownLabel>Sort</DropdownLabel>
              <DropdownItem
                icon={<ChevronUpIcon className="h-4 w-4" />}
                onClick={() => handleSort(col.key, 'asc')}
              >
                Sort Ascending
              </DropdownItem>
              <DropdownItem
                icon={<ChevronDownIcon className="h-4 w-4" />}
                onClick={() => handleSort(col.key, 'desc')}
              >
                Sort Descending
              </DropdownItem>

              {col.filterable && (
                <>
                  <DropdownSeparator />
                  <DropdownLabel>Filter</DropdownLabel>
                  <div className="px-2 py-1">
                    <input
                      type="text"
                      placeholder={`Filter ${col.label}...`}
                      value={filterValues[col.key] || ''}
                      onChange={(e) =>
                        setFilterValues((prev) => ({
                          ...prev,
                          [col.key]: e.target.value,
                        }))
                      }
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-md border px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {hasFilter && (
                    <DropdownItem
                      icon={<XIcon className="h-4 w-4" />}
                      onClick={() => handleClearFilter(col.key)}
                    >
                      Clear Filter
                    </DropdownItem>
                  )}
                </>
              )}

              <DropdownSeparator />
              <DropdownLabel>Column</DropdownLabel>
              <DropdownItem
                icon={<LockIcon className="h-4 w-4" />}
                onClick={() => handleTogglePinColumn(col.key)}
              >
                {isPinned ? 'Unpin Column' : 'Pin Column'}
              </DropdownItem>
              <DropdownItem
                icon={<EyeOffIcon className="h-4 w-4" />}
                onClick={() => handleHideColumn(col.key)}
              >
                Hide Column
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </TableHead>
    );
  };

  return (
    <div className="w-full max-w-5xl">
      {/* Show hidden columns restore UI */}
      {hiddenColumns.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-muted-foreground text-sm">Hidden columns:</span>
          {Array.from(hiddenColumns).map((key) => {
            const col = allColumns.find((c) => c.key === key);
            return (
              <button
                key={key}
                onClick={() =>
                  setHiddenColumns((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(key);
                    return newSet;
                  })
                }
                className="bg-muted hover:bg-muted/80 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors"
              >
                {col?.label}
                <XIcon className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead
                className="bg-background w-12"
                style={getCheckboxPinnedStyle()}
              >
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {visibleColumns.map((col, index) => (
              <ColumnHeader key={col.key} col={col} index={index} />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                className="text-muted-foreground h-24 text-center"
              >
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((row) => (
              <TableRow
                key={row.id}
                selected={selectable && selectedIds.has(row.id)}
              >
                {selectable && (
                  <TableCell
                    className="bg-background"
                    style={getCheckboxPinnedStyle()}
                  >
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </TableCell>
                )}
                {visibleColumns.map((col, index) => {
                  const isPinned =
                    index < pinnedColumns || pinnedColumnKeys.has(col.key);
                  return (
                    <TableCell
                      key={col.key}
                      className={`${index === 0 ? 'font-medium' : ''} ${
                        isPinned
                          ? 'bg-background min-w-[140px]'
                          : 'min-w-[140px]'
                      }`}
                      style={getPinnedStyle(index, col.key)}
                    >
                      {col.key === 'status' ? (
                        <Badge
                          variant={
                            row.status === 'Active'
                              ? 'success'
                              : row.status === 'Inactive'
                                ? 'secondary'
                                : 'warning'
                          }
                          size="sm"
                        >
                          {row.status}
                        </Badge>
                      ) : (
                        row[col.key as keyof typeof row]
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
        {showFooter && (
          <TableFooter>
            <TableRow>
              {selectable && (
                <TableCell
                  className="bg-muted/50"
                  style={getCheckboxPinnedStyle()}
                />
              )}
              {visibleColumns.map((col, index) => {
                const isPinned =
                  index < pinnedColumns || pinnedColumnKeys.has(col.key);
                return (
                  <TableCell
                    key={col.key}
                    className={`${col.footerValue ? 'font-bold' : ''} ${
                      isPinned ? 'bg-muted/50 min-w-[140px]' : ''
                    }`}
                    style={getPinnedStyle(index, col.key)}
                  >
                    {col.footerValue}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableFooter>
        )}
      </Table>
      {selectable && (
        <p className="text-muted-foreground mt-4 text-sm">
          {selectedIds.size} of {filteredData.length} row(s) selected.
        </p>
      )}
    </div>
  );
}

export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    columnCount: 6,
    showFooter: false,
    pinnedColumns: 0,
    selectable: false,
    showColumnMenus: true,
  },
  argTypes: {
    columnCount: {
      control: { type: 'range', min: 1, max: 12, step: 1 },
      description: 'Number of columns to display (1-12)',
    },
    showFooter: {
      control: 'boolean',
      description: 'Show or hide the table footer',
    },
    pinnedColumns: {
      control: { type: 'range', min: 0, max: 4, step: 1 },
      description: 'Number of columns to pin to the left (0-4)',
    },
    selectable: {
      control: 'boolean',
      description: 'Enable row selection with checkboxes',
    },
    showColumnMenus: {
      control: 'boolean',
      description: 'Show column header menus with sort, filter, and options',
    },
  },
  render: (args) => <PlaygroundTable {...args} />,
};

const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'Inactive',
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'Moderator',
    status: 'Active',
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'User',
    status: 'Pending',
  },
];

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    user.status === 'Active'
                      ? 'success'
                      : user.status === 'Inactive'
                        ? 'secondary'
                        : 'warning'
                  }
                  size="sm"
                >
                  {user.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

export const WithCaption: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <Table>
        <TableCaption>A list of your recent users.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.slice(0, 3).map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Widget A</TableCell>
            <TableCell>10</TableCell>
            <TableCell className="text-right">$100.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Widget B</TableCell>
            <TableCell>5</TableCell>
            <TableCell className="text-right">$75.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Widget C</TableCell>
            <TableCell>15</TableCell>
            <TableCell className="text-right">$150.00</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right font-bold">$325.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
};

function SortableTableDemo() {
  const [sortField, setSortField] = React.useState<'name' | 'email' | 'role'>(
    'name'
  );
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(
    'asc'
  );

  const handleSort = (field: 'name' | 'email' | 'role') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const direction = sortDirection === 'asc' ? 1 : -1;
    return aValue.localeCompare(bValue) * direction;
  });

  return (
    <div className="w-full max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              sortable
              sortDirection={sortField === 'name' ? sortDirection : null}
              onSort={() => handleSort('name')}
            >
              Name
            </TableHead>
            <TableHead
              sortable
              sortDirection={sortField === 'email' ? sortDirection : null}
              onSort={() => handleSort('email')}
            >
              Email
            </TableHead>
            <TableHead
              sortable
              sortDirection={sortField === 'role' ? sortDirection : null}
              onSort={() => handleSort('role')}
            >
              Role
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Badge
                  variant={user.status === 'Active' ? 'success' : 'secondary'}
                  size="sm"
                >
                  {user.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const Sortable: Story = {
  render: () => <SortableTableDemo />,
};

function SelectableTableDemo() {
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());

  const allSelected = selectedIds.size === users.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="w-full max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} selected={selectedIds.has(user.id)}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(user.id)}
                  onChange={() => handleSelectRow(user.id)}
                  aria-label={`Select ${user.name}`}
                />
              </TableCell>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-muted-foreground mt-4 text-sm">
        {selectedIds.size} of {users.length} row(s) selected.
      </p>
    </div>
  );
}

export const Selectable: Story = {
  render: () => <SelectableTableDemo />,
};

export const Empty: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-muted-foreground h-24 text-center"
            >
              No results found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const Striped: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow
              key={user.id}
              className={index % 2 === 0 ? 'bg-muted/30' : ''}
            >
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};
