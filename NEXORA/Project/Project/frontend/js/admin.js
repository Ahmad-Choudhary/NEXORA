'use strict';

const ADMIN_API = 'http://127.0.0.1:5000/api/admin';

function adminUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (error) { return null; }
}

function isAdminUser(user) {
  return Boolean(user && (
    user.role === 'admin' ||
    user.is_admin === true ||
    user.is_admin === 1 ||
    user.is_admin === '1'
  ));
}

function adminHeaders() {
  return { 'Content-Type': 'application/json' };
}

function adminMessage(message, type = 'error') {
  const alertBox = document.getElementById('admin-alert');
  if (!alertBox) return;
  alertBox.className = `alert-custom alert-${type}`;
  alertBox.textContent = message;
  alertBox.style.display = 'block';
}

function formatDate(value) {
  if (!value) return 'No record';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

async function adminFetch(path, options = {}) {
  const response = await fetch(`${ADMIN_API}${path}`, { ...options, credentials: 'include', headers: { ...adminHeaders(), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

function renderPsychologists(psychologists) {
  const list = document.getElementById('psychologists-list');
  document.getElementById('psychologist-count').textContent = `${psychologists.length} profile${psychologists.length === 1 ? '' : 's'}`;
  if (!psychologists.length) { list.innerHTML = '<tr><td colspan="6" class="admin-empty">No psychologist profiles yet.</td></tr>'; return; }
  list.innerHTML = psychologists.map(item => `
    <tr>
      <td><strong>${escapeHtml(item.full_name || item.name)}</strong><br><small>${escapeHtml(item.email || 'No email')}</small></td>
      <td>${escapeHtml(item.specialization)}</td>
      <td>${escapeHtml(item.contact || 'Not provided')}</td>
      <td>${escapeHtml(item.experience || 'Not provided')}</td>
      <td><span class="admin-badge">${escapeHtml(item.availability || 'Available')}</span></td>
      <td><button class="btn btn-sm btn-outline-danger" type="button" data-delete-psychologist="${item.id}"><i class="fas fa-trash me-1"></i>Remove</button></td>
    </tr>`).join('');
}

function renderUsers(users) {
  const list = document.getElementById('users-list');
  document.getElementById('user-count').textContent = `${users.length} patient${users.length === 1 ? '' : 's'}`;
  if (!users.length) { list.innerHTML = '<tr><td colspan="6" class="admin-empty">No registered patients yet.</td></tr>'; return; }
  list.innerHTML = users.map(item => `
    <tr>
      <td><strong>${escapeHtml(item.full_name)}</strong><br><small>ID #${escapeHtml(item.id)}</small></td>
      <td>${escapeHtml(item.email)}</td>
      <td>${formatDate(item.created_at)}</td>
      <td>${item.phq_score === null || item.phq_score === undefined ? 'No assessment' : `${escapeHtml(item.phq_score)} / 27`}</td>
      <td>${escapeHtml(item.phq_severity || 'No assessment')}</td>
      <td><button class="btn btn-sm btn-outline-danger" type="button" data-delete-user="${item.id}"><i class="fas fa-user-minus me-1"></i>Delete</button></td>
    </tr>`).join('');
}

async function loadPsychologists() {
  const data = await adminFetch('/psychologists');
  renderPsychologists(data.psychologists || []);
}

async function loadUsers() {
  const data = await adminFetch('/users');
  renderUsers(data.users || []);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = adminUser();
  if (!isAdminUser(user)) {
    adminMessage('Administrator access is required to view this page.', 'error');
    return;
  }

  try { await Promise.all([loadPsychologists(), loadUsers()]); }
  catch (error) { adminMessage(error.message); }

  document.getElementById('psychologist-form').addEventListener('submit', async event => {
    event.preventDefault();
    const payload = {
      name: document.getElementById('psychologist-name').value.trim(),
      specialization: document.getElementById('psychologist-specialization').value.trim(),
      email: document.getElementById('psychologist-email').value.trim(),
      contact: document.getElementById('psychologist-contact').value.trim(),
      experience: document.getElementById('psychologist-experience').value.trim(),
      availability: document.getElementById('psychologist-availability').value
    };
    try {
      await adminFetch('/psychologists', { method: 'POST', body: JSON.stringify(payload) });
      event.target.reset();
      await loadPsychologists();
      adminMessage('Psychologist added successfully.', 'success');
    } catch (error) { adminMessage(error.message); }
  });

  document.addEventListener('click', async event => {
    const psychologistButton = event.target.closest('[data-delete-psychologist]');
    const userButton = event.target.closest('[data-delete-user]');
    if (psychologistButton) {
      if (!window.confirm('Remove this psychologist profile?')) return;
      try { await adminFetch(`/psychologists/${psychologistButton.dataset.deletePsychologist}`, { method: 'DELETE' }); await loadPsychologists(); adminMessage('Psychologist removed.', 'success'); }
      catch (error) { adminMessage(error.message); }
    }
    if (userButton) {
      if (!window.confirm('Delete this patient and all of their assessment records? This cannot be undone.')) return;
      try { await adminFetch(`/users/${userButton.dataset.deleteUser}`, { method: 'DELETE' }); await loadUsers(); adminMessage('Patient record deleted.', 'success'); }
      catch (error) { adminMessage(error.message); }
    }
  });
});
