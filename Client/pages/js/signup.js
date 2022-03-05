
function signupButton(){
    username = document.getElementById('usernameInput').value
    password = document.getElementById('passwordInput').value
    
    ipcRenderer.on('signup_success', (event, arg) => {
        // Send us to the login page
        window.location.href = "./login1.html"
    })
    
    ipcRenderer.on('signup_fail', (event, arg) => {
        // TODO tell the user something went wrong
        // you might want to use alert(), but nope
        // that doesn't work well at all with electron
    })
    
    ipcRenderer.send('signup_attempt', {username: username, password: password})
    
}

// Why do we setup handlers in JS instead of HTML?
// To satisfy the Context-Security-Policy

window.onload = function(e){
    document.getElementById("signupButton").addEventListener("click", signupButton)
}