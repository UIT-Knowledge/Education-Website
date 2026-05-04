const SECURITY = {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 15 * 60 * 1000,
    BASE_DELAY_MS: 1000,
    SESSION_CHECK_INTERVAL_MS: 60 * 1000,
    TOKEN_GRACE_PERIOD_MS: 30 * 1000,
    MIN_PASSWORD_LENGTH: 8,
    MAX_EMAIL_LENGTH: 254,
    ALLOWED_EMAIL_DOMAINS: []
};

function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>"']/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        if (m === "'") return '&#039;';
        return m;
    });
}

function constantTimeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

function validateEmail(email) {
    if (typeof email !== 'string') return false;
    email = email.toLowerCase().trim();
    if (email.length > SECURITY.MAX_EMAIL_LENGTH) return false;
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(email)) return false;
    const domain = email.split('@')[1];
    if (!domain) return false;
    return true;
}

function validatePassword(password) {
    if (typeof password !== 'string') return false;
    if (password.length < SECURITY.MIN_PASSWORD_LENGTH) return false;
    if (password.length > 128) return false;
    if (/[\x00-\x1f\x7f]/.test(password)) return false;
    return true;
}

function decodeJWTPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '=');
        const decoded = atob(padded);
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

function isTokenExpired(token, graceMs = 0) {
    const payload = decodeJWTPayload(token);
    if (!payload || !payload.exp) return true;
    return (Date.now() / 1000) > (payload.exp + graceMs / 1000);
}

function getClientMetadata() {
    return {
        user_agent: (navigator.userAgent || '').substring(0, 512),
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        referrer: document.referrer ? new URL(document.referrer).origin : null,
        timestamp: new Date().toISOString()
    };
}

function generateSessionId() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

const authContainer = document.getElementById('auth-container');
const adminContainer = document.getElementById('admin-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const rateLimitWarning = document.getElementById('rate-limit-warning');
const logoutBtn = document.getElementById('logout-btn');
const tabTitle = document.getElementById('tab-title');
const contentArea = document.getElementById('content-area');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const itemForm = document.getElementById('item-form');
const dynamicFields = document.getElementById('dynamic-fields');

const rateLimitState = {
    attempts: parseInt(sessionStorage.getItem('hw_rate_attempts') || '0', 10),
    lockoutUntil: parseInt(sessionStorage.getItem('hw_rate_lockout') || '0', 10),
    inCooldown: false
};
let sessionCheckTimer = null;
let currentSessionId = null;

function persistRateLimit() {
    try {
        sessionStorage.setItem('hw_rate_attempts', String(rateLimitState.attempts));
        sessionStorage.setItem('hw_rate_lockout', String(rateLimitState.lockoutUntil));
    } catch { }
}

function isRateLimited() {
    const now = Date.now();
    if (rateLimitState.lockoutUntil > now) {
        const remaining = Math.ceil((rateLimitState.lockoutUntil - now) / 1000);
        return { limited: true, remainingSeconds: remaining };
    }
    if (rateLimitState.lockoutUntil > 0 && now >= rateLimitState.lockoutUntil) {
        rateLimitState.attempts = 0;
        rateLimitState.lockoutUntil = 0;
        persistRateLimit();
    }
    return { limited: false, remainingSeconds: 0 };
}

function recordFailedAttempt() {
    rateLimitState.attempts++;
    if (rateLimitState.attempts >= SECURITY.MAX_LOGIN_ATTEMPTS) {
        const jitter = Math.floor(Math.random() * 60000);
        rateLimitState.lockoutUntil = Date.now() + SECURITY.LOCKOUT_DURATION_MS + jitter;
    }
    persistRateLimit();
}

function computeBackoffDelay() {
    const base = SECURITY.BASE_DELAY_MS;
    const factor = Math.min(rateLimitState.attempts, SECURITY.MAX_LOGIN_ATTEMPTS);
    const jitter = Math.floor(Math.random() * 500);
    return Math.min(base * Math.pow(2, factor) + jitter, 30000);
}

async function logAuditEvent(eventType, metadata = {}) {
    try {
        if (!supabaseClient) return;
        const TIMEOUT_MS = 5000;
        const { data: { session } } = await supabaseClient.auth.getSession();
        const payload = {
            event_type: eventType,
            user_id: session?.user?.id || null,
            email: session?.user?.email || null,
            ip_address: null,
            user_agent: (navigator.userAgent || '').substring(0, 512),
            metadata: {
                ...metadata,
                screen: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language
            }
        };
        await supabaseClient.from('audit_logs').insert([payload]);
    } catch (e) {
        console.warn('Audit log failed:', e);
    }
}

async function init() {
    try {
        if (!supabaseClient) {
            console.error('Supabase client not available during init.');
            showAuth();
            return;
        }

        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        if (session) {
            const token = session.access_token;
            if (isTokenExpired(token)) {
                const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
                if (refreshError || !refreshData.session) {
                    showAuth();
                    return;
                }
            }
            currentSessionId = generateSessionId();
            showAdmin();
            startSessionCheck();
        } else {
            showAuth();
        }
    } catch (err) {
        console.error('Initialization error:', err);
        showAuth();
    }
}

function showAdmin() {
    authContainer.style.display = 'none';
    adminContainer.style.display = 'grid';
    loadData();
}

function showAuth() {
    authContainer.style.display = 'flex';
    adminContainer.style.display = 'none';
    if (sessionCheckTimer) {
        clearInterval(sessionCheckTimer);
        sessionCheckTimer = null;
    }
    currentSessionId = null;
}

async function checkSession() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            logAuditEvent('session_expired', getClientMetadata());
            showAuth();
            return;
        }
        if (isTokenExpired(session.access_token, SECURITY.TOKEN_GRACE_PERIOD_MS)) {
            const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
            if (refreshError || !refreshData.session) {
                logAuditEvent('token_refresh_failed', { error: refreshError?.message });
                showAuth();
            }
        }
    } catch {
        showAuth();
    }
}

