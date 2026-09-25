'use strict';

const PSYCHOLOGISTS_API = 'http://127.0.0.1:5000/api/psychologists';

const STATIC_PROFILE_TAGS = {
  'Dr. Sadia Yasir': ['Depression', 'Anxiety', 'OCD'],
  'Ms. Aqila Unbrin': ['PTSD', 'Trauma', 'ADHD'],
  'Dr. Yasmeen Naeem': ['Child & Teen', 'Autism', 'Anxiety'],
  'Dr. Junaid Rasool': ['Anxiety Disorders', 'Depression', 'OCD'],
  'Dr. Alina': ['Addiction', 'Rehab', 'Schizophrenia'],
  'Dr. Saima Batool': ['Anxiety', 'Schizophrenia', 'OCD']
};

const STATIC_PROFILE_PRESENTATION = {
  'Dr. Sadia Yasir': {
    categories: 'depression, anxiety',
    topStyle: '',
    avatarStyle: 'background: linear-gradient(135deg,#e0f3f0,#c8eae4); font-family:var(--font-head);',
    credentials: 'MBBS,FCPS (Pysychiatry), CHPE, Head of psychiatry',
    location: 'Jinnah Hospital Lahore, Pakistan'
  },
  'Ms. Aqila Unbrin': {
    categories: 'trauma-ptsd',
    topStyle: 'background: linear-gradient(160deg,#e8f0fe,#e6f6f4);',
    avatarStyle: 'background: linear-gradient(135deg,#d6e4fd,#c3d9fb); color:#3a6bc4; font-family:var(--font-head);',
    credentials: 'MS Clinical psychology, ADCP',
    location: 'PIMH Lahore, Pakistan'
  },
  'Dr. Yasmeen Naeem': {
    categories: 'child-adolescent, anxiety',
    topStyle: 'background: linear-gradient(160deg,#fef3e2,#fde8d8);',
    avatarStyle: 'background: linear-gradient(135deg,#fde8d8,#fbd5bc); color:#c0542a; font-family:var(--font-head);',
    credentials: 'MBBS, MS Clinical psychology',
    location: 'Lahore, Pakistan'
  },
  'Dr. Junaid Rasool': {
    categories: 'depression',
    topStyle: 'background: linear-gradient(160deg,#f0e6f6,#e6eef9);',
    avatarStyle: 'background: linear-gradient(135deg,#ead4f8,#d8c3f5); color:#7b3fa8; font-family:var(--font-head);',
    credentials: 'Head of psychiatry',
    location: 'FMH Lahore, Pakistan'
  },
  'Dr. Alina': {
    categories: 'addiction',
    topStyle: 'background: linear-gradient(160deg,#e6faf5,#d9f2ec);',
    avatarStyle: 'background: linear-gradient(135deg,#c8f0e4,#aee8d8); color:#1a7a58; font-family:var(--font-head);',
    credentials: 'MS Clinical psychology',
    location: 'PIMH Lahore, Pakistan'
  },
  'Dr. Saima Batool': {
    categories: 'all',
    topStyle: 'background: linear-gradient(160deg,#fff0f5,#ffe6ee);',
    avatarStyle: 'background: linear-gradient(135deg,#ffd6e5,#ffc3d9); color:#c0395a; font-family:var(--font-head);',
    credentials: 'MBBS, FCPS in psychiatry, Consultant Psychologist',
    location: 'FMH Lahore, Pakistan'
  }
};

function escapePsychologistHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function psychologistSlug(name) {
  return String(name || 'psychologist')
    .toLowerCase()
    .replace(/^(dr\.?|ms\.?|mr\.?|mrs\.?)\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getInitials(fullName) {
  const titlePattern = /^(dr\.?|ms\.?|mr\.?|mrs\.?|prof\.?)$/i;
  const words = String(fullName || '?').trim().split(/\s+/);
  if (titlePattern.test(words[0])) words.shift();
  if (!words.length || !words[0]) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function splitSpecialization(value) {
  const rawValue = String(value || 'Mental health professional').trim();
  const parentheticalTags = [...rawValue.matchAll(/\(([^)]+)\)/g)]
    .flatMap(match => match[1].split(/[,/&]+/))
    .map(tag => tag.trim())
    .filter(Boolean);
  const title = rawValue.replace(/\s*\([^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  return { title: title || 'Mental health professional', parentheticalTags };
}

function normalizedProfileName(name) {
  return String(name || '').replace(/\./g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function profilePresentation(name) {
  const key = Object.keys(STATIC_PROFILE_PRESENTATION).find(profileName => normalizedProfileName(profileName) === normalizedProfileName(name));
  return key ? STATIC_PROFILE_PRESENTATION[key] : {};
}

function profileTags(profile, extraTags = []) {
  const key = Object.keys(STATIC_PROFILE_TAGS).find(profileName => normalizedProfileName(profileName) === normalizedProfileName(profile.full_name));
  const baseTags = (key ? STATIC_PROFILE_TAGS[key] : null) ||
    String(profile.specialization || 'Professional support').replace(/\([^)]*\)/g, '').split(/[,/&]+/).map(tag => tag.trim()).filter(Boolean).slice(0, 3);
  return [...new Set([...baseTags, ...extraTags])];
}

function renderPsychologistCard(profile, index) {
  const name = profile.full_name || profile.name || 'Psychologist';
  const specialization = splitSpecialization(profile.specialization);
  const presentation = profilePresentation(name);
  const tags = profileTags({ ...profile, full_name: name }, specialization.parentheticalTags);
  const categories = presentation.categories || tags.concat(specialization.title).join(', ').toLowerCase();
  const avatar = escapePsychologistHtml(getInitials(name));
  const availability = profile.availability || 'Available';
  const availabilityStyle = availability.toLowerCase() === 'busy' ? ' style="background:#f4a261;"' : '';

  return `
    <div class="col-xl-4 col-md-6" data-categories="${escapePsychologistHtml(categories)}">
      <div class="doctor-card">
        <div class="doctor-card-top"${presentation.topStyle ? ` style="${presentation.topStyle}"` : ''}>
          <span class="availability-badge"${availabilityStyle}>${escapePsychologistHtml(availability)}</span>
          <div class="doctor-avatar"${presentation.avatarStyle ? ` style="${presentation.avatarStyle}"` : ''}>${avatar}</div>
          <div class="doctor-name">${escapePsychologistHtml(name)}</div>
          <div class="doctor-spec">${escapePsychologistHtml(specialization.title)}</div>
        </div>
        <div class="doctor-card-body">
          <div class="doctor-info-item"><i class="fas fa-graduation-cap"></i>${escapePsychologistHtml(presentation.credentials || specialization.title)}</div>
          <div class="doctor-info-item"><i class="fas fa-map-marker-alt"></i>${escapePsychologistHtml(presentation.location || 'Available online')}</div>
          <div class="doctor-info-item"><i class="fas fa-clock"></i>${escapePsychologistHtml(profile.experience || 'Experience not provided')}</div>
          <div class="doctor-info-item"><i class="fas fa-phone"></i>${escapePsychologistHtml(profile.contact || 'Contact not provided')}</div>
          <div class="doctor-info-item"><i class="fas fa-envelope"></i>${escapePsychologistHtml(profile.email || 'Email not provided')}</div>
          <div class="mt-2">${tags.map(tag => `<span class="doctor-tag">${escapePsychologistHtml(tag)}</span>`).join('')}</div>
          <a href="booking.html?${profile.id ? `id=${encodeURIComponent(profile.id)}` : `doctor=${encodeURIComponent(psychologistSlug(name))}`}" class="btn-contact" style="text-decoration:none; display:flex; align-items:center; justify-content:center;">
            <i class="fas fa-calendar-check me-2"></i>Book Appointment
          </a>
        </div>
      </div>
    </div>`;
}

async function loadPublicPsychologists() {
  const grid = document.getElementById('psychologist-grid');
  if (!grid) return;

  try {
    const response = await fetch(PSYCHOLOGISTS_API);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Unable to load psychologist profiles.');

    const psychologists = data.psychologists || [];
    grid.innerHTML = psychologists.length
      ? psychologists.map(renderPsychologistCard).join('')
      : '<div class="col-12 text-center"><p style="color:var(--text-soft);">No psychologist profiles are currently available.</p></div>';

    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
    const allFilter = document.querySelector('.filter-chip[data-filter="all"]');
    if (allFilter) allFilter.classList.add('active');
  } catch (error) {
    console.error('Error loading psychologists:', error);
    grid.innerHTML = '<div class="col-12 text-center"><p style="color:var(--rose);">Unable to load psychologist profiles. Please try again later.</p></div>';
  }
}

document.addEventListener('DOMContentLoaded', loadPublicPsychologists);
