// src/pages/note/note-renderers.js
import { sanitizeHtml, formatDate, calculateReadTime } from './note-helpers.js';
import { selectCategories, selectTags, selectStats } from './note-selectors.js';

export function renderHeader(state) {
  const stats = selectStats(state.notes);
  return `
    <header class="page-header note-header flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="fas fa-sticky-note text-amber-500"></i>
          دفترچه یادداشت پیشرفته
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          مدیریت، برچسب‌گذاری و یادداشت‌برداری هوشمند
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button class="btn btn-outline" data-action="toggle-stats">
          <i class="fas fa-chart-pie"></i>
          <span>آمار (${stats.active})</span>
        </button>
        <button class="btn btn-outline" data-action="export-all">
          <i class="fas fa-file-export"></i>
          <span>خروجی</span>
        </button>
        <button class="btn btn-primary" data-action="create-note">
          <i class="fas fa-plus"></i>
          <span>یادداشت جدید</span>
        </button>
      </div>
    </header>
  `;
}

export function renderToolbar(state) {
  const categories = selectCategories(state.notes);
  const tags = selectTags(state.notes);

  return `
    <div class="note-toolbar grid grid-cols-1 md:grid-cols-4 gap-3 my-4">
      <div class="relative col-span-1 md:col-span-2">
        <input 
          type="text" 
          placeholder="جستجو در متن، عنوان یا برچسب..." 
          class="input w-full pr-10" 
          id="note-search-input"
          value="${sanitizeHtml(state.filters.search)}"
          data-action="search"
        />
        <i class="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
      </div>

      <div>
        <select class="input w-full" data-action="filter-category">
          ${categories.map(c => `<option value="${sanitizeHtml(c)}" ${state.filters.category === c ? 'selected' : ''}>دسته: ${sanitizeHtml(c)}</option>`).join('')}
        </select>
      </div>

      <div class="flex gap-2">
        <select class="input w-full" data-action="sort">
          <option value="updatedAt_desc" ${state.filters.sortBy === 'updatedAt_desc' ? 'selected' : ''}>آخرین تغییرات</option>
          <option value="createdAt_desc" ${state.filters.sortBy === 'createdAt_desc' ? 'selected' : ''}>جدیدترین</option>
          <option value="title_asc" ${state.filters.sortBy === 'title_asc' ? 'selected' : ''}>عنوان (الف - ی)</option>
        </select>
        
        <button 
          class="btn ${state.filters.isArchived ? 'btn-warning' : 'btn-outline'}" 
          data-action="toggle-archive-view" 
          title="مشاهده آرشیو"
        >
          <i class="fas ${state.filters.isArchived ? 'fa-inbox' : 'fa-archive'}"></i>
        </button>
      </div>
    </div>
  `;
}

export function renderNoteCard(note, isSelected = false) {
  const isPinned = note.isPinned;
  const readTime = calculateReadTime(note.content || '');
  const tagsHtml = (note.tags || []).map(t => `<span class="badge badge-sm badge-ghost">${sanitizeHtml(t)}</span>`).join('');

  return `
    <div class="note-card p-4 rounded-xl border transition-all cursor-pointer ${
      isSelected 
        ? 'border-amber-500 bg-amber-500/5 shadow-md' 
        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
    }" data-note-id="${note.id}" data-action="select-note">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-1 flex items-center gap-1.5">
          ${isPinned ? '<i class="fas fa-thumbtack text-amber-500 text-xs rotate-45"></i>' : ''}
          ${sanitizeHtml(note.title || 'بدون عنوان')}
        </h3>
        <div class="flex items-center gap-1 dropdown-container">
          <button class="btn btn-xs btn-ghost" data-action="toggle-pin" data-note-id="${note.id}" title="${isPinned ? 'برداشتن سنجاق' : 'سنجاق کردن'}">
            <i class="fas fa-thumbtack ${isPinned ? 'text-amber-500' : 'text-gray-400'}"></i>
          </button>
          <button class="btn btn-xs btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" data-action="delete-note" data-note-id="${note.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
        ${sanitizeHtml(note.content || 'یادداشت خالی...')}
      </p>

      <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 text-xs text-gray-400">
        <span class="flex items-center gap-1">
          <i class="far fa-clock"></i>
          ${formatDate(note.updatedAt)}
        </span>
        <span class="text-[11px]">${readTime} دقیقه مطالعه</span>
      </div>

      ${tagsHtml ? `<div class="flex flex-wrap gap-1 mt-2">${tagsHtml}</div>` : ''}
    </div>
  `;
}

