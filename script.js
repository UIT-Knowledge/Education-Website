const header = document.getElementById('header');
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');
const sections = document.querySelectorAll('section[id], footer[id]');
const navLinks = document.querySelectorAll('.nav-link');
const revealElements = document.querySelectorAll('.reveal');
const counters = document.querySelectorAll('.hero-stat-number');

// Security: Sanitization helper to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Adaptive header: detect dark/light section under header
function updateHeaderTheme() {
    const headerRect = header.getBoundingClientRect();
    // Using bottom of header for a more responsive feel as you scroll down
    const triggerPoint = headerRect.bottom - 8;
    
    // Find which section the header bottom overlaps
    const allSections = document.querySelectorAll('section, footer');
    let onDark = false;
    
    for (const section of allSections) {
        const rect = section.getBoundingClientRect();
        if (triggerPoint >= rect.top && triggerPoint < rect.bottom) {
            // Check if this section has a dark background
            const isDarkSection = section.classList.contains('section-dark') 
                || section.classList.contains('hero') 
                || section.classList.contains('footer-dark');
            onDark = isDarkSection;
            break;
        }
    }
    
    header.classList.toggle('header-on-dark', onDark);
}

window.addEventListener('scroll', () => {
    // Scroll progress for parallax
    const scrolled = window.scrollY;
    document.documentElement.style.setProperty('--scroll-y', `${scrolled}px`);

    // Change to scrolled state exactly when leaving the hero section
    const hero = document.getElementById('gioi-thieu');
    const heroBottom = hero ? hero.offsetHeight : 0;
    
    if (window.scrollY > (heroBottom - header.offsetHeight)) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    updateActiveNav();
    updateHeaderTheme();
});

// Initial call
updateHeaderTheme();

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    nav.classList.toggle('open');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        nav.classList.remove('open');
    });
});

function updateActiveNav() {
    const triggerLine = header.getBoundingClientRect().bottom + 12;

    const triggerMap = [
        { navId: 'gioi-thieu', el: document.getElementById('gioi-thieu') },
        { navId: 'video', el: document.getElementById('video') },
        { navId: 'khoa-hoc', el: findSectionTagByText('Khóa học theo từng môn') },
        { navId: 'merch', el: findSectionTagByText('Merch cho cộng đồng UIT Knowledge') },
        { navId: 'lien-he', el: findSectionTagByText('Giải đáp thắc mắc') },
    ].filter(entry => entry.el);

    let activeId = 'gioi-thieu';
    for (const entry of triggerMap) {
        if (entry.el.getBoundingClientRect().top <= triggerLine) {
            activeId = entry.navId;
        } else {
            break;
        }
    }

    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === activeId);
    });
}

function findSectionTagByText(text) {
    const normalize = value => value.replace(/\s+/g, ' ').trim();
    for (const el of document.querySelectorAll('.section-tag')) {
        if (normalize(el.textContent) === text) return el;
    }
    return null;
}


const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const target = entry.target;
            
            // Handle staggered children if this is a stagger-parent
            if (target.classList.contains('stagger-parent')) {
                const children = target.querySelectorAll('.reveal');
                children.forEach((child, index) => {
                    // Logic cap for verification and performance
                    const delay = Math.min(index * 100, 600);
                    child.style.setProperty('--stagger-index', delay / 100 + 1);
                    setTimeout(() => {
                        child.classList.add('visible');
                    }, 50);
                });
            } else {
                target.classList.add('visible');
            }
            
            revealObserver.unobserve(target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

// Initial observation
function initReveal() {
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    document.querySelectorAll('.stagger-parent').forEach(el => revealObserver.observe(el));
}
initReveal();

// Helper to observe newly added elements
function observeNewElements(container) {
    if (!container) return;
    container.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    container.querySelectorAll('.stagger-parent').forEach(el => revealObserver.observe(el));
}

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const counter = entry.target;
        const target = Number(counter.dataset.count || 0);
        const duration = 1600;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.floor(target * eased).toLocaleString('vi-VN');

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                counter.textContent = target.toLocaleString('vi-VN');
            }
        };

        requestAnimationFrame(animate);
        counterObserver.unobserve(counter);
    });
}, { threshold: 0.45 });

