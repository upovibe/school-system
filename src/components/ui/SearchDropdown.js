import '@/components/ui/Toast.js';

/**
 * Search Dropdown Component (V2)
 * A robust, encapsulated, searchable dropdown using a Shadow DOM to prevent style and event conflicts.
 */
class SearchDropdown extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // --- State ---
        this.isOpen = false;
        this.selectedValues = new Set();
        this.searchTerm = '';
        this._options = [];
        this.focusedIndex = -1;
    }

    static get observedAttributes() {
        return ['value', 'disabled', 'multiple', 'placeholder'];
    }

    // --- Lifecycle Callbacks ---
    connectedCallback() {
        // Only render the component's structure once.
        if (!this.shadowRoot.firstChild) {
            this.shadowRoot.innerHTML = this.render();
        }

        // --- Element References ---
        // It's best practice to query for elements in connectedCallback.
        this.container = this.shadowRoot.querySelector('.search-dropdown');
        this.trigger = this.shadowRoot.querySelector('.search-dropdown__trigger');
        this.selection = this.shadowRoot.querySelector('.search-dropdown__selection');
        this.searchInput = this.shadowRoot.querySelector('.search-dropdown__search-input');
        this.optionsContainer = this.shadowRoot.querySelector('.search-dropdown__options');
        this.slotEl = this.shadowRoot.querySelector('slot');

        // --- Initial Setup ---
        this._setupEventListeners();
        this._onSlotChange(); // Manually trigger to process initial options
        this._updateFromAttributes();
    }

    // Ensure element references are available
    _ensureElements() {
        if (!this.selection) {
            this.selection = this.shadowRoot.querySelector('.search-dropdown__selection');
        }
        if (!this.optionsContainer) {
            this.optionsContainer = this.shadowRoot.querySelector('.search-dropdown__options');
        }
        if (!this.searchInput) {
            this.searchInput = this.shadowRoot.querySelector('.search-dropdown__search-input');
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        this._updateFromAttributes();
    }

    // --- Event Setup ---
    _setupEventListeners() {
        this._ensureElements();
        
        if (this.trigger) {
            this.trigger.addEventListener('click', () => this.toggleDropdown());
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this._onSearch(e));
            this.searchInput.addEventListener('keydown', (e) => this._onSearchKeydown(e));
        }
        
        if (this.slotEl) {
            this.slotEl.addEventListener('slotchange', () => this._onSlotChange());
        }
        
        // Close dropdown if clicking outside of the component
        document.addEventListener('click', (e) => {
            if (!e.composedPath().includes(this)) {
                this.closeDropdown();
            }
        }, true);
    }

    // --- State & Attribute Updates ---
    _updateFromAttributes() {
        this._updateValueFromAttribute();
        this._updateDisabled();
    }

    _updateValueFromAttribute() {
        const valueAttr = this.getAttribute('value');
        this.selectedValues.clear();
        if (valueAttr && valueAttr !== '') {
            try {
                const values = this.hasAttribute('multiple') ? JSON.parse(valueAttr) : [valueAttr];
                if (Array.isArray(values)) {
                    values.forEach(v => this.selectedValues.add(String(v)));
                }
            } catch (e) { 
                console.error('SearchDropdown: Invalid value attribute format.', e);
            }
        }
        this._renderSelection();
    }

    _updateDisabled() {
        this.trigger.classList.toggle('disabled', this.hasAttribute('disabled'));
        if (this.hasAttribute('disabled')) this.closeDropdown();
    }

    // --- Core Logic ---
    toggleDropdown() {
        if (this.hasAttribute('disabled')) return;
        this.isOpen ? this.closeDropdown() : this.openDropdown();
    }

    openDropdown() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.container.classList.add('open');
        this._renderOptions();
        this._ensureElements();
        if (this.searchInput) {
            this.searchInput.focus();
        }
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
        this._ensureElements();
        this.searchTerm = e.target.value;
        this.focusedIndex = -1;
        this._renderOptions();
        this.dispatchEvent(new CustomEvent('search', { detail: { term: this.searchTerm } }));
    }

    _onSearchKeydown(e) {
        const options = this._getFilteredOptions();
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusedIndex = Math.min(this.focusedIndex + 1, options.length - 1);
                this._renderOptions();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
                this._renderOptions();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.focusedIndex > -1 && options[this.focusedIndex]) {
                    this._selectOption(options[this.focusedIndex]);
                }
                break;
            case 'Escape':
                this.closeDropdown();
                break;
        }
    }

    _onSlotChange() {
        this._options = this.slotEl.assignedElements({ flatten: true }).filter(el => el.tagName === 'UI-OPTION');
        this._renderOptions();
        this._renderSelection();
    }

    _selectOption(option) {
        if (option.hasAttribute('disabled')) return;
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

    _dispatchChangeEvent() {
        const value = this.hasAttribute('multiple') 
            ? JSON.stringify(Array.from(this.selectedValues)) 
            : (this.selectedValues.values().next().value || '');
        
        this.setAttribute('value', value);

        this.dispatchEvent(new CustomEvent('change', {
            detail: { value },
            bubbles: true,
            composed: true
        }));
    }

    get value() {
        return this.getAttribute('value') || '';
    }

    set value(val) {
        this.setAttribute('value', val);
    }

    // --- Rendering ---
    _getFilteredOptions() {
        if (!this.searchTerm) return this._options;
        const term = this.searchTerm.toLowerCase();
        return this._options.filter(option => 
            option.textContent.toLowerCase().includes(term) || 
            (option.getAttribute('value') || '').toLowerCase().includes(term)
        );
    }

    _renderSelection() {
        this._ensureElements();
        if (!this.selection) return;

        if (this.selectedValues.size === 0) {
            this.selection.innerHTML = `<span class="search-dropdown__placeholder">${this.getAttribute('placeholder') || 'Select an option'}</span>`;
            return;
        }

        if (this.hasAttribute('multiple')) {
            this.selection.innerHTML = Array.from(this.selectedValues).map(value => {
                const option = this._options.find(opt => opt.getAttribute('value') === value);
                return `
                    <span class="search-dropdown__tag" data-value="${value}">
                        ${option ? option.textContent.trim() : value}
                        <button class="search-dropdown__tag-remove" aria-label="Remove">×</button>
                    </span>
                `;
            }).join('');
            this.selection.querySelectorAll('.search-dropdown__tag-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = e.currentTarget.parentElement.dataset.value;
                    this.selectedValues.delete(value);
                    this._renderSelection();
                    this._renderOptions();
                    this._dispatchChangeEvent();
                });
            });
        } else {
            const value = this.selectedValues.values().next().value;
            const option = this._options.find(opt => opt.getAttribute('value') === value);
            this.selection.innerHTML = `<span>${option ? option.textContent.trim() : (value || '')}</span>`;
        }
    }

    _renderOptions() {
        this._ensureElements();
        if (!this.optionsContainer) return;

        const options = this._getFilteredOptions();
        if (options.length === 0) {
            this.optionsContainer.innerHTML = `<div class="search-dropdown__empty">No results found</div>`;
            return;
        }

        this.optionsContainer.innerHTML = options.map((option, index) => {
            const value = option.getAttribute('value');
            const text = option.textContent.trim();
            const isSelected = this.selectedValues.has(value);
            const isFocused = this.focusedIndex === index;
            const isDisabled = option.hasAttribute('disabled');
            
            let classes = 'search-dropdown__option';
            if (isSelected) classes += ' selected';
            if (isFocused) classes += ' focused';
            if (isDisabled) classes += ' disabled';

            return `
                <div class="${classes}" data-value="${value}" role="option" aria-selected="${isSelected}">
                    ${this.hasAttribute('multiple') ? `<div class="search-dropdown__option-checkbox">${isSelected ? '✓' : ''}</div>` : ''}
                    <span class="search-dropdown__option-text">${text}</span>
                </div>
            `;
        }).join('');

        this.optionsContainer.querySelectorAll('.search-dropdown__option').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const option = this._options.find(o => o.getAttribute('value') === el.dataset.value);
                if (option) this._selectOption(option);
            });
        });
    }

    render() {
        return `
            <style>
                /* The component uses standard, self-contained CSS. It does not use Tailwind or any external framework. */
                :host { display: inline-block; width: 100%; position: relative; font-family: sans-serif; }
                .search-dropdown { position: relative; }
                .search-dropdown__trigger { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background-color: #fff; cursor: pointer; min-height: 38px; box-sizing: border-box; }
                .search-dropdown__trigger.disabled { background-color: #f5f5f5; color: #999; cursor: not-allowed; }
                .search-dropdown__selection { flex: 1; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; min-height: 20px; }
                .search-dropdown__placeholder { color: #999; }
                .search-dropdown__tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background-color: #e0e7ff; color: #3730a3; border-radius: 4px; font-size: 12px; }
                .search-dropdown__tag-remove { cursor: pointer; background: none; border: none; font-size: 16px; color: #6b7280; padding: 0; line-height: 1; }
                .search-dropdown__arrow { display: flex; align-items: center; color: #6b7280; transition: transform 0.2s; }
                .search-dropdown.open .search-dropdown__arrow { transform: rotate(180deg); }
                .search-dropdown__menu { display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; background-color: #fff; border: 1px solid #ccc; border-radius: 4px; z-index: 1000; }
                .search-dropdown.open .search-dropdown__menu { display: block; }
                .search-dropdown__search-container { padding: 8px; border-bottom: 1px solid #eee; }
                .search-dropdown__search-input { width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
                .search-dropdown__options { max-height: 192px; overflow-y: auto; }
                .search-dropdown__option { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                .search-dropdown__option:hover { background-color: #f0f0f0; }
                .search-dropdown__option.focused { background-color: #e6f7ff; }
                .search-dropdown__option.selected { background-color: #dbeafe; color: #1e40af; }
                .search-dropdown__option.disabled { color: #aaa; cursor: not-allowed; }
                .search-dropdown__option-checkbox { width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .search-dropdown__option.selected .search-dropdown__option-checkbox { background-color: #3b82f6; border-color: #3b82f6; color: white; }
                .search-dropdown__empty { padding: 8px 12px; color: #666; text-align: center; }
            </style>
            <div class="search-dropdown">
                <div class="search-dropdown__trigger">
                    <div class="search-dropdown__selection"></div>
                    <div class="search-dropdown__arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
                <div class="search-dropdown__menu">
                    <div class="search-dropdown__search-container">
                        <input type="text" class="search-dropdown__search-input" placeholder="Search...">
                    </div>
                    <div class="search-dropdown__options"></div>
                </div>
            </div>
            <slot style="display: none;"></slot>
        `;
    }
}

customElements.define('ui-search-dropdown', SearchDropdown);
export default SearchDropdown;
