document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;
    const themeIcon = themeToggleBtn.querySelector('i');

    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-bs-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.classList.remove('bi-sun-fill');
            themeIcon.classList.add('bi-moon-stars-fill');
        } else {
            themeIcon.classList.remove('bi-moon-stars-fill');
            themeIcon.classList.add('bi-sun-fill');
        }
    }

    // --- Mock Wheel Game Logic ---
    const spinBtn = document.getElementById('spinBtn');
    const mockWheel = document.getElementById('mockWheel');
    const spinCountSpan = document.getElementById('spinCount');
    const spinResult = document.getElementById('spinResult');
    
    let spinsLeft = 3;
    let currentRotation = 0;
    let isSpinning = false;

    // Mock Prizes corresponding to the 6 segments
    const prizes = [
        "iPhone 15 Pro Max", // Index 0
        "Try Again",         // Index 1
        "Steam Wallet $50",  // Index 2
        "Exclusive Merch",   // Index 3
        "Try Again",         // Index 4
        "VIP Discord Role"   // Index 5
    ];

    spinBtn.addEventListener('click', () => {
        if (isSpinning) return;
        
        if (spinsLeft <= 0) {
            spinResult.textContent = "Out of spins! Become a higher Tier Member for more.";
            spinResult.className = "mt-3 fw-bold fs-5 text-danger";
            return;
        }

        isSpinning = true;
        spinsLeft--;
        spinCountSpan.textContent = spinsLeft;
        spinResult.textContent = "Spinning...";
        spinResult.className = "mt-3 fw-bold fs-4 text-warning";

        // Calculate random rotation (min 5 full spins + random degree)
        const randomDegree = Math.floor(Math.random() * 360);
        const extraSpins = 360 * 5; 
        currentRotation += extraSpins + randomDegree;

        mockWheel.style.transform = `rotate(${currentRotation}deg)`;

        // Wait for animation to finish (matches CSS transition time 3s)
        setTimeout(() => {
            isSpinning = false;
            
            // Calculate which segment won based on the final rotation angle
            // Since CSS rotates clockwise, we calculate backwards
            const actualDegree = currentRotation % 360;
            // 6 segments = 60 degrees per segment
            // Arrow is at the top (0 degrees). 
            // We need to adjust based on how segments are positioned in CSS
            
            // Simplified mock result calculation
            const prizeIndex = Math.floor(((360 - actualDegree + 30) % 360) / 60);
            const wonPrize = prizes[prizeIndex];

            if (wonPrize === "Try Again") {
                spinResult.textContent = "Oops! Better luck next spin.";
                spinResult.className = "mt-3 fw-bold fs-4 text-muted";
            } else {
                spinResult.textContent = `🎉 You won: ${wonPrize}! 🎉`;
                spinResult.className = "mt-3 fw-bold fs-4 text-success";
            }

        }, 3000); // 3000ms = 3s
    });
});