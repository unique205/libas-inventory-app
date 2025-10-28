// Enhanced Data Manager for GitHub Pages
class DataManager {
    constructor() {
        this.storageKey = 'libas_inventory_data_v2';
        this.githubBackupKey = 'libas_github_backup';
        this.init();
    }

    init() {
        // Migrate old data if exists
        this.migrateOldData();
    }

    migrateOldData() {
        const oldData = localStorage.getItem('libas_inventory_data');
        if (oldData && !localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, oldData);
        }
    }

    // Save data to browser storage
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            
            // Also backup to session storage for cross-tab sync
            sessionStorage.setItem(this.storageKey, JSON.stringify(data));
            
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Load data from browser storage
    loadData() {
        try {
            // Try session storage first (for real-time sync across tabs)
            let data = sessionStorage.getItem(this.storageKey);
            
            // Fallback to local storage
            if (!data) {
                data = localStorage.getItem(this.storageKey);
            }
            
            return data ? JSON.parse(data) : this.getDefaultData();
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
                version: '2.0',
                lastSync: new Date().toISOString()
            }
        };
    }

    // Add new stock entry
    addStockEntry(entry) {
        const data = this.loadData();
        entry.id = Date.now().toString();
        entry.timestamp = new Date().toISOString();
        entry.addedBy = entry.addedBy || 'staff';
        data.stockEntries.push(entry);
        data.settings.lastSync = new Date().toISOString();
        return this.saveData(data);
    }

    // Add new item
    addItem(item) {
        const data = this.loadData();
        item.id = Date.now().toString();
        item.createdDate = new Date().toISOString();
        data.items.push(item);
        data.settings.lastSync = new Date().toISOString();
        return this.saveData(data);
    }

    // Add bill
    addBill(bill) {
        const data = this.loadData();
        bill.id = Date.now().toString();
        bill.uploadDate = new Date().toISOString();
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

    // Update stock entry
    updateStockEntry(entryId, updatedData) {
        const data = this.loadData();
        const entryIndex = data.stockEntries.findIndex(entry => entry.id === entryId);
        
        if (entryIndex !== -1) {
            updatedData.id = data.stockEntries[entryIndex].id;
            updatedData.timestamp = data.stockEntries[entryIndex].timestamp;
            updatedData.addedBy = data.stockEntries[entryIndex].addedBy;
            updatedData.originalDate = data.stockEntries[entryIndex].date;
            
            data.stockEntries[entryIndex] = { ...data.stockEntries[entryIndex], ...updatedData };
            data.settings.lastSync = new Date().toISOString();
            return this.saveData(data);
        }
        return false;
    }

    // Export to Excel format
    exportToExcel() {
        const data = this.loadData();
        
        // Create CSV content
        let csvContent = "Item Name,Quantity,Group,Purchase Price,Selling Price,Date,Added By,Description\n";
        
        data.stockEntries.forEach(entry => {
            const safeDescription = (entry.description || '').replace(/"/g, '""');
            csvContent += `"${entry.name}",${entry.quantity},"${entry.group}",${entry.purchasePrice || 'N/A'},${entry.sellingPrice || 'N/A'},"${entry.date}","${entry.addedBy}","${safeDescription}"\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `libas_inventory_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    }

    // Backup data (for manual download)
    backupData() {
        const data = this.loadData();
        const backup = {
            ...data,
            backupCreated: new Date().toISOString(),
            version: '2.0'
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `libas_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    }

    // Restore data from backup
    restoreData(backupFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    if (this.validateBackup(backupData)) {
                        this.saveData(backupData);
                        resolve(true);
                    } else {
                        reject('Invalid backup file');
                    }
                } catch (error) {
                    reject('Error parsing backup file');
                }
            };
            reader.readAsText(backupFile);
        });
    }

    validateBackup(backupData) {
        return backupData && 
               backupData.stockEntries !== undefined && 
               backupData.settings !== undefined;
    }

    // Get system stats
    getStats() {
        const data = this.loadData();
        const staffEntries = data.stockEntries.filter(entry => entry.addedBy === 'staff');
        const totalValue = data.stockEntries.reduce((sum, entry) => {
            return sum + (parseFloat(entry.purchasePrice) || 0) * (parseInt(entry.quantity) || 0);
        }, 0);
        
        return {
            totalProducts: data.stockEntries.length,
            staffEntries: staffEntries.length,
            totalValue: totalValue,
            totalBills: data.bills.length,
            lastSync: data.settings.lastSync
        };
    }
}

// Create global instance
window.dataManager = new DataManager();

// Auto-sync across tabs
window.addEventListener('storage', function(e) {
    if (e.key === 'libas_inventory_data_v2') {
        // Data changed in another tab, reload
        window.location.reload();
    }
});