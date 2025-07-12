class FileUpload extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.files = [];
    this.isDragOver = false;
    this.uploadProgress = {};
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  static get observedAttributes() {
    return ['multiple', 'accept', 'max-size', 'max-files', 'disabled', 'status'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      this.setupEventListeners();
    }
  }

  render() {
    const multiple = this.hasAttribute('multiple');
    const accept = this.getAttribute('accept') || '';
    const maxSize = this.getAttribute('max-size') || '';
    const maxFiles = this.getAttribute('max-files') || '';
    const disabled = this.hasAttribute('disabled');
    const status = this.getAttribute('status') || '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .file-upload {
          border: 2px dashed #d1d5db;
          border-radius: 0.5rem;
          padding: 2rem;
          text-align: center;
          background: #f9fafb;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .file-upload:hover:not(.disabled) {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .file-upload.drag-over {
          border-color: #3b82f6;
          background: #dbeafe;
          transform: scale(1.02);
        }

        .file-upload.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-upload.success {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .file-upload.warning {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .file-upload.error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .file-upload.info {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .upload-icon {
          width: 3rem;
          height: 3rem;
          margin: 0 auto 1rem;
          color: #6b7280;
        }

        .upload-icon svg {
          width: 100%;
          height: 100%;
        }

        .upload-text {
          margin-bottom: 0.5rem;
          font-size: 1.125rem;
          font-weight: 500;
          color: #374151;
        }

        .upload-hint {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .file-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .file-input:disabled {
          cursor: not-allowed;
        }

        .file-list {
          margin-top: 1rem;
          text-align: left;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .file-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          transition: all 0.2s ease;
          min-width: 200px;
          max-width: 300px;
          flex-shrink: 0;
        }

        .file-item:hover {
          border-color: #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .file-icon {
          width: 1.5rem;
          height: 1.5rem;
          margin-right: 0.5rem;
          color: #6b7280;
          flex-shrink: 0;
        }

        .file-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .file-name {
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.125rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.875rem;
        }

        .file-size {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .file-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          position: relative;
          z-index: 10;
          flex-shrink: 0;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 0.125rem;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-btn:hover {
          background: #fef2f2;
        }

        .progress-bar {
          width: 100%;
          height: 0.25rem;
          background: #e5e7eb;
          border-radius: 0.125rem;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .success-message {
          color: #10b981;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .warning-message {
          color: #f59e0b;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .info-message {
          color: #3b82f6;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
      </style>

      <div class="file-upload ${disabled ? 'disabled' : ''} ${status}">
        <div class="upload-icon">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
          </svg>
        </div>
        
        <div class="upload-text">
          ${this.getAttribute('text') || 'Drop files here or click to upload'}
        </div>
        
        <div class="upload-hint">
          ${this.getUploadHint(accept, maxSize, maxFiles)}
        </div>

        <input 
          type="file" 
          class="file-input" 
          ${multiple ? 'multiple' : ''} 
          ${accept ? `accept="${accept}"` : ''}
          ${disabled ? 'disabled' : ''}
        >

        <div class="file-list" id="fileList"></div>
      </div>
    `;
  }

  getUploadHint(accept, maxSize, maxFiles) {
    let hint = '';
    
    if (accept) {
      const types = accept.split(',').map(t => t.trim().replace('*', ''));
      hint += `Accepted formats: ${types.join(', ')}`;
    }
    
    if (maxSize) {
      if (hint) hint += ' • ';
      hint += `Max size: ${this.formatFileSize(maxSize)}`;
    }
    
    if (maxFiles) {
      if (hint) hint += ' • ';
      hint += `Max files: ${maxFiles}`;
    }
    
    return hint || 'All file types accepted';
  }

  setupEventListeners() {
    const uploadArea = this.shadowRoot.querySelector('.file-upload');
    const fileInput = this.shadowRoot.querySelector('.file-input');

    // Click to upload
    uploadArea.addEventListener('click', (e) => {
      // Don't trigger file input if clicking on file items or remove buttons
      if (e.target.closest('.file-item') || e.target.closest('.remove-btn')) {
        return;
      }
      
      if (!this.hasAttribute('disabled') && e.target !== fileInput) {
        fileInput.click();
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!this.hasAttribute('disabled')) {
        this.isDragOver = true;
        uploadArea.classList.add('drag-over');
      }
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!e.relatedTarget || !uploadArea.contains(e.relatedTarget)) {
        this.isDragOver = false;
        uploadArea.classList.remove('drag-over');
      }
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.isDragOver = false;
      uploadArea.classList.remove('drag-over');
      
      if (!this.hasAttribute('disabled')) {
        this.handleFiles(e.dataTransfer.files);
      }
    });
  }

  handleFiles(fileList) {
    const files = Array.from(fileList);
    const maxFiles = parseInt(this.getAttribute('max-files')) || Infinity;
    const maxSize = parseInt(this.getAttribute('max-size')) || Infinity;
    const accept = this.getAttribute('accept');

    // Check max files
    if (this.files.length + files.length > maxFiles) {
      this.showError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > maxSize) {
        this.showError(`${file.name} is too large. Max size: ${this.formatFileSize(maxSize)}`);
        return false;
      }

      // Check file type
      if (accept) {
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const isValidType = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.match(new RegExp(type.replace('*', '.*')));
        });
        
        if (!isValidType) {
          this.showError(`${file.name} is not an accepted file type`);
          return false;
        }
      }

      return true;
    });

    // Add valid files
    validFiles.forEach(file => {
      this.files.push(file);
      this.uploadProgress[file.name] = 0;
    });

    this.updateFileList();
    this.dispatchEvent(new CustomEvent('files-changed', {
      detail: { files: this.files }
    }));
  }

  updateFileList() {
    const fileList = this.shadowRoot.querySelector('#fileList');
    fileList.innerHTML = '';

    this.files.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      fileItem.innerHTML = `
        <div class="file-icon">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
          </svg>
        </div>
        
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${this.formatFileSize(file.size)}</div>
          ${this.uploadProgress[file.name] > 0 ? `
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${this.uploadProgress[file.name]}%"></div>
            </div>
          ` : ''}
        </div>
        
        <div class="file-actions">
          <button class="remove-btn" data-index="${index}">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      `;

      fileList.appendChild(fileItem);
    });

    // Add remove event listeners
    fileList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const index = parseInt(btn.dataset.index);
        this.removeFile(index);
      });
    });
  }

  removeFile(index) {
    const file = this.files[index];
    this.files.splice(index, 1);
    delete this.uploadProgress[file.name];
    
    this.updateFileList();
    this.dispatchEvent(new CustomEvent('files-changed', {
      detail: { files: this.files }
    }));
  }

  setUploadProgress(fileName, progress) {
    this.uploadProgress[fileName] = progress;
    this.updateFileList();
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const uploadArea = this.shadowRoot.querySelector('.file-upload');
    uploadArea.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Public methods
  getFiles() {
    return this.files;
  }

  clear() {
    this.files = [];
    this.uploadProgress = {};
    this.updateFileList();
  }
}

customElements.define('ui-file-upload', FileUpload);
export default FileUpload;