/**
 * WYSIWYG Editor Component
 * 
 * A rich text editor component using Quill.js from CDN
 * 
 * Attributes:
 * - placeholder: string (default: 'Start writing...') - placeholder text
 * - value: string (default: '') - initial content
 * - readonly: boolean (default: false) - read-only mode
 * - theme: string (default: 'snow') - editor theme
 * - height: string (default: '300px') - editor height
 * - toolbar: string (default: 'full') - toolbar configuration: 'full', 'basic', 'minimal', 'custom'
 * 
 * Events:
 * - change: Fired when content changes (detail: { html: string, text: string, delta: object })
 * - focus: Fired when editor gains focus
 * - blur: Fired when editor loses focus
 * 
 * Usage:
 * <ui-wysiwyg placeholder="Write your content here..."></ui-wysiwyg>
 * <ui-wysiwyg toolbar="basic" height="200px"></ui-wysiwyg>
 * <ui-wysiwyg readonly value="<p>Read-only content</p>"></ui-wysiwyg>
 */
class Wysiwyg extends HTMLElement {
    constructor() {
        super();
        this.editor = null;
        this.quillLoaded = false;
        this.initialized = false;
    }

    static get observedAttributes() {
        return ['placeholder', 'value', 'readonly', 'theme', 'height', 'toolbar'];
    }

    connectedCallback() {
        this.loadQuill();
    }

    disconnectedCallback() {
        if (this.editor) {
            this.editor = null;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.editor && this.initialized) {
            switch (name) {
                case 'placeholder':
                    this.editor.root.setAttribute('data-placeholder', newValue);
                    break;
                case 'value':
                    // Only set content if the editor is fully initialized
                    if (this.editor && this.editor.root) {
                        this.editor.root.innerHTML = newValue || '';
                    }
                    break;
                case 'readonly':
                    this.editor.enable(!this.hasAttribute('readonly'));
                    break;
                case 'height':
                    this.editor.root.style.height = newValue;
                    break;
            }
        }
    }

