// Homepage JavaScript functionality

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Launch Application function
function launchApp() {
    // Check if we're in Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
        // Launch the main application
        window.electronAPI.launchMainApp();
    } else {
        // Fallback for web browser
        alert('Please download and install DATABASE ONLY to launch the application.');
        downloadApp();
    }
}

// Download functions
function downloadApp() {
    // Detect operating system
    const platform = getPlatform();
    
    switch (platform) {
        case 'windows':
            downloadWindows();
            break;
        case 'mac':
            downloadMac();
            break;
        case 'linux':
            downloadLinux();
            break;
        default:
            // Generic download
            window.open('https://github.com/ktsoaela/database_only/releases', '_blank');
    }
}

function downloadWindows() {
    // For now, show a message - you can update this with actual download links
    alert('Windows version will be available soon! Please check our GitHub releases page.');
    window.open('https://github.com/ktsoaela/database_only/releases', '_blank');
}

function downloadMac() {
    // For now, show a message - you can update this with actual download links
    alert('macOS version will be available soon! Please check our GitHub releases page.');
    window.open('https://github.com/ktsoaela/database_only/releases', '_blank');
}

function downloadLinux() {
    // For now, show a message - you can update this with actual download links
    alert('Linux version will be available soon! Please check our GitHub releases page.');
    window.open('https://github.com/ktsoaela/database_only/releases', '_blank');
}

function viewSource() {
    window.open('https://github.com/ktsoaela/database_only', '_blank');
}

// Platform detection
function getPlatform() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/windows/i.test(userAgent)) {
        return 'windows';
    }
    
    if (/macintosh|mac os x/i.test(userAgent)) {
        return 'mac';
    }
    
    if (/linux/i.test(userAgent)) {
        return 'linux';
    }
    
    return 'unknown';
}

// Add scroll effects
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(102, 126, 234, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        header.style.backdropFilter = 'none';
    }
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards and database cards
document.querySelectorAll('.feature-card, .database-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Add hover effects for database cards
document.querySelectorAll('.database-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add typing effect for hero title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect when page loads
window.addEventListener('load', () => {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        typeWriter(heroTitle, originalText, 80);
    }
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const rate = scrolled * -0.5;
    
    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Add counter animation for features
function animateCounters() {
    const counters = document.querySelectorAll('.feature-card h3');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target') || '0');
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current);
                setTimeout(updateCounter, 20);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}

// Initialize animations when elements come into view
const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, {
    threshold: 0.5
});

// Observe elements for animation
document.querySelectorAll('.feature-card, .database-card, .download-card').forEach(el => {
    animationObserver.observe(el);
});

// Add CSS class for animations
const style = document.createElement('style');
style.textContent = `
    .feature-card, .database-card, .download-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .feature-card:nth-child(1) { transition-delay: 0.1s; }
    .feature-card:nth-child(2) { transition-delay: 0.2s; }
    .feature-card:nth-child(3) { transition-delay: 0.3s; }
    .feature-card:nth-child(4) { transition-delay: 0.4s; }
    .feature-card:nth-child(5) { transition-delay: 0.5s; }
    .feature-card:nth-child(6) { transition-delay: 0.6s; }
    
    .database-card:nth-child(1) { transition-delay: 0.1s; }
    .database-card:nth-child(2) { transition-delay: 0.2s; }
    .database-card:nth-child(3) { transition-delay: 0.3s; }
    .database-card:nth-child(4) { transition-delay: 0.4s; }
`;
document.head.appendChild(style);

// Add mobile menu functionality
function createMobileMenu() {
    const header = document.querySelector('.header-content');
    const nav = document.querySelector('.nav');
    
    // Create mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuBtn.style.display = 'none';
    
    // Add mobile menu styles
    const mobileStyles = document.createElement('style');
    mobileStyles.textContent = `
        @media (max-width: 768px) {
            .mobile-menu-btn {
                display: block !important;
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
            }
            
            .nav {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(102, 126, 234, 0.95);
                backdrop-filter: blur(10px);
                flex-direction: column;
                padding: 1rem;
                transform: translateY(-100%);
                opacity: 0;
                transition: all 0.3s ease;
                display: flex !important;
            }
            
            .nav.show {
                transform: translateY(0);
                opacity: 1;
            }
            
            .nav-link {
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .nav-link:last-child {
                border-bottom: none;
            }
        }
    `;
    document.head.appendChild(mobileStyles);
    
    // Add mobile menu button to header
    header.appendChild(mobileMenuBtn);
    
    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        nav.classList.toggle('show');
    });
    
    // Close mobile menu when clicking on a link
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('show');
        });
    });
}

// Initialize mobile menu
createMobileMenu();

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Add CSS for loading animation
const loadingStyle = document.createElement('style');
loadingStyle.textContent = `
    body {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
    
    body.loaded {
        opacity: 1;
    }
    
    .loading-spinner {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
    }
    
    .loading-spinner::after {
        content: '';
        display: block;
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(loadingStyle);

// Show loading spinner initially
const loadingSpinner = document.createElement('div');
loadingSpinner.className = 'loading-spinner';
document.body.appendChild(loadingSpinner);

// Remove loading spinner when page is loaded
window.addEventListener('load', () => {
    setTimeout(() => {
        loadingSpinner.remove();
    }, 500);
});

console.log('DATABASE ONLY - DATABASE ONLY Homepage loaded successfully! 🚀');
