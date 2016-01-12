// TODO License Announcement

(function (window, document, undefined) {
'use strict';

var owncloud = window.owncloud || (window.owncloud = {});

var API_FILES = '/apps/files/ajax/list.php';
var API_SHARE = '/core/ajax/share.php';
var API_MULTI_SHARE = '/apps/mail_external/shareLinks';
var API_SHARED_URI = '/s/';
var API_DOWNLOAD = '/apps/files/ajax/download.php?';

var PERMISSION_ALL = 31;
var PERMISSION_CREATE = 4;
var PERMISSION_DELETE = 8;
var PERMISSION_READ = 1;
var PERMISSION_SHARE = 16;
var PERMISSION_UPDATE = 2;

var conifg = {
    url_root: null,
    async: true
};

var requesttoken = null;

owncloud.value = {};
owncloud.value.isRoot = true;
owncloud.value.currentPath = '/';

owncloud.fn = {};
owncloud.fn.setup = setup;
owncloud.fn.login = login;
owncloud.fn.files = files;
owncloud.fn.share = share;
owncloud.fn.getDownloadUrl = getDownloadUrl;

// TODO All support type of object input
// TODO 可以多個檔案同時建立連結 (verify)
// TODO 要可以設定密碼及到期日 (verify)

function share (files, expiration, password) {
    var df = $.Deferred();
    
    var files = files.map(function (file) {
        var permissions = file.permissions;

        if (file.type === 'file') {
           permissions = permissions & ~PERMISSION_DELETE;
        }

        if (file.type === 'dir') { 
            file.type = 'folder';
        }

        return {
            itemType: file.type,
            itemSource: file.id,
            itemSourceName: file.name,
            permissions: permissions
        };
    });
    
    multiLinkShares({
        files: files,
        expiration: expiration,
        password: password,
        passwordChanged: password !== undefined
    }).done(function (data, textStatus, jqXHR) {
        var shares = Object.keys(data).map(function (name) {
            return {
                name: name,
                url: conifg.url_root + API_SHARED_URI + data[name]
            };
        });

        df.resolve(share, textStatus, jqXHR);
    });
    
    return df.promise();
}

// TODO 確認檔案物件皆有可提供開發者使用的變數
function files (path, async) {
    var df = $.Deferred();
    var options = typeof path === 'object' ? path : false;
    var dir = options ? options.path : path;
    var async = options ? options.async : async;
    
    filelist({
        dir: verifyPath(dir),
        async : async
    }).done(function (data, textStatus, jqXHR) {
        owncloud.value.currentPath = data.data.directory;
        owncloud.value.isRoot = data.data.directory === '/';
        
        df.resolve(data.data, textStatus, jqXHR);
    });
    
    return df.promise();
}

function verifyPath (path) {
    if (!path) {
        return owncloud.value.currentPath;
    }
    
    if (path.indexOf('/') === 0) {
        return path;
    }
    
    if (path === '..') {
        return getParentPath();
    }
    
    return owncloud.value.isRoot ? '/' + path : owncloud.value.currentPath + '/' + path;
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
        signin({
            username: username,
            password: password
        }).done(function (data, textStatus, jqXHR) {
            jqXHR.status === 302 && df.resolve({status: 'success'}, textStatus, jqXHR);
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
        
        requesttoken = data.requesttoken;
        owncloud.value.currentUser = data.user;
        
        df.resolve();
    });
    
    return df.promise();
};

function multiLinkShares (options) {
    return $.ajax({
        async: options.async !== undefined ? options.async : conifg.async,
        url: conifg.url_root + API_MULTI_SHARE,
        method: 'POST',
        headers: {
            requesttoken: requesttoken,
        },
        data: {
            data: options.files,
            expirationDate: options.expiration,
            shareWith: {
                password: options.password,
                passwordChanged: options.passwordChanged
            }
        }
    });
}

function shareWithLink (file, options) {
    return $.ajax({
        async: conifg.async,
        url: conifg.url_root + API_SHARE,
        method: 'POST',
        headers: {
            requesttoken: requesttoken,
        },
        data: {
            action: 'share',
            itemType: file.type,
            itemSource: file.id,
            itemSourceName: file.name,
            shareType: 3,
            shareWith: options.password,
            permissions: options.permissions,
            expirationDate: options.expiration
        }
    });
}

function filelist (options) {
    return $.ajax({
        async: options.async !== undefined ? options.async : conifg.async,
        url: conifg.url_root + API_FILES,
        data: {
            dir: options.dir,
            sort: 'name',
            sortdirection: 'asc'
        }
    });
}

// TODO 不應該使用帳密登入應該更換為 SSO 的 TOKEN
function signin (options) {
    return $.ajax({
        url: conifg.url_root,
        method: 'POST',
        data: {
            requesttoken: requesttoken,
            user: options.username,
            password: options.password
        }
    });
}

function init () {
    return $.ajax({
        url: conifg.url_root
    });
};

function setup (options) {
    if (typeof options.url_root !== 'string') {
        throw new Error('The ownCloud URL should be assigned with url_root!');
    }
    
    conifg.url_root = options.url_root;
    
    if (typeof options.async === 'boolean') {
        conifg.async = options.async;
    }
}

function exculdeUndefined (data) {
     return data != undefined;
}

})(window, document);