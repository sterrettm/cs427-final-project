function getData(){
    var password = document.getElementById('passwordInput').value
    
    ipcRenderer.on('load_data_success', (event, arg) => {
        // Redirect to the page to view passwords
        window.location.href = "./list.html"
    })

    ipcRenderer.on('load_data_fail', (event, arg) => {
        // TODO error better
        window.location.href = "./login2.html"
    })
    
        
    // TODO make remote correct here to allow offline login to work correctly
    ipcRenderer.send('load_data', {password: password, remote: getRemote()})
}

// Why do we setup handlers in JS instead of HTML?
// To satisfy the Context-Security-Policy

window.onload = function(e){
    document.getElementById("keyEnterButton").addEventListener("click", getData)
}