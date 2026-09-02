import { login } from '../../../core/services/auth-service.js';

export function createLoginPage(ctx) {
  let root = null;
  let isSubmitting = false;

  function render() {
    return `
      <main class="auth-page">
        <section class="auth-card">
          <h1>ورود به ViXoRa</h1>

          <form data-login-form novalidate>
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
              رمز عبور
              <input
                name="password"
                type="password"
                autocomplete="current-password"
                required
              />
            </label>

            <p data-form-message class="form-message"></p>

            <button
              type="submit"
              data-submit-button
            >
              ورود
            </button>
          </form>

          <p>
            حساب ندارید؟
            <a href="/register">ثبت‌نام کنید</a>
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
      ? 'در حال ورود...'
      : 'ورود';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const username = formData.get('username');
    const password = formData.get('password');

    setMessage('');
    setLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setMessage(result.message);
      setLoading(false);
      return;
    }

    setMessage('ورود موفق بود. در حال انتقال...', 'success');

    window.dispatchEvent(
      new CustomEvent('auth:changed', {
        detail: {
          type: 'login',
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

    const form = root?.querySelector('[data-login-form]');

    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
  }

  function destroy() {
    const form = root?.querySelector('[data-login-form]');

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

export default createLoginPage;
