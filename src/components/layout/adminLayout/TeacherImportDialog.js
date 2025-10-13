import '@/components/ui/Dialog.js';
import Toast from '@/components/ui/Toast.js';

/**
 * Teacher Import Dialog Component
 * 
 * Handles CSV file import for teachers with validation and error reporting
 */
class TeacherImportDialog extends HTMLElement {
    constructor() {
        super();
        this.file = null;
        this.importing = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && oldValue !== newValue) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add event listeners
        this.addEventListener('file-selected', this.handleFileSelected.bind(this));
        this.addEventListener('import-started', this.handleImportStarted.bind(this));
        this.addEventListener('import-completed', this.handleImportCompleted.bind(this));
        
        // Listen for dialog close events
        this.addEventListener('modal-closed', this.handleDialogClose.bind(this));
    }

    handleDialogClose() {
        this.clearFile();
        this.importing = false;
    }

    handleFileSelected(event) {
        this.file = event.detail.file;
        this.updateFileDisplay();
    }

    handleImportStarted(event) {
        this.importing = true;
        this.updateImportButton();
    }

    handleImportCompleted(event) {
        this.importing = false;
        this.updateImportButton();
        
        if (event.detail.success) {
            this.close();
            this.showImportResults(event.detail.data);
        }
    }

    updateFileDisplay() {
        const fileDisplay = this.querySelector('.file-display');
        if (fileDisplay) {
            if (this.file) {
                fileDisplay.innerHTML = `
                    <div class="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <i class="fas fa-file-csv text-green-600"></i>
                        <div class="flex-1">
                            <div class="font-medium text-green-800">${this.file.name}</div>
                            <div class="text-sm text-green-600">${this.formatFileSize(this.file.size)}</div>
                        </div>
                        <button onclick="this.closest('teacher-import-dialog').clearFile()" 
                                class="text-green-600 hover:text-green-800">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            } else {
                // Clear the display when no file is selected
                fileDisplay.innerHTML = '';
            }
        }
    }

    updateImportButton() {
        const importBtn = this.querySelector('.import-button');
        if (importBtn) {
            if (this.importing) {
                importBtn.disabled = true;
                importBtn.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    Importing...
                `;
            } else {
                importBtn.disabled = !this.file;
                importBtn.innerHTML = `
                    <i class="fas fa-upload"></i>
                    Import Teachers
                `;
            }
        }
    }

    clearFile() {
        this.file = null;
        const fileInput = this.querySelector('#import-file-input');
        if (fileInput) {
            fileInput.value = '';
            // Trigger change event to ensure UI updates
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        this.updateFileDisplay();
        this.updateImportButton();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showImportResults(data) {
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">Import Results</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600">${data.total}</div>
                            <div class="text-sm text-blue-600">Total Records</div>
                        </div>
                        <div class="bg-green-50 p-3 rounded-lg">
                            <div class="text-2xl font-bold text-green-600">${data.successful}</div>
                            <div class="text-sm text-green-600">Successful</div>
                        </div>
                        <div class="bg-red-50 p-3 rounded-lg">
                            <div class="text-2xl font-bold text-red-600">${data.failed}</div>
                            <div class="text-sm text-red-600">Failed</div>
                        </div>
                    </div>
                    
                    ${data.errors && data.errors.length > 0 ? `
                        <div>
                            <h4 class="font-medium text-gray-800 mb-2">Errors:</h4>
                            <div class="space-y-2 max-h-40 overflow-y-auto">
                                ${data.errors.map(error => `
                                    <div class="bg-red-50 border border-red-200 rounded p-2 text-sm">
                                        <div class="font-medium">Row ${error.row} (${error.employee_id})</div>
                                        <div class="text-red-600">${error.error}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="mt-6 flex justify-end">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Import Teachers">
                <div slot="content">
                    <div class="space-y-4">
                        <!-- Instructions -->
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 class="font-medium text-blue-800 mb-2">CSV Format Requirements:</h4>
                            <ul class="text-sm text-blue-700 space-y-1">
                                <li>• Required fields: EmployeeID, FirstName, LastName, Email, Phone, Address, DateOfBirth, Gender, HireDate</li>
                                <li>• Optional fields: Qualification, Specialization, Salary, Status</li>
                                <li>• Date format: YYYY-MM-DD</li>
                                <li>• Gender: male, female, or other</li>
                                <li>• Phone: exactly 10 digits</li>
                                <li>• Default password: default123</li>
                            </ul>
                        </div>
                        
                        <!-- File Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                            <input type="file" 
                                   id="import-file-input"
                                   accept=".csv"
                                   class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                        </div>
                        
                        <!-- File Display -->
                        <div class="file-display"></div>
                    </div>
                </div>
                
                <div slot="footer">
                    <button onclick="this.closest('teacher-import-dialog').close()" 
                            class="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors">
                        Cancel
                    </button>
                    <button onclick="this.closest('teacher-import-dialog').handleImport()" 
                            class="import-button px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled>
                        <i class="fas fa-upload text-xs"></i>
                        Import Teachers
                    </button>
                </div>
            </ui-dialog>
        `;
    }

    handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                Toast.show({
                    title: 'Invalid File Type',
                    message: 'Please select a CSV file',
                    variant: 'error',
                    duration: 3000
                });
                event.target.value = '';
                return;
            }
            
            this.file = file;
            this.updateFileDisplay();
            this.updateImportButton();
        }
    }

    async handleImport() {
        if (!this.file) {
            Toast.show({
                title: 'No File Selected',
                message: 'Please select a CSV file to import',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            this.dispatchEvent(new CustomEvent('import-started', { bubbles: true }));
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please log in to import data');
            }

            const formData = new FormData();
            formData.append('file', this.file);

            const response = await fetch('/api/teachers/import', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                Toast.show({
                    title: 'Import Successful',
                    message: result.message,
                    variant: 'success',
                    duration: 5000
                });

                this.dispatchEvent(new CustomEvent('import-completed', {
                    detail: { success: true, data: result.data },
                    bubbles: true
                }));
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            Toast.show({
                title: 'Import Error',
                message: error.message || 'Failed to import teachers data',
                variant: 'error',
                duration: 5000
            });
            
            this.dispatchEvent(new CustomEvent('import-completed', {
                detail: { success: false, error: error.message },
                bubbles: true
            }));
        }
    }

    open() {
        this.setAttribute('open', '');
        this.render();
        
        // Auto-trigger file input after dialog renders
        setTimeout(() => {
            const fileInput = this.querySelector('#import-file-input');
            if (fileInput) {
                fileInput.click();
                fileInput.addEventListener('change', this.handleFileChange.bind(this));
            }
        }, 100);
    }

    close() {
        this.removeAttribute('open');
        this.render();
        // Clear file and reset state
        this.clearFile();
        this.importing = false;
    }
}

customElements.define('teacher-import-dialog', TeacherImportDialog);
export default TeacherImportDialog;
