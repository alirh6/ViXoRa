

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

        <section class="HPHeader-menu">
          <ul class="HPHeaderMenu-ul">
            
              <a class="HPHeaderMenu-a" href="/tools/dashboard">
                <li class="HPHeaderMenu-li">Tools</li>
                <img class="HPHeaderMenu-img" src="" alt="">
              </a>

              <a class="HPHeaderMenu-a" href="">
                <li class="HPHeaderMenu-li">Product</li>
                <img class="HPHeaderMenu-img" src="" alt="">
              </a>

              <a class="HPHeaderMenu-a" href="">
                <li class="HPHeaderMenu-li">Tutorials</li>
                <img class="HPHeaderMenu-img" src="" alt="">
              </a>

              <a class="HPHeaderMenu-a" href="">
                <li class="HPHeaderMenu-li">landing pages</li>
                <img class="HPHeaderMenu-img" src="" alt="">
              </a>

              <a class="HPHeaderMenu-a" href="">
                <li class="HPHeaderMenu-li">Site Map</li>
                <img class="HPHeaderMenu-img" src="" alt="">
              </a>

              <a class="HPHeaderMenu-a" href="">
                <li class="HPHeaderMenu-li">Collaboration</li>
                <img class="HPHeaderMenu-img" src="" alt="">
              </a>

              <a class="HPHeaderMenu-a" href="">
                <li class="HPHeaderMenu-li">Pricing</li>
                <img class="HPHeaderMenu-img" src="" alt="">
              </a>
              <a class="HPHeaderMenu-a" href="">
                <li class="HPHeaderMenu-li">Contact</li>
                <img class="HPHeaderMenu-img" src="" alt="">
              </a>
            
          </ul>
        </section>

        <section class="HPHeader-tools">
          <ul class="HPHeaderTools-menu">

            <a class="HPHeaderToolsMenu-a" href="">
              <li class="HPHeaderToolsMenu-li">Light Theme</li>
              <img class="HPHeaderToolsMenu-img" src="" alt="">
            </a>

            <a class="HPHeaderToolsMenu-a" href="">
              <li class="HPHeaderToolsMenu-li">Customize Menu</li>
              <img class="HPHeaderToolsMenu-img" src="" alt="">
            </a>

            <a class="HPHeaderToolsMenu-a" href="">
              <li class="HPHeaderToolsMenu-li">send ticket</li>
              <img class="HPHeaderToolsMenu-img" src="" alt="">
            </a>

            <a class="HPHeaderToolsMenu-a" href="">
              <li class="HPHeaderToolsMenu-li">online Support</li>
              <img class="HPHeaderToolsMenu-img" src="" alt="">
            </a>

            <a class="HPHeaderToolsMenu-a" href="">
              <li class="HPHeaderToolsMenu-li">Download app</li>
              <img class="HPHeaderToolsMenu-img" src="" alt="">
            </a>

            <a class="HPHeaderToolsMenu-a" href="">
              <li class="HPHeaderToolsMenu-li">About ViXoRa</li>
              <img class="HPHeaderToolsMenu-img" src="" alt="">
            </a>

          </ul>
        </section>
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