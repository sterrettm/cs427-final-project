function getCookie(name){
    var cookie = ipcRenderer.sendSync('get_cookie', {name: name})
    console.log(name+" : "+cookie.value)
    return cookie.value
}

function getRemote(){
    var remote = ipcRenderer.sendSync('is_remote', {})
    return remote
}

function setCookie(name, value){
    return ipcRenderer.sendSync('set_cookie', {name: name, value: value})
}

window.addEventListener('load', (event) => {
    var usernameText = document.getElementById("usernameText")
    if (usernameText != undefined){
        usernameText.innerText = getCookie("username")
    }
});