counters.forEach(counter => counterObserver.observe(counter));

document.querySelectorAll('.lite-youtube').forEach(container => {
    container.addEventListener('click', function () {
        const videoId = this.dataset.videoId;
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.style.position = 'absolute';
        iframe.style.inset = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';

        this.innerHTML = '';
        this.appendChild(iframe);
        this.style.aspectRatio = '16 / 9';
    }, { once: true });
});

document.querySelectorAll('.variant-options').forEach(group => {
    const buttons = group.querySelectorAll('.variant-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(item => item.classList.remove('active'));
            button.classList.add('active');
        });
    });
});

function initFAQAccordion() {
    const accordion = document.getElementById('faq-accordion');
    if (!accordion) return;

    const items = Array.from(accordion.querySelectorAll('.faq-item'));
    items.forEach((item, index) => {
        const button = item.querySelector('.faq-question');
        if (!button) return;

        const isOpen = index === 0;
        item.classList.toggle('is-open', isOpen);
        button.setAttribute('aria-expanded', String(isOpen));

        button.addEventListener('click', () => {
            const shouldOpen = !item.classList.contains('is-open');
            items.forEach(otherItem => {
                const otherButton = otherItem.querySelector('.faq-question');
                otherItem.classList.remove('is-open');
                otherButton?.setAttribute('aria-expanded', 'false');
            });

            if (shouldOpen) {
                item.classList.add('is-open');
                button.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

function initMerchCarousel() {
    const track = document.getElementById('merch-grid');
    const carousel = track?.closest('.merch-carousel');
    if (!track || !carousel) return;

    const prevButton = carousel.querySelector('.merch-arrow-prev');
    const nextButton = carousel.querySelector('.merch-arrow-next');
    let slides = Array.from(track.querySelectorAll('.merch-card:not([data-clone])'));
    if (!slides.length) return;

    track.querySelectorAll('[data-clone="true"]').forEach(clone => clone.remove());
    slides = Array.from(track.querySelectorAll('.merch-card:not([data-clone])'));

    if (slides.length === 1) {
        track.style.transform = 'translateX(0)';
        prevButton?.setAttribute('hidden', '');
        nextButton?.setAttribute('hidden', '');
        return;
    }

    prevButton?.removeAttribute('hidden');
    nextButton?.removeAttribute('hidden');

    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    firstClone.dataset.clone = 'true';
    lastClone.dataset.clone = 'true';
    firstClone.classList.add('visible');
    lastClone.classList.add('visible');
    track.appendChild(firstClone);
    track.insertBefore(lastClone, slides[0]);

    let index = slides.length > 1 ? 1 : 0;
    let isAnimating = false;

    const setPosition = (withTransition = true) => {
        track.classList.toggle('no-transition', !withTransition);
        track.style.transform = `translateX(-${index * 100}%)`;

        if (!withTransition) {
            track.offsetHeight;
            track.classList.remove('no-transition');
        }
    };

    const move = (direction) => {
        if (isAnimating) return;
        isAnimating = true;
        index += direction;
        setPosition(true);
    };

    track.ontransitionend = (e) => {
        if (e.target !== track || e.propertyName !== 'transform') return;

        const realCount = slides.length;
        if (index === realCount + 1) {
            index = 1;
            setPosition(false);
        } else if (index === 0) {
            index = realCount;
            setPosition(false);
        }
        isAnimating = false;
    };

    if (prevButton) prevButton.onclick = () => move(-1);
    if (nextButton) nextButton.onclick = () => move(1);
    setPosition(false);
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        const target = getNavScrollTarget(anchor) || document.querySelector(href);
        if (!target) return;

        event.preventDefault();
        const targetTop = target.getBoundingClientRect().top + window.scrollY;
        const offset = targetTop - header.getBoundingClientRect().height - 16;
        window.scrollTo({ top: offset, behavior: 'smooth' });
    });
});

function getNavScrollTarget(anchor) {
    if (!anchor.classList.contains('nav-link')) return null;

    const navTargets = {
        'khoa-hoc': 'Khóa học theo từng môn',
        merch: 'Merch cho cộng đồng UIT Knowledge',
        'lien-he': 'Giải đáp thắc mắc',
    };

    const tagText = navTargets[anchor.dataset.section];
    return tagText ? findSectionTagByText(tagText) : null;
}

// Initial merch buttons are handled by delegation after dynamic load


// Modal Elements
const paymentModal = document.getElementById('payment-modal');
const paymentModalTitle = document.getElementById('payment-modal-title');
const closePaymentModalBtn = document.getElementById('close-payment-modal');
const paymentQrImage = document.getElementById('payment-qr-image');
const paymentCourseTitle = document.getElementById('payment-course-title');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');

// Registration Modal Elements
const registrationModal = document.getElementById('registration-modal');
const closeRegistrationModalBtn = document.getElementById('close-registration-modal');
const registrationForm = document.getElementById('registration-form');

function openPaymentModal(itemTitle, qrUrl, modalHeader = 'Thanh toán', price = null) {
    if (!qrUrl) {
        alert('Thông tin thanh toán sẽ sớm được cập nhật.');
        return;
    }

    const priceDisplay = document.getElementById('payment-price-display');
    const fbBtn = document.getElementById('facebook-contact-btn');
    const confirmBtn = document.getElementById('confirm-payment-btn');

    if (paymentModalTitle) paymentModalTitle.textContent = modalHeader;
    paymentCourseTitle.textContent = itemTitle;
    paymentQrImage.src = qrUrl;
    paymentQrImage.classList.remove('loaded');

    if (priceDisplay) {
        if (price) {
            priceDisplay.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
            priceDisplay.style.display = 'block';
        } else {
            priceDisplay.style.display = 'none';
        }
    }

    if (fbBtn) {
        // Show FB button if it's a course registration payment
        fbBtn.style.display = (modalHeader.includes('đăng ký') || modalHeader.includes('Thanh toán')) ? 'flex' : 'none';
    }

    paymentQrImage.onload = () => {
        paymentQrImage.classList.add('loaded');
    };

    paymentModal.classList.add('active');
    paymentModal.setAttribute('aria-hidden', 'false');
    paymentModal.style.display = 'flex'; // Ensure it's visible
    document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
    paymentModal.classList.remove('active');
    paymentModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    paymentQrImage.src = '';
    setTimeout(() => { paymentModal.style.display = 'none'; }, 300);
}

closePaymentModalBtn?.addEventListener('click', closePaymentModal);
paymentModal?.querySelector('.qr-modal-overlay')?.addEventListener('click', closePaymentModal);
confirmPaymentBtn?.addEventListener('click', async () => {
    try {
        const { data } = await supabaseClient.from('settings').select('value').eq('key', 'facebook_contact_url').single();
        window.open(data?.value || 'https://www.facebook.com/GenCanyon', '_blank');
    } catch (e) {
        window.open('https://www.facebook.com/GenCanyon', '_blank');
    }
    closePaymentModal();
});

// Registration Modal Functions
function openRegistrationModal(courseTitle) {
    const modal = document.getElementById('registration-modal');
    const form = document.getElementById('registration-form');
    
    if (!modal || !form) return;
    
    form.reset();
    
    if (courseTitle) {
        const titleLower = courseTitle.toLowerCase();
        form.querySelectorAll('input[name="courses"]').forEach(cb => {
            const valLower = cb.value.toLowerCase();
            if (titleLower.includes(valLower) || 
                (cb.value === 'OOP' && titleLower.includes('hướng đối tượng')) ||
                (cb.value === 'DSA' && (titleLower.includes('cấu trúc dữ liệu') || titleLower.includes('giải thuật')))) {
                cb.checked = true;
            }
        });
    }

    modal.style.display = 'flex'; // Force display
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeRegistrationModal() {
    const modal = document.getElementById('registration-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

closeRegistrationModalBtn?.addEventListener('click', closeRegistrationModal);
registrationModal?.querySelector('.qr-modal-overlay')?.addEventListener('click', closeRegistrationModal);

registrationForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-registration-btn');
    if (!submitBtn) return;

    const formData = new FormData(e.target);
    const selectedCourses = formData.getAll('courses');
    
    if (selectedCourses.length === 0) {
        alert('Vui lòng chọn ít nhất một môn học.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    const data = {
        full_name: formData.get('full_name'),
        student_id_email: formData.get('student_id_email'),
        has_teams_email: formData.get('has_teams_email'),
        teams_email: formData.get('teams_email'),
        courses: selectedCourses,
        goal: formData.get('goal'),
        difficulties: formData.get('difficulties'),
        weekend_available: formData.get('weekend_available'),
        time_slots: formData.getAll('time_slots')
    };

    try {
        const { error } = await supabaseClient.from('course_registrations').insert([data]);
        if (error) throw error;
        
        // Calculate price
        const count = selectedCourses.length;
        let price = 0;
        if (count === 1) price = 225000;
        else if (count === 2) price = 385000;
        else if (count > 2) {
            price = Math.round((count * 225000 * 0.855) / 1000) * 1000;
        }

        const courseList = selectedCourses.join(', ');
        
        // Close registration modal and open payment modal
        closeRegistrationModal();
        openPaymentModal(
            `Đăng ký môn: ${courseList}`, 
            'assets/images/unnamed.png', 
            'Thanh toán đăng ký khóa học',
            price
        );
        
        observeNewElements(videoGrid);
    } catch (err) {
        alert('Có lỗi xảy ra: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Gửi đăng ký';
    }
});

// Video Registration Modal Functions
function openVideoModal() {
    const modal = document.getElementById('video-modal');
    const form = document.getElementById('video-form');
    if (!modal || !form) return;
    form.reset();
    modal.style.display = 'flex';
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

document.getElementById('close-video-modal')?.addEventListener('click', closeVideoModal);
document.getElementById('video-modal')?.querySelector('.qr-modal-overlay')?.addEventListener('click', closeVideoModal);

document.getElementById('video-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-video-btn');
    if (!submitBtn) return;

    const formData = new FormData(e.target);
    const selectedCourses = formData.getAll('courses');

    if (selectedCourses.length === 0) {
        alert('Vui lòng chọn ít nhất một môn học.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    const data = {
        full_name: formData.get('full_name'),
        student_id: formData.get('student_id'),
        has_teams_email: formData.get('has_teams_email'),
        teams_email: formData.get('teams_email'),
        courses: selectedCourses
    };

    try {
        const { error } = await supabaseClient.from('video_registrations').insert([data]);
        if (error) throw error;
        
        // Calculate price for videos
        const count = selectedCourses.length;
        let price = 0;
        const prices = {
            1: 100000,
            2: 160000,
            3: 220000,
            4: 265000,
            5: 300000,
            6: 330000
        };
        
        if (count >= 6) price = 330000;
        else price = prices[count] || (count * 100000);

        const courseList = selectedCourses.join(', ');
        
        // Close video modal and open payment modal
        closeVideoModal();
        openPaymentModal(
            `Đăng ký xem Video môn: ${courseList}`, 
            'assets/images/unnamed.png', 
            'Thanh toán đăng ký Video',
            price
        );
        
        observeNewElements(videoGrid);
    } catch (err) {
        alert('Có lỗi xảy ra: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Gửi đăng ký';
    }
});

// Delegate course and merch link clicks
document.addEventListener('click', (e) => {
    const courseLink = e.target.closest('.course-link');
    const videoLink = e.target.closest('.video-link');
    const merchBtn = e.target.closest('.merch-btn');

    if (courseLink) {
        e.preventDefault();
        const title = courseLink.dataset.title || courseLink.innerText;
        openRegistrationModal(title);
    } else if (videoLink) {
        e.preventDefault();
        openVideoModal();
    } else if (merchBtn) {
        const title = merchBtn.dataset.name;
        const qrUrl = merchBtn.dataset.qr;
        const price = merchBtn.dataset.price;
        openMerchModal(title, qrUrl, price);
    }
});

// Merch Modal Functions
function openMerchModal(name, qr, price) {
    const modal = document.getElementById('merch-modal');
    const form = document.getElementById('merch-form');
    if (!modal || !form) return;
    
    form.reset();
    document.getElementById('merch-item-name').value = name;
    document.getElementById('merch-item-price').value = price;
    document.getElementById('merch-item-qr').value = qr;
    document.getElementById('merch-display-name').textContent = name;
    
    modal.style.display = 'flex';
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeMerchModal() {
    const modal = document.getElementById('merch-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

document.getElementById('close-merch-modal')?.addEventListener('click', closeMerchModal);
document.getElementById('merch-modal')?.querySelector('.qr-modal-overlay')?.addEventListener('click', closeMerchModal);

document.getElementById('merch-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-merch-btn');
    if (!submitBtn) return;

    const formData = new FormData(e.target);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý...';

    const merchName = formData.get('merch_name');
    const merchPriceStr = formData.get('merch_price');
    const merchQr = formData.get('merch_qr');
    const quantity = parseInt(formData.get('quantity') || '1');
    const pricePerUnit = Number(String(merchPriceStr).replace(/[^0-9]/g, ''));
    const totalPrice = pricePerUnit * quantity;

    const data = {
        full_name: formData.get('full_name'),
        student_id: formData.get('student_id'),
        phone: formData.get('phone'),
        merch_name: merchName,
        quantity: quantity,
        note: formData.get('note'),
        total_price: totalPrice
    };

    try {
        // Try to insert into merch_registrations (if table exists)
        // If it fails, we still proceed to payment to not block the user
        const { error } = await supabaseClient.from('merch_registrations').insert([data]);
        if (error) console.warn('Note: merch_registrations table might be missing or RLS error:', error.message);
        
        closeMerchModal();
        openPaymentModal(
            `Mua Merch: ${merchName} (x${quantity})`, 
            merchQr || 'assets/images/unnamed.png', 
            'Thanh toán mua Merch',
            totalPrice
        );
    } catch (err) {
        console.error('Error during merch registration:', err);
        // Fallback: still open payment modal
        closeMerchModal();
        openPaymentModal(
            `Mua Merch: ${merchName} (x${quantity})`, 
            merchQr || 'assets/images/unnamed.png', 
            'Thanh toán mua Merch',
            totalPrice
        );
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tiếp tục thanh toán';
    }
});


updateActiveNav();

// --- Dynamic Content from Supabase ---

async function fetchDynamicContent() {
    try {
        // Fetch Videos
        const { data: videos } = await supabaseClient.from('videos').select('*').order('is_featured', { ascending: false }).order('created_at', { ascending: false });
        renderVideos(videos || []);

        // Static Course Cards (Manual Registration + Video Form)
        renderCourses();

        // Fetch Merch
        const { data: merch } = await supabaseClient.from('merch').select('*').order('created_at', { ascending: false });
        renderMerch(merch || []);

        // Fetch Settings (Social Links, etc.)
        fetchSettings();
    } catch (err) {
        console.error('Error fetching dynamic content:', err);
    }
}

async function fetchSettings() {
    try {
        const { data: settings } = await supabaseClient.from('settings').select('*');
        if (!settings) return;

        const config = {};
        settings.forEach(s => config[s.key] = s.value);

        // Update Social Icons in Footer
        document.querySelectorAll('.social-icon').forEach(icon => {
            const label = icon.getAttribute('aria-label')?.toLowerCase();
            if (label === 'youtube' && config.youtube_url) icon.href = config.youtube_url;
            if (label === 'facebook' && config.facebook_url) icon.href = config.facebook_url;
            if (label === 'discord' && config.discord_url) icon.href = config.discord_url;
        });

        // Update Contact Buttons
        const fbContactBtn = document.getElementById('facebook-contact-btn');
        if (fbContactBtn && config.facebook_contact_url) {
            fbContactBtn.onclick = (e) => {
                e.preventDefault();
                window.open(config.facebook_contact_url, '_blank');
            };
        }

        // Update Email Links
        if (config.email_contact) {
            document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
                link.href = `mailto:${config.email_contact}`;
                // Also update text if it's the specific footer email
                if (link.innerText.includes('@')) link.innerText = config.email_contact;
            });
        }

        observeNewElements(videoGrid);
    } catch (err) {
        console.warn('Error fetching settings:', err);
    }
}

function renderVideos(videos) {
    const container = document.getElementById('video-grid');
    if (!container) return;

    if (!videos || videos.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; padding: 48px; text-align: center; color: var(--dark-text-muted); font-family: var(--font-mono); font-size: 14px; border: 1px dashed var(--dark-border); border-radius: var(--radius-lg);">
                <p>RESOURCES_COMING_SOON...</p>
            </div>
        `;
        return;
    }

    container.innerHTML = videos.map((video, index) => `
        <article class="video-card ${video.is_featured ? 'featured' : ''} reveal">
            <div class="video-embed lite-youtube" data-video-id="${video.video_id}">
                <div class="video-thumb" style="background-image: url('${video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`}')">
                    <div class="video-overlay"></div>
                    <div class="video-play ${video.is_featured ? '' : 'small-play'}">
                        <svg width="${video.is_featured ? '24' : '20'}" height="${video.is_featured ? '24' : '20'}" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <span class="video-duration">${video.duration || '00:00'}</span>
                </div>
            </div>
            <div class="video-info">
                ${video.is_featured ? '<div class="eyebrow eyebrow-dark">VIDEO NỔI BẬT</div>' : ''}
                <h3 class="video-title">${escapeHTML(video.title)}</h3>
                ${video.is_featured ? `<p class="video-desc">${escapeHTML(video.description || '')}</p>` : ''}

            </div>
        </article>
    `).join('');

    // Observe new reveal elements
    observeNewElements(container);

    // Re-initialize YouTube embeds for dynamic content
    initYoutubeEmbeds();

    // Inject Video Schema
    const videoSchema = {
        "@context": "https://schema.org",
        "@graph": videos.map(video => ({
            "@type": "VideoObject",
            "name": video.title,
            "description": video.description || video.title,
            "thumbnailUrl": video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`,
            "contentUrl": `https://www.youtube.com/watch?v=${video.video_id}`,
            "embedUrl": `https://www.youtube.com/embed/${video.video_id}`,
            "uploadDate": video.created_at || new Date().toISOString()
        }))
    };
    injectSchema('video-schema', videoSchema);
}

function renderCourses() {
    const container = document.getElementById('courses-grid');
    if (!container) return;

    container.innerHTML = `
        <article class="course-card reveal">
            <div class="course-image glass-effect">
                <div class="course-badge badge-online">Online</div>
                <img src="assets/images/image.png" alt="Khóa học theo môn">
            </div>
            <div class="course-content">
                <div class="course-meta">
                    <span>Lộ trình bài bản</span>
                    <span>Học cùng Mentor</span>
                </div>
                <h3 class="course-title">Khóa học theo môn</h3>
                <ul class="course-features">
                    <li>Học trực tiếp cùng mentor bám sát đề cương UIT.</li>
                    <li>Giải bài tập, ôn thi & hỗ trợ 24/7 suốt kỳ học.</li>
                </ul>
                <div class="course-footer">
                    <span class="course-price">Đăng ký lớp mới</span>
                    <a href="#" class="course-link btn btn-primary btn-small">
                        <span>Đăng ký ngay</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </a>
                </div>
            </div>
        </article>

        <article class="course-card reveal">
            <div class="course-image glass-effect-alt">
                <div class="course-badge badge-hot">Dành cho bạn</div>
                <img src="assets/images/eb80805b-31b8-4f2c-a9da-b3d0b59bdbb1.jpg" alt="Video ôn tập">
            </div>
            <div class="course-content">
                <div class="course-meta">
                    <span>Tự học linh hoạt</span>
                    <span>Kho video giải đề</span>
                </div>
                <h3 class="course-title">Đăng ký xem Video</h3>
                <ul class="course-features">
                    <li>Kho video ôn tập trọng tâm bám sát UIT.</li>
                    <li>Giải chi tiết đề thi các năm giúp nắm chắc kiến thức.</li>
                </ul>
                <div class="course-footer">
                    <span class="course-price">Trả phí</span>
                    <a href="#" class="video-link btn btn-primary btn-small">
                        <span>Đăng ký ngay</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </a>
                </div>
            </div>
        </article>
    `;

    // Observe new reveal elements
    observeNewElements(container);
}

function injectSchema(id, schemaObj) {
    let script = document.getElementById(id);
    if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schemaObj);
}

function renderMerch(merchList) {
    const container = document.getElementById('merch-grid');
    if (!container) return;

    function formatVND(value) {
        if (!value) return '';
        const num = Number(String(value).replace(/[^0-9]/g, ''));
        if (num > 0) {
            return num.toLocaleString('vi-VN') + 'đ';
        }
        return value;
    }

    if (!merchList || merchList.length === 0) {
        container.innerHTML = `
            <article class="merch-card" style="padding: 48px; text-align: center; color: var(--dark-text-muted); font-family: var(--font-mono); font-size: 14px; min-width: 100%;">
                <p>MERCH_COLLECTION_PENDING...</p>
            </article>
        `;
        return;
    }

    container.innerHTML = merchList.map(merch => `
        <article class="merch-card reveal">
            <div class="merch-image">
                ${merch.image_url ?
            `<img src="${escapeHTML(merch.image_url)}" alt="${escapeHTML(merch.name)}" style="width: 100%; height: 100%; object-fit: contain; padding: 16px;">` :
            `<div class="merch-placeholder ${escapeHTML(merch.placeholder_class || 'merch-shirt')}"><span>${escapeHTML(merch.name)}</span></div>`
        }
            </div>
            <div class="merch-info">
                <h3 class="merch-name">${escapeHTML(merch.name)}</h3>
                <p class="merch-desc">${escapeHTML(merch.description || '')}</p>
                <div class="merch-footer">
                    <span class="merch-price">${escapeHTML(formatVND(merch.price))}</span>
                    <button class="btn btn-primary btn-merch merch-btn" 
                            data-name="${escapeHTML(merch.name)}" 
                            data-qr="${escapeHTML(merch.payment_qr_url || '')}"
                            data-price="${escapeHTML(merch.price || '')}">Mua ngay</button>
                </div>
            </div>
        </article>
    `).join('');

    // Observe new reveal elements
    observeNewElements(container);

    initMerchCarousel();
}

function initYoutubeEmbeds() {
    document.querySelectorAll('.lite-youtube').forEach(container => {
        container.addEventListener('click', function () {
            const videoId = this.dataset.videoId;
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.style.position = 'absolute';
            iframe.style.inset = '0';
            iframe.style.width = '100%';
            iframe.style.height = '100%';

            this.innerHTML = '';
            this.appendChild(iframe);
            this.style.aspectRatio = '16 / 9';
        }, { once: true });
    });
}

// Initialize Liquid Glass Effect
document.addEventListener("DOMContentLoaded", () => {
    const glassEffect = liquidGL({
        target: ".liquidGL",
        refraction: 0.01,
        bevelDepth: 0.08,
        bevelWidth: 0.15,
        frost: 0,
        shadow: true,
        specular: true,
        reveal: "fade"
    });
});

// Start fetching
fetchDynamicContent();
initFAQAccordion();

// Inject FAQ Schema
const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "UIT Knowledge là gì?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "UIT Knowledge là cộng đồng học thuật chuyên tổng hợp video, khóa học và tài liệu dành riêng cho sinh viên UIT - VNU-HCM."
            }
        },
        {
            "@type": "Question",
            "name": "Nội dung ở đây có bám sát chương trình UIT không?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Có. Video và lộ trình khóa học được xây từ đề cương và nhu cầu ôn tập thực tế của sinh viên UIT."
            }
        },
        {
            "@type": "Question",
            "name": "Tôi nên bắt đầu từ đâu nếu bị mất gốc?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Hãy xem video ôn tập nền tảng trước để nắm lại ý chính, rồi chọn khóa học theo môn đang yếu nhất."
            }
        },
        {
            "@type": "Question",
            "name": "Khóa học tại UIT Knowledge diễn ra như thế nào?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Khóa học thường học online có hướng dẫn, qua video và bài tập thực hành, mở theo từng đợt để hỗ trợ tốt hơn."
            }
        }
    ]
};
injectSchema('faq-schema', faqSchema);

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

