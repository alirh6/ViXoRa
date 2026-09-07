

export function createDashboardLayout (ct) {
  let outlet = null
  const ctx = ct

  function render () {
    return /*html*/`
      <div class="dashboardLayoutRoot">
        <header class="DLHeader">
          <section class="DLHeaderL-userInfo">
            ${DLHeaderUserInfoRender()}
          </section>

          <section class="DLHeader-middle"></section>

          <section class="DLHeader-right"></section>
        </header>


        <div class="outlet dashboardMain"></div>
      </div>

      
    `
  }

  function DLHeaderUserInfoRender () {
    return `

      <div class="wrapper1">
      <div class="DLHeaderL-userImgWrapper">
              ${ctx?.user?.avatar
                  ? `
                    <img class="DLHeaderL-userImg" src="${ctx.user.avatar}" alt="">
                  `
                  : `
                    <div class="DLHeaderL-guestImg">g</div>
                  `
              }
            </div>
            </div>

          <div class="wrapper2">
            <div class="DLHeaderL-nameWrapper">
              ${ctx.user.name
                  ? `
                    <span class="DLHeaderL-username">${ctx.user.name}</span>
                  `
                  : `
                    <span class="DLHeader-loginButNoName"></span>
                  `
              }
            </div>
            
            <div class="DLHeaderL-usernameWrapper">
              ${ctx.user.username
                  ? `
                    <span class="DLHeaderL-username">${ctx.user.username}</span>
                  `
                  : `
                    <span class="DLHeader-loginButNoName"></span>
                  `
              }
            </div>
            </div>

          <div class="wrapper3">
            <div class="DLHeaderL-emailWrapper">
              ${ctx.user.email
                  ? `
                    <span class="DLHeaderL-username">${ctx.user.email}</span>
                  `
                  : `
                    <span class="DLHeader-loginButNoName"></span>
                  `
              }
            </div>
            
            <div class="DLHeaderL-phoneNumberWrapper">
              ${ctx.user.phoneNumber
                  ? `
                    <span class="DLHeaderL-username">${ctx.user.phoneNumber}</span>
                  `
                  : `
                    <span class="DLHeader-loginButNoName"></span>
                  `
              }
            </div>
            </div>


            <div class="DLHeaderL-profileIsCompleteWrapper">
              ${ctx.user.profileIsComplete
                  ? `
                    <span class="DLHeader-loginButNoName"></span>
                  `
                  : `
                    <div class="DLHeaderL-profileCompletePage">takmile profile</div>
                  `
              }
            </div>
    `
  }


  function afterRender () {
    outlet = document.querySelector(".outlet")
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