function startSessionCheck() {
    if (sessionCheckTimer) clearInterval(sessionCheckTimer);
    sessionCheckTimer = setInterval(checkSession, SECURITY.SESSION_CHECK_INTERVAL_MS);
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!supabaseClient) {
        loginError.textContent = 'Lỗi: Không thể kết nối với hệ thống xác thực (Supabase Library missing).';
        return;
    }

    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const email = document.getElementById('email').value.toLowerCase().trim();
    const password = document.getElementById('password').value.trim();

    if (!validateEmail(email)) {
        loginError.textContent = 'Email không hợp lệ.';
        return;
    }
    if (!validatePassword(password)) {
        loginError.textContent = 'Mật khẩu phải từ 8 ký tự trở lên.';
        return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'Đang kiểm tra...';
    loginError.textContent = '';
    
    try {
        console.log('Attempting login for:', email);
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            console.error('Supabase login error:', error.message, error.status);
            if (error.message === 'Invalid login credentials') {
                loginError.textContent = 'Tài khoản hoặc mật khẩu không đúng.';
            } else if (error.message.includes('Email not confirmed')) {
                loginError.textContent = 'Tài khoản chưa được xác nhận email. Vui lòng kiểm tra hộp thư.';
            } else {
                loginError.textContent = 'Lỗi: ' + error.message;
            }
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.textContent = 'Authorize';
            return;
        }

        // Success flow
        console.log('Login successful');
        currentSessionId = generateSessionId();
        showAdmin();
        logAuditEvent('login_success', { email, session_id: currentSessionId });
        startSessionCheck();
    } catch (err) {
        console.error('Fatal login error:', err);
        loginError.textContent = 'Lỗi hệ thống: ' + err.message;
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Authorize';
    }
});

logoutBtn.addEventListener('click', async () => {
    logAuditEvent('logout', { session_id: currentSessionId });
    await supabaseClient.auth.signOut();
    rateLimitState.attempts = 0;
    rateLimitState.lockoutUntil = 0;
    persistRateLimit();
    showAuth();
});

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.id === 'logout-btn') return;
        document.querySelector('.nav-item.active').classList.remove('active');
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        const label = btn.querySelector('span').textContent;
        tabTitle.textContent = label;
        loadData();
    });
});

