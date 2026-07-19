// Blog posts CMS module
(function (global) {
  'use strict';

  const TAG_BADGE = {
    NEWS: 'bg-purple-100 text-purple-700',
    NOTICE: 'bg-yellow-100 text-yellow-700',
    DIARY: 'bg-green-100 text-green-700',
    ACTIVITY: 'bg-blue-100 text-blue-700',
  };

  let editingId = null;
  let editors = {};
  let currentLangTab = 'jp';

  function blogFolderFromDate(dateStr) {
    // dateStr: YYYY/MM/DD or YYYY-MM-DD
    const compact = (dateStr || '').replace(/[/-]/g, '');
    return compact ? `blog/${compact}` : 'blog/drafts';
  }

  function renderList() {
    const el = document.getElementById('postList');
    if (!el || !global.AdminState.state.siteData) return;
    const posts = [...global.AdminState.state.siteData.posts].sort((a, b) => b.id - a.id);
    if (!posts.length) {
      el.innerHTML = '<p class="text-center text-gray-400 py-12 font-mono text-sm">No posts yet.</p>';
      return;
    }
    el.innerHTML = posts
      .map((p) => {
        const title = global.AdminUI.displayTitle(p.title);
        const badge = TAG_BADGE[p.tag] || 'bg-gray-100 text-gray-600';
        const imgHtml = p.img
          ? `<img src="${global.AdminUI.escHtml(p.img)}" onerror="this.style.display='none'" class="w-16 h-16 object-cover rounded-lg flex-shrink-0">`
          : `<div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 text-gray-300">🖼</div>`;
        return `
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition group">
            ${imgHtml}
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-xs font-bold px-2 py-0.5 rounded font-mono ${badge}">${global.AdminUI.escHtml(p.tag)}</span>
                <span class="text-xs text-gray-400 font-mono">${global.AdminUI.escHtml(p.date)}</span>
                <span class="text-xs text-gray-300 font-mono">#${p.id}</span>
                ${global.AdminUI.langChips(p.langs)}
              </div>
              <p class="font-semibold text-gray-800 truncate text-sm">${global.AdminUI.escHtml(title)}</p>
            </div>
            <div class="flex gap-2 flex-shrink-0 opacity-80 group-hover:opacity-100 transition flex-wrap justify-end">
              <button type="button" data-edit-post="${p.id}" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-mono">Edit</button>
              <button type="button" data-dup-post="${p.id}" class="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-mono">Duplicate</button>
              <button type="button" data-del-post="${p.id}" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-mono">Delete</button>
            </div>
          </div>`;
      })
      .join('');

    el.querySelectorAll('[data-edit-post]').forEach((b) =>
      b.addEventListener('click', () => editPost(Number(b.dataset.editPost)))
    );
    el.querySelectorAll('[data-dup-post]').forEach((b) =>
      b.addEventListener('click', () => duplicatePost(Number(b.dataset.dupPost)))
    );
    el.querySelectorAll('[data-del-post]').forEach((b) =>
      b.addEventListener('click', () => deletePost(Number(b.dataset.delPost)))
    );
  }

  function showList() {
    document.getElementById('postListView')?.classList.remove('hidden');
    document.getElementById('postEditView')?.classList.add('hidden');
    renderList();
  }

  function showEdit() {
    document.getElementById('postListView')?.classList.add('hidden');
    document.getElementById('postEditView')?.classList.remove('hidden');
  }

  function destroyEditors() {
    for (const lang of global.AdminState.LANGS) {
      if (editors[lang]) {
        try {
          editors[lang].toTextArea();
        } catch (_) {}
        editors[lang] = null;
      }
    }
  }

  function makeImageToolbarAction(lang) {
    return {
      name: 'custom-image',
      action: async function (editor) {
        const dateVal = document.getElementById('fDate')?.value || '';
        const folder = blogFolderFromDate(dateVal.replace(/-/g, '/'));
        const path = await global.ImagePicker.open({
          folder,
          namePrefix: 'content',
        });
        if (!path) return;
        const cm = editor.codemirror;
        const selected = cm.getSelection() || 'image';
        cm.replaceSelection(`![${selected}](${path})`);
        cm.focus();
      },
      className: 'fa fa-image',
      title: 'Insert Image',
    };
  }

  function initEditors() {
    document.querySelectorAll('.post-lang-panel').forEach((p) => p.classList.remove('hidden'));
    destroyEditors();
    for (const lang of global.AdminState.LANGS) {
      const el = document.getElementById('editor-' + lang);
      if (!el) continue;
      editors[lang] = new EasyMDE({
        element: el,
        spellChecker: false,
        autofocus: false,
        status: false,
        minHeight: '220px',
        toolbar: [
          'bold',
          'italic',
          'heading-2',
          'heading-3',
          '|',
          'quote',
          'unordered-list',
          'ordered-list',
          '|',
          'link',
          makeImageToolbarAction(lang),
          '|',
          'preview',
          'side-by-side',
          'fullscreen',
        ],
      });
    }
    switchLangTab(currentLangTab);
  }

  function switchLangTab(lang) {
    currentLangTab = lang;
    document.querySelectorAll('.post-lang-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.querySelectorAll('.post-lang-panel').forEach((p) => p.classList.add('hidden'));
    document.getElementById('panel-' + lang)?.classList.remove('hidden');
    if (editors[lang]) {
      setTimeout(() => editors[lang].codemirror.refresh(), 20);
    }
    updateLangFieldState();
  }

  function getLangToggles() {
    return {
      jp: document.getElementById('langOn-jp')?.checked !== false,
      en: document.getElementById('langOn-en')?.checked !== false,
      zh: document.getElementById('langOn-zh')?.checked !== false,
    };
  }

  function setLangToggles(langs) {
    for (const l of global.AdminState.LANGS) {
      const el = document.getElementById('langOn-' + l);
      if (el) el.checked = !!(langs && langs[l]);
    }
    updateLangFieldState();
  }

  function updateLangFieldState() {
    const toggles = getLangToggles();
    for (const l of global.AdminState.LANGS) {
      const panel = document.getElementById('panel-' + l);
      if (!panel) continue;
      panel.classList.toggle('opacity-50', !toggles[l]);
      const title = document.getElementById('fTitle-' + l);
      if (title) title.disabled = !toggles[l];
      if (editors[l]) {
        editors[l].codemirror.setOption('readOnly', toggles[l] ? false : 'nocursor');
      }
    }
  }

  function updateThumb() {
    const url = document.getElementById('fImg')?.value.trim();
    const wrap = document.getElementById('thumbWrap');
    const img = document.getElementById('thumbImg');
    if (!wrap || !img) return;
    if (url) {
      img.src = url;
      wrap.classList.remove('hidden');
    } else {
      wrap.classList.add('hidden');
    }
  }

  function fillEventIdSelect(selected) {
    const sel = document.getElementById('fEventId');
    if (!sel) return;
    const ids = global.AdminState.eventIds ? global.AdminState.eventIds() : [];
    const cur = selected || '';
    sel.innerHTML =
      '<option value="">— none —</option>' +
      ids
        .map(
          (id) =>
            `<option value="${global.AdminUI.escHtml(id)}"${id === cur ? ' selected' : ''}>${global.AdminUI.escHtml(id)}</option>`
        )
        .join('');
    // Keep custom eventId if not in catalog yet
    if (cur && !ids.includes(cur)) {
      const opt = document.createElement('option');
      opt.value = cur;
      opt.textContent = cur + ' (missing in events.js)';
      opt.selected = true;
      sel.appendChild(opt);
    }
    sel.value = cur || '';
  }

  function newPost() {
    editingId = null;
    document.getElementById('editHeading').textContent = 'New Post';
    document.getElementById('fTag').value = 'NEWS';
    document.getElementById('fDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('fImg').value = '';
    fillEventIdSelect('');
    setLangToggles({ jp: true, en: true, zh: true });
    for (const lang of global.AdminState.LANGS) {
      document.getElementById('fTitle-' + lang).value = '';
    }
    updateThumb();
    showEdit();
    initEditors();
    for (const lang of global.AdminState.LANGS) editors[lang]?.value('');
    switchLangTab('jp');
  }

  function editPost(id) {
    const post = global.AdminState.state.siteData.posts.find((p) => p.id === id);
    if (!post) return;
    editingId = id;
    document.getElementById('editHeading').textContent = 'Edit Post #' + id;
    document.getElementById('fTag').value = post.tag;
    document.getElementById('fDate').value = (post.date || '').replace(/\//g, '-');
    document.getElementById('fImg').value = post.img || '';
    fillEventIdSelect(post.eventId || '');
    setLangToggles(post.langs || { jp: true, en: true, zh: true });
    for (const lang of global.AdminState.LANGS) {
      document.getElementById('fTitle-' + lang).value = post.title[lang] || '';
    }
    updateThumb();
    showEdit();
    initEditors();
    for (const lang of global.AdminState.LANGS) {
      editors[lang]?.value(post.content[lang] || '');
    }
    switchLangTab('jp');
  }

  function collectPost() {
    const dateRaw = document.getElementById('fDate').value;
    if (!dateRaw) {
      global.AdminUI.showToast('Please pick a date.', 'error');
      return null;
    }
    const langs = getLangToggles();
    if (!langs.jp && !langs.en && !langs.zh) {
      global.AdminUI.showToast('Enable at least one language.', 'error');
      return null;
    }

    const title = {};
    const content = {};
    for (const lang of global.AdminState.LANGS) {
      if (langs[lang]) {
        title[lang] = document.getElementById('fTitle-' + lang).value.trim() || null;
        content[lang] = editors[lang] ? editors[lang].value().trim() || null : null;
      } else {
        title[lang] = null;
        content[lang] = null;
      }
    }

    const hasTitle = Object.values(title).some(Boolean);
    if (!hasTitle) {
      global.AdminUI.showToast('Enter a title for at least one enabled language.', 'error');
      return null;
    }

    const existing =
      editingId !== null
        ? global.AdminState.state.siteData.posts.find((p) => p.id === editingId)
        : null;

    const eventIdRaw = document.getElementById('fEventId').value.trim();

    return {
      ...(existing || {}),
      id: editingId !== null ? editingId : global.AdminState.nextPostId(),
      tag: document.getElementById('fTag').value,
      date: dateRaw.replace(/-/g, '/'),
      img: document.getElementById('fImg').value.trim() || null,
      eventId: eventIdRaw || null,
      langs,
      title,
      content,
    };
  }

  function savePost() {
    const post = collectPost();
    if (!post) return;
    const posts = global.AdminState.state.siteData.posts;
    if (editingId !== null) {
      const idx = posts.findIndex((p) => p.id === editingId);
      if (idx !== -1) posts[idx] = post;
      global.AdminUI.showToast('Post updated — click Save all to write files.');
    } else {
      posts.push(post);
      global.AdminUI.showToast(`Post #${post.id} created — click Save all.`);
    }
    global.AdminState.markDirty();
    showList();
  }

  function duplicatePost(id) {
    const src = global.AdminState.state.siteData.posts.find((p) => p.id === id);
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = global.AdminState.nextPostId();
    for (const lang of global.AdminState.LANGS) {
      if (copy.title[lang]) {
        const suffix = lang === 'jp' ? ' (コピー)' : lang === 'zh' ? '（複製）' : ' (copy)';
        copy.title[lang] = copy.title[lang] + suffix;
      }
    }
    global.AdminState.state.siteData.posts.push(copy);
    global.AdminState.markDirty();
    renderList();
    global.AdminUI.showToast(`Duplicated as #${copy.id} — click Save all.`);
  }

  function deletePost(id) {
    const post = global.AdminState.state.siteData.posts.find((p) => p.id === id);
    const name = post ? global.AdminUI.displayTitle(post.title) : 'this post';
    if (!global.AdminUI.confirmDialog(`Delete post #${id}: "${name}"?\n\nIn memory until you Save all. Image files are kept.`))
      return;
    global.AdminState.state.siteData.posts = global.AdminState.state.siteData.posts.filter(
      (p) => p.id !== id
    );
    global.AdminState.markDirty();
    renderList();
    global.AdminUI.showToast('Post deleted — click Save all.');
  }

  async function pickThumb() {
    const dateVal = document.getElementById('fDate')?.value || '';
    const folder = blogFolderFromDate(dateVal.replace(/-/g, '/'));
    const path = await global.ImagePicker.open({
      folder,
      namePrefix: 'thumb',
      width: 800,
      height: 450,
    });
    if (!path) return;
    document.getElementById('fImg').value = path;
    updateThumb();
  }

  function bind() {
    document.getElementById('btnNewPost')?.addEventListener('click', newPost);
    document.getElementById('btnCancelPost')?.addEventListener('click', showList);
    document.getElementById('btnCancelPost2')?.addEventListener('click', showList);
    document.getElementById('btnSavePost')?.addEventListener('click', savePost);
    document.getElementById('btnPickThumb')?.addEventListener('click', pickThumb);
    document.getElementById('fImg')?.addEventListener('input', updateThumb);
    document.querySelectorAll('.post-lang-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchLangTab(btn.dataset.lang));
    });
    for (const l of global.AdminState.LANGS) {
      document.getElementById('langOn-' + l)?.addEventListener('change', updateLangFieldState);
    }
  }

  function onSectionShow() {
    showList();
  }

  global.AdminPosts = {
    bind,
    renderList,
    showList,
    onSectionShow,
  };
})(window);
