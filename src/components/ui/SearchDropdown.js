import '@/components/ui/Toast.js';

class SearchDropdown extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // State
        this.isOpen = false;
        this.selectedValues = new Set();
        this.searchTerm = '';
        this._options = [];
        this.focusedIndex = -1;

        // Structure
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    width: 100%;
                    position: relative;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .upo-search-dropdown-trigger {
                    display: flex; align-items: center; justify-content: space-between; width: 100%;
                    padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem;
                    background-color: #ffffff; cursor: pointer; font-size: 0.875rem; min-height: 2.5rem;
                    box-sizing: border-box; user-select: none;
                }
                :host([disabled]) .upo-search-dropdown-trigger { 
                    background-color: #f9fafb; color: #9ca3af; cursor: not-allowed; 
                }
                .upo-search-dropdown-selection { flex: 1; display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; min-height: 1.25rem; }
                .upo-search-dropdown-placeholder { color: #9ca3af; }
                .upo-search-dropdown-tag { 
                    display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.125rem 0.5rem;
                    background-color: #e0e7ff; color: #3730a3; border-radius: 0.25rem; font-size: 0.75rem;
                }
                .upo-search-dropdown-tag-remove { cursor: pointer; background: none; border: none; font-size: 1rem; color: #6b7280; padding: 0; line-height: 1; }
                .upo-search-dropdown-arrow { display: flex; align-items: center; color: #6b7280; transition: transform 0.2s; }
                .open .upo-search-dropdown-arrow { transform: rotate(180deg); }
                .upo-search-dropdown-menu { display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 0.375rem; z-index: 100; }
                .open .upo-search-dropdown-menu { display: block; }
                .upo-search-dropdown-search { padding: 0.5rem; border-bottom: 1px solid #e5e7eb; }
                .upo-search-dropdown-search-input { width: 100%; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.875rem; box-sizing: border-box; }
                .upo-search-dropdown-options { max-height: 12rem; overflow-y: auto; }
                .upo-search-dropdown-option { padding: 0.5rem 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
                .upo-search-dropdown-option:hover { background-color: #f3f4f6; }
                .upo-search-dropdown-option.focused { background-color: #eff6ff; }
                .upo-search-dropdown-option.selected { background-color: #dbeafe; color: #1e40af; }
                .upo-search-dropdown-option.disabled { color: #9ca3af; cursor: not-allowed; }
                .upo-search-dropdown-option-checkbox { width: 1rem; height: 1rem; border: 1px solid #d1d5db; border-radius: 0.25rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .upo-search-dropdown-option.selected .upo-search-dropdown-option-checkbox { background-color: #3b82f6; border-color: #3b82f6; color: white; }
                .upo-search-dropdown-empty { padding: 0.5rem 0.75rem; color: #6b7280; text-align: center; }
            </style>
            <div class="upo-search-dropdown" part="container">
                <div class="upo-search-dropdown-trigger" part="trigger">
                    <div class="upo-search-dropdown-selection" part="selection"></div>
                    <div class="upo-search-dropdown-arrow" part="arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
                <div class="upo-search-dropdown-menu" part="menu">
                    <div class="upo-search-dropdown-search" part="search-container">
                        <input type="text" class="upo-search-dropdown-search-input" part="search-input" placeholder="Search...">
                    </div>
                    <div class="upo-search-dropdown-options" part="options-container"></div>
                </div>
            </div>
            <slot style="display: none;"></slot>
        `;

        // Element references
        this.container = this.shadowRoot.querySelector('.upo-search-dropdown');
        this.trigger = this.shadowRoot.querySelector('.upo-search-dropdown-trigger');
        this.selection = this.shadowRoot.querySelector('.upo-search-dropdown-selection');
        this.searchInput = this.shadowRoot.querySelector('.upo-search-dropdown-search-input');
        this.optionsContainer = this.shadowRoot.querySelector('.upo-search-dropdown-options');
        this.slot = this.shadowRoot.querySelector('slot');
    }

    static get observedAttributes() {
        return ['value', 'disabled', 'multiple', 'placeholder'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        switch (name) {
            case 'value':
                this._updateValueFromAttribute();
                break;
            case 'disabled':
                this._updateDisabled();
                break;
        }
    }

    connectedCallback() {
        this._updateValueFromAttribute();
        this._updateDisabled();
        this._setupEventListeners();
    }

    _setupEventListeners() {
        this.trigger.addEventListener('click', () => this.toggleDropdown());
        this.searchInput.addEventListener('input', (e) => this._onSearch(e));
        this.searchInput.addEventListener('keydown', (e) => this._onSearchKeydown(e));
        this.slot.addEventListener('slotchange', () => this._onSlotChange());
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                this.closeDropdown();
            }
        }, true);
    }

    _onSlotChange() {
        this._options = this.slot.assignedElements({ flatten: true }).filter(el => el.matches('ui-option'));
        this._renderOptions();
        this._renderSelection();
    }

    _updateValueFromAttribute() {
        const value = this.getAttribute('value');
        this.selectedValues.clear();
        if (value) {
            try {
                const values = this.hasAttribute('multiple') ? JSON.parse(value) : [value];
                if (Array.isArray(values)) {
                    values.forEach(v => this.selectedValues.add(String(v)));
                }
            } catch (e) { /* Ignore parse error */ }
        }
        this._renderSelection();
    }

    _updateDisabled() {
        if (this.hasAttribute('disabled')) {
            this.container.classList.add('disabled');
            this.closeDropdown();
        } else {
            this.container.classList.remove('disabled');
        }
    }

    toggleDropdown() {
        if (this.hasAttribute('disabled')) return;
        this.isOpen ? this.closeDropdown() : this.openDropdown();
    }

    openDropdown() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.container.classList.add('open');
        this._renderOptions();
        this.searchInput.focus();
    }

    closeDropdown() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.container.classList.remove('open');
        this.searchTerm = '';
        this.searchInput.value = '';
        this.focusedIndex = -1;
    }

    _onSearch(e) {
        this.searchTerm = e.target.value;
        this.focusedIndex = -1;
        this._renderOptions();
        this.dispatchEvent(new CustomEvent('search', { detail: { term: this.searchTerm } }));
    }

    _onSearchKeydown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusedIndex = Math.min(this.focusedIndex + 1, this._getFilteredOptions().length - 1);
                this._renderOptions();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
                this._renderOptions();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.focusedIndex > -1) {
                    this._selectOption(this._getFilteredOptions()[this.focusedIndex]);
                }
                break;
            case 'Escape':
                this.closeDropdown();
                break;
        }
    }

    _renderSelection() {
        if (this.selectedValues.size === 0) {
            this.selection.innerHTML = `<span class="upo-search-dropdown-placeholder">${this.getAttribute('placeholder') || 'Select an option'}</span>`;
            return;
        }

        if (this.hasAttribute('multiple')) {
            this.selection.innerHTML = Array.from(this.selectedValues).map(value => {
                const option = this._options.find(opt => opt.getAttribute('value') === value);
                return `
                    <span class="upo-search-dropdown-tag" data-value="${value}">
                        ${option ? option.textContent.trim() : value}
                        <button class="upo-search-dropdown-tag-remove" aria-label="Remove">×</button>
                    </span>
                `;
            }).join('');
            this.selection.querySelectorAll('.upo-search-dropdown-tag-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = e.currentTarget.parentElement.dataset.value;
                    this._deselectValue(value);
                });
            });
        } else {
            const value = Array.from(this.selectedValues)[0];
            const option = this._options.find(opt => opt.getAttribute('value') === value);
            this.selection.innerHTML = `<span>${option ? option.textContent.trim() : value}</span>`;
        }
    }

    _getFilteredOptions() {
        if (!this.searchTerm) return this._options;
        return this._options.filter(option => {
            const text = option.textContent.toLowerCase();
            const value = option.getAttribute('value')?.toLowerCase() || '';
            return text.includes(this.searchTerm.toLowerCase()) || value.includes(this.searchTerm.toLowerCase());
        });
    }

    _renderOptions() {
        const filteredOptions = this._getFilteredOptions();
        if (filteredOptions.length === 0) {
            this.optionsContainer.innerHTML = `<div class="upo-search-dropdown-empty">No results found</div>`;
            return;
        }

        this.optionsContainer.innerHTML = filteredOptions.map((option, index) => {
            const value = option.getAttribute('value');
            const text = option.textContent.trim();
            const isSelected = this.selectedValues.has(value);
            const isFocused = this.focusedIndex === index;
            const isDisabled = option.hasAttribute('disabled');
            
            let classes = 'upo-search-dropdown-option';
            if (isSelected) classes += ' selected';
            if (isFocused) classes += ' focused';
            if (isDisabled) classes += ' disabled';

            return `
                <div class="${classes}" data-value="${value}" role="option" aria-selected="${isSelected}">
                    ${this.hasAttribute('multiple') ? `<div class="upo-search-dropdown-option-checkbox">${isSelected ? '✓' : ''}</div>` : ''}
                    <span class="upo-search-dropdown-option-text">${text}</span>
                </div>
            `;
        }).join('');

        this.optionsContainer.querySelectorAll('.upo-search-dropdown-option').forEach(el => {
            el.addEventListener('click', () => {
                const option = this._options.find(o => o.getAttribute('value') === el.dataset.value);
                if (option && !option.hasAttribute('disabled')) {
                    this._selectOption(option);
                }
            });
        });
    }

    _selectOption(option) {
        const value = option.getAttribute('value');
        if (this.hasAttribute('multiple')) {
            this.selectedValues.has(value) ? this.selectedValues.delete(value) : this.selectedValues.add(value);
        } else {
            this.selectedValues.clear();
            this.selectedValues.add(value);
            this.closeDropdown();
        }
        this._renderSelection();
        this._renderOptions();
        this._dispatchChangeEvent();
    }

    _deselectValue(value) {
        this.selectedValues.delete(value);
        this._renderSelection();
        this._renderOptions();
        this._dispatchChangeEvent();
    }

    _dispatchChangeEvent() {
        const value = this.hasAttribute('multiple') 
            ? JSON.stringify(Array.from(this.selectedValues)) 
            : (this.selectedValues.values().next().value || null);
        
        this.setAttribute('value', value);
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value },
            bubbles: true,
            composed: true
        }));
    }

    get value() {
        if (this.hasAttribute('multiple')) {
            return JSON.stringify(Array.from(this.selectedValues));
        }
        return this.selectedValues.values().next().value || null;
    }

    set value(val) {
        this.setAttribute('value', val);
    }
}

customElements.define('ui-search-dropdown', SearchDropdown);
export default SearchDropdown;