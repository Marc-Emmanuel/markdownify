const fs = require('fs');
const electron = require('electron');

window.$ = window.jQuery = require('./js/jquery.min.js');

var mde = new SimpleMDE({
    element: document.getElementById("mdify"),
    spellChecker: false,
    renderingConfig: {
        codeSyntaxHighlighting: true
    },
    shortcuts: {
        toggleFullScreen: null
    },
    hideIcons: ["fullscreen"]
});
mde.toggleFullScreen();

mde.codemirror.on('change', function(){
    electron.ipcRenderer.send('edited', true);
});

electron.ipcRenderer.on('export', function(event, message){
    alert("Export is still TODO ;)");
});
electron.ipcRenderer.on('file', function (event, message) {
    fs.readFile(message, 'utf-8', function (err, data) {
        if (!err) {
            mde.value(data);
        }
    })
});
electron.ipcRenderer.on('save', function (event, message) {
    fs.writeFile(message, mde.value(), function (err) {
        if (err) {
            electron.dialog.showMessageBox({
                message: "A problem occured while saving " + err,
                buttons: ["OK"]
            });
        }
    });
});
electron.ipcRenderer.on('path', function(event, message){
    document.getElementById('wintitle').innerHTML = "Markdownify - " + message;
});

