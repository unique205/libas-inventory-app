// Libas Inventory - Main Application Controller
class LibasInventoryApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupServiceWorker();
        this.setupOfflineSupport();
        this.setupAutoSave();
    }

    // Check if user is authenticated
    checkAuthentication() {
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUIForUser();
        } else {
            // Redirect to login if not on login page
            if (!window.location.pathname.includes('index.html') && 
                window.location.pathname !== '/') {
                window.location.href = 'index.html';
            }
        }
    }

    // Update UI based on user role
    updateUIForUser() {
        if (this.currentUser) {
            // Update page title with user role
            const role = this.currentUser.role === 'admin' ? 'Admin' : 'Staff';
            document.title = `Libas Inventory - ${role}`;
            
            // Add user info to dashboard if exists
            const userInfoElement = document.querySelector('.user-info');
            if (userInfoElement) {
                const userName = document.createElement('span');
                userName.textContent = `Welcome, ${this.currentUser.username}!`;
                userName.style.marginRight = '10px';
                userInfoElement.prepend(userName);
            }
        }
    }

    // Setup Service Worker for PWA features
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }

    // Setup offline support
    setupOfflineSupport() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.showNotification('You are offline - data saved locally', 'warning');
        });

        // Check initial connection
        if (!navigator.onLine) {
            this.showNotification('Working offline - data will sync when connected', 'info');
        }
    }

    // Auto-save functionality
    setupAutoSave() {
        // Auto-save form data every 30 seconds
        setInterval(() => {
            this.autoSaveForms();
        }, 30000);

        // Save before page unload
        window.addEventListener('beforeunload', (e) => {
            this.autoSaveForms();
        });
    }

    // Auto-save all form data
    autoSaveForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
            const formData = new FormData(form);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });
            
            // Save to localStorage
            const formKey = `autoSave_form_${index}_${this.currentUser?.username || 'anonymous'}`;
            localStorage.setItem(formKey, JSON.stringify({
                data: formObject,
                timestamp: new Date().toISOString()
            }));
        });
    }

    // Restore auto-saved forms
    restoreAutoSavedForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
            const formKey = `autoSave_form_${index}_${this.currentUser?.username || 'anonymous'}`;
            const savedData = localStorage.getItem(formKey);
            
            if (savedData) {
                try {
                    const { data, timestamp } = JSON.parse(savedData);
                    Object.keys(data).forEach(key => {
                        const input = form.querySelector(`[name="${key}"]`);
                        if (input && data[key]) {
                            input.value = data[key];
                        }
                    });
                    
                    // Clear saved data after restore
                    localStorage.removeItem(formKey);
                    
                    this.showNotification('Restored unsaved work', 'info');
                } catch (error) {
                    console.error('Error restoring form data:', error);
                }
            }
        });
    }

    // Sync data when online
    syncData() {
        if (navigator.onLine && window.dataManager) {
            // Perform any sync operations here
            console.log('Syncing data...');
        }
    }

    // Show notification to user
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.libas-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `libas-notification libas-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .libas-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    max-width: 300px;
                    border-left: 4px solid #667eea;
                    animation: slideInRight 0.3s ease;
                }
                .libas-notification-success { border-left-color: #00b894; }
                .libas-notification-warning { border-left-color: #fdcb6e; }
                .libas-notification-error { border-left-color: #e17055; }
                .libas-notification-info { border-left-color: #667eea; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .notification-message {
                    color: #333;
                    font-size: 0.9rem;
                    margin-right: 15px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    color: #666;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Utility function to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    // Utility function to format date
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Export data with advanced options
    exportData(options = {}) {
        if (!window.dataManager) {
            this.showNotification('Data manager not available', 'error');
            return;
        }

        const data = window.dataManager.loadData();
        const { format = 'csv', includeBills = false, dateRange = null } = options;

        let exportData;
        
        if (format === 'csv') {
            exportData = this.generateCSV(data, dateRange);
        } else if (format === 'json') {
            exportData = this.generateJSON(data, dateRange);
        }

        this.downloadFile(exportData, `libas_export_${new Date().getTime()}.${format}`);
        this.showNotification('Data exported successfully', 'success');
    }

    generateCSV(data, dateRange) {
        let csvContent = "Item Name,Quantity,Group,Purchase Price,Selling Price,Date,Added By,Description,Timestamp\n";
        
        let entries = data.stockEntries;
        if (dateRange) {
            entries = entries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= dateRange.start && entryDate <= dateRange.end;
            });
        }
        
        entries.forEach(entry => {
            const safeDescription = (entry.description || '').replace(/"/g, '""');
            csvContent += `"${entry.name}",${entry.quantity},"${entry.group}",${entry.purchasePrice || '0'},"${entry.sellingPrice || '0'}","${entry.date}","${entry.addedBy}","${safeDescription}","${entry.timestamp}"\n`;
        });

        return csvContent;
    }

    generateJSON(data, dateRange) {
        let entries = data.stockEntries;
        if (dateRange) {
            entries = entries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= dateRange.start && entryDate <= dateRange.end;
            });
        }

        return JSON.stringify({
            exportDate: new Date().toISOString(),
            totalEntries: entries.length,
            data: entries
        }, null, 2);
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Advanced search functionality
    searchInventory(searchTerm, filters = {}) {
        if (!window.dataManager) return [];

        const data = window.dataManager.loadData();
        let results = data.stockEntries;

        // Text search
        if (searchTerm) {
            results = results.filter(entry => 
                entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (entry.description && entry.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply filters
        if (filters.group) {
            results = results.filter(entry => entry.group === filters.group);
        }

        if (filters.dateRange) {
            results = results.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= filters.dateRange.start && entryDate <= filters.dateRange.end;
            });
        }

        if (filters.addedBy) {
            results = results.filter(entry => entry.addedBy === filters.addedBy);
        }

        return results;
    }

    // Get unique groups for filter dropdown
    getUniqueGroups() {
        if (!window.dataManager) return [];
        
        const data = window.dataManager.loadData();
        const groups = [...new Set(data.stockEntries.map(entry => entry.group))];
        return groups.filter(group => group).sort();
    }

    // Clear all data (admin only)
    clearAllData() {
        if (this.currentUser?.role !== 'admin') {
            this.showNotification('Only admin can clear data', 'error');
            return;
        }

        if (confirm('⚠️ ARE YOU SURE? This will delete ALL data permanently!')) {
            localStorage.removeItem('libas_inventory_data_v2');
            sessionStorage.removeItem('libas_inventory_data_v2');
            localStorage.removeItem('libas_inventory_data');
            
            // Clear all auto-saved forms
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('autoSave_form_')) {
                    localStorage.removeItem(key);
                }
            });

            this.showNotification('All data cleared successfully', 'success');
            setTimeout(() => window.location.reload(), 1000);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.libasApp = new LibasInventoryApp();
});

// Global utility functions
window.libasUtils = {
    // Generate random ID
    generateId: () => Date.now().toString() + Math.random().toString(36).substr(2, 9),
    
    // Validate email
    validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    
    // Debounce function for search
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Format file size
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};