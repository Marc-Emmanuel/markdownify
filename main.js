'use strict';
const app = require('app');
const BrowserWindow = require("browser-window");
const Menu = require('menu');
const dialog = require('electron').dialog;
const ipc = require('electron').ipcMain;

var debug = false;
var windows = [];
var winSize = {
    width: 1170,
    height: 600,
    minHeight: 400,
    minWidth: 400,
    titleBarStyle: 'hidden'
};
var fileToOpen = undefined;
var template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'New',
                accelerator: 'CmdOrCtrl+N',
                click: function () {
                    var window = buildWindow();
                    window.focus();
                }
            },
            {
                label: 'Open',
                accelerator: 'CmdOrCtrl+O',
                click: function () {
                    dialog.showOpenDialog({
                        filters: [
                            {
                                name: 'Markdown',
                                extensions: ['md']
                                }
                            ],
                        properties: ['openFile', 'multiSelections'],
                    }, function (fileNames) {
                        if (fileNames != undefined) {
                            for (var i = 0; i < fileNames.length; i++) {
                                (function (f) {
                                    var window = buildWindow();
                                    var file = f;
                                    window.title = file.replace('/Users/', "");
                                    window.webContents.on("did-finish-load", function () {
                                        window.webContents.send('file', file);
                                        window.webContents.send('path', window.title);
                                    });
                                })(fileNames[i]);
                            }
                        }
                    });
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Save',
                accelerator: 'CmdOrCtrl+S',
                click: function () {
                    var t = windows.filter(function (e) {
                        return e.active;
                    });
                    if (t.length > 0) {
                        if (t[0].title != undefined) {
                            t[0].webContents.send('save', '/Users/' + t[0].title);
                            t[0].webContents.send('path', t[0].title);
                            t[0].setDocumentEdited(false);
                            return;
                        }

                    }
                    dialog.showSaveDialog({
                        filters: [
                            {
                                name: 'Markdown',
                                extensions: ['md']
                            }
                        ]
                    }, function (fileName) {
                        if (fileName === undefined) {
                            return;
                        }
                        var t = windows.filter(function (e) {
                            return e.active;
                        });
                        if (t.length > 0) {
                            t[0].title = fileName.replace('/Users/', "");
                            t[0].webContents.send('save', fileName);
                            t[0].webContents.send('path', t[0].title);

                            t[0].setDocumentEdited(false);

                        }
                    });
                }
            },
            {
                label: 'Save as',
                accelerator: 'Shift+CmdOrCtrl+S',
                click: function () {
                    dialog.showSaveDialog({
                        filters: [
                            {
                                name: 'Markdown',
                                extensions: ['md']
                            }
                        ]
                    }, function (fileName) {
                        if (fileName === undefined) {
                            return;
                        }
                        var t = windows.filter(function (e) {
                            return e.active;
                        });
                        if (t.length > 0) {
                            t[0].title = fileName.replace('/Users/', "");
                            t[0].webContents.send('save', fileName);
                            t[0].webContents.send('path', t[0].title);
                            t[0].setDocumentEdited(false);

                        }
                    });
                }
            },
            {
                label: 'Export...',
                accelerator: 'Shift+CmdOrCtrl+E',
                click: function () {
                    dialog.showSaveDialog({
                        filters: [
                            {
                                name: 'HTML',
                                extensions: ['html']
                            }
                        ]
                    }, function (fileName) {
                        if (fileName === undefined) {
                            return;
                        }
                        var t = windows.filter(function (e) {
                            return e.active;
                        });
                        if (t.length > 0) {
                            t[0].webContents.send('export', fileName);
                        }
                    });
                }
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            },
            {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo'
            },
            {
                type: 'separator'
            },
            {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            },
            {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            },
            {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            },
            {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }
        ]
    },
    {
        label: 'Window',
        role: 'window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            },
            {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            }
        ]
    },
    {
        label: 'Help',
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: function () {
                    require('electron').shell.openExternal('http://electron.atom.io');
                }
            }
        ]
    }
];
if (process.platform == 'darwin') {
    var name = require('electron').app.getName();
    template.unshift({
        label: name,
        submenu: [
            {
                label: 'About ' + name,
                role: 'about'
            },
            {
                type: 'separator'
            },
            {
                label: 'Services',
                role: 'services',
                submenu: []
            },
            {
                type: 'separator'
            },
            {
                label: 'Hide ' + name,
                accelerator: 'Command+H',
                role: 'hide'
            },
            {
                label: 'Hide Others',
                accelerator: 'Command+Alt+H',
                role: 'hideothers'
            },
            {
                label: 'Show All',
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: function () {
                    app.quit();
                }
            }
        ]
    });
    // Window menu.
    template[3].submenu.push({
        type: 'separator'
    }, {
        label: 'Bring All to Front',
        role: 'front'
    });
}

var m = Menu.buildFromTemplate(template);

var shouldQuit = app.makeSingleInstance(function (commandLine, workingDirectory) {
    // Someone tried to run a second instance, we should show our window.

    //Naive method to display a widow
    if (windows.length > 0) {
        var arr = windows.filter(function (f) {
            return f.active
        });
        if (arr[0].isMinimized()) {
            arr[0].restore();
        }
        arr[0].focus();
        arr[0].active = true;
    }
    return true;
});
var buildWindow = function () {
    var window = new BrowserWindow(winSize);
    if (debug) {
        window.openDevTools();
    }
    window.active = true;
    window.title = undefined;
    window.setFullScreenable(false);
    window.loadURL('file://' + __dirname + '/index.html');
    window.on('closed', function () {
        windows.splice(window, 1);
        window = null;
    });
    window.on('focus', function () {
        console.log('focus ' + window.id);
        window.active = true;
    });
    window.on('blur', function () {
        console.log('blur ' + window.id);
        window.active = false;
    });
    windows.push(window);
    return window;
};

if (shouldQuit) {
    app.quit();
    return;
}

app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', function () {
    Menu.setApplicationMenu(m);
    var first = buildWindow();
    first.focus();
    if (fileToOpen != undefined) {
        first.title = fileToOpen.replace('/Users/', "");
        first.webContents.on("did-finish-load", function () {
            first.webContents.send('file', fileToOpen);
            first.webContents.send('path', first.title);
        });
    }
});
app.on('open-file', function (event, path) {
    event.preventDefault();
    fileToOpen = path;
});
app.on('activate', function (event, hasVisibleWindows) {
    if (hasVisibleWindows) {
        if (windows.length > 0) {
            var arr = windows.filter(function (f) {
                return f.active
            });
            if (arr.length > 0) {
                if (arr[0].isMinimized()) arr[0].restore();
                arr[0].focus();
                arr[0].active = true;
            }
        }
    } else {
        var win = buildWindow();
        win.focus();
        win.active = true;
    }
});

ipc.on("edited", function (mess) {
    if (windows.length > 0) {
        var arr = windows.filter(function (f) {
            return f.active
        });

        arr[0].setDocumentEdited(true);
    }
});
