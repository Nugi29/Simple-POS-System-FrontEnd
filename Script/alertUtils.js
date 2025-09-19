// SweetAlert2 Utility Functions for MOS Burger POS System
// Provides consistent styling and behavior for all alerts and notifications

/**
 * SweetAlert2 Configuration and Utility Functions
 */
class AlertUtils {
    
    static getTheme() {
        return {
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-secondary',
                denyButton: 'btn btn-danger'
            },
            buttonsStyling: false
        };
    }

    // Success notifications
    static showSuccess(title, message = '', timer = 3000) {
        return Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            timer: timer,
            timerProgressBar: true,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
            ...this.getTheme()
        });
    }

    // Error notifications
    static showError(title, message = '') {
        return Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: title,
            footer: message ? `<small>${message}</small>` : '',
            ...this.getTheme()
        });
    }

    // Warning notifications
    static showWarning(title, message = '') {
        return Swal.fire({
            icon: 'warning',
            title: title,
            text: message,
            ...this.getTheme()
        });
    }

    // Info notifications
    static showInfo(title, message = '') {
        return Swal.fire({
            icon: 'info',
            title: title,
            text: message,
            ...this.getTheme()
        });
    }

    // Confirmation dialogs
    static showConfirmation(title, message = '', confirmText = 'Yes, delete it!', cancelText = 'Cancel') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            reverseButtons: true,
            ...this.getTheme()
        });
    }

    // Loading/Processing notifications
    static showLoading(title = 'Processing...', message = 'Please wait while we process your request.') {
        return Swal.fire({
            title: title,
            text: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            },
            ...this.getTheme()
        });
    }

    // Input dialogs
    static showInput(title, placeholder = '', inputType = 'text') {
        return Swal.fire({
            title: title,
            input: inputType,
            inputPlaceholder: placeholder,
            showCancelButton: true,
            confirmButtonText: 'Submit',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to enter something!';
                }
            },
            ...this.getTheme()
        });
    }

    // Custom order success with details
    static showOrderSuccess(orderCode, customerName = '', total = 0) {
        return Swal.fire({
            icon: 'success',
            title: 'Order Placed Successfully!',
            html: `
                <div class="order-success-details">
                    <p><strong>Order Code:</strong> ${orderCode}</p>
                    ${customerName ? `<p><strong>Customer:</strong> ${customerName}</p>` : ''}
                    ${total > 0 ? `<p><strong>Total:</strong> Rs.${total.toFixed(2)}</p>` : ''}
                </div>
            `,
            timer: 5000,
            timerProgressBar: true,
            showConfirmButton: true,
            confirmButtonText: 'View Orders',
            ...this.getTheme()
        });
    }

    // Custom inventory update notification
    static showInventoryUpdate(action, itemName) {
        const actionText = action === 'add' ? 'Added' : action === 'update' ? 'Updated' : 'Deleted';
        const iconType = action === 'delete' ? 'warning' : 'success';
        
        return Swal.fire({
            icon: iconType,
            title: `Item ${actionText}!`,
            text: `${itemName} has been ${actionText.toLowerCase()} successfully.`,
            timer: 3000,
            timerProgressBar: true,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            ...this.getTheme()
        });
    }

    // Custom customer management notification
    static showCustomerUpdate(action, customerName) {
        const actionText = action === 'add' ? 'Added' : action === 'update' ? 'Updated' : 'Deleted';
        const iconType = action === 'delete' ? 'warning' : 'success';
        
        return Swal.fire({
            icon: iconType,
            title: `Customer ${actionText}!`,
            text: `${customerName} has been ${actionText.toLowerCase()} successfully.`,
            timer: 3000,
            timerProgressBar: true,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            ...this.getTheme()
        });
    }

    // Network error handler
    static showNetworkError() {
        return Swal.fire({
            icon: 'error',
            title: 'Connection Error',
            text: 'Unable to connect to the server. Please check your internet connection and try again.',
            footer: '<i class="fas fa-wifi"></i> Check your network connection',
            ...this.getTheme()
        });
    }

    // Validation error with multiple messages
    static showValidationError(errors = []) {
        const errorList = errors.map(error => `• ${error}`).join('<br>');
        
        return Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            html: `Please fix the following issues:<br><br>${errorList}`,
            ...this.getTheme()
        });
    }

    // Close any open Swal
    static close() {
        Swal.close();
    }
}

// Add custom CSS for better styling
const style = document.createElement('style');
style.textContent = `
    .swal-custom-popup {
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .swal-custom-title {
        color: #2c3e50;
        font-weight: 600;
    }
    
    .order-success-details {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
        border-left: 4px solid #28a745;
    }
    
    .order-success-details p {
        margin: 5px 0;
        color: #495057;
    }
    
    .swal2-timer-progress-bar {
        background: linear-gradient(90deg, #007bff, #28a745);
    }
`;
document.head.appendChild(style);