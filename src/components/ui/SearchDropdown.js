import '@/components/ui/Toast.js';

/**
 * Search Dropdown Component
 * 
 * A searchable dropdown component with single or multi-select functionality
 * 
 * Attributes:
 * - placeholder: string - placeholder text
 * - multiple: boolean - enables multi-select mode
 * - value: string/array - current selected value(s)
 * - disabled: boolean - disables the dropdown
 * - name: string - form field name
 * 
 * Events:
 * - change: Fired when selection changes
 * - search: Fired when search input changes
 */
class SearchDropdown extends HTMLElement {
    constructor() {
        super();
        this.isOpen = false;
        this.searchTerm = '';
        this.selectedItems = [];
        this.filteredOptions = [];
        this.options = [];
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['value', 'disabled', 'multiple'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadOptions();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value' && oldValue !== newValue) {
            this.updateSelectedItems();
        }
    }

    setupEventListeners() {
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.closest('.search-dropdown')) {
                this.toggleDropdown();
            }
            
            // Handle option selection
            if (e.target.closest('.option-item')) {
                const optionItem = e.target.closest('.option-item');
                const value = optionItem.dataset.value;
                const option = this.options.find(opt => opt.value === value);
                if (option) {
                    this.selectOption(option);
                }
            }
            
            // Handle remove item
            if (e.target.closest('.remove-item')) {
                const removeBtn = e.target.closest('.remove-item');
                const value = removeBtn.dataset.value;
                const item = this.selectedItems.find(item => item.value === value);
                if (item) {
                    this.removeSelectedItem(item);
                }
            }
        });

        // Search input
        const searchInput = this.shadowRoot.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.filterOptions();
                this.render();
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.selectFirstOption();
                }
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Keyboard navigation
        this.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });
    }

    loadOptions() {
        // Get options from slots
        const slot = this.shadowRoot.querySelector('slot');
        if (slot) {
            const assignedElements = slot.assignedElements();
            this.options = assignedElements.map(el => ({
                value: el.value,
                text: el.textContent,
                selected: el.hasAttribute('selected')
            }));
            this.filteredOptions = [...this.options];
        }
    }

    filterOptions() {
        if (!this.searchTerm) {
            this.filteredOptions = [...this.options];
        } else {
            this.filteredOptions = this.options.filter(option =>
                option.text.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }
    }

    selectFirstOption() {
        if (this.filteredOptions.length > 0) {
            this.selectOption(this.filteredOptions[0]);
        }
    }

    selectOption(option) {
        const isMultiple = this.hasAttribute('multiple');
        
        if (isMultiple) {
            const index = this.selectedItems.findIndex(item => item.value === option.value);
            if (index > -1) {
                this.selectedItems.splice(index, 1);
            } else {
                this.selectedItems.push(option);
            }
        } else {
            this.selectedItems = [option];
            this.closeDropdown();
        }

        this.updateValue();
        this.dispatchChangeEvent();
    }

    removeSelectedItem(item) {
        const index = this.selectedItems.findIndex(selected => selected.value === item.value);
        if (index > -1) {
            this.selectedItems.splice(index, 1);
            this.updateValue();
            this.dispatchChangeEvent();
        }
    }

    updateValue() {
        const isMultiple = this.hasAttribute('multiple');
        const value = isMultiple 
            ? this.selectedItems.map(item => item.value)
            : this.selectedItems[0]?.value || '';
        
        this.setAttribute('value', isMultiple ? JSON.stringify(value) : value);
    }

    updateSelectedItems() {
        const value = this.getAttribute('value');
        if (!value) {
            this.selectedItems = [];
            return;
        }

        const isMultiple = this.hasAttribute('multiple');
        if (isMultiple) {
            try {
                const values = JSON.parse(value);
                this.selectedItems = this.options.filter(option => values.includes(option.value));
            } catch (e) {
                this.selectedItems = [];
            }
        } else {
            this.selectedItems = this.options.filter(option => option.value === value);
        }
    }

    dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: this.getAttribute('value'),
                selectedItems: this.selectedItems
            },
            bubbles: true
        }));
    }

    toggleDropdown() {
        if (this.hasAttribute('disabled')) return;
        
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.isOpen = true;
        this.render();
        const searchInput = this.shadowRoot.querySelector('.search-input');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 0);
        }
    }

    closeDropdown() {
        this.isOpen = false;
        this.searchTerm = '';
        this.render();
    }

    get value() {
        return this.getAttribute('value') || '';
    }

    set value(val) {
        this.setAttribute('value', val);
    }

    render() {
        const placeholder = this.getAttribute('placeholder') || 'Select...';
        const isMultiple = this.hasAttribute('multiple');
        const isDisabled = this.hasAttribute('disabled');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .search-dropdown {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }

                .dropdown-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    background-color: #ffffff;
                    cursor: pointer;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    font-size: 0.875rem;
                    line-height: 1.25;
                    color: #374151;
                    min-height: 2.5rem;
                    user-select: none;
                    box-sizing: border-box;
                }

                .dropdown-trigger:hover:not(.disabled) {
                    border-color: #9ca3af;
                }

                .dropdown-trigger:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .dropdown-trigger.disabled {
                    background-color: #f9fafb;
                    color: #9ca3af;
                    cursor: not-allowed;
                    border-color: #e5e7eb;
                }

                .selected-items {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    flex-wrap: wrap;
                    min-height: 1.25rem;
                }

                .selected-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.125rem 0.5rem;
                    background-color: #e0e7ff;
                    color: #3730a3;
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .remove-item {
                    cursor: pointer;
                    padding: 0.125rem;
                    border-radius: 0.125rem;
                    transition: background-color 0.15s ease-in-out;
                    background: none;
                    border: none;
                    font-size: 0.75rem;
                    color: #6b7280;
                }

                .remove-item:hover {
                    background-color: rgba(55, 48, 163, 0.1);
                    color: #ef4444;
                }

                .placeholder {
                    color: #9ca3af;
                }

                .dropdown-arrow {
                    display: flex;
                    align-items: center;
                    color: #6b7280;
                    transition: transform 0.15s ease-in-out;
                    flex-shrink: 0;
                    margin-left: 0.5rem;
                }

                .search-dropdown.open .dropdown-arrow {
                    transform: rotate(180deg);
                }

                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 4px);
                    left: 0;
                    right: 0;
                    background-color: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    z-index: 9999;
                    max-height: 15rem;
                    overflow: hidden;
                    display: none;
                }

                .search-dropdown.open .dropdown-menu {
                    display: block;
                }

                .search-input {
                    width: calc(100% - 1rem);
                    padding: 0.375rem 0.5rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                    outline: none;
                    transition: border-color 0.15s ease-in-out;
                    margin: 0.5rem;
                    box-sizing: border-box;
                }

                .search-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .option-list {
                    max-height: 12rem;
                    overflow-y: auto;
                }

                .option-item {
                    padding: 0.5rem 0.75rem;
                    cursor: pointer;
                    transition: background-color 0.15s ease-in-out;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .option-item:hover {
                    background-color: #f3f4f6;
                }

                .option-item.selected {
                    background-color: #dbeafe;
                    color: #1e40af;
                }

                .option-checkbox {
                    width: 1rem;
                    height: 1rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    background-color: white;
                }

                .option-checkbox.checked {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                    color: white;
                }

                .no-results {
                    padding: 0.5rem 0.75rem;
                    color: #6b7280;
                    font-style: italic;
                    text-align: center;
                }
            </style>

            <div class="search-dropdown ${this.isOpen ? 'open' : ''}">
                <div class="dropdown-trigger ${isDisabled ? 'disabled' : ''}" tabindex="0">
                    <div class="selected-items">
                        ${isMultiple ? this.renderSelectedItems() : this.renderSingleSelection()}
                    </div>
                    <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </div>

                <div class="dropdown-menu">
                    <input 
                        type="text" 
                        class="search-input" 
                        placeholder="Search..."
                        value="${this.searchTerm}"
                    >
                    <div class="option-list">
                        ${this.renderOptions()}
                    </div>
                </div>
            </div>

            <div style="display: none;">
                <slot></slot>
            </div>
        `;
    }

    renderSelectedItems() {
        if (this.selectedItems.length === 0) {
            return `<span class="placeholder">${this.getAttribute('placeholder') || 'Select...'}</span>`;
        }

        return this.selectedItems.map(item => `
            <span class="selected-item">
                ${item.text}
                <button type="button" class="remove-item" data-value="${item.value}">×</button>
            </span>
        `).join('');
    }

    renderSingleSelection() {
        if (this.selectedItems.length === 0) {
            return `<span class="placeholder">${this.getAttribute('placeholder') || 'Select...'}</span>`;
        }
        return `<span>${this.selectedItems[0].text}</span>`;
    }

    renderOptions() {
        if (this.filteredOptions.length === 0) {
            return `<div class="no-results">No options found</div>`;
        }

        const isMultiple = this.hasAttribute('multiple');
        
        return this.filteredOptions.map(option => {
            const isSelected = this.selectedItems.some(item => item.value === option.value);
            return `
                <div class="option-item ${isSelected ? 'selected' : ''}" data-value="${option.value}">
                    ${isMultiple ? `
                        <div class="option-checkbox ${isSelected ? 'checked' : ''}">
                            ${isSelected ? '✓' : ''}
                        </div>
                    ` : ''}
                    <span>${option.text}</span>
                </div>
            `;
        }).join('');
    }
}

customElements.define('ui-search-dropdown', SearchDropdown);
export default SearchDropdown; 