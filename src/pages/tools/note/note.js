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

  async function loadNotes() {
    try {
      notes = await getToolData('notes');
      renderNotesList();
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  }

  function renderNotesList() {
    const listContainer = root?.querySelector('[data-notes-list]');
    if (!listContainer) return;

    if (notes.length === 0) {
      listContainer.innerHTML = '<p class="empty-msg">هیچ یادداشتی وجود ندارد.</p>';
      return;
    }

    listContainer.innerHTML = notes.map((note) => `
      <div class="note-card" data-id="${note.id}" style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 8px;">
        <h3 class="note-title">${note.title}</h3>
        <p class="note-desc">${note.content}</p>
        <div class="note-actions">
          <button type="button" class="btn-edit" data-action="edit" data-id="${note.id}">ویرایش</button>
          <button type="button" class="btn-delete" data-action="delete" data-id="${note.id}">حذف</button>
        </div>
      </div>
    `).join('');
  }

  function render() {
    return `
      <div class="notes-page-root" style="padding: 20px;">
        <header class="notes-header" style="display:flex; justify-content:space-between; margin-bottom:20px;">
          <h1>مدیریت یادداشت‌ها</h1>
          <button type="button" id="btn-add-note" class="btn-primary">+ یادداشت جدید</button>
        </header>

        <div class="notes-grid" data-notes-list>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    `;
  }

  async function handlePageClick(event) {
    // ۱. افزودن نوت جدید
    if (event.target.closest('#btn-add-note')) {
      const title = prompt('عنوان یادداشت:');
      const content = prompt('متن یادداشت:');
      if (title) {
        const newNote = await createToolItem('notes', { title, content: content || '' });
        notes.unshift(newNote);
        renderNotesList();
      }
      return;
    }

    // ۲. حذف نوت
    const deleteBtn = event.target.closest('[data-action="delete"]');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('آیا از حذف این یادداشت اطمینان دارید؟')) {
        await deleteToolItem('notes', id);
        notes = notes.filter((n) => String(n.id) !== String(id));
        renderNotesList();
      }
      return;
    }

    // ۳. ویرایش نوت
    const editBtn = event.target.closest('[data-action="edit"]');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const targetNote = notes.find((n) => String(n.id) === String(id));
      const newTitle = prompt('عنوان جدید:', targetNote?.title);
      if (newTitle) {
        const updated = await updateToolItem('notes', id, { title: newTitle });
        const index = notes.findIndex((n) => String(n.id) === String(id));
        notes[index] = updated;
        renderNotesList();
      }
    }
  }

  function afterRender() {
    root = document.querySelector('.notes-page-root');
    if (!root) return;

    root.addEventListener('click', handlePageClick);
    loadNotes();
  }

  function destroy() {
    if (root) {
      root.removeEventListener('click', handlePageClick);
    }
    root = null;
    notes = [];
  }

  return {
    render,
    afterRender,
    destroy
  };
}

export default createNotePage;
