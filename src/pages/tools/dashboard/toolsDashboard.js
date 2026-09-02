

export function createToolsDashboardPage (ctx) {
  function render () {
    return `
      <div class="x">این صفحه داشبورد ابزارهاست</div>
      <div class="xx">this is tools dashboard page</div>
    `
  }

  function afterRender () {

  }

  function destroy () {

  }

  return {
    render,
    afterRender,
    destroy
  }
}