// Simple JavaScript for Royal Car Rental

// DOM Elements
const navLinks = document.getElementById('navLinks');
const hamburger = document.getElementById('hamburger');
const themeToggle = document.getElementById('themeToggle');
const bookingModal = document.getElementById('bookingModal');
const closeModal = document.getElementById('closeModal');
const bookingForm = document.getElementById('bookingForm');
const modalCarName = document.getElementById('modalCarName');
const customerPhone = document.getElementById('customerPhone');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const totalPrice = document.getElementById('totalPrice');
const toastContainer = document.getElementById('toastContainer');
const contactForm = document.getElementById('contactForm');
const newsletterForm = document.getElementById('newsletterForm');
const loader = document.getElementById('loader');

let totalBookings = 0;
let bookings = [];

// Initialize
function init() {
    setupEventListeners();
    setMinDate();
    setupAboutStatsAnimation();
    window.addEventListener('load', () => setTimeout(() => loader?.classList.add('hidden'), 500));
}

// Event Listeners
function setupEventListeners() {
    navLinks?.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-link')) {
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            e.target.classList.add('active');
            closeMobileMenu();
        }
    });
    
    hamburger?.addEventListener('click', () => navLinks?.classList.toggle('active'));
    themeToggle?.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
    });
    
    closeModal?.addEventListener('click', closeBookingModal);
    bookingModal?.addEventListener('click', (e) => e.target === bookingModal && closeBookingModal());
    bookingForm?.addEventListener('submit', handleBookingSubmit);
    customerPhone?.addEventListener('input', formatPhoneInput);
    startDate?.addEventListener('change', handleDateChange);
    endDate?.addEventListener('change', handleDateChange);
    contactForm?.addEventListener('submit', handleContactSubmit);
    newsletterForm?.addEventListener('submit', handleNewsletterSubmit);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && bookingModal?.classList.contains('active')) closeBookingModal();
    });
}

function closeMobileMenu() {
    navLinks?.classList.remove('active');
}

function setMinDate() {
    if (startDate && endDate) {
        const today = new Date().toISOString().split('T')[0];
        startDate.setAttribute('min', today);
        endDate.setAttribute('min', today);
    }
}

// Format phone input to help user enter correct format: +252 61 XXXXXXXX
function formatPhoneInput(e) {
    let value = e.target.value;
    
    // Clear error when user starts typing
    const errorEl = document.getElementById('phoneError');
    if (errorEl) errorEl.textContent = '';
    
    // Remove all non-digit and non-space characters except +
    value = value.replace(/[^\d\s+]/g, '');
    
    // Remove + if it's not at the start
    if (value.includes('+') && !value.startsWith('+')) {
        value = value.replace(/\+/g, '');
        value = '+' + value;
    }
    
    // Extract digits only for processing
    const digits = value.replace(/\D/g, '');
    
    // Build formatted value
    let formatted = '';
    
    if (digits.length === 0) {
        formatted = '';
    } else if (digits.startsWith('252')) {
        formatted = '+252';
        if (digits.length > 3) {
            formatted += ' ' + digits.slice(3, 5); // Add 61
            if (digits.length > 5) {
                formatted += ' ' + digits.slice(5, 13); // Add up to 8 digits
            }
        }
    } else {
        // If doesn't start with 252, force +252
        formatted = '+252';
        if (digits.length > 0) {
            formatted += ' ' + (digits.length >= 2 ? digits.slice(0, 2) : digits);
            if (digits.length > 2) {
                formatted += ' ' + digits.slice(2, 10); // Add up to 8 digits
            }
        }
    }
    
    // Limit to +252 61 + 8 digits = 17 characters total
    if (formatted.length > 17) {
        formatted = formatted.slice(0, 17);
    }
    
    e.target.value = formatted;
}

