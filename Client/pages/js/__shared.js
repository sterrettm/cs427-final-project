function getCookie(name){
    var cookie = ipcRenderer.sendSync('get_cookie', {name: name})
    console.log(name+" : "+cookie.value)
    return cookie.value
}

function setCookie(name, value){
    return ipcRenderer.sendSync('set_cookie', {name: name, value: value})
}