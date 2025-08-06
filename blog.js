// Reference the audio elements
let soundEnabled = true; // Default to sound being on

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

// Navigation Button
document.getElementById("navButton").addEventListener("click", function () {
    const navButton = document.getElementById("navButton");
    const navSubButtons = document.getElementById("navSubButtons");
    
    // Toggle rotation
    navButton.classList.toggle("rotated");
    
    // Toggle sub-buttons visibility
    navSubButtons.classList.toggle("visible");
    
    // Play sound
    playSound(bloopAudio);
});

// Blog Button (stays on blog page)
document.getElementById("blogButton").addEventListener("click", function () {
    console.log("Already on blog page");
    playSound(clickAudio);
});

// Generator Button - navigate to main page
document.getElementById("generatorButton").addEventListener("click", function () {
    window.location.href = "index.html";
    playSound(clickAudio);
});

// Navigation popup functionality
document.getElementById("goToGenerator").addEventListener("click", function () {
    window.location.href = "index.html";
    playSound(clickAudio);
});

document.getElementById("goToBlog").addEventListener("click", function () {
    console.log("Already on blog page");
    playSound(clickAudio);
});

document.getElementById("navigationExitButton").addEventListener("click", function () {
    const popup = document.getElementById("navigationPopup");
    popup.classList.remove("show");
    playSound(multipopAudio);
});

// Category filtering functionality
document.addEventListener('DOMContentLoaded', function() {
    const blogPosts = document.querySelectorAll('.blog-post');
    const categoryButtons = document.querySelectorAll('.category-button');
    
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
    
    // Category button click handlers
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.id.replace('Button', '').replace('Posts', '');
            
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter posts
            blogPosts.forEach(post => {
                const postCategory = post.getAttribute('data-category');
                
                if (category === 'all' || postCategory === category) {
                    post.classList.remove('hidden');
                } else {
                    post.classList.add('hidden');
                }
            });
            
            playSound(clickAudio);
        });
    });
}); 