# 🎨 UPO UI

A lightweight, vanilla JavaScript Web Component library designed for CSS framework compatibility. No build tools, no dependencies, just pure ES Modules.

## ✨ Features

- 🚀 **Zero Dependencies** - Pure vanilla JavaScript
- 📦 **No Build Tools** - Works directly in the browser
- 🎨 **CSS Framework Ready** - Works with Tailwind, Bootstrap, or any CSS framework
- 🔧 **Attribute Pass-through** - All HTML attributes supported
- 📱 **Responsive** - Style with your preferred CSS framework
- 🔥 **Lightweight** - Minimal footprint
- 🎯 **Framework Agnostic** - Switch between CSS frameworks easily

## 🚀 Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <title>UPO UI Demo</title>
    <!-- Add your preferred CSS framework -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Or use Bootstrap -->
    <!-- <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"> -->
</head>
<body>
    <!-- Use components with your CSS framework classes -->
    <ui-input 
        placeholder="Enter your name"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
    </ui-input>
    
    <!-- Load the library -->
    <script type="module" src="./bundler/bundle.js"></script>
</body>
</html>
```

## 🎨 Styling

### With Tailwind CSS
```html
<ui-input class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
```

### With Bootstrap
```html
<ui-input class="form-control form-control-lg border-primary">
```

### With Custom CSS
```html
<ui-input class="my-custom-input">
```

```css
.my-custom-input {
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
}

.my-custom-input:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}
```

## 🏗️ Architecture

Our components use a **transparent wrapper approach** instead of Shadow DOM:

- **CSS Framework Compatibility**: External stylesheets can directly style components
- **Attribute Pass-through**: All attributes are transferred to internal elements
- **No Style Encapsulation**: Components inherit page styles (feature, not bug!)
- **Framework Agnostic**: Works with any CSS framework or custom styles

## 📁 Installation

### Option 1: Direct Download
Download the repository and include the bundle file:

```html
<script type="module" src="/components/bundle.js"></script>
```

### Option 2: Using CDN
```html
<script type="module" src="https://cdn.jsdelivr.net/gh/upovibe/upoUI@v1.0.1/components/bundle.js"></script>
```

### Option 3: Clone Repository
```bash
git clone https://github.com/upovibe/upoUI.git
cd upoUI
# Open components.html in your browser
```

## 🌐 Browser Support

Works in all modern browsers that support:
- ES Modules
- Custom Elements v1
- JavaScript Classes

**Supported:** Chrome 63+, Firefox 63+, Safari 10.1+, Edge 79+

## 🎯 Why This Approach?

Unlike traditional web components that use Shadow DOM, UPO UI prioritizes:

1. **CSS Framework Integration** - Works seamlessly with Tailwind, Bootstrap, etc.
2. **Simplicity** - No complex styling APIs or CSS custom properties
3. **Flexibility** - Style components exactly how you want
4. **Familiarity** - Behaves like native HTML elements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

Made with ❤️ using Vanilla JavaScript Web Components
