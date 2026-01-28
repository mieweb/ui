import * as React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    /** Whether to make the table responsive with horizontal scroll */
    responsive?: boolean;
}
/**
 * An accessible table component.
 *
 * @example
 * ```tsx
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Name</TableHead>
 *       <TableHead>Email</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>John Doe</TableCell>
 *       <TableCell>john@example.com</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */
declare const Table: React.ForwardRefExoticComponent<TableProps & React.RefAttributes<HTMLTableElement>>;
type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;
declare const TableHeader: React.ForwardRefExoticComponent<TableHeaderProps & React.RefAttributes<HTMLTableSectionElement>>;
type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
declare const TableBody: React.ForwardRefExoticComponent<TableBodyProps & React.RefAttributes<HTMLTableSectionElement>>;
type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;
declare const TableFooter: React.ForwardRefExoticComponent<TableFooterProps & React.RefAttributes<HTMLTableSectionElement>>;
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    /** Whether the row is selected */
    selected?: boolean;
}
declare const TableRow: React.ForwardRefExoticComponent<TableRowProps & React.RefAttributes<HTMLTableRowElement>>;
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    /** Sortable column configuration */
    sortable?: boolean;
    /** Current sort direction */
    sortDirection?: 'asc' | 'desc' | null;
    /** Callback when sort is triggered */
    onSort?: () => void;
}
declare const TableHead: React.ForwardRefExoticComponent<TableHeadProps & React.RefAttributes<HTMLTableCellElement>>;
type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;
declare const TableCell: React.ForwardRefExoticComponent<TableCellProps & React.RefAttributes<HTMLTableCellElement>>;
type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;
declare const TableCaption: React.ForwardRefExoticComponent<TableCaptionProps & React.RefAttributes<HTMLTableCaptionElement>>;

export { Table, TableBody, type TableBodyProps, TableCaption, type TableCaptionProps, TableCell, type TableCellProps, TableFooter, type TableFooterProps, TableHead, type TableHeadProps, TableHeader, type TableHeaderProps, type TableProps, TableRow, type TableRowProps };
