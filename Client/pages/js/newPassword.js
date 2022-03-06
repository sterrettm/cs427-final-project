function newPassword(){
    var hostname = document.getElementById('hostnameInput').value
    var username = document.getElementById('usernameInput').value
    var password = document.getElementById('passwordInput').value
    
    ipcRenderer.on('add_password_success', (event, arg) => {
        window.location.href = "./list.html"
    })
    
    ipcRenderer.on('add_password_fail', (event, arg) => {
        // TODO fail properly here
        resolve({})
    })
    
    ipcRenderer.send('add_password', {hostname: hostname, username: username, password: password})
}

window.onload = async function(e){
    
    document.getElementById("newPassword").addEventListener("click", newPassword)
}