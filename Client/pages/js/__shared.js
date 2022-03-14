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

function handlebars(template, args){
    var htmlString = ipcRenderer.sendSync('use_template', {template: template, args: args})
    console.log(htmlString)
    return htmlString
}

_paramDict = undefined

function paramDict(){
    
    if (_paramDict == undefined){
    
        var query = window.location.search.slice(1)
        var queries = query.split("&")

        var queryData = {}
        for (key in queries) {
            var splits = queries[key].split("=")
            queryData[splits[0]] = splits[1]
        }
        _paramDict = queryData
    }
    
    return _paramDict
}

function getPasswordList(){
    return new Promise(function (resolve, reject){
        ipcRenderer.on('password_list_success', (event, arg) => {
            resolve(arg)
        })
        
        ipcRenderer.on('password_list_fail', (event, arg) => {
            // TODO fail properly here
            resolve({})
        })
        
        ipcRenderer.send('password_list', {remote: getRemote()})
    })
}