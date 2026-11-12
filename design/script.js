(function () {
  'use strict';

  const USERS = [
    { id: 1, name: 'Rina', email: 'admin@teamorbit.test', role: 'admin' },
    { id: 2, name: 'Budi', email: 'budi@teamorbit.test', role: 'member' },
    { id: 3, name: 'Ani', email: 'ani@teamorbit.test', role: 'member' },
    { id: 4, name: 'Citra', email: 'citra@teamorbit.test', role: 'member' }
  ];

  const PROJECTS = {
    marketing: { label: 'Marketing', class: 'project-marketing' },
    engineering: { label: 'Engineering', class: 'project-engineering' },
    design: { label: 'Design', class: 'project-design' },
    admin: { label: 'Admin', class: 'project-admin' }
  };

  const MOCK_TASKS = [
    { id: 101, title: 'Susun rundown rapat mingguan', description: 'Rapat sinkronisasi antar divisi.', status: 'belum_selesai', createdBy: 2, assigneeIds: [2, 3], project: 'marketing', dueDate: '2026-11-15' },
    { id: 102, title: 'Perbaiki tautan unduhan panduan onboarding', description: 'Beberapa tautan mengarah ke 404.', status: 'belum_selesai', createdBy: 1, assigneeIds: [1, 4], project: 'engineering', dueDate: '2026-11-18' },
    { id: 103, title: 'Rapikan penamaan file arsip Q3', description: 'Gunakan format YYYY-MM-namaFile.', status: 'selesai', createdBy: 2, assigneeIds: [2], project: 'admin', dueDate: '2026-11-10' },
    { id: 104, title: 'Draft pengumuman maintenance server', description: 'Jadwal downtime perlu dikomunikasikan.', status: 'belum_selesai', createdBy: 1, assigneeIds: [1, 2, 3], project: 'engineering', dueDate: '2026-11-20' },
    { id: 105, title: 'Cek ulang daftar hadir Oktober', description: 'Pastikan absen tercatat.', status: 'selesai', createdBy: 3, assigneeIds: [3, 4], project: 'design', dueDate: '2026-11-12' }
  ];

  let tasks = JSON.parse(JSON.stringify(MOCK_TASKS));
  let role = 'member';
  let currentUserId = 2;
  let filter = 'all';
  let projectFilter = 'all';
  let searchQuery = '';
  let dashboardState = 'loaded';
  let editingTaskId = null;
  let selectedDetailId = 101;

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function avatarColor(name) {
    const palette = ['#1E6B4F', '#E06C6C', '#5B6FE8', '#A855F7', '#B45309'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % palette.length;
    return palette[h];
  }

  function toast(message, type) {
    const c = document.createElement('div');
    c.className = 'toast' + (type === 'danger' ? ' toast-danger' : '');
    c.textContent = message;
    const container = $('#toastContainer');
    container.appendChild(c);
    setTimeout(function () { c.remove(); }, 3000);
  }

  function formatDate(str) {
    if (!str) return '-';
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  function isOverdue(str) {
    if (!str) return false;
    const due = new Date(str + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  function showPage(name) {
    $$('.page').forEach(function (p) { p.classList.add('hidden'); });
    $('#page-' + name).classList.remove('hidden');
    $$('[data-goto]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.goto === name); });

    const topbar = $('#topbar');
    const sidebar = $('#sidebar');
    if (name === 'login' || name === 'register') {
      topbar.style.display = 'none';
      sidebar.style.display = 'none';
    } else {
      topbar.style.display = 'flex';
      sidebar.style.display = 'flex';
      $('#navAdmin').style.display = role === 'admin' ? 'flex' : 'none';
      const current = USERS.find(function (u) { return u.id === currentUserId; });
      $('#topbarAvatar').textContent = (current || {}).name ? current.name.charAt(0) : 'U';
    }

    if (name === 'dashboard') renderDashboard();
    if (name === 'detail') renderDetail();
    if (name === 'admin') renderAdmin();
  }

  function filteredTasks() {
    let list = tasks.filter(function (t) {
      if (role === 'admin') return true;
      return t.createdBy === currentUserId || t.assigneeIds.indexOf(currentUserId) !== -1;
    });
    if (filter !== 'all') list = list.filter(function (t) { return t.status === filter; });
    if (projectFilter !== 'all') list = list.filter(function (t) { return t.project === projectFilter; });
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(function (t) {
        if (t.title.toLowerCase().indexOf(q) !== -1) return true;
        if (t.description && t.description.toLowerCase().indexOf(q) !== -1) return true;
        const meta = PROJECTS[t.project];
        if (meta && meta.label.toLowerCase().indexOf(q) !== -1) return true;
        return t.assigneeIds.some(function (id) {
          const u = USERS.find(function (x) { return x.id === id; });
          return u && u.name.toLowerCase().indexOf(q) !== -1;
        });
      });
    }
    return list;
  }

  function projectTag(p) {
    const meta = PROJECTS[p] || PROJECTS.admin;
    return '<span class="tag ' + meta.class + '">' + meta.label + '</span>';
  }

  function avatar(id, size) {
    const u = USERS.find(function (x) { return x.id === id; });
    if (!u) return '';
    return '<span class="avatar" style="background:' + avatarColor(u.name) + (size ? '; width:' + size + 'px; height:' + size + 'px; font-size:0.7rem' : '') + '" title="' + u.name + '">' + u.name.charAt(0) + '</span>';
  }

  function renderStats(list) {
    const total = list.length;
    const done = list.filter(function (t) { return t.status === 'selesai'; }).length;
    const open = list.filter(function (t) { return t.status !== 'selesai'; }).length;
    const overdue = list.filter(function (t) { return t.status !== 'selesai' && isOverdue(t.dueDate); }).length;
    $('#statsGrid').innerHTML =
      '<div class="stat-card"><div class="stat-icon"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></div><div><h3>' + total + '</h3><p>Total tugas</p></div></div>' +
      '<div class="stat-card accent"><div class="stat-icon"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3>' + open + '</h3><p>Belum selesai</p></div></div>' +
      '<div class="stat-card"><div class="stat-icon"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3>' + done + '</h3><p>Selesai</p></div></div>' +
      '<div class="stat-card"><div class="stat-icon"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.427 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.427 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.427-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg></div><div><h3>' + overdue + '</h3><p>Jatuh tempo</p></div></div>';
  }

  function renderChips(list) {
    const counts = { all: list.length, marketing: 0, engineering: 0, design: 0, admin: 0 };
    list.forEach(function (t) { if (counts[t.project] !== undefined) counts[t.project]++; });
    const chips = [
      { key: 'all', label: 'Semua' },
      { key: 'marketing', label: 'Marketing' },
      { key: 'engineering', label: 'Engineering' },
      { key: 'design', label: 'Design' },
      { key: 'admin', label: 'Admin' }
    ];
    $('#filterChips').innerHTML = chips.map(function (c) {
      const active = projectFilter === c.key;
      return '<button class="chip ' + (active ? 'is-active' : '') + '" data-chip="' + c.key + '">' + c.label + '<span class="badge">' + counts[c.key] + '</span></button>';
    }).join('');
    $$('#filterChips .chip').forEach(function (chip) {
      chip.onclick = function () {
        projectFilter = chip.dataset.chip;
        $$('#filterChips .chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        renderDashboard();
      };
    });
  }

  function renderBoard(list) {
    const open = list.filter(function (t) { return t.status !== 'selesai'; });
    const done = list.filter(function (t) { return t.status === 'selesai'; });

    function card(t) {
      const isDone = t.status === 'selesai';
      const overdue = !isDone && isOverdue(t.dueDate);
      const u = USERS.find(function (x) { return x.id === t.createdBy; });
      return '<div class="board-card ' + (overdue ? 'alert' : '') + '" data-detail="' + t.id + '" tabindex="0" role="button">' +
        '<div class="board-card-header">' +
        avatar(t.createdBy, 34) +
        '<div>' +
        '<p class="board-card-title">' + escapeHtml(t.title) + '</p>' +
        '<p class="board-card-sub">' + (u ? u.name : '') + '</p>' +
        '</div>' +
        '</div>' +
        '<div class="board-card-body">' + projectTag(t.project) + '<span class="tag ' + (isDone ? 'tag--done' : 'tag--due') + '">' + (isDone ? 'Selesai' : formatDate(t.dueDate)) + '</span></div>' +
        (overdue ? '<div class="board-card-note">Jatuh tempo</div>' : '') +
        '</div>';
    }

    return '<div class="board">' +
      '<div class="board-col"><div class="board-col-header"><h3>Belum selesai</h3><span class="target">' + open.length + ' tugas</span></div>' + open.map(card).join('') + '</div>' +
      '<div class="board-col"><div class="board-col-header"><h3>Selesai</h3><span class="target">' + done.length + ' tugas</span></div>' + done.map(card).join('') + '</div>' +
      '</div>';
  }

  function renderDashboard() {
    const list = filteredTasks();
    const content = $('#dashboardContent');

    if (dashboardState === 'loading') {
      content.innerHTML = '<div class="skeleton-row"><div class="skeleton" style="width:70%; margin-bottom:0.75rem"></div><div class="skeleton" style="width:40%"></div></div><div class="skeleton-row"><div class="skeleton" style="width:80%; margin-bottom:0.75rem"></div><div class="skeleton" style="width:35%"></div></div><p style="color:var(--muted); font-size:0.875rem; text-align:center; margin-top:1rem">Memuat tugas...</p>';
      renderStats(list);
      renderChips(list);
      return;
    }
    if (dashboardState === 'error') {
      content.innerHTML = '<div class="empty-state"><h3>Gagal memuat tugas</h3><p>Terjadi kesalahan saat mengambil data. Silakan coba lagi.</p><button class="btn btn-primary" id="retryLoad">Coba lagi</button></div>';
      $('#retryLoad').onclick = function () {
        dashboardState = 'loading'; renderDashboard();
        setTimeout(function () { dashboardState = 'loaded'; renderDashboard(); }, 800);
      };
      renderStats(list);
      renderChips(list);
      return;
    }

    renderStats(list);
    renderChips(list);

    if (!list.length) {
      content.innerHTML = '<div class="empty-state"><h3>Belum ada tugas di sini</h3><p>Mulai dengan membuat tugas baru atau ubah filter.</p><button type="button" class="btn btn-primary" id="emptyAddTask">Buat tugas baru</button></div>';
      $('#emptyAddTask').onclick = function () { openTaskModal(); };
      return;
    }

    content.innerHTML = renderBoard(list);
    $$('[data-detail]', content).forEach(function (row) {
      row.addEventListener('click', function () { selectedDetailId = parseInt(row.dataset.detail); showPage('detail'); });
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectedDetailId = parseInt(row.dataset.detail); showPage('detail'); }
      });
    });
  }

  function openTaskModal(task) {
    const modal = $('#taskModal');
    $('#taskTitle').value = task ? task.title : '';
    $('#taskDesc').value = task ? task.description : '';
    $('#taskProject').value = (task && task.project) ? task.project : '';
    $('#taskDue').value = (task && task.dueDate) ? task.dueDate : '';
    $('#modalTitle').textContent = task ? 'Edit tugas' : 'Tugas baru';
    $('#titleCounter').textContent = (($('#taskTitle').value || '')).length + ' / 100';
    $('#titleCounter').classList.remove('is-over');
    editingTaskId = task ? task.id : null;
    modal.classList.add('is-open');
    setTimeout(function () { $('#taskTitle').focus(); }, 0);
  }

  function closeTaskModal() { $('#taskModal').classList.remove('is-open'); editingTaskId = null; }

  function saveTask(title, description, project, dueDate) {
    if (editingTaskId) {
      const t = tasks.find(function (x) { return x.id === editingTaskId; });
      if (t) { t.title = title; t.description = description; t.project = project || 'admin'; t.dueDate = dueDate; toast('Tugas diperbarui'); }
    } else {
      const newId = tasks.length ? Math.max.apply(null, tasks.map(function (t) { return t.id; })) + 1 : 1;
      tasks.push({ id: newId, title: title, description: description, status: 'belum_selesai', createdBy: currentUserId, assigneeIds: [currentUserId], project: project || 'admin', dueDate: dueDate });
      toast('Tugas baru dibuat');
    }
    closeTaskModal();
    renderDashboard();
  }

  function renderDetail() {
    const t = tasks.find(function (x) { return x.id === selectedDetailId; }) || tasks[0];
    selectedDetailId = t.id;
    const done = t.status === 'selesai';
    const canEdit = role === 'admin' || t.createdBy === currentUserId || t.assigneeIds.indexOf(currentUserId) !== -1;
    const creator = USERS.find(function (u) { return u.id === t.createdBy; });
    const overdue = !done && isOverdue(t.dueDate);

    const titleEl = $('#detailTitle');
    titleEl.textContent = t.title;
    titleEl.classList.toggle('detail-title--done', done);

    $('#detailActions').innerHTML =
      '<button type="button" class="btn" id="toggleStatusBtn">' + (done ? 'Tandai belum selesai' : 'Tandai selesai') + '</button>' +
      (canEdit ? '<button type="button" class="btn" id="editTaskBtn">Edit</button>' : '') +
      (canEdit ? '<button type="button" class="btn btn-danger" id="deleteTaskBtn">Hapus</button>' : '');

    const available = USERS.filter(function (u) { return t.assigneeIds.indexOf(u.id) === -1; }).map(function (u) {
      return '<option value="' + u.id + '">' + u.name + ' (' + u.email + ')</option>';
    }).join('');
    const addAssignee = canEdit
      ? '<div class="assignee-list" style="margin-top:0.75rem"><select id="assigneeSelect"><option value="">+ Tambah assignee</option>' + available + '</select><button type="button" class="btn" id="addAssigneeBtn" disabled>Tambah</button></div>'
      : '<p style="font-size:0.875rem; color:var(--muted); margin-top:0.75rem">Kamu tidak punya izin mengubah assignee.</p>';

    $('#detailBody').innerHTML =
      '<div class="card">' +
      '<dl class="properties">' +
      '<dt>Status</dt><dd><span class="tag ' + (done ? 'tag--done' : 'tag--due') + '">' + (done ? 'Selesai' : 'Belum selesai') + '</span></dd>' +
      '<dt>Proyek</dt><dd>' + projectTag(t.project) + '</dd>' +
      '<dt>Tenggat</dt><dd class="' + (overdue ? 'due-overdue' : '') + '">' + (t.dueDate ? formatDate(t.dueDate) + (overdue ? ' (jatuh tempo)' : '') : '-') + '</dd>' +
      '<dt>Dibuat oleh</dt><dd>' + (creator ? creator.name : '') + '</dd>' +
      '</dl>' +
      '</div>' +
      '<div class="panel"><h2>Deskripsi</h2><p class="content-block">' + (escapeHtml(t.description) || 'Tidak ada deskripsi.') + '</p></div>' +
      '<div class="panel"><h2>Assignee</h2><div class="assignee-list" id="assigneeChips">' + renderAssigneeChips(t, canEdit) + '</div>' + addAssignee + '</div>';

    $('#toggleStatusBtn').onclick = function () {
      t.status = done ? 'belum_selesai' : 'selesai';
      renderDetail(); renderDashboard();
      toast('Status diubah ke ' + (t.status === 'selesai' ? 'selesai' : 'belum selesai'));
    };
    if ($('#editTaskBtn')) $('#editTaskBtn').onclick = function () { openTaskModal(t); };
    if ($('#deleteTaskBtn')) $('#deleteTaskBtn').onclick = function () {
      if (confirm('Hapus tugas ini? Tindakan ini tidak bisa dibatalkan.')) {
        tasks = tasks.filter(function (x) { return x.id !== t.id; });
        toast('Tugas dihapus');
        showPage('dashboard');
      }
    };
    $$('[data-remove]', $('#detailBody')).forEach(function (btn) {
      btn.onclick = function () {
        const id = parseInt(btn.dataset.remove);
        t.assigneeIds = t.assigneeIds.filter(function (x) { return x !== id; });
        renderDetail();
        toast('Assignee dihapus');
      };
    });
    const sel = $('#assigneeSelect');
    if (sel) {
      sel.onchange = function () { $('#addAssigneeBtn').disabled = !sel.value; };
      $('#addAssigneeBtn').onclick = function () {
        const id = parseInt(sel.value);
        if (!id) return;
        t.assigneeIds.push(id);
        renderDetail();
        toast('Assignee ditambahkan');
      };
    }
  }

  function renderAssigneeChips(t, canEdit) {
    const assignees = t.assigneeIds.map(function (id) { return USERS.find(function (u) { return u.id === id; }); }).filter(Boolean);
    if (!assignees.length) return '<span style="color:var(--muted); font-size:0.875rem">Belum ada assignee.</span>';
    return assignees.map(function (u) {
      return '<span class="assignee-chip"><span class="avatar" style="background:' + avatarColor(u.name) + '">' + u.name.charAt(0) + '</span>' + u.name + (canEdit ? '<button type="button" data-remove="' + u.id + '" aria-label="Hapus ' + u.name + '">×</button>' : '') + '</span>';
    }).join('');
  }

  function renderAdmin() {
    if (role !== 'admin') { showPage('forbidden'); return; }
    const q = (($('#userSearch') && $('#userSearch').value) || '').toLowerCase();
    const filtered = USERS.filter(function (u) { return u.name.toLowerCase().indexOf(q) !== -1 || u.email.toLowerCase().indexOf(q) !== -1; });
    $('#usersTableBody').innerHTML = filtered.map(function (u) {
      const isSelf = u.id === currentUserId;
      return '<tr><td data-label="Nama"><strong>' + escapeHtml(u.name) + '</strong></td>' +
        '<td data-label="Email" class="muted">' + escapeHtml(u.email) + '</td>' +
        '<td data-label="Role"><select ' + (isSelf ? 'disabled title="Tidak bisa mengubah role sendiri"' : '') + ' data-user="' + u.id + '">' +
        '<option value="member"' + (u.role === 'member' ? ' selected' : '') + '>Member</option>' +
        '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>Admin</option>' +
        '</select></td>' +
        '<td data-label="Aksi">' + (isSelf ? '<span class="muted">Tidak bisa ubah sendiri</span>' : '-') + '</td></tr>';
    }).join('');
    $$('#usersTable select').forEach(function (sel) {
      sel.onchange = function () {
        const uid = parseInt(sel.dataset.user);
        const user = USERS.find(function (u) { return u.id === uid; });
        if (user) { user.role = sel.value; toast('Role ' + user.name + ' diubah ke ' + user.role); renderAdmin(); }
      };
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function validateLogin(e) {
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    $('#loginEmail').closest('.form-group').classList.toggle('has-error', !email);
    $('#loginPassword').closest('.form-group').classList.toggle('has-error', !password);
    if (email && password) { toast('Berhasil masuk'); showPage('dashboard'); }
  }

  function validateRegister(e) {
    e.preventDefault();
    const name = $('#regName').value.trim();
    const email = $('#regEmail').value.trim();
    const password = $('#regPassword').value;
    const confirm = $('#regPasswordConfirm').value;
    const groups = $$('#registerForm .form-group');
    groups[0].classList.toggle('has-error', !name);
    groups[1].classList.toggle('has-error', !email || /^\S+@\S+$/.test(email) === false);
    groups[2].classList.toggle('has-error', password.length < 8);
    groups[3].classList.toggle('has-error', !confirm || confirm !== password);
    if (name && email && password.length >= 8 && confirm === password) {
      toast('Akun dibuat. Silakan masuk.');
      showPage('login');
    }
  }

  function validateTask(e) {
    e.preventDefault();
    const title = $('#taskTitle').value.trim();
    const desc = $('#taskDesc').value.trim();
    const project = $('#taskProject').value;
    const due = $('#taskDue').value;
    const group = $('#taskTitle').closest('.form-group');
    const valid = title.length > 0 && title.length <= 100;
    group.classList.toggle('has-error', !valid);
    if (valid) saveTask(title, desc, project, due);
  }

  function setActiveSidebar() {
    const visible = document.querySelector('.page:not(.hidden)');
    const name = visible ? visible.id.replace('page-', '') : 'dashboard';
    $$('.sidebar-link').forEach(function (link) {
      const isActive = (name === 'dashboard' && link.dataset.goto === 'dashboard') ||
        (name === 'admin' && link.dataset.goto === 'admin');
      link.classList.toggle('is-active', isActive);
    });
  }

  $$('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); showPage(el.dataset.goto); setActiveSidebar(); });
  });
  $$('[data-role]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      role = btn.dataset.role;
      currentUserId = role === 'admin' ? 1 : 2;
      $$('[data-role]').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      const currentPage = document.querySelector('.page:not(.hidden)').id.replace('page-', '');
      if (currentPage === 'admin' && role !== 'admin') showPage('dashboard');
      else if (currentPage === 'dashboard' || currentPage === 'detail' || currentPage === 'admin') { showPage(currentPage); }
      setActiveSidebar();
    });
  });
  $$('[data-state]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      dashboardState = btn.dataset.state;
      $$('[data-state]').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      renderDashboard();
    });
  });
  $$('[data-filter-project]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      projectFilter = link.dataset.filterProject;
      $$('[data-filter-project]').forEach(function (l) { l.classList.remove('is-active'); });
      link.classList.add('is-active');
      showPage('dashboard');
    });
  });

  $('#themeToggle').onclick = function () {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    $('#themeToggle').textContent = isDark ? 'Gelap' : 'Terang';
  };

  $('#openTaskModal').onclick = function () { openTaskModal(); };
  $('#closeModal').onclick = closeTaskModal;
  $('#cancelModal').onclick = closeTaskModal;
  $('#taskModal').addEventListener('click', function (e) { if (e.target === $('#taskModal')) closeTaskModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#taskModal').classList.contains('is-open')) closeTaskModal(); });
  $('#taskTitle').addEventListener('input', function (e) {
    const len = e.target.value.length;
    $('#titleCounter').textContent = len + ' / 100';
    $('#titleCounter').classList.toggle('is-over', len > 100);
  });
  $('#globalSearch').addEventListener('input', function (e) {
    searchQuery = e.target.value.trim();
    const currentPage = document.querySelector('.page:not(.hidden)').id.replace('page-', '');
    if (currentPage === 'dashboard') renderDashboard();
  });

  $('#loginForm').onsubmit = validateLogin;
  $('#registerForm').onsubmit = validateRegister;
  $('#taskForm').onsubmit = validateTask;
  $('#fillAdmin').onclick = function () { $('#loginEmail').value = 'admin@teamorbit.test'; $('#loginPassword').value = 'password'; };
  $('#fillMember').onclick = function () { $('#loginEmail').value = 'budi@teamorbit.test'; $('#loginPassword').value = 'password'; };
  $('#userSearch').oninput = function () { renderAdmin(); };

  const sidebar = $('#sidebar');
  $('#sidebarToggle').onclick = function () { sidebar.classList.toggle('is-open'); };
  document.addEventListener('click', function (e) {
    if (window.innerWidth <= 768 && sidebar.classList.contains('is-open') && !sidebar.contains(e.target) && !$('#sidebarToggle').contains(e.target)) {
      sidebar.classList.remove('is-open');
    }
  });

  document.documentElement.setAttribute('data-theme', 'light');
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('page') === 'dashboard') showPage('dashboard');
  else showPage('login');
})();
