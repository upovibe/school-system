/**
 * Image Carousel Component
 * 
 * A specialized carousel for image preview with navigation controls and content overlay.
 * Supports left/right navigation, content overlay with dark gradient, and customizable content.
 * 
 * Attributes:
 * - autoplay: boolean (default: false)
 * - interval: number (default: 5000)
 * - show-indicators: boolean (default: true)
 * - show-controls: boolean (default: true)
 * - height: string (default: "400px") - Height of the carousel
 * 
 * Usage:
 * <ui-image-carousel height="500px">
 *   <ui-image-carousel-item 
 *     src="image1.jpg" 
 *     alt="Image 1"
 *     title="Beautiful Landscape"
 *     description="A stunning view of mountains and lakes">
 *     <div slot="content">
 *       <h3>Custom Content</h3>
 *       <p>Any HTML content can go here</p>
 *     </div>
 *   </ui-image-carousel-item>
 *   <ui-image-carousel-item 
 *     src="image2.jpg" 
 *     alt="Image 2"
 *     title="City View"
 *     description="Urban landscape at sunset">
 *   </ui-image-carousel-item>
 * </ui-image-carousel>
 */
class ImageCarousel extends HTMLElement {
    constructor() {
        super();
        
        // Create the carousel structure
        this.carouselContainer = document.createElement('div');
        this.leftControl = document.createElement('button');
        this.contentContainer = document.createElement('div');
        this.carouselTrack = document.createElement('div');
        this.rightControl = document.createElement('button');
        this.indicatorsContainer = document.createElement('div');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Carousel state
        this.currentIndex = 0;
        this.totalSlides = 0;
        this.autoplayInterval = null;
        this.isTransitioning = false;
        
        // Build the structure
        this.contentContainer.appendChild(this.carouselTrack);
        this.carouselContainer.appendChild(this.leftControl);
        this.carouselContainer.appendChild(this.contentContainer);
        this.carouselContainer.appendChild(this.rightControl);
        this.carouselContainer.appendChild(this.indicatorsContainer);
        this.appendChild(this.carouselContainer);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }

    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-image-carousel-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-image-carousel-styles';
            style.textContent = `
                .upo-image-carousel {
                    position: relative;
                    width: 100%;
                    height: 400px;
                    overflow: hidden;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                .upo-image-carousel-content-container {
                    flex: 1;
                    height: 100%;
                    overflow: hidden;
                }
                
                .upo-image-carousel-track {
                    display: flex;
                    transition: transform 0.5s ease-in-out;
                    height: 100%;
                    width: 100%;
                }
                
                .upo-image-carousel-item {
                    flex-shrink: 0;
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                }
                
                .upo-image-carousel-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                
                .upo-image-carousel-item-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                
                /* Navigation Controls - positioned on left and right */
                .upo-image-carousel-control {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 3rem;
                    height: 3rem;
                    border-radius: 50%;
                    background-color: rgba(255, 255, 255, 0.9);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    color: #374151;
                    transition: all 0.2s ease-in-out;
                    z-index: 20;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                
                .upo-image-carousel-control:hover {
                    background-color: rgba(255, 255, 255, 1);
                    transform: translateY(-50%) scale(1.05);
                }
                
                .upo-image-carousel-control:active {
                    transform: translateY(-50%) scale(0.95);
                }
                
                .upo-image-carousel-control:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .upo-image-carousel-control.prev {
                    left: 1rem;
                }
                
                .upo-image-carousel-control.next {
                    right: 1rem;
                }
                
                /* Content Overlay with Dark Gradient */
                .upo-image-carousel-content {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 2rem 1.5rem 1.5rem;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
                    color: white;
                    z-index: 10;
                }
                
                .upo-image-carousel-item-content {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 2rem 1.5rem 1.5rem;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
                    color: white;
                    z-index: 10;
                }
                
                .upo-image-carousel-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                    line-height: 1.2;
                }
                
                .upo-image-carousel-description {
                    font-size: 1rem;
                    margin: 0 0 1rem 0;
                    opacity: 0.9;
                    line-height: 1.4;
                }
                
                .upo-image-carousel-item-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                    line-height: 1.2;
                }
                
                .upo-image-carousel-item-description {
                    font-size: 1rem;
                    margin: 0 0 1rem 0;
                    opacity: 0.9;
                    line-height: 1.4;
                }
                
                .upo-image-carousel-custom-content {
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                
                .upo-image-carousel-item-custom-content {
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                
                /* Indicators */
                .upo-image-carousel-indicators {
                    position: absolute;
                    bottom: 1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 0.5rem;
                    z-index: 15;
                }
                
                .upo-image-carousel-indicator {
                    width: 0.75rem;
                    height: 0.75rem;
                    border-radius: 50%;
                    background-color: rgba(255, 255, 255, 0.5);
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                }
                
                .upo-image-carousel-indicator.active {
                    background-color: rgba(255, 255, 255, 1);
                    transform: scale(1.2);
                }
                
                .upo-image-carousel-indicator:hover {
                    background-color: rgba(255, 255, 255, 0.8);
                }
                
                /* Responsive */
                @media (max-width: 640px) {
                    .upo-image-carousel {
                        height: 300px;
                    }
                    
                    .upo-image-carousel-control {
                        width: 2.5rem;
                        height: 2.5rem;
                        font-size: 1rem;
                    }
                    
                    .upo-image-carousel-control.prev {
                        left: 0.5rem;
                    }
                    
                    .upo-image-carousel-control.next {
                        right: 0.5rem;
                    }
                    
                    .upo-image-carousel-content {
                        padding: 1.5rem 1rem 1rem;
                    }
                    
                    .upo-image-carousel-title {
                        font-size: 1.25rem;
                    }
                    
                    .upo-image-carousel-description {
                        font-size: 0.9rem;
                    }
                    
                    .upo-image-carousel-indicators {
                        bottom: 0.5rem;
                    }
                    
                    .upo-image-carousel-indicator {
                        width: 0.5rem;
                        height: 0.5rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    static get observedAttributes() {
        return ['autoplay', 'interval', 'show-indicators', 'show-controls', 'height'];
    }

    get autoplay() {
        return this.hasAttribute('autoplay');
    }

    get interval() {
        return parseInt(this.getAttribute('interval')) || 5000;
    }

    get showIndicators() {
        return !this.hasAttribute('show-indicators') || this.getAttribute('show-indicators') !== 'false';
    }

    get showControls() {
        return !this.hasAttribute('show-controls') || this.getAttribute('show-controls') !== 'false';
    }

    get height() {
        return this.getAttribute('height') || '400px';
    }

    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Apply CSS classes
        this.carouselContainer.className = 'upo-image-carousel';
        this.contentContainer.className = 'upo-image-carousel-content-container';
        this.carouselTrack.className = 'upo-image-carousel-track';

        // Set height
        this.carouselContainer.style.height = this.height;

        // Process children and build carousel
        this.processChildren();
        this.addControls();
        this.addIndicators();
        this.updateTrackPosition();
        this.updateIndicators();
        this.updateControls();

        // Start autoplay if enabled
        if (this.autoplay) {
            this.startAutoplay();
        }
    }

    processChildren() {
        const items = Array.from(this.querySelectorAll('ui-image-carousel-item'));
        this.totalSlides = items.length;

        items.forEach((item, index) => {
            // Move the item into the carousel track
            this.carouselTrack.appendChild(item);
            
            // Set width to 100% for full-width slides
            item.style.width = '100%';
            item.style.flexShrink = '0';
            
            // Add click handler for indicators
            item.addEventListener('click', () => this.goToSlide(index));
        });

        this.carouselTrack.style.width = `${this.totalSlides * 100}%`;
    }

    addControls() {
        if (!this.showControls) {
            this.leftControl.style.display = 'none';
            this.rightControl.style.display = 'none';
            return;
        }

        this.leftControl.className = 'upo-image-carousel-control prev';
        this.leftControl.innerHTML = '<i class="fas fa-chevron-left"></i>';
        this.leftControl.addEventListener('click', () => this.previous());

        this.rightControl.className = 'upo-image-carousel-control next';
        this.rightControl.innerHTML = '<i class="fas fa-chevron-right"></i>';
        this.rightControl.addEventListener('click', () => this.next());
    }

    addIndicators() {
        if (!this.showIndicators || this.totalSlides <= 1) {
            this.indicatorsContainer.style.display = 'none';
            return;
        }

        this.indicatorsContainer.className = 'upo-image-carousel-indicators';

        for (let i = 0; i < this.totalSlides; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'upo-image-carousel-indicator';
            indicator.addEventListener('click', () => this.goToSlide(i));
            this.indicatorsContainer.appendChild(indicator);
        }
    }

    updateTrackPosition() {
        const translateX = -(this.currentIndex * 100);
        this.carouselTrack.style.transform = `translateX(${translateX}%)`;
    }

    updateIndicators() {
        if (!this.showIndicators) return;

        const indicators = this.indicatorsContainer.querySelectorAll('.upo-image-carousel-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
    }

    updateControls() {
        if (!this.showControls) return;

        this.leftControl.disabled = this.currentIndex === 0;
        this.rightControl.disabled = this.currentIndex === this.totalSlides - 1;
    }

    next() {
        if (this.isTransitioning || this.currentIndex >= this.totalSlides - 1) return;
        
        this.isTransitioning = true;
        this.currentIndex++;
        this.updateTrackPosition();
        this.updateIndicators();
        this.updateControls();
        this.restartAutoplay();

        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }

    previous() {
        if (this.isTransitioning || this.currentIndex <= 0) return;
        
        this.isTransitioning = true;
        this.currentIndex--;
        this.updateTrackPosition();
        this.updateIndicators();
        this.updateControls();
        this.restartAutoplay();

        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }

    goToSlide(index) {
        if (this.isTransitioning || index < 0 || index >= this.totalSlides || index === this.currentIndex) return;
        
        this.isTransitioning = true;
        this.currentIndex = index;
        this.updateTrackPosition();
        this.updateIndicators();
        this.updateControls();
        this.restartAutoplay();

        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }

    startAutoplay() {
        if (this.autoplayInterval) return;
        
        this.autoplayInterval = setInterval(() => {
            if (this.currentIndex >= this.totalSlides - 1) {
                this.currentIndex = 0;
            } else {
                this.currentIndex++;
            }
            this.updateTrackPosition();
            this.updateIndicators();
            this.updateControls();
        }, this.interval);
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    restartAutoplay() {
        if (this.autoplay) {
            this.stopAutoplay();
            this.startAutoplay();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.initialized) return;

        switch (name) {
            case 'autoplay':
                if (this.autoplay) {
                    this.startAutoplay();
                } else {
                    this.stopAutoplay();
                }
                break;
            case 'interval':
                if (this.autoplay) {
                    this.restartAutoplay();
                }
                break;
            case 'show-indicators':
                this.addIndicators();
                this.updateIndicators();
                break;
            case 'show-controls':
                this.addControls();
                this.updateControls();
                break;
            case 'height':
                this.carouselContainer.style.height = this.height;
                break;
        }
    }

    disconnectedCallback() {
        this.stopAutoplay();
    }
}

/**
 * Image Carousel Item Component
 * 
 * Individual item for the image carousel with image and content overlay.
 * 
 * Attributes:
 * - src: string - Image source URL
 * - alt: string - Image alt text
 * - title: string - Title for the content overlay
 * - description: string - Description for the content overlay
 * 
 * Slots:
 * - content: Custom HTML content for the overlay
 */
class ImageCarouselItem extends HTMLElement {
    constructor() {
        super();
        
        // Create the item structure
        this.imageElement = document.createElement('img');
        this.contentOverlay = document.createElement('div');
        this.titleElement = document.createElement('h3');
        this.descriptionElement = document.createElement('p');
        this.customContentSlot = document.createElement('div');
        
        // Build the structure
        this.contentOverlay.appendChild(this.titleElement);
        this.contentOverlay.appendChild(this.descriptionElement);
        this.contentOverlay.appendChild(this.customContentSlot);
        this.appendChild(this.imageElement);
        this.appendChild(this.contentOverlay);
        
        // Add default styles
        this.addDefaultStyles();
    }

    addDefaultStyles() {
        if (!document.getElementById('upo-ui-image-carousel-item-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-image-carousel-item-styles';
            style.textContent = `
                .upo-image-carousel-item-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                
                .upo-image-carousel-item-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .upo-image-carousel-item-content {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 2rem 1.5rem 1.5rem;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
                    color: white;
                    z-index: 10;
                }
                