window.openBookingModal = (carName = '') => {
    if (bookingModal) {
        if (modalCarName) modalCarName.value = carName;
        bookingModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeBookingModal() {
    if (bookingModal) {
        bookingModal.classList.remove('active');
        document.body.style.overflow = '';
        bookingForm?.reset();
        clearDateErrors();
        if (totalPrice) totalPrice.textContent = '$0';
    }
}

function handleDateChange() {
    if (!startDate?.value || !endDate?.value) return;
    
    clearDateErrors();
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    
    if (end < start) {
        showError('endDateError', 'End date must be after start date');
        return;
    }
    
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (days < 1) {
        showError('startDateError', 'Minimum rental period is 1 day');
        return;
    }
    
    calculateTotalPrice(days);
}

function calculateTotalPrice(days) {
    if (totalPrice) totalPrice.textContent = `$${(100 * days).toFixed(2)}`;
}

function clearDateErrors() {
    document.getElementById('startDateError')?.textContent && (document.getElementById('startDateError').textContent = '');
    document.getElementById('endDateError')?.textContent && (document.getElementById('endDateError').textContent = '');
    document.getElementById('phoneError')?.textContent && (document.getElementById('phoneError').textContent = '');
}

function showError(errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.textContent = message;
}

function handleBookingSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('customerName').value.trim();
    const phone = customerPhone.value.trim();
    const carName = modalCarName.value.trim();
    const start = startDate.value;
    const end = endDate.value;
    
    if (!name) return showToast('Please enter your name', 'error');
    if (!phone) return showToast('Please enter your phone number', 'error');
    if (!isValidPhone(phone)) return showError('phoneError', 'Phone must be in format: +252 61 12345678 (8 digits)');
    if (!carName) return showToast('Please enter car model', 'error');
    if (!start || !end) return showToast('Please select both start and end dates', 'error');
    
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    
    if (endDateObj < startDateObj) return showError('endDateError', 'End date must be after start date');
    
    const days = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
    if (days < 1) return showError('startDateError', 'Minimum rental period is 1 day');
    
    const booking = {
        id: Date.now(),
        name,
        phone,
        carModel: carName,
        startDate: start,
        endDate: end,
        days,
        totalPrice: 100 * days
    };
    
    bookings.push(booking);
    totalBookings++;
    displayBookingInTable(booking);
    showToast('Booking confirmed! We will contact you soon.', 'success');
    closeBookingModal();
}

function handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    if (!name || !email || !message) return showToast('Please fill in all fields', 'error');
    if (!isValidEmail(email)) return showToast('Please enter a valid email address', 'error');
    
    showToast('Message sent! We will get back to you soon.', 'success');
    contactForm.reset();
}

function handleNewsletterSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value.trim();
    const errorEl = document.getElementById('newsletterError');
    
    if (!email) {
        if (errorEl) {
            errorEl.textContent = 'Please enter your email';
            errorEl.style.display = 'block';
        }
        return;
    }
    
    if (!isValidEmail(email)) {
        if (errorEl) {
            errorEl.textContent = 'Please enter a valid email address';
            errorEl.style.display = 'block';
        }
        return;
    }
    
    if (errorEl) errorEl.style.display = 'none';
    showToast('Thank you for subscribing!', 'success');
    newsletterForm.reset();
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPhone = (phone) => {
    // Validate format: +252 61 followed by exactly 8 digits
    // Pattern: +252 61 XXXXXXXX (8 digits)
    const phoneRegex = /^\+252\s61\s\d{8}$/;
    return phoneRegex.test(phone.trim());
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    if (toastContainer) {
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

function setupAboutStatsAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseFloat(entry.target.getAttribute('data-target'));
                animateValue(entry.target, 0, target, 2000);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const isDecimal = end % 1 !== 0;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + (end - start) * progress;
        element.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = isDecimal ? end.toFixed(1) : end;
        }
    }
    
    requestAnimationFrame(update);
}

function displayBookingInTable(booking) {
    const tableContainer = document.getElementById('bookingsTableContainer');
    const tableBody = document.getElementById('bookingsTableBody');
    
    if (!tableContainer || !tableBody) return;
    
    tableContainer.style.display = 'block';
    
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${sanitizeInput(booking.name)}</td>
        <td>${sanitizeInput(booking.phone)}</td>
        <td>${sanitizeInput(booking.carModel)}</td>
        <td>${formatDate(booking.startDate)}</td>
        <td>${formatDate(booking.endDate)}</td>
        <td>${booking.days}</td>
        <td>$${booking.totalPrice.toFixed(2)}</td>
    `;
    
    tableBody.appendChild(row);
}

const sanitizeInput = (input) => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
