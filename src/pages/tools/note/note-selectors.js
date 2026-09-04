// src/pages/note/note-selectors.js

export function selectCategories(notes = []) {
  const cats = new Set(['همه']);
  notes.forEach(n => {
    if (n.category && n.category.trim()) cats.add(n.category.trim());
  });
  return Array.from(cats);
}

export function selectTags(notes = []) {
  const tags = new Set();
  notes.forEach(n => {
    if (Array.isArray(n.tags)) {
      n.tags.forEach(t => t && tags.add(t.trim()));
    }
  });
  return Array.from(tags);
}

export function selectFilteredNotes(notes = [], filters = {}) {
  const {
    search = '',
    category = 'همه',
    tag = 'همه',
    isPinned = null,
    isArchived = false,
    sortBy = 'updatedAt_desc'
  } = filters;

  return notes
    .filter(note => {
      // Archive status
      if (Boolean(note.isArchived) !== Boolean(isArchived)) return false;

      // Category
      if (category !== 'همه' && note.category !== category) return false;

      // Tag
      if (tag !== 'همه' && (!Array.isArray(note.tags) || !note.tags.includes(tag))) return false;

      // Pinned
      if (isPinned !== null && Boolean(note.isPinned) !== Boolean(isPinned)) return false;

      // Search Query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const titleMatch = (note.title || '').toLowerCase().includes(q);
        const contentMatch = (note.content || '').toLowerCase().includes(q);
        const tagMatch = Array.isArray(note.tags) && note.tags.some(t => t.toLowerCase().includes(q));
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Pinned notes always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (sortBy) {
        case 'updatedAt_asc':
          return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
        case 'createdAt_desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'createdAt_asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '', 'fa');
        case 'title_desc':
          return (b.title || '').localeCompare(a.title || '', 'fa');
        case 'updatedAt_desc':
        default:
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      }
    });
}

export function selectStats(notes = []) {
  const total = notes.length;
  const archived = notes.filter(n => n.isArchived).length;
  const active = total - archived;
  const pinned = notes.filter(n => n.isPinned && !n.isArchived).length;
  const totalWords = notes.reduce((acc, n) => acc + (n.content ? n.content.trim().split(/\s+/).filter(Boolean).length : 0), 0);

  return { total, active, archived, pinned, totalWords };
}