    async loadQuill() {
        // Check if Quill is already loaded
        if (window.Quill) {
            this.initializeEditor();
            return;
        }

        // Load Quill CSS
        if (!document.querySelector('link[href*="quill"]')) {
            const link = document.createElement('link');
            link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // Load Quill JS
        if (!document.querySelector('script[src*="quill"]')) {
            const script = document.createElement('script');
            script.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js';
            script.onload = () => {
                this.initializeEditor();
            };
            document.head.appendChild(script);
        } else {
            // If script is already loading, wait for it
            const checkQuill = setInterval(() => {
                if (window.Quill) {
                    clearInterval(checkQuill);
                    this.initializeEditor();
                }
            }, 100);
        }
    }

    initializeEditor() {
        if (this.initialized || !window.Quill) return;

        // Clear any existing content in the component
        this.innerHTML = '';
        
        // Create editor container
        const container = document.createElement('div');
        container.className = 'wysiwyg-container';
        this.appendChild(container);

        // Get configuration
        const placeholder = this.getAttribute('placeholder') || 'Start writing...';
        const theme = this.getAttribute('theme') || 'snow';
        const height = this.getAttribute('height') || '300px';
        const toolbar = this.getAttribute('toolbar') || 'full';
        const readonly = this.hasAttribute('readonly');

        // Configure toolbar based on attribute
        let toolbarConfig;
        switch (toolbar) {
            case 'basic':
                toolbarConfig = [
                    ['bold', 'italic', 'underline'],
                    ['link', 'blockquote'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }]
                ];
                break;
            case 'minimal':
                toolbarConfig = [
                    ['bold', 'italic'],
                    ['link']
                ];
                break;
            case 'custom':
                toolbarConfig = [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'header': 1 }, { 'header': 2 }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'direction': 'rtl' }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'font': [] }],
                    [{ 'align': [] }],
                    ['clean'],
                    ['link', 'image', 'video']
                ];
                break;
            default: // 'full'
                toolbarConfig = [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'align': [] }],
                    ['blockquote', 'code-block'],
                    ['link', 'image', 'video'],
                    ['clean']
                ];
        }

        // Initialize Quill
        this.editor = new window.Quill(container, {
            theme: theme,
            placeholder: placeholder,
            readOnly: readonly,
            modules: {
                toolbar: toolbarConfig
            }
        });

        // Set initial content after editor is created
        const initialValue = this.getAttribute('value');
        if (initialValue && this.editor && this.editor.root) {
            this.editor.root.innerHTML = initialValue;
        }

        // Set height
        this.editor.root.style.height = height;

        // Add custom styles
        this.addCustomStyles();

        // Set up event listeners
        this.setupEventListeners();
        
        // Mark as fully initialized
        this.initialized = true;
    }

    addCustomStyles() {
        if (!document.getElementById('upo-ui-wysiwyg-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-wysiwyg-styles';
            style.textContent = `
                .wysiwyg-container {
                    border: 1px solid #d1d5db;
                    border-radius:0 0 0.375rem 0.375rem;
                    overflow: hidden;
                }

                .wysiwyg-container .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid #d1d5db !important;
                    background: #f9fafb !important;
                    padding: 0.5rem !important;
                    border-radius: 0.375rem 0.375rem 0 0 !important;
                }

                .wysiwyg-container .ql-toolbar.ql-snow {
                    border: none !important;
                    border-bottom: 1px solid #d1d5db !important;
                    background: #f9fafb !important;
                    padding: 0.5rem !important;
                    border-radius: 0.375rem 0.375rem 0 0 !important;
                }

                .wysiwyg-container .ql-container {
                    border: none !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    font-size: 0.875rem !important;
                    line-height: 1.5 !important;
                }

                .wysiwyg-container .ql-container.ql-snow {
                    border: none !important;
                    border-radius:0.375rem 0.375rem 0 0  !important;
                }

                .wysiwyg-container .ql-editor {
                    padding: 1rem;
                    min-height: 150px;
                    color: #374151;
                }

                .wysiwyg-container .ql-editor:focus {
                    outline: none;
                }

                .wysiwyg-container .ql-editor p {
                    margin-bottom: 0.5rem;
                }

                .wysiwyg-container .ql-editor h1,
                .wysiwyg-container .ql-editor h2,
                .wysiwyg-container .ql-editor h3,
                .wysiwyg-container .ql-editor h4,
                .wysiwyg-container .ql-editor h5,
                .wysiwyg-container .ql-editor h6 {
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    line-height: 1.25;
                }

                .wysiwyg-container .ql-editor h1 { font-size: 1.875rem; }
                .wysiwyg-container .ql-editor h2 { font-size: 1.5rem; }
                .wysiwyg-container .ql-editor h3 { font-size: 1.25rem; }
                .wysiwyg-container .ql-editor h4 { font-size: 1.125rem; }
                .wysiwyg-container .ql-editor h5 { font-size: 1rem; }
                .wysiwyg-container .ql-editor h6 { font-size: 0.875rem; }

                .wysiwyg-container .ql-editor blockquote {
                    border-left: 4px solid #d1d5db;
                    margin: 1rem 0;
                    padding-left: 1rem;
                    color: #6b7280;
                    font-style: italic;
                }

                .wysiwyg-container .ql-editor code {
                    background: #f3f4f6;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 0.875em;
                }

                .wysiwyg-container .ql-editor pre {
                    background: #f3f4f6;
                    padding: 1rem;
                    border-radius: 0.375rem;
                    overflow-x: auto;
                    margin: 1rem 0;
                }

                .wysiwyg-container .ql-editor pre code {
                    background: none;
                    padding: 0;
                }

                .wysiwyg-container .ql-editor ul,
                .wysiwyg-container .ql-editor ol {
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }

                .wysiwyg-container .ql-editor li {
                    margin-bottom: 0.25rem;
                }

                .wysiwyg-container .ql-editor a {
                    color: #3b82f6;
                    text-decoration: underline;
                }

                .wysiwyg-container .ql-editor a:hover {
                    color: #2563eb;
                }

                .wysiwyg-container .ql-editor img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.375rem;
                }

                /* Focus states */
                .wysiwyg-container:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                /* Readonly state */
                .wysiwyg-container.readonly .ql-toolbar {
                    display: none;
                }

                .wysiwyg-container.readonly .ql-editor {
                    background: #f9fafb;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .wysiwyg-container .ql-toolbar {
                        padding: 0.25rem;
                    }

                    .wysiwyg-container .ql-editor {
                        padding: 0.75rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        if (!this.editor) return;

        // Content change event
        this.editor.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user') {
                const html = this.editor.root.innerHTML;
                const text = this.editor.getText();
                
                this.dispatchEvent(new CustomEvent('change', {
                    detail: {
                        html: html,
                        text: text,
                        delta: delta
                    },
                    bubbles: true
                }));
            }
        });

        // Focus event
        this.editor.on('focus', () => {
            this.dispatchEvent(new CustomEvent('focus', { bubbles: true }));
        });

        // Blur event
        this.editor.on('blur', () => {
            this.dispatchEvent(new CustomEvent('blur', { bubbles: true }));
        });
    }

    // Public methods
    getValue() {
        return this.editor ? this.editor.root.innerHTML : '';
    }

    setValue(html) {
        if (this.editor) {
            this.editor.root.innerHTML = html;
        }
    }

    getText() {
        return this.editor ? this.editor.getText() : '';
    }

    setText(text) {
        if (this.editor) {
            this.editor.setText(text);
        }
    }

    enable() {
        if (this.editor) {
            this.editor.enable();
        }
    }

    disable() {
        if (this.editor) {
            this.editor.disable();
        }
    }

    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }

    blur() {
        if (this.editor) {
            this.editor.blur();
        }
    }

    // Getters and setters for attributes
    get value() {
        return this.getValue();
    }

    set value(val) {
        this.setValue(val);
    }

    get placeholder() {
        return this.getAttribute('placeholder') || 'Start writing...';
    }

    set placeholder(val) {
        this.setAttribute('placeholder', val);
    }
}

customElements.define('ui-wysiwyg', Wysiwyg);
export default Wysiwyg; 