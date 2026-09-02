// src/pages/tools/note/note.js
import { 
  getToolData, 
  createToolItem, 
  updateToolItem, 
  deleteToolItem 
} from '../../../core/actions/tools-service.js';

export function createNotePage(ctx) {
  let notes = [];
  let root = null;
  let activeModalMode = null; // 'create' | 'edit'
  let currentEditingId = null;

  // --- بارگذاری اولیه داده‌ها ---
  async function loadNotes() {
    renderGridState('در حال دریافت یادداشت‌ها...');
    try {
      notes = await getToolData('notes');
      renderNotesList();
    } catch (err) {
      console.error('Error loading notes:', err);
      renderGridState('خطا در دریافت اطلاعات از سرور. لطفاً دوباره تلاش کنید.', true);
    }
  }

  // --- وضعیت نمایش گرید ---
  function renderGridState(message, isError = false) {
    const listContainer = root?.querySelector('[data-notes-list]');
    if (!listContainer) return;
    listContainer.innerHTML = `
      <div class="state-message" style="${isError ? 'color: #ef4444; border-color: #fee2e2;' : ''}">
        <p>${message}</p>
      </div>
    `;
  }

  // --- رندر لیست کارت‌ها ---
  function renderNotesList() {
    const listContainer = root?.querySelector('[data-notes-list]');
    if (!listContainer) return;

    if (!notes || notes.length === 0) {
      renderGridState('هنوز هیچ یادداشتی ثبت نشده است. اولین یادداشت خود را ایجاد کنید!');
      return;
    }

    listContainer.innerHTML = notes.map((note) => `
      <article class="note-card" data-id="${note.id}">
        <div class="note-card-body">
          <h3 class="note-card-title">${escapeHtml(note.title)}</h3>
          <p class="note-card-content">${escapeHtml(note.content || '')}</p>
        </div>
        <footer class="note-card-footer">
          <div class="note-card-actions">
            <button type="button" class="btn-icon" data-action="edit" data-id="${note.id}">ویرایش</button>
            <button type="button" class="btn-icon delete" data-action="delete" data-id="${note.id}">حذف</button>
          </div>
        </footer>
      </article>
    `).join('');
  }

  // فرار از تگ‌های خطرناک HTML (امنیت XSS)
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- ساختار اصلی HTML + CSS ---
  function render() {
    return `
      <style>
        .notes-page-root {
          --primary: #6366f1;
          --primary-hover: #4f46e5;
          --bg-card: #ffffff;
          --border: #e2e8f0;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --danger: #ef4444;
          --radius: 12px;
          --transition: all 0.2s ease-in-out;
          
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          box-sizing: border-box;
          direction: rtl;
        }

        .notes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .notes-header-info h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0 0 6px 0;
        }

        .notes-header-info p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .btn-primary-action {
          background: var(--primary);
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: var(--radius);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-primary-action:hover {
          background: var(--primary-hover);
        }

        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .note-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 160px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
          transition: var(--transition);
        }

        .note-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          border-color: #cbd5e1;
        }

        .note-card-title {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .note-card-content {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .note-card-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
          margin-top: 14px;
        }

        .note-card-actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: var(--transition);
          color: var(--text-main);
        }

        .btn-icon:hover {
          background: #f8fafc;
        }

        .btn-icon.delete {
          color: var(--danger);
          border-color: #fee2e2;
        }

        .btn-icon.delete:hover {
          background: #fef2f2;
        }

        .state-message {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px 16px;
          background: #f8fafc;
          border-radius: var(--radius);
          border: 1px dashed var(--border);
          color: var(--text-muted);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease, visibility 0.2s ease;
        }

        .modal-overlay.active {
          opacity: 1;
          visibility: visible;
        }

        .modal-content {
          background: #ffffff;
          border-radius: 16px;
          width: 90%;
          max-width: 480px;
          padding: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.2rem;
          color: var(--text-main);
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          font-size: 1.4rem;
          cursor: pointer;
          color: var(--text-muted);
        }

        .form-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-main);
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.95rem;
          box-sizing: border-box;
          outline: none;
          font-family: inherit;
        }

        .form-input:focus, .form-textarea:focus {
          border-color: var(--primary);
        }

        .form-textarea {
          min-height: 110px;
          resize: vertical;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
        }

        .btn-secondary {
          background: #f1f5f9;
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          color: var(--text-main);
        }
      </style>

      <div class="notes-page-root">
        <header class="notes-header">
          <div class="notes-header-info">
            <h1>مدیریت یادداشت‌ها</h1>
            <p>یادداشت‌های روزانه و ایده‌های خود را ثبت و مدیریت کنید.</p>
          </div>
          <button type="button" id="btn-open-add-modal" class="btn-primary-action">
            + یادداشت جدید
          </button>
        </header>

        <section class="notes-grid" data-notes-list>
          <div class="state-message"><p>در حال آماده‌سازی...</p></div>
        </section>

        <!-- مودال ثبت و ویرایش -->
        <div class="modal-overlay" id="note-modal">
          <div class="modal-content" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h3 id="modal-title">افزودن یادداشت جدید</h3>
              <button type="button" class="modal-close-btn" data-action="close-modal">&times;</button>
            </div>
            
            <form id="note-form" onsubmit="return false;">
              <div class="form-group">
                <label for="note-title-input">عنوان یادداشت *</label>
                <input type="text" id="note-title-input" class="form-input" placeholder="عنوان را وارد کنید..." required />
              </div>
              <div class="form-group">
                <label for="note-content-input">متن یادداشت</label>
                <textarea id="note-content-input" class="form-textarea" placeholder="متن کامل یادداشت..."></textarea>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" data-action="close-modal">انصراف</button>
                <button type="button" id="btn-submit-form" class="btn-primary-action" data-action="submit-note">ذخیره</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  // --- باز و بسته کردن مودال ---
  function openModal(mode, note = null) {
    activeModalMode = mode;
    currentEditingId = note ? note.id : null;

    const modal = root.querySelector('#note-modal');
    const modalTitle = root.querySelector('#modal-title');
    const titleInput = root.querySelector('#note-title-input');
    const contentInput = root.querySelector('#note-content-input');

    if (mode === 'edit' && note) {
      modalTitle.textContent = 'ویرایش یادداشت';
      titleInput.value = note.title;
      contentInput.value = note.content || '';
    } else {
      modalTitle.textContent = 'افزودن یادداشت جدید';
      titleInput.value = '';
      contentInput.value = '';
    }

    modal.classList.add('active');
    titleInput.focus();
  }

  function closeModal() {
    const modal = root?.querySelector('#note-modal');
    if (modal) modal.classList.remove('active');
    activeModalMode = null;
    currentEditingId = null;
  }

  // --- ذخیره اطلاعات نوت ---
  async function submitNote() {
    const titleInput = root.querySelector('#note-title-input');
    const contentInput = root.querySelector('#note-content-input');
    const submitBtn = root.querySelector('#btn-submit-form');

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title) {
      titleInput.focus();
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'در حال ذخیره...';

      if (activeModalMode === 'create') {
        const newNote = await createToolItem('notes', { title, content });
        notes.unshift(newNote);
      } else if (activeModalMode === 'edit' && currentEditingId) {
        const updated = await updateToolItem('notes', currentEditingId, { title, content });
        const index = notes.findIndex((n) => String(n.id) === String(currentEditingId));
        if (index !== -1) notes[index] = updated;
      }

      renderNotesList();
      closeModal();
    } catch (err) {
      console.error('Error saving note:', err);
      alert('خطا در ذخیره یادداشت. وضعیت اتصال را بررسی کنید.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'ذخیره';
    }
  }

  // --- مدیریت کلیک‌ها (Event Delegation) ---
  async function handlePageClick(event) {
    // ۱. سابمیت دکمه ذخیره
    if (event.target.closest('[data-action="submit-note"]')) {
      event.preventDefault();
      event.stopPropagation();
      await submitNote();
      return;
    }

    // ۲. دکمه باز کردن مودال افزودن
    if (event.target.closest('#btn-open-add-modal')) {
      openModal('create');
      return;
    }

    // ۳. دکمه‌های بستن مودال
    if (event.target.closest('[data-action="close-modal"]')) {
      closeModal();
      return;
    }

    // ۴. کلیک روی بک‌دراپ تیره مودال
    if (event.target.id === 'note-modal') {
      closeModal();
      return;
    }

    // ۵. دکمه ویرایش
    const editBtn = event.target.closest('[data-action="edit"]');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const target = notes.find((n) => String(n.id) === String(id));
      if (target) openModal('edit', target);
      return;
    }

    // ۶. دکمه حذف
    const deleteBtn = event.target.closest('[data-action="delete"]');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (!confirm('آیا از حذف این یادداشت اطمینان دارید؟')) return;

      try {
        deleteBtn.disabled = true;
        await deleteToolItem('notes', id);
        notes = notes.filter((n) => String(n.id) !== String(id));
        renderNotesList();
      } catch (err) {
        console.error('Error deleting note:', err);
        alert('خطا در حذف یادداشت.');
        deleteBtn.disabled = false;
      }
    }
  }

  // بستن با Escape یا سابمیت با فشردن Enter درون Input
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      closeModal();
    } else if (event.key === 'Enter' && event.target.id === 'note-title-input') {
      event.preventDefault();
      submitNote();
    }
  }

  // --- Lifecycle Methods ---
  function afterRender() {
    root = document.querySelector('.notes-page-root');
    if (!root) return;

    root.addEventListener('click', handlePageClick);
    window.addEventListener('keydown', handleKeyDown);

    loadNotes();
  }

  function destroy() {
    if (root) {
      root.removeEventListener('click', handlePageClick);
    }
    window.removeEventListener('keydown', handleKeyDown);
    root = null;
    notes = [];
    activeModalMode = null;
    currentEditingId = null;
  }

  return {
    render,
    afterRender,
    destroy
  };
}

export default createNotePage;
