export function initializeMobileMenu() {
    try {
        const menuButton = document.getElementById('mobile-menu-button');
        if (menuButton) {
            menuButton.addEventListener('click', function() {
                const menu = document.getElementById('mobile-menu');
                if (menu) {
                    menu.classList.toggle('hidden');
                }
            });
        }
    } catch (error) {
        console.error('Error initializing mobile menu:', error);
    }
}