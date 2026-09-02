import { register } from '../../../core/services/auth-service.js';

export function createRegisterPage(ctx) {
  let root = null;
  let isSubmitting = false;

  function render() {
    return `
      <main class="auth-page">
        <section class="auth-card">
          <h1>ساخت حساب کاربری</h1>

          <form data-register-form novalidate>
            <label>
              نام
              <input
                name="name"
                type="text"
                autocomplete="name"
                required
              />
            </label>

            <label>
              نام کاربری
              <input
                name="username"
                type="text"
                autocomplete="username"
                required
              />
            </label>

            <label>
              ایمیل
              <input
                name="email"
                type="email"
                autocomplete="email"
                required
              />
            </label>

            <label>
              رمز عبور
              <input
                name="password"
                type="password"
                autocomplete="new-password"
                required
              />
            </label>

            <p data-form-message class="form-message"></p>

            <button
              type="submit"
              data-submit-button
            >
              ثبت‌نام
            </button>
          </form>

          <p>
            قبلاً حساب ساخته‌اید؟
            <a href="/login">وارد شوید</a>
          </p>
        </section>
      </main>
    `;
  }

  function setMessage(message, type = 'error') {
    const element = root?.querySelector('[data-form-message]');

    if (!element) return;

    element.textContent = message || '';
    element.dataset.type = type;
  }

  function setLoading(loading) {
    isSubmitting = loading;

    const button = root?.querySelector('[data-submit-button]');

    if (!button) return;

    button.disabled = loading;
    button.textContent = loading
      ? 'در حال ساخت حساب...'
      : 'ثبت‌نام';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);

    const data = {
      name: formData.get('name'),
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
    };

    setMessage('');
    setLoading(true);

    const result = await register(data);

    if (!result.success) {
      setMessage(result.message);
      setLoading(false);
      return;
    }

    setMessage(
      'ثبت‌نام موفق بود. در حال انتقال...',
      'success'
    );

    window.dispatchEvent(
      new CustomEvent('auth:changed', {
        detail: {
          type: 'register',
          user: result.user,
        },
      })
    );

    window.appRouter?.navigate('/tools/dashboard', {
      replace: true,
    });
  }

  function afterRender() {
    root = document.querySelector('.auth-page');

    const form = root?.querySelector('[data-register-form]');

    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
  }

  function destroy() {
    const form = root?.querySelector('[data-register-form]');

    if (form) {
      form.removeEventListener('submit', handleSubmit);
    }

    root = null;
  }

  return {
    render,
    afterRender,
    destroy,
  };
}

export default createRegisterPage;
