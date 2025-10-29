// FIXED Data Manager - Centralized Data Storage
class DataManager {
    constructor() {
        this.storageKey = 'libas_inventory_shared_data';
        this.init();
    }

    init() {
        this.migrateOldData();
        this.setupDataSync();
    }

    migrateOldData() {
        // Migrate from old storage keys
        const oldKeys = ['libas_inventory_data', 'libas_inventory_data_v2'];
        oldKeys.forEach(oldKey => {
            const oldData = localStorage.getItem(oldKey);
            if (oldData && !localStorage.getItem(this.storageKey)) {
                localStorage.setItem(this.storageKey, oldData);
                console.log('Migrated data from:', oldKey);
            }
        });
    }

    setupDataSync() {
        // Sync across tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                console.log('Data updated from another tab');
                this.triggerDataUpdate();
            }
        });
    }

    triggerDataUpdate() {
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('inventoryDataUpdated'));
    }

    // Save data to centralized storage
    saveData(data) {
        try {
            // Add timestamp
            data.lastUpdated = new Date().toISOString();
            data.lastUpdatedBy = this.getCurrentUser() || 'unknown';
            
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            sessionStorage.setItem(this.storageKey, JSON.stringify(data));
            
            // Trigger sync event
            this.triggerDataUpdate();
            
            console.log('Data saved successfully:', data);
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Load data from centralized storage
    loadData() {
        try {
            let data = localStorage.getItem(this.storageKey) || sessionStorage.getItem(this.storageKey);
            
            if (!data) {
                return this.getDefaultData();
            }
            
            const parsedData = JSON.parse(data);
            console.log('Data loaded:', parsedData);
            return parsedData;
            
        } catch (error) {
            console.error('Error loading data:', error);
            return this.getDefaultData();
        }
    }

    getDefaultData() {
        return {
            items: [],
            stockEntries: [],
            bills: [],
            users: [
                { username: 'admin', password: 'libas123', role: 'admin', fullName: 'Owner' },
                { username: 'staff', password: '456', role: 'staff', fullName: 'Staff Member' }
            ],
            settings: {
                appName: 'Libas Inventory',
                companyName: 'Your Business',
                version: '3.0',
                lastSync: new Date().toISOString()
            },
            lastUpdated: new Date().toISOString(),
            lastUpdatedBy: 'system'
        };
    }

    getCurrentUser() {
        try {
            const userData = sessionStorage.getItem('currentUser');
            return userData ? JSON.parse(userData).username : 'unknown';
        } catch {
            return 'unknown';
        }
    }

    // Add new stock entry
    addStockEntry(entry) {
        const data = this.loadData();
        entry.id = 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        entry.timestamp = new Date().toISOString();
        entry.addedBy = this.getCurrentUser();
        
        console.log('Adding stock entry:', entry);
        
        data.stockEntries.push(entry);
        data.settings.lastSync = new Date().toISOString();
        return this.saveData(data);
    }

    // Add new item
    addItem(item) {
        const data = this.loadData();
        item.id = 'item_' + Date.now();
        item.createdDate = new Date().toISOString();
        item.addedBy = this.getCurrentUser();
        data.items.push(item);
        data.settings.lastSync = new Date().toISOString();
        return this.saveData(data);
    }

    // Add bill
    addBill(bill) {
        const data = this.loadData();
        bill.id = 'bill_' + Date.now();
        bill.uploadDate = new Date().toISOString();
        bill.uploadedBy = this.getCurrentUser();
        data.bills.push(bill);
        data.settings.lastSync = new Date().toISOString();
        return this.saveData(data);
    }

    // Get entries by date
    getEntriesByDate(date) {
        const data = this.loadData();
        return data.stockEntries.filter(entry => entry.date === date);
    }

    // Get bills by date
    getBillsByDate(date) {
        const data = this.loadData();
        return data.bills.filter(bill => bill.date === date);
    }

    // Get all stock entries
    getAllStockEntries() {
        const data = this.loadData();
        return data.stockEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Get staff entries only
    getStaffEntries() {
        const data = this.loadData();
        return data.stockEntries.filter(entry => entry.addedBy === 'staff');
    }

    // Get admin entries only
    getAdminEntries() {
        const data = this.loadData();
        return data.stockEntries.filter(entry => entry.addedBy === 'admin');
    }

    // Update stock entry
    updateStockEntry(entryId, updatedData) {
        const data = this.loadData();
        const entryIndex = data.stockEntries.findIndex(entry => entry.id === entryId);
        
        if (entryIndex !== -1) {
            // Preserve original data
            updatedData.id = data.stockEntries[entryIndex].id;
            updatedData.timestamp = data.stockEntries[entryIndex].timestamp;
            updatedData.addedBy = data.stockEntries[entryIndex].addedBy;
            updatedData.originalDate = data.stockEntries[entryIndex].date;
            updatedData.lastModified = new Date().toISOString();
            updatedData.modifiedBy = this.getCurrentUser();
            
            data.stockEntries[entryIndex] = { ...data.stockEntries[entryIndex], ...updatedData };
            data.settings.lastSync = new Date().toISOString();
            return this.saveData(data);
        }
        return false;
    }

    // Delete stock entry
    deleteStockEntry(entryId) {
        const data = this.loadData();
        const initialLength = data.stockEntries.length;
        data.stockEntries = data.stockEntries.filter(entry => entry.id !== entryId);
        data.settings.lastSync = new Date().toISOString();
        
        if (data.stockEntries.length < initialLength) {
            this.saveData(data);
            return true;
        }
        return false;
    }

    // Export to Excel
    exportToExcel() {
        const data = this.loadData();
        
        let csvContent = "Item Name,Quantity,Group,Purchase Price,Selling Price,Date,Added By,Description,Timestamp\n";
        
        data.stockEntries.forEach(entry => {
            const safeDescription = (entry.description || '').replace(/"/g, '""');
            csvContent += `"${entry.name}",${entry.quantity},"${entry.group}",${entry.purchasePrice || '0'},"${entry.sellingPrice || '0'}","${entry.date}","${entry.addedBy}","${safeDescription}","${entry.timestamp}"\n`;
        });

        this.downloadFile(csvContent, `libas_inventory_${new Date().toISOString().split('T')[0]}.csv`);
        return true;
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Get system stats
    getStats() {
        const data = this.loadData();
        const staffEntries = this.getStaffEntries();
        const adminEntries = this.getAdminEntries();
        const totalValue = data.stockEntries.reduce((sum, entry) => {
            return sum + (parseFloat(entry.purchasePrice) || 0) * (parseInt(entry.quantity) || 0);
        }, 0);
        
        return {
            totalProducts: data.stockEntries.length,
            staffEntries: staffEntries.length,
            adminEntries: adminEntries.length,
            totalValue: totalValue,
            totalBills: data.bills.length,
            lastUpdated: data.lastUpdated
        };
    }

    // Clear all data (use carefully!)
    clearAllData() {
        if (confirm('⚠️ ARE YOU SURE? This will delete ALL data permanently!')) {
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.storageKey);
            
            // Clear old storage keys too
            ['libas_inventory_data', 'libas_inventory_data_v2'].forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            
            return true;
        }
        return false;
    }

    // Debug function to see all data
    debugData() {
        const data = this.loadData();
        console.log('=== DEBUG DATA ===');
        console.log('Total entries:', data.stockEntries.length);
        console.log('Staff entries:', data.stockEntries.filter(e => e.addedBy === 'staff').length);
        console.log('Admin entries:', data.stockEntries.filter(e => e.addedBy === 'admin').length);
        console.log('All entries:', data.stockEntries);
        console.log('==================');
        return data;
    }
}

// Create global instance
window.dataManager = new DataManager();

// Listen for data updates
window.addEventListener('inventoryDataUpdated', function() {
    console.log('Inventory data updated - refreshing UI if needed');
    // This will trigger UI refreshes in admin/staff dashboards
});