export function renderEditor(note) {
  if (!note) {
    return `
      <div class="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
        <i class="fas fa-book-open text-4xl mb-3 text-gray-300 dark:text-gray-600"></i>
        <p class="font-medium">یک یادداشت را برای ویرایش انتخاب کنید یا یادداشت جدید بسازید.</p>
      </div>
    `;
  }

  return `
    <div class="note-editor-container flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
        <input 
          type="text" 
          class="input font-bold text-lg w-full bg-transparent border-0 focus:outline-none px-0" 
          id="editor-title" 
          value="${sanitizeHtml(note.title || '')}" 
          placeholder="عنوان یادداشت..." 
          data-action="update-current-title"
        />
        <div class="flex items-center gap-2">
          <button class="btn btn-sm btn-ghost" data-action="copy-content" title="کپی متن">
            <i class="far fa-copy"></i>
          </button>
          <button class="btn btn-sm btn-ghost" data-action="toggle-archive" data-note-id="${note.id}" title="${note.isArchived ? 'خروج از آرشیو' : 'انتقال به آرشیو'}">
            <i class="fas ${note.isArchived ? 'fa-inbox' : 'fa-archive'}"></i>
          </button>
        </div>
      </div>

      <div class="flex gap-3 mb-4">
        <input 
          type="text" 
          class="input input-sm w-1/2" 
          id="editor-category" 
          value="${sanitizeHtml(note.category || '')}" 
          placeholder="دسته‌بندی (مثال: کاری، شخصی...)" 
          data-action="update-current-category"
        />
        <input 
          type="text" 
          class="input input-sm w-1/2" 
          id="editor-tags" 
          value="${sanitizeHtml((note.tags || []).join(', '))}" 
          placeholder="برچسب‌ها (با کاما جدا کنید)" 
          data-action="update-current-tags"
        />
      </div>

      <textarea 
        class="textarea w-full flex-1 bg-transparent resize-none border-gray-100 dark:border-gray-800 focus:border-amber-500 rounded-xl p-4 leading-relaxed font-sans text-base"
        id="editor-content"
        placeholder="شروع به نوشتن متن یادداشت کنید..."
        data-action="update-current-content"
      >${sanitizeHtml(note.content || '')}</textarea>

      <div class="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
        <span>آخرین ویرایش: ${formatDate(note.updatedAt)}</span>
        <span>${(note.content || '').length} کاراکتر | ${calculateReadTime(note.content || '')} دقیقه مطالعه</span>
      </div>
    </div>
  `;
}

export function renderNotePageLayout(state, filteredNotes) {
  const activeNote = state.notes.find(n => n.id === state.selectedNoteId) || null;

  return `
    <div class="note-app-wrapper flex flex-col h-full max-w-7xl mx-auto p-4 md:p-6 space-y-4">
      ${renderHeader(state)}
      ${renderToolbar(state)}
      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[550px]">
        <!-- Note List Panel -->
        <div class="lg:col-span-5 flex flex-col space-y-3 overflow-y-auto max-h-[700px] pr-1">
          ${
            filteredNotes.length === 0
              ? `<div class="p-8 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl">یادداشتی یافت نشد.</div>`
              : filteredNotes.map(n => renderNoteCard(n, n.id === state.selectedNoteId)).join('')
          }
        </div>

        <!-- Note Editor Panel -->
        <div class="lg:col-span-7 h-full min-h-[500px]">
          ${renderEditor(activeNote)}
        </div>
      </div>
    </div>
  `;
}
