export function createDashboardLayout() {
  let outlet = null;
  let layoutRoot = null;
  let isToolsMenuOpen = false;

  let handleDocumentClick = null;
  let handleToolsButtonClick = null;
  let handleKeyDown = null;
  let handleLanguageClick = null;

  const toolsMenuId = 'hp-tools-menu';

  function render() {
    return `
      <div class="HP-layout" data-dashboard-layout>
        <header class="HP-header">
          <a
            class="HP-aLink__sectionLogo"
            href="/"
            data-link
            aria-label="ViXoRa home"
          >
            <section class="HPHeader-siteBrand">
              <span class="HPHeaderSiteBrand-vixo">ViXo</span>
              <span class="HPHeaderSiteBrand-ra">Ra</span>
            </section>
          </a>

          <nav
            class="HPHeader-menu"
            aria-label="Main navigation"
          >
            <ul class="HPHeaderMenu-ul">
              <li class="HPHeaderMenu-li">
                <a
                  class="HPHeaderMenu-a"
                  href="/tools/dashboard"
                  data-link
                >
                  Tools
                </a>
              </li>

              <li class="HPHeaderMenu-li">
                <a
                  class="HPHeaderMenu-a"
                  href="/product"
                  data-link
                >
                  Product
                </a>
              </li>

              <li class="HPHeaderMenu-li">
                <a
                  class="HPHeaderMenu-a"
                  href="/tutorials"
                  data-link
                >
                  Tutorials
                </a>
              </li>

              <li class="HPHeaderMenu-li">
                <a
                  class="HPHeaderMenu-a"
                  href="/landing-pages"
                  data-link
                >
                  Landing Pages
                </a>
              </li>

              <li class="HPHeaderMenu-li">
                <a
                  class="HPHeaderMenu-a"
                  href="/sitemap"
                  data-link
                >
                  Site Map
                </a>
              </li>

              <li class="HPHeaderMenu-li">
                <a
                  class="HPHeaderMenu-a"
                  href="/collaboration"
                  data-link
                >
                  Collaboration
                </a>
              </li>

              <li class="HPHeaderMenu-li">
                <a
                  class="HPHeaderMenu-a"
                  href="/pricing"
                  data-link
                >
                  Pricing
                </a>
              </li>

              <li class="HPHeaderMenu-li">
                <a
                  class="HPHeaderMenu-a"
                  href="/contact"
                  data-link
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          <div class="HPHeader-tools" data-tools-container>
            <button
              class="HPHeaderTools-openBtn"
              type="button"
              aria-label="باز کردن منوی ابزارها"
              aria-expanded="false"
              aria-controls="${toolsMenuId}"
              data-tools-trigger
            >
              <img
                class="HPHeaderTools-openBtn__text"
                src="/src/global/stickers/more.svg"
                alt=""
                aria-hidden="true"
              />
            </button>

            <div
              class="HPHeaderTools-menu"
              id="${toolsMenuId}"
              aria-hidden="true"
              data-tools-menu
            >
              <ul class="HPHeaderToolsMenu-list">
                <li>
                  <a
                    class="HPHeaderToolsMenu-a"
                    href="/settings/theme"
                    data-link
                  >
                    <span>Light Theme</span>
                  </a>
                </li>

                <li>
                  <a
                    class="HPHeaderToolsMenu-a"
                    href="/settings/menu"
                    data-link
                  >
                    <span>Customize Menu</span>
                  </a>
                </li>

                <li>
                  <a
                    class="HPHeaderToolsMenu-a"
                    href="/support/ticket"
                    data-link
                  >
                    <span>Send Ticket</span>
                  </a>
                </li>

                <li>
                  <a
                    class="HPHeaderToolsMenu-a"
                    href="/support"
                    data-link
                  >
                    <span>Online Support</span>
                  </a>
                </li>

                <li>
                  <a
                    class="HPHeaderToolsMenu-a"
                    href="/download"
                    data-link
                  >
                    <span>Download App</span>
                  </a>
                </li>

                <li>
                  <a
                    class="HPHeaderToolsMenu-a"
                    href="/about"
                    data-link
                  >
                    <span>About ViXoRa</span>
                  </a>
                </li>

                <li class="HPHeaderTools-languageLi">
                  <span class="HPHeaderTools-languageLabel">
                    Language
                  </span>

                  <div class="HPHeaderTools-languageList">
                    <button
                      type="button"
                      class="HPHeaderTools-languageBtn"
                      data-language="fa"
                      aria-label="فارسی"
                    >
                      <img
                        class="HPHeaderTools-languageSticker"
                        src="/src/global/stickers/iran.svg"
                        alt=""
                      />
                    </button>

                    <button
                      type="button"
                      class="HPHeaderTools-languageBtn"
                      data-language="en"
                      aria-label="English"
                    >
                      <img
                        class="HPHeaderTools-languageSticker"
                        src="/src/global/stickers/usa.svg"
                        alt=""
                      />
                    </button>

                    <button
                      type="button"
                      class="HPHeaderTools-languageBtn"
                      data-language="fr"
                      aria-label="Français"
                    >
                      <img
                        class="HPHeaderTools-languageSticker"
                        src="/src/global/stickers/france.svg"
                        alt=""
                      />
                    </button>

                    <button
                      type="button"
                      class="HPHeaderTools-languageBtn"
                      data-language="es"
                      aria-label="Español"
                    >
                      <img
                        class="HPHeaderTools-languageSticker"
                        src="/src/global/stickers/spain.svg"
                        alt=""
                      />
                    </button>

                    <button
                      type="button"
                      class="HPHeaderTools-languageBtn"
                      data-language="ar"
                      aria-label="العربية"
                    >
                      <img
                        class="HPHeaderTools-languageSticker"
                        src="/src/global/stickers/saudi_arabia.svg"
                        alt=""
                      />
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <main
          class="HP-main HP-outlet"
          data-router-outlet
        ></main>

        <footer class="HP-footer"></footer>
      </div>
    `;
  }

  function setToolsMenuState(isOpen) {
    if (!layoutRoot) {
      return;
    }

    const toolsContainer = layoutRoot.querySelector('[data-tools-container]');
    const toolsMenuButton = layoutRoot.querySelector('[data-tools-trigger]');
    const toolsMenu = layoutRoot.querySelector('[data-tools-menu]');

    if (!toolsContainer || !toolsMenuButton || !toolsMenu) {
      return;
    }

    isToolsMenuOpen = isOpen;

    toolsContainer.classList.toggle('is-open', isToolsMenuOpen);
    toolsMenuButton.setAttribute('aria-expanded', String(isToolsMenuOpen));
    toolsMenu.setAttribute('aria-hidden', String(!isToolsMenuOpen));
  }

  function toggleToolsMenu() {
    setToolsMenuState(!isToolsMenuOpen);
  }

  function closeToolsMenu() {
    if (isToolsMenuOpen) {
      setToolsMenuState(false);
    }
  }

  function afterRender() {
    destroyEventListeners();

    layoutRoot = document.querySelector('[data-dashboard-layout]');
    outlet = layoutRoot?.querySelector('[data-router-outlet]');

    document.documentElement.classList.add('homeLayout');

    if (!layoutRoot) {
      return;
    }

    const toolsMenuButton = layoutRoot.querySelector('[data-tools-trigger]');

    if (toolsMenuButton) {
      handleToolsButtonClick = (event) => {
        event.stopPropagation();
        toggleToolsMenu();
      };
      toolsMenuButton.addEventListener('click', handleToolsButtonClick);
    }

    handleDocumentClick = (event) => {
      if (!isToolsMenuOpen || !layoutRoot) {
        return;
      }

      const clickedInsideTools = event.target.closest('[data-tools-container]');
      if (!clickedInsideTools) {
        closeToolsMenu();
      }
    };
    document.addEventListener('click', handleDocumentClick);

    handleKeyDown = (event) => {
      if (event.key === 'Escape' && isToolsMenuOpen) {
        closeToolsMenu();
        toolsMenuButton?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    handleLanguageClick = (event) => {
      const languageButton = event.target.closest('[data-language]');
      if (!languageButton || !layoutRoot?.contains(languageButton)) {
        return;
      }

      const selectedLanguage = languageButton.dataset.language;
      document.documentElement.lang = selectedLanguage;

      layoutRoot.querySelectorAll('[data-language]').forEach((button) => {
        button.classList.toggle('is-selected', button === languageButton);
      });
    };
    layoutRoot.addEventListener('click', handleLanguageClick);

    setToolsMenuState(false);
  }

  function destroyEventListeners() {
    const toolsMenuButton = layoutRoot?.querySelector('[data-tools-trigger]');

    if (toolsMenuButton && handleToolsButtonClick) {
      toolsMenuButton.removeEventListener('click', handleToolsButtonClick);
    }

    if (handleDocumentClick) {
      document.removeEventListener('click', handleDocumentClick);
    }

    if (handleKeyDown) {
      window.removeEventListener('keydown', handleKeyDown);
    }

    if (layoutRoot && handleLanguageClick) {
      layoutRoot.removeEventListener('click', handleLanguageClick);
    }

    handleToolsButtonClick = null;
    handleDocumentClick = null;
    handleKeyDown = null;
    handleLanguageClick = null;
  }

  function getOutlet() {
    return outlet;
  }

  function destroy() {
    destroyEventListeners();

    document.documentElement.classList.remove('homeLayout');

    outlet = null;
    layoutRoot = null;
    isToolsMenuOpen = false;
  }

  return {
    render,
    afterRender,
    getOutlet,
    destroy
  };
}
