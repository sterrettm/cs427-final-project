const Handlebars = require('handlebars')
const fs = require('fs')

var templates = {}

function useTemplate(templateName, args){
    if (!(templateName in templates)){
        var templatePath =  "./pages/views/"+templateName
        var data = fs.readFileSync(templatePath, {encoding: 'utf8'})
        templates[templateName] = Handlebars.compile(data)
    }
    
    var template = templates[templateName]
    
    return template(args)
}

module.exports = {useTemplate: useTemplate}