import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const modalOverlayVariants: (props?: ({} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const modalContentVariants: (props?: ({
    size?: "sm" | "md" | "lg" | "xl" | "full" | "2xl" | "3xl" | "4xl" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ModalProps extends VariantProps<typeof modalContentVariants> {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when the modal should close */
    onOpenChange: (open: boolean) => void;
    /** Modal content */
    children: React.ReactNode;
    /** Whether to close when clicking the overlay */
    closeOnOverlayClick?: boolean;
    /** Whether to close when pressing Escape */
    closeOnEscape?: boolean;
    /** Additional class name for the modal content */
    className?: string;
    /** ID for the modal, used for accessibility */
    id?: string;
    /** Accessible label for the modal */
    'aria-label'?: string;
    /** ID of the element that labels the modal */
    'aria-labelledby'?: string;
    /** ID of the element that describes the modal */
    'aria-describedby'?: string;
}
/**
 * An accessible modal/dialog component.
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onOpenChange={setIsOpen} size="lg">
 *   <ModalHeader>
 *     <ModalTitle>Confirm Action</ModalTitle>
 *     <ModalClose />
 *   </ModalHeader>
 *   <ModalBody>
 *     Are you sure you want to continue?
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 * ```
 */
declare function Modal({ open, onOpenChange, children, size, closeOnOverlayClick, closeOnEscape, className, id, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, }: ModalProps): react_jsx_runtime.JSX.Element | null;
declare namespace Modal {
    var displayName: string;
}
type ModalHeaderProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Header section of a Modal.
 */
declare const ModalHeader: React.ForwardRefExoticComponent<ModalHeaderProps & React.RefAttributes<HTMLDivElement>>;
type ModalTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
/**
 * Title for a Modal.
 */
declare const ModalTitle: React.ForwardRefExoticComponent<ModalTitleProps & React.RefAttributes<HTMLHeadingElement>>;
type ModalCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
/**
 * Close button for a Modal.
 */
declare const ModalClose: React.ForwardRefExoticComponent<ModalCloseProps & React.RefAttributes<HTMLButtonElement>>;
type ModalBodyProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Main content area of a Modal.
 */
declare const ModalBody: React.ForwardRefExoticComponent<ModalBodyProps & React.RefAttributes<HTMLDivElement>>;
type ModalFooterProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Footer section of a Modal, typically for action buttons.
 */
declare const ModalFooter: React.ForwardRefExoticComponent<ModalFooterProps & React.RefAttributes<HTMLDivElement>>;

export { Modal, ModalBody, type ModalBodyProps, ModalClose, type ModalCloseProps, ModalFooter, type ModalFooterProps, ModalHeader, type ModalHeaderProps, type ModalProps, ModalTitle, type ModalTitleProps, modalContentVariants, modalOverlayVariants };
