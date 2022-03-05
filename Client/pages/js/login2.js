
// Fetch the data
ipcRenderer.send('load_data', {remote: true})

ipcRenderer.on('load_data_success', (event, arg) => {
    // Yeah
    // We do nothing in this case
})

ipcRenderer.on('load_data_fail', (event, arg) => {
    // TODO error better
    window.location.href = "./login1.html"
})

function loginButton(){
}

// Why do we setup handlers in JS instead of HTML?
// To satisfy the Context-Security-Policy

window.onload = function(e){
    document.getElementById("usernameText").innerText = getCookie("username")
}