                .upo-image-carousel-item-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                    line-height: 1.2;
                }
                
                .upo-image-carousel-item-description {
                    font-size: 1rem;
                    margin: 0 0 1rem 0;
                    opacity: 0.9;
                    line-height: 1.4;
                }
                
                .upo-image-carousel-item-custom-content {
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                
                @media (max-width: 640px) {
                    .upo-image-carousel-item-content {
                        padding: 1.5rem 1rem 1rem;
                    }
                    
                    .upo-image-carousel-item-title {
                        font-size: 1.25rem;
                    }
                    
                    .upo-image-carousel-item-description {
                        font-size: 0.9rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    static get observedAttributes() {
        return ['src', 'alt', 'title', 'description'];
    }

    connectedCallback() {
        this.className = 'upo-image-carousel-item';
        this.imageElement.className = 'upo-image-carousel-item-image';
        this.contentOverlay.className = 'upo-image-carousel-content';
        this.titleElement.className = 'upo-image-carousel-title';
        this.descriptionElement.className = 'upo-image-carousel-description';
        this.customContentSlot.className = 'upo-image-carousel-custom-content';

        // Process slot content
        this.processSlotContent();
        
        // Update attributes
        this.updateAttributes();
    }

    processSlotContent() {
        const slotContent = this.querySelector('[slot="content"]');
        if (slotContent) {
            this.customContentSlot.appendChild(slotContent);
        }
    }

    updateAttributes() {
        if (this.hasAttribute('src')) {
            this.imageElement.src = this.getAttribute('src');
        }
        
        if (this.hasAttribute('alt')) {
            this.imageElement.alt = this.getAttribute('alt');
        }
        
        if (this.hasAttribute('title')) {
            this.titleElement.textContent = this.getAttribute('title');
        } else {
            this.titleElement.style.display = 'none';
        }
        
        if (this.hasAttribute('description')) {
            this.descriptionElement.textContent = this.getAttribute('description');
        } else {
            this.descriptionElement.style.display = 'none';
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateAttributes();
        }
    }
}

customElements.define('ui-image-carousel', ImageCarousel);
customElements.define('ui-image-carousel-item', ImageCarouselItem);

export default ImageCarousel; 