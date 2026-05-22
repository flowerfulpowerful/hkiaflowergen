// Reference the audio elements (shared key with generator sound-prefs.js)
let soundEnabled = localStorage.getItem('hkia-sound-enabled') !== 'false';

// Reference the audio elements
const clickAudio = document.getElementById("clickAudio");
const bloopAudio = document.getElementById("bloopAudio");
const deepbloopAudio = document.getElementById("deepbloopAudio");
const popAudio = document.getElementById("popAudio");
const multipopAudio = document.getElementById("multipopAudio");

// Function to play sound if enabled
function playSound(sound) {
    if (soundEnabled) {
        sound.play();
    }
}

// Navigation Button (only if it exists)
const navButton = document.getElementById("navButton");
if (navButton) {
    navButton.addEventListener("click", function () {
        const navSubButtons = document.getElementById("navSubButtons");
        
        // Toggle rotation
        navButton.classList.toggle("rotated");
        
        // Toggle sub-buttons visibility
        if (navSubButtons) {
            navSubButtons.classList.toggle("visible");
        }
        
        // Play sound
        playSound(bloopAudio);
    });
}

// Blog Button (only if it exists)
const blogButton = document.getElementById("blogButton");
if (blogButton) {
    blogButton.addEventListener("click", function () {
        console.log("Already on blog page");
        playSound(clickAudio);
    });
}

// Generator Button - navigate to main page (only if it exists)
const generatorButton = document.getElementById("generatorButton");
if (generatorButton) {
    generatorButton.addEventListener("click", function () {
        window.location.href = "index.html";
        playSound(clickAudio);
    });
}

// Navigation popup functionality (only if elements exist)
const goToGenerator = document.getElementById("goToGenerator");
if (goToGenerator) {
    goToGenerator.addEventListener("click", function () {
        window.location.href = "index.html";
        playSound(clickAudio);
    });
}

const goToBlog = document.getElementById("goToBlog");
if (goToBlog) {
    goToBlog.addEventListener("click", function () {
        console.log("Already on blog page");
        playSound(clickAudio);
    });
}

const navigationExitButton = document.getElementById("navigationExitButton");
if (navigationExitButton) {
    navigationExitButton.addEventListener("click", function () {
        const popup = document.getElementById("navigationPopup");
        if (popup) {
            popup.classList.remove("show");
        }
        playSound(multipopAudio);
    });
}

// Dark mode functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dark mode from localStorage
    const savedTheme = localStorage.getItem('blog-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Dark mode toggle functionality
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    function updateDarkModeIcon(theme) {
        if (darkModeToggle) {
            const icon = darkModeToggle.querySelector('i');
            if (icon) {
                if (theme === 'dark') {
                    icon.className = 'fas fa-sun';
                } else {
                    icon.className = 'fas fa-moon';
                }
            }
        }
    }
    
    // Update dark mode toggle icon on load
    updateDarkModeIcon(savedTheme);
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('blog-theme', newTheme);
            updateDarkModeIcon(newTheme);
            
            playSound(clickAudio);
        });
    }
});

// Category filtering functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Blog filtering script loaded');
    
    const blogPosts = document.querySelectorAll('.blog-post');
    console.log('Found blog posts:', blogPosts.length);
    
    // Add click handlers for blog posts to make them interactive
    blogPosts.forEach(post => {
        post.addEventListener('click', function() {
            // Add a subtle animation when clicked
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            playSound(clickAudio);
        });
    });
    
    // Get filter buttons by their IDs
    const allPostsButton = document.getElementById('allPostsButton');
    const updatesButton = document.getElementById('updatesButton');
    const otherButton = document.getElementById('otherButton');
    const tipsButton = document.getElementById('tipsButton');
    
    console.log('Filter buttons found:', {
        allPosts: !!allPostsButton,
        updates: !!updatesButton,
        other: !!otherButton,
        tips: !!tipsButton
    });
    
    const filterButtons = [allPostsButton, updatesButton, otherButton, tipsButton];
    
    // Function to filter posts
    function filterPosts(category) {
        console.log('Filtering posts by category:', category);
        let visibleCount = 0;
        
        blogPosts.forEach(post => {
            const postCategory = post.getAttribute('data-category');
            console.log('Post category:', postCategory, 'Filter:', category);
            
            if (category === 'all' || postCategory === category) {
                post.classList.remove('hidden');
                visibleCount++;
            } else {
                post.classList.add('hidden');
            }
        });
        
        console.log('Visible posts after filtering:', visibleCount);
    }
    
    // Function to update active button
    function updateActiveButton(activeButton) {
        filterButtons.forEach(btn => {
            if (btn) {
                btn.classList.remove('active');
            }
        });
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
    
    // Add click handlers for each filter button
    if (allPostsButton) {
        allPostsButton.addEventListener('click', function() {
            console.log('All posts button clicked');
            updateActiveButton(this);
            filterPosts('all');
            playSound(clickAudio);
        });
    }
    
    if (updatesButton) {
        updatesButton.addEventListener('click', function() {
            console.log('Updates button clicked');
            updateActiveButton(this);
            filterPosts('updates');
            playSound(clickAudio);
        });
    }
    
    if (otherButton) {
        otherButton.addEventListener('click', function() {
            console.log('Other button clicked');
            updateActiveButton(this);
            filterPosts('other');
            playSound(clickAudio);
        });
    }
    
    if (tipsButton) {
        tipsButton.addEventListener('click', function() {
            console.log('Tips button clicked');
            updateActiveButton(this);
            filterPosts('tips');
            playSound(clickAudio);
        });
    }
}); 