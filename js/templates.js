Handlebars.getTemplate = function(name) {
    if (Handlebars.templates === undefined || Handlebars.templates[name] === undefined) {
        $.ajax({
            url : 'templates/' + name + '.handlebars',
            datatype: 'text/javascript',
            success : function(response, status, jqXHR) {
                if (Handlebars.templates === undefined) {
                    Handlebars.templates = {};
                }
                Handlebars.templates[name] = Handlebars.compile(response);
            },
            async : false
        });
    }
    return Handlebars.templates[name];
};