async function loadData() {
    contentArea.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p style="font-family: 'Fira Code'; font-size: 12px; letter-spacing: 0.1em;">FETCHING_RESOURCES...</p>
        </div>`;

    let query = supabaseClient.from(currentTab).select('*');
    if (currentTab !== 'settings') {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        contentArea.innerHTML = `<div class="error-message">Lỗi: ${escapeHTML(error.message)}</div>`;
        return;
    }

    if (currentTab.includes('registrations') || currentTab === 'settings') {
        addBtn.style.display = 'none';
    } else {
        addBtn.style.display = 'flex';
    }

    renderItems(data);
}

function renderItems(items) {
    if (items.length === 0) {
        contentArea.innerHTML = `
            <div class="loading-state">
                <div style="opacity: 0.2; font-size: 4rem; margin-bottom: 2rem;">&#128194;</div>
                <p>Kho dữ liệu trống. Hãy khởi tạo mục mới.</p>
            </div>`;
        return;
    }

    contentArea.innerHTML = items.map(item => {
        const title = item.key || item.full_name || item.title || item.name;
        const subtext = item.value || item.student_id || item.student_id_email || item.phone || item.video_id || item.price || item.id.substring(0, 8);
        const meta = item.updated_at ? `Cập nhật: ${new Date(item.updated_at).toLocaleDateString('vi-VN')}` : (item.courses ? item.courses.join(', ') : (item.subject ? item.subject : (item.image_url ? 'IMAGE_SYNCED' : escapeHTML(item.placeholder_class || 'UIT_KNOWLEDGE_CORE'))));

        const isReg = currentTab.includes('registrations');
        const isSetting = currentTab === 'settings';
        const regBadge = isReg ? `<span class="registration-badge">${currentTab === 'course_registrations' ? 'MENTOR' : (currentTab === 'video_registrations' ? 'VIDEO' : 'TUTOR')}</span>` : (isSetting ? '<span class="registration-badge" style="background: rgba(255, 255, 255, 0.1); border-color: var(--border);">CONFIG</span>' : '');

        const editId = escapeHTML(item.id || item.key);

        return `
            <div class="admin-item-card" data-id="${editId}">
                <div class="item-info">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                        ${regBadge}
                        <h3 style="margin: 0;">${escapeHTML(title)}</h3>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <p>INFO: ${escapeHTML(subtext)}</p>
                        <span style="width: 4px; height: 4px; border-radius: 50%; background: var(--border);"></span>
                        <p title="${escapeHTML(meta)}">${escapeHTML(meta)}</p>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-small" onclick="openEditModal('${editId}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        ${isReg ? 'Chi tiết' : 'Sửa'}
                    </button>
                    ${!isSetting ? `
                    <button class="btn btn-secondary btn-small" onclick="deleteItem('${editId}')" style="color: #ff4b4b; border-color: rgba(255, 75, 75, 0.2);">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        Xóa
                    </button>` : ''}
                </div>
            </div>`;
    }).join('');
}

addBtn.addEventListener('click', () => {
    openAddModal();
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
});

function openAddModal() {
    currentItem = null;
    modalTitle.textContent = `Thêm ${currentTab.slice(0, -1)} mới`;
    modalSubtitle.textContent = 'INIT_NEW_ENTRY';
    renderFields();
    modal.classList.add('active');
}

async function openEditModal(id) {
    const safeId = id;
    let query = supabaseClient.from(currentTab).select('*');
    if (currentTab === 'settings') {
        query = query.eq('key', safeId);
    } else {
        query = query.eq('id', safeId);
    }

    const { data, error } = await query.single();
    if (error) return alert(error.message);

    currentItem = data;
    const isReg = currentTab.includes('registrations');
    modalTitle.textContent = isReg ? 'Chi tiết đăng ký' : `Chỉnh sửa ${currentTab.slice(0, -1)}`;
    modalSubtitle.textContent = isReg ? 'VIEW_USER_SUBMISSION' : 'PATCH_DATABASE_RECORDS';
    renderFields(data);

    const saveBtn = document.getElementById('save-btn');
    saveBtn.style.display = isReg ? 'none' : 'block';

    modal.classList.add('active');
}

async function fetchYouTubeData() {
    const videoIdField = document.querySelector('input[name="video_id"]');
    const titleField = document.querySelector('input[name="title"]');
    const videoId = videoIdField.value.trim();

    if (!videoId) return alert('Vui lòng nhập YouTube ID trước!');

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return alert('YouTube ID không hợp lệ.');
    }

    const btn = document.getElementById('fetch-yt-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner" style="width:12px;height:12px;margin:0"></span>';
    btn.disabled = true;

    try {
        const response = await fetch(`https://noembed.com/embed?dataType=json&url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`);
        const data = await response.json();
        if (data.title) {
            titleField.value = data.title;
        } else {
            alert('Không tìm thấy thông tin video.');
        }
    } catch {
        alert('Lỗi khi kết nối với máy chủ YouTube.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 64);
}

function renderFields(data = {}) {
    let fields = '';
    const safe = (val) => escapeHTML(val || '');

    if (currentTab === 'videos') {
        fields = `
            <div class="form-group">
                <label>YouTube ID</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" name="video_id" value="${safe(data.video_id)}" required placeholder="Ví dụ: dQw4w9WgXcQ" pattern="[a-zA-Z0-9_-]{11}" style="flex: 1;">
                    <button type="button" id="fetch-yt-btn" class="btn btn-secondary btn-small" onclick="fetchYouTubeData()">Lấy thông tin</button>
                </div>
            </div>
            <div class="form-group">
                <label>Tiêu đề Video</label>
                <input type="text" name="title" value="${safe(data.title)}" required maxlength="200">
            </div>
            <div class="form-group">
                <label>Mô tả chi tiết</label>
                <textarea rows="3" name="description" maxlength="2000">${safe(data.description)}</textarea>
            </div>
            <div class="form-group">
                <label>Thời lượng (MM:SS)</label>
                <input type="text" name="duration" value="${safe(data.duration)}" placeholder="vd: 12:45" pattern="[0-9]{1,2}:[0-9]{2}">
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.8rem; cursor: pointer; text-transform: none; color: var(--text);">
                    <input type="checkbox" name="is_featured" ${data.is_featured ? 'checked' : ''} style="width: auto;"> Đánh dấu là Video nổi bật
                </label>
            </div>`;
    } else if (currentTab === 'courses') {
        fields = `
            <div class="form-group">
                <label>Tên khóa học</label>
                <input type="text" name="title" value="${safe(data.title)}" required maxlength="200">
            </div>
            <div class="form-group">
                <label>Mô tả ngắn</label>
                <textarea rows="3" name="description" maxlength="2000">${safe(data.description)}</textarea>
            </div>
            <div class="form-group">
                <label>Học phí / Trạng thái</label>
                <input type="text" name="price" value="${safe(data.price)}" maxlength="100">
            </div>
            <div class="form-group">
                <label>Link đăng ký</label>
                <input type="url" name="registration_link" value="${safe(data.registration_link)}" maxlength="500">
            </div>
            <div class="form-group">
                <label>QR Thanh toán (Upload)</label>
                <input type="file" id="course-qr-file" accept="image/png,image/jpeg,image/webp" style="margin-bottom: 0.5rem;">
                ${data.payment_qr_url ? `<p style="font-size: 11px; color: var(--primary);">Đã có QR: ${safe(data.payment_qr_url.split('/').pop())}</p>` : ''}
            </div>
            <div class="form-group">
                <label>Màu sắc giao diện (pastel-1 -> 4)</label>
                <select name="image_class">
                    <option value="pastel-1" ${data.image_class === 'pastel-1' ? 'selected' : ''}>Màu hồng nhạt</option>
                    <option value="pastel-2" ${data.image_class === 'pastel-2' ? 'selected' : ''}>Màu xanh tím</option>
                    <option value="pastel-3" ${data.image_class === 'pastel-3' ? 'selected' : ''}>Màu xanh lá</option>
                    <option value="pastel-4" ${data.image_class === 'pastel-4' ? 'selected' : ''}>Màu trung tính</option>
                </select>
            </div>`;
    } else if (currentTab === 'merch') {
        fields = `
            <div class="form-group">
                <label>Tên sản phẩm</label>
                <input type="text" name="name" value="${safe(data.name)}" required maxlength="200">
            </div>
            <div class="form-group">
                <label>Mô tả</label>
                <textarea rows="3" name="description" maxlength="2000">${safe(data.description)}</textarea>
            </div>
            <div class="form-group">
                <label>Giá bán</label>
                <input type="text" name="price" value="${safe(data.price)}" maxlength="100">
            </div>
            <div class="form-group">
                <label>Hình ảnh sản phẩm (Upload)</label>
                <input type="file" id="merch-image-file" accept="image/png,image/jpeg,image/webp" style="margin-bottom: 0.5rem;">
                ${data.image_url ? `<p style="font-size: 11px; color: var(--primary);">Đã có ảnh: ${safe(data.image_url.split('/').pop())}</p>` : ''}
            </div>
            <div class="form-group">
                <label>QR Thanh toán (Upload)</label>
                <input type="file" id="merch-qr-file" accept="image/png,image/jpeg,image/webp" style="margin-bottom: 0.5rem;">
                ${data.payment_qr_url ? `<p style="font-size: 11px; color: var(--primary);">Đã có QR: ${safe(data.payment_qr_url.split('/').pop())}</p>` : ''}
            </div>
            <div class="form-group">
                <label>Loại sản phẩm</label>
                <select name="placeholder_class">
                    <option value="merch-shirt" ${data.placeholder_class === 'merch-shirt' ? 'selected' : ''}>Áo thun</option>
                    <option value="merch-keychain" ${data.placeholder_class === 'merch-keychain' ? 'selected' : ''}>Móc khóa</option>
                    <option value="merch-hoodie" ${data.placeholder_class === 'merch-hoodie' ? 'selected' : ''}>Dây đeo thẻ</option>
                    <option value="merch-sticker" ${data.placeholder_class === 'merch-sticker' ? 'selected' : ''}>Sticker</option>
                </select>
            </div>`;
    } else if (currentTab === 'course_registrations') {
        fields = `
            <div class="modal-grid-2col">
                <div class="form-group">
                    <label>Họ và tên</label>
                    <input type="text" value="${safe(data.full_name)}" readonly>
                </div>
                <div class="form-group">
                    <label>MSSV / Email</label>
                    <input type="text" value="${safe(data.student_id_email)}" readonly>
                </div>
                <div class="form-group">
                    <label>Có mail Teams?</label>
                    <input type="text" value="${safe(data.has_teams_email)}" readonly>
                </div>
                <div class="form-group">
                    <label>Email Teams</label>
                    <input type="text" value="${safe(data.teams_email)}" readonly>
                </div>
                <div class="form-group modal-grid-full">
                    <label>Khóa học đăng ký</label>
                    <input type="text" value="${data.courses ? safe(data.courses.join(', ')) : ''}" readonly style="color: var(--primary); font-weight: 600;">
                </div>
                <div class="form-group">
                    <label>Mục tiêu</label>
                    <input type="text" value="${safe(data.goal)}" readonly>
                </div>
                <div class="form-group">
                    <label>Rảnh cuối tuần?</label>
                    <input type="text" value="${safe(data.weekend_available)}" readonly>
                </div>
                <div class="form-group modal-grid-full">
                    <label>Khó khăn</label>
                    <textarea rows="2" readonly>${safe(data.difficulties)}</textarea>
                </div>
                <div class="form-group">
                    <label>Thời gian rảnh</label>
                    <input type="text" value="${data.time_slots ? safe(data.time_slots.join(', ')) : ''}" readonly>
                </div>
                <div class="form-group">
                    <label>Thời gian gửi</label>
                    <input type="text" value="${data.created_at ? new Date(data.created_at).toLocaleString('vi-VN') : ''}" readonly>
                </div>
            </div>`;
    } else if (currentTab === 'video_registrations') {
        fields = `
            <div class="modal-grid-2col">
                <div class="form-group">
                    <label>Họ và tên</label>
                    <input type="text" value="${safe(data.full_name)}" readonly>
                </div>
                <div class="form-group">
                    <label>MSSV</label>
                    <input type="text" value="${safe(data.student_id)}" readonly>
                </div>
                <div class="form-group">
                    <label>Có mail Teams?</label>
                    <input type="text" value="${safe(data.has_teams_email)}" readonly>
                </div>
                <div class="form-group">
                    <label>Email Teams</label>
                    <input type="text" value="${safe(data.teams_email)}" readonly>
                </div>
                <div class="form-group modal-grid-full">
                    <label>Video đăng ký</label>
                    <input type="text" value="${data.courses ? safe(data.courses.join(', ')) : ''}" readonly style="color: var(--primary); font-weight: 600;">
                </div>
                <div class="form-group">
                    <label>Thời gian gửi</label>
                    <input type="text" value="${data.created_at ? new Date(data.created_at).toLocaleString('vi-VN') : ''}" readonly>
                </div>
            </div>`;
    } else if (currentTab === 'settings') {
        fields = `
            <div class="form-group">
                <label>Mã thiết lập (Key)</label>
                <input type="text" name="key" value="${safe(data.key)}" readonly style="opacity: 0.7;">
            </div>
            <div class="form-group">
                <label>Giá trị (Value)</label>
                <input type="text" name="value" value="${safe(data.value)}" required placeholder="Ví dụ: https://facebook.com/GenCanyon" maxlength="1000">
            </div>
            <p style="font-size: 11px; color: var(--text-muted); margin-top: 10px;">Lưu ý: Bạn chỉ có thể sửa giá trị, mã thiết lập là cố định.</p>`;
    } else if (currentTab === 'tutor_registrations') {
        fields = `
            <div class="modal-grid-2col">
                <div class="form-group">
                    <label>Họ và tên</label>
                    <input type="text" value="${safe(data.full_name)}" readonly>
                </div>
                <div class="form-group">
                    <label>Trường học</label>
                    <input type="text" value="${safe(data.school)}" readonly>
                </div>
                <div class="form-group">
                    <label>Cấp bậc</label>
                    <input type="text" value="${safe(data.education_level)}" readonly>
                </div>
                <div class="form-group">
                    <label>Môn học</label>
                    <input type="text" value="${safe(data.subject)}" readonly style="color: var(--primary); font-weight: 600;">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="text" value="${safe(data.email)}" readonly>
                </div>
                <div class="form-group">
                    <label>Số điện thoại</label>
                    <input type="text" value="${safe(data.phone)}" readonly>
                </div>
                <div class="form-group">
                    <label>Facebook</label>
                    <input type="text" value="${safe(data.facebook)}" readonly>
                </div>
                <div class="form-group">
                    <label>Zalo</label>
                    <input type="text" value="${safe(data.zalo)}" readonly>
                </div>
                <div class="form-group">
                    <label>Trạng thái</label>
                    <input type="text" value="${safe(data.status)}" readonly>
                </div>
                <div class="form-group">
                    <label>Thời gian gửi</label>
                    <input type="text" value="${data.created_at ? new Date(data.created_at).toLocaleString('vi-VN') : ''}" readonly>
                </div>
            </div>`;
    }

    dynamicFields.innerHTML = fields;
}

itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-btn');
    const originalBtnText = saveBtn.textContent;
    saveBtn.textContent = 'ĐANG XỬ LÝ...';
    saveBtn.disabled = true;

    const allowedKeys = {
        'videos': ['video_id', 'title', 'description', 'duration', 'is_featured'],
        'courses': ['title', 'description', 'price', 'registration_link', 'image_class', 'category', 'is_hot', 'payment_qr_url'],
        'merch': ['name', 'description', 'price', 'placeholder_class', 'payment_qr_url'],
        'settings': ['value'],
        'course_registrations': [],
        'video_registrations': [],
        'tutor_registrations': []
    };

    const formData = new FormData(itemForm);
    const payload = {};

    formData.forEach((value, key) => {
        if (!allowedKeys[currentTab].includes(key)) return;
        if (itemForm.elements[key]?.type === 'checkbox') {
            payload[key] = itemForm.elements[key].checked;
        } else if (typeof value === 'string') {
            payload[key] = value.substring(0, 2000);
        } else {
            payload[key] = value;
        }
    });

    if (currentTab === 'courses') {
        const fileInput = document.getElementById('course-qr-file');
        const file = fileInput.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File quá lớn. Tối đa 5MB.');
                saveBtn.textContent = originalBtnText;
                saveBtn.disabled = false;
                return;
            }
            const fileExt = sanitizeFileName(file.name.split('.').pop());
            const fileName = `${generateSessionId()}.${fileExt}`;
            const filePath = `qrs/${fileName}`;
            const { error: uploadError } = await supabaseClient.storage.from('courses').upload(filePath, file);
            if (uploadError) {
                alert('Lỗi upload QR: ' + uploadError.message);
                saveBtn.textContent = originalBtnText;
                saveBtn.disabled = false;
                return;
            }
            const { data: { publicUrl } } = supabaseClient.storage.from('courses').getPublicUrl(filePath);
            payload.payment_qr_url = publicUrl;
        } else if (currentItem && currentItem.payment_qr_url) {
            payload.payment_qr_url = currentItem.payment_qr_url;
        }
    }

    if (currentTab === 'merch') {
        const fileInput = document.getElementById('merch-image-file');
        const file = fileInput.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File quá lớn. Tối đa 5MB.');
                saveBtn.textContent = originalBtnText;
                saveBtn.disabled = false;
                return;
            }
            const fileExt = sanitizeFileName(file.name.split('.').pop());
            const fileName = `${generateSessionId()}.${fileExt}`;
            const filePath = `merch/${fileName}`;
            const { error: uploadError } = await supabaseClient.storage.from('merch').upload(filePath, file);
            if (uploadError) {
                alert('Lỗi upload ảnh: ' + uploadError.message);
                saveBtn.textContent = originalBtnText;
                saveBtn.disabled = false;
                return;
            }
            const { data: { publicUrl } } = supabaseClient.storage.from('merch').getPublicUrl(filePath);
            payload.image_url = publicUrl;
        } else if (currentItem && currentItem.image_url) {
            payload.image_url = currentItem.image_url;
        }

        const qrInput = document.getElementById('merch-qr-file');
        const qrFile = qrInput.files[0];
        if (qrFile) {
            if (qrFile.size > 5 * 1024 * 1024) {
                alert('File quá lớn. Tối đa 5MB.');
                saveBtn.textContent = originalBtnText;
                saveBtn.disabled = false;
                return;
            }
            const fileExt = sanitizeFileName(qrFile.name.split('.').pop());
            const fileName = `${generateSessionId()}.${fileExt}`;
            const filePath = `qrs/${fileName}`;
            const { error: uploadError } = await supabaseClient.storage.from('merch').upload(filePath, qrFile);
            if (uploadError) {
                alert('Lỗi upload QR: ' + uploadError.message);
                saveBtn.textContent = originalBtnText;
                saveBtn.disabled = false;
                return;
            }
            const { data: { publicUrl } } = supabaseClient.storage.from('merch').getPublicUrl(filePath);
            payload.payment_qr_url = publicUrl;
        } else if (currentItem && currentItem.payment_qr_url) {
            payload.payment_qr_url = currentItem.payment_qr_url;
        }
    }

    let result;
    if (currentItem) {
        if (currentTab === 'settings') {
            result = await supabaseClient.from(currentTab).update(payload).eq('key', currentItem.key);
        } else {
            result = await supabaseClient.from(currentTab).update(payload).eq('id', currentItem.id);
        }
    } else {
        result = await supabaseClient.from(currentTab).insert([payload]);
    }

    if (result.error) {
        alert('Lỗi: ' + result.error.message);
    } else {
        modal.classList.remove('active');
        loadData();
    }

    saveBtn.textContent = originalBtnText;
    saveBtn.disabled = false;
});

async function deleteItem(id) {
    if (!confirm('Xác nhận gỡ bỏ dữ liệu này khỏi hệ thống?')) return;
    const { error } = await supabaseClient.from(currentTab).delete().eq('id', id);
    if (error) {
        alert(error.message);
    } else {
        loadData();
    }
}

window.openEditModal = openEditModal;
window.deleteItem = deleteItem;
window.fetchYouTubeData = fetchYouTubeData;

init();
