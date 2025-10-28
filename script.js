// Initialize Particles.js
particlesJS('particles-js', {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: "#ffffff" },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        line_linked: {
            enable: true,
            distance: 150,
            color: "#ffffff",
            opacity: 0.4,
            width: 1
        },
        move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false
        }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: { enable: true, mode: "repulse" },
            onclick: { enable: true, mode: "push" },
            resize: true
        }
    }
});

// Load data manager
document.addEventListener('DOMContentLoaded', function() {
    // Create script element for data manager
    const script = document.createElement('script');
    script.src = 'data-manager.js';
    document.head.appendChild(script);
});

// Login functionality
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('.login-btn');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.querySelector('.btn-loader');
    
    // Show loading animation
    loginBtn.classList.add('loading');
    
    // Simulate API call with timeout
    setTimeout(() => {
        // Check credentials against data manager
        const dataManager = window.dataManager;
        let user = null;
        
        if (dataManager) {
            const data = dataManager.loadData();
            user = data.users.find(u => u.password === password);
        } else {
            // Fallback to hardcoded passwords
            if (password === 'libas123' || password === '456') {
                user = {
                    username: password === 'libas123' ? 'admin' : 'staff',
                    role: password === 'libas123' ? 'admin' : 'staff'
                };
            }
        }
        
        if (user) {
            // Success animation
            loginBtn.style.background = 'linear-gradient(135deg, #00b894, #00a085)';
            btnText.textContent = 'Access Granted!';
            
            // Store user session
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            setTimeout(() => {
                if (user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'staff-dashboard.html';
                }
            }, 1000);
            
        } else {
            // Error animation
            loginBtn.classList.remove('loading');
            loginBtn.style.background = 'linear-gradient(135deg, #ff7675, #d63031)';
            btnText.textContent = 'Wrong Password!';
            
            // Shake animation
            loginBtn.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                loginBtn.style.animation = '';
                loginBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                btnText.textContent = 'Access Inventory';
            }, 2000);
            
            document.getElementById('password').value = '';
        }
    }, 1500);
});

// Add shake animation for error
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .login-btn.shake {
        animation: shake 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);

// Input focus effects
document.getElementById('password').addEventListener('focus', function() {
    this.parentElement.style.transform = 'scale(1.02)';
});

document.getElementById('password').addEventListener('blur', function() {
    this.parentElement.style.transform = 'scale(1)';
});

// Add some floating animation to glass card
const glassCard = document.querySelector('.glass-card');
glassCard.style.animation = 'float 8s ease-in-out infinite';

// Add resize handler for particles
window.addEventListener('resize', function() {
    setTimeout(() => {
        if (window.pJSDom && window.pJSDom[0]) {
            window.pJSDom[0].pJS.fn.particlesRefresh();
        }
    }, 500);
});

// Check if user is already logged in
window.addEventListener('load', function() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'staff-dashboard.html';
        }
    }
});