// src/pages/tools/building/building-state.js

/**
 * ساختمون‌یار — استیت UI
 */

export const BLD_TABS = [
  { id: 'facade', title: 'نمای ساختمان', icon: '🏠' },
  { id: 'feed', title: 'تابلو اعلانات', icon: '📢' },
  { id: 'money', title: 'مالی', icon: '💰' },
  { id: 'chat', title: 'گفتگو', icon: '💬' },
  { id: 'services', title: 'خدمات', icon: '🛠' },
  { id: 'votes', title: 'نظرسنجی و پیشنهاد', icon: '🗳' },
  { id: 'complaints', title: 'شکایات', icon: '⚖️' },
  { id: 'docs', title: 'اسناد', icon: '📁' },
  { id: 'manage', title: 'مدیریت', icon: '⚙️' },
];

export function createBuildingState() {
  return {
    ready: false,
    view: 'onboarding', // onboarding | building
    buildingId: '',
    activeTab: 'facade',
    myList: [], // listBuildingsForUser
    // زیرنمایه‌ها
    moneyMode: 'mine', // mine | fund | approvals | report (manager)
    chatMode: 'group', // group | dm:<userId>
    docsMode: 'docs', // docs | contacts | rules
    manageMode: 'units', // units | reports | settings
    feedFilter: 'all', // all | charge | expense | notice | discussion | pinned
    // نما
    facadeMode: 'auto', // auto | day | night
    unitModalSlot: '',
    // انتخاب‌ها
    pickedSlot: '',
    joinCode: '',
    // جستجوها
    q: '',
    // داخلی
    toastTimer: null,
    chatScrollLock: false,
    lastBuildingId: '',
  };
}
