// TODO License Announcement

(function (window, document) {
'use strict';

var owncloud = window.owncloud || (window.owncloud = {});

var conifg = {
    url_root: '',
    Async: true
};

var API_FILES = '/apps/files/ajax/list.php';
var API_SHARE = '/core/ajax/share.php';
var API_SHARED = '/s/';
var API_DOWNLOAD = '/apps/files/ajax/download.php?';

var PERMISSION_ALL = 31;
var PERMISSION_CREATE = 4;
var PERMISSION_DELETE = 8;
var PERMISSION_READ = 1;
var PERMISSION_SHARE = 16;
var PERMISSION_UPDATE = 2;

owncloud.value = {};
owncloud.value.isRoot = true;
owncloud.value.currentPath = '/';

owncloud.fn = {};
owncloud.fn.setup = setup;
owncloud.fn.login = login;
owncloud.fn.files = files;
owncloud.fn.share = share;
owncloud.fn.getDownloadUrl = getDownloadUrl;

function setup (setting, Async) {
    if ( typeof setting == 'object' ) {
        conifg.url_root = setting.url_root;
        conig.Async = setting.Async;
    }

    else {
        conifg.url_root = setting;
        conifg.Async = Async;
    }
}
// TODO All support type of object input
// TODO 可以多個檔案同時建立連結 (verify)
// TODO 要可以設定密碼及到期日 (verify)

function share (files, date, password) {
    var df = $.Deferred();
    var sharefiles = [];

    sharefiles = files.map(function (data) {
        var sharePermissions = data.permissions;

        //     if (files[i].mountType && files[i].mountType === "external-root"){
        //         sharePermissions = sharePermissions | (PERMISSION_ALL & ~PERMISSION_SHARE);
        //     }

        if(data.type === 'file') {
           sharePermissions = sharePermissions & ~PERMISSION_DELETE;
        }

        if(data.type === 'dir') { 
            data.type = 'folder';
        }

        var file = {
            itemType: data.type,
            itemSource: data.id,
            itemSourceName: data.name,
            permissions: sharePermissions
        };

        return file;
    });
                  
    sharefiles.expirationDate = date;

    sharefiles.password = {
        password: password || null,
        passwordChanged: password ? true : false
    };

    multiLinkshares(sharefiles).done(function (data) {
        var share = {};
        share.email = data.email;
        share.link = Object.keys(data).map(function (key) {
            if (key != 'email') {
                return data[key];
            }
        }).filter(exculdeUndefined);

        df.resolve(share);
    });
    
    return df.promise();
}

// TODO 確認檔案物件皆有可提供開發者使用的變數
function files (dir) {
    var df = $.Deferred();

    dir = typeof dir == 'object' ? dir.name : dir;
    
    filelist(verifyPath(dir)).done(function (data, textStatus) {
        owncloud.value.currentPath = data.data.directory;
        owncloud.value.isRoot = data.data.directory === '/';
        
        df.resolve(data.data);
    });
    
    return df.promise();
}

function verifyPath (dir) {
    if (!dir) {
        return owncloud.value.currentPath;
    }
    
    if (dir.indexOf('/') === 0) {
        return dir;
    }
    
    if (dir === '..') {
        return getParentPath();
    }
    
    return owncloud.value.isRoot ? '/' + dir : owncloud.value.currentPath + '/' + dir;
}

function getParentPath () {
    var path = owncloud.value.currentPath.split('/');
    
    path.pop();
    
    return path.join('/');
}

function getDownloadUrl (file, path) {
    return conifg.url_root + API_DOWNLOAD + $.param({
        files: file,
        dir: path || owncloud.value.currentPath
    });
}

function login (username, password) {
    var df = $.Deferred();
    
    prepare().done(function () {
        signin(username, password).done(function () {
            df.resolve();
        });
    });
    
    return df.promise();
};

function prepare () {
    var df = $.Deferred();
    
    init().done(function (html) {
        var root = document.createElement('html');
        
        root.innerHTML = html;
        
        var container = $('<div>').append(root);
        var data = container.find('head').data();
        
        owncloud.value.requesttoken = data.requesttoken;
        owncloud.value.currentUser = data.user;
        
        df.resolve();
    });
    
    return df.promise();
};

function shareWithLink (file) {
    return $.ajax({
        Async: conifg.Async,
        url: conifg.url_root + API_SHARE,
        method: 'POST',
        headers: {
            requesttoken: owncloud.value.requesttoken,
        },
        data: {
            action: 'share',
            itemType: file.type,
            itemSource: file.id,
            shareType: 3,
            shareWith: file.password,
            permissions: file.permissions,
            itemSourceName: file.name,
            expirationDate: file.expirationDate
        }
    });
}

function multiLinkshares (file) {
    return $.ajax({
        Async: conifg.Async,
        url: conifg.url_root + '/apps/mail_external/shareLinks',
        method: 'POST',
        headers: {
            requesttoken: owncloud.value.requesttoken,
        },
        data: {
            data: file,
            shareWith: file.password,
            expirationDate: file.expirationDate,
        },
    });
}

function filelist (path) {
    return $.ajax({
        Async: conifg.Async,
        url: conifg.url_root + API_FILES,
        data: {
            dir: path,
            sort: 'name',
            sortdirection: 'asc'
        }
    });
}

// TODO signin 不應該使用帳密登入應該更換為 SSO 的 TOKEN
function signin (username, password) {
    return $.ajax({
        Async: conifg.Async,
        url: conifg.url_root,
        method: 'POST',
        data: {
            requesttoken: owncloud.value.requesttoken,
            user: username,
            password: password
        }
    });
}

function init () {
    return $.ajax({
        url: conifg.url_root,
        method: 'POST'
    });
};

function exculdeUndefined (data) {
     return data != undefined;
}

})(window, document);