const fs = require('fs');
const electron = require('electron');
window.$ = window.jQuery = require('./js/jquery.min.js');
var htmlOutput = "";
var mde;
$(document).ready(function () {
    mde = new SimpleMDE({
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

    mde.codemirror.on('change', function () {
        electron.ipcRenderer.send('edited', true);
        htmlOutput = mde.markdown(mde.value());
    });

    electron.ipcRenderer.on('export', function (event, exportName) {
        var n = exportName.split('.')[0].split('/');
        var title = n[n.length - 1];
        var toBeExported = "<!DOCTYPE html>\n<html>\n    <head>\n        <title>" + title + "</title>\n    <script type='text/javascript' src='http://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.2.0/highlight.min.js'></script>\n";

        fs.readFile(__dirname + '/css/highlight.css', 'utf-8', function (err, css) {
            if (err) {
                console.log(err);
            }
            if (!err) {
                toBeExported += "\n    <style>\n    " + css + "\n    </style>\n";
                toBeExported += "    </head>\n    <body>\n    " + htmlOutput + "\n    </body>\n</html>";
                fs.writeFile(exportName, toBeExported, function (err) {
                    if (err) {
                        console.log(err);
                        electron.dialog.showMessageBox({
                            message: "A problem occured while exporting ",
                            buttons: ["OK"]
                        });
                    }
                })
            }
        })
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
    electron.ipcRenderer.on('path', function (event, message) {
        document.getElementById('wintitle').innerHTML = "Markdownify - " + message;
    });

});
