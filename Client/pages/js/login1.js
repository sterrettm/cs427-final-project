function loginButton(){
    username = document.getElementById('usernameInput').value
    password = document.getElementById('passwordInput').value
    
    ipcRenderer.on('login_success', (event, arg) => {
        // Send us to login2.html
        window.location.href = "./login2.html"
    })
    
    ipcRenderer.on('login_fail', (event, arg) => {
        // TODO tell the user something went wrong
        // you might want to use alert(), but nope
        // that doesn't work well at all with electron
    })
    
    ipcRenderer.send('login_attempt', {username: username, password: password})
    
}

function executeGoogleLogin(authToken){
    ipcRenderer.on('login_success', (event, arg) => {
        // Send us to login2.html
        window.location.href = "./login2.html"
    })
    
    ipcRenderer.on('login_fail', (event, arg) => {
        // TODO tell the user something went wrong
        // you might want to use alert(), but nope
        // that doesn't work well at all with electron
    })
    
    ipcRenderer.send('login_attempt_google', {password: authToken})
}

function googleLoginButton(){
    shell.openExternal("http://localhost:8887/");
}

// Why do we setup handlers in JS instead of HTML?
// To satisfy the Context-Security-Policy

window.onload = function(e){
    document.getElementById("loginButton").addEventListener("click", loginButton)
    document.getElementById("googleLoginButton").addEventListener("click", googleLoginButton)
}

