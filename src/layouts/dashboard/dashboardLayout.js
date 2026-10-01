

export function createDashboardLayout (ct) {
  let outlet = null
  const ctx = ct

  function render () {
    return /*html*/`
      <div class="DL-root">
        <header class="DL-header">
          <section class="DL-leftHeader"></section>
          <section class="DL-middleHeader"></section>
          <section class="DL-rightHeader"></section>
        </header>
      </div>

    `
  }

  


  function afterRender () {
    
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