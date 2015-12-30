// TODO License Announcement

(function (window, document) {
'use strict';

var owncloud = window.owncloud || (window.owncloud = {});

var conifg = {
    URL_ROOT: 'http://localhost/inwin/owncloud/8.0.4/index.php' // TODO 這個參數需要由開發者指定
};

var API_FILES = '/apps/files/ajax/list.php';
var API_SHARE = '/core/ajax/share.php';
var API_SHARED = '/s/';
var API_DOWNLOAD = '/apps/files/ajax/download.php?';

owncloud.value = {};
// owncloud.value.requesttoken = null;
owncloud.value.isRoot = true;
owncloud.value.currentPath = '/';

owncloud.fn = {};
owncloud.fn.login = login;
owncloud.fn.files = files;
owncloud.fn.share = share;
owncloud.fn.getDownloadUrl = getDownloadUrl;

// TODO 可以多個檔案同時建立連結
// TODO 要可以設定密碼及到期日
function share (file) {
    var df = $.Deferred();
    
    shareWithLink(file).done(function (data) {
        df.resolve(conifg.URL_ROOT + API_SHARED + data.data.token);
    });
    
    return df.promise();
}

// TODO 確認檔案物件皆有可提供開發者使用的變數
function files (dir) {
    var df = $.Deferred();
    
    filelist(verifyPath(dir)).done(function (data) {
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
    return conifg.URL_ROOT + API_DOWNLOAD + $.param({
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
        
        df.resolve();
    });
    
    return df.promise();
};

function shareWithLink (file) {
    return $.ajax({
        url: conifg.URL_ROOT + API_SHARE,
        method: 'POST',
        headers: {
            requesttoken: owncloud.value.requesttoken,
        },
        data: {
            action: 'share',
            itemType: 'file',
            itemSource: file.id,
            shareType: 3,
            shareWith: null,
            permissions: 1,
            itemSourceName: file.name,
            expirationDate: null
        }
    });
}

function filelist (path) {
    return $.ajax({
        url: conifg.URL_ROOT + API_FILES,
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
        url: conifg.URL_ROOT,
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
        url: conifg.URL_ROOT
    });
};

})(window, document);