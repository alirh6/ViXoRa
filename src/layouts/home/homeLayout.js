

export function createDashboardLayout () {
  let outlet = null

  function render () {
    return `
      <header class="HP-header">
        <a class="HP-aLink__sectionLogo" href="/" data-link>
          <section class="HPHeader-siteBrand">
            <span class="HP-brand__mark"></span>
            <span class="HP-brand__text">
              <span class="HP-brand__name">ViXoRa</span>
              <span class="HP-brand__sub">Creative Engineering</span>
            </span>
          </section>
        </a>

        <section class="HPHeader-menu"></section>

        <section class="HPHeader-tools"></section>
      </header>

      <main class="HP-main HP-outlet"></main>

      <footer class="HP-footer"></footer>
      
    `
  }
  function afterRender () {
    outlet = document.querySelector(".HP-outlet")
  }
  function getOutlet () {
    return outlet
  }
  function destroy () {

  }

  return {
    render,
    afterRender,
    getOutlet,
    destroy
  }
}