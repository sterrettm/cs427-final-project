
function loginButton(){
    var username = document.getElementById('usernameInput').value
    
    // Here we are just going to set a cookie
    setCookie("username", username)
    
    window.location.href = "./login2.html"
}

// Why do we setup handlers in JS instead of HTML?
// To satisfy the Context-Security-Policy

window.onload = function(e){
    document.getElementById("loginButton").addEventListener("click", loginButton)
}