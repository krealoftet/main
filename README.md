# Clay Workshop - Artisan Ceramics Studio

A modern, responsive website for an artisan ceramics and pottery studio, built with industry-standard web optimization and accessibility features.

## 🎯 Features

- **Modern Design System**: Token-based design with semantic color roles
- **Responsive Layout**: Mobile-first design that works on all devices  
- **Performance Optimized**: Image optimization, lazy loading, and caching
- **SEO Ready**: Complete meta tags, structured data, and sitemap
- **Accessibility First**: WCAG compliant with proper ARIA labels
- **Progressive Web App**: Service worker and web app manifest
- **Build Tools**: Sass compilation, CSS optimization, and code linting

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone or download the project
cd clay_workshop

# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:3000`

## 📁 Project Structure

```
clay_workshop/
├── assets/
│   ├── images/          # Image assets
│   ├── fonts/           # Web fonts
│   └── icons/           # Icons and favicons
├── js/
│   └── main.js          # JavaScript functionality
├── styles/
│   ├── tokens/          # Design tokens (colors, etc.)
│   ├── foundations/     # CSS variables and mixins
│   ├── base/            # Reset and typography
│   ├── layout/          # Layout components
│   ├── semantics/       # Semantic color roles
│   ├── components/      # UI components
│   └── main.scss        # Main stylesheet
├── index.html           # Main HTML file
├── manifest.json        # PWA manifest
├── sw.js               # Service worker
├── robots.txt          # Search engine directives
└── sitemap.xml         # Site structure for SEO
```

## 🛠 Available Scripts

### Development
- `npm run dev` - Start development server with live reload
- `npm run dev:sass` - Watch and compile Sass files
- `npm run dev:serve` - Start local development server

### Building
- `npm run build` - Build optimized production files
- `npm run build:sass` - Compile and compress Sass
- `npm run build:css` - Post-process CSS (autoprefixer, minification)
- `npm run build:images` - Optimize and convert images

### Quality & Testing
- `npm run lint` - Run all linters
- `npm run lint:html` - Validate HTML
- `npm run lint:css` - Lint Sass/CSS files
- `npm run lint:js` - Lint JavaScript
- `npm run format` - Format code with Prettier
- `npm run test` - Run Lighthouse performance tests

### Utilities
- `npm run clean` - Clean build artifacts
- `npm run serve` - Serve production files

## 🎨 Design System

### Color Tokens
The design system uses a token-based approach with semantic color roles:

- **Base Colors**: White, Seashell
- **Carbon Scale**: Neutral grays (100-700)
- **Coral Scale**: Primary brand colors (50-900)  
- **Clay Scale**: Secondary accent colors (50-900)
- **Dust**: Muted background color

### Typography
- **Headings**: Playfair Display (serif)
- **Body Text**: Inter (sans-serif)
- **Responsive Sizing**: Fluid typography with clamp()

## 📱 Performance Features

### Core Web Vitals Optimization
- Optimized images with WebP conversion
- Lazy loading for below-the-fold content
- Critical CSS inlining
- Preconnect to external resources

### Caching Strategy
- Service worker for offline functionality
- Cache-first strategy for static assets
- Network-first for dynamic content

### SEO & Meta Tags
- Complete Open Graph tags
- Twitter Card support
- Structured data (JSON-LD)
- Canonical URLs and meta descriptions

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Semantic HTML structure
- Proper heading hierarchy
- Focus management and keyboard navigation
- Screen reader friendly
- High contrast color ratios
- Alternative text for images

## 🔧 Configuration Files

- `.stylelintrc.json` - Sass/CSS linting rules
- `.eslintrc.json` - JavaScript linting configuration
- `.prettierrc.json` - Code formatting rules
- `lighthouserc.json` - Performance testing configuration

## 📋 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
The built files can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Firebase Hosting

### Performance Monitoring
Run Lighthouse audits regularly:
```bash
npm run test
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

For questions about this project, please contact:
- Email: hello@clayworkshop.com
- Website: https://clayworkshop.com

---

Built with ❤️ for artisan crafters and modern web standards.

