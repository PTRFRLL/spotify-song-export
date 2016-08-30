// I lied about the Github part (for now)
// Here's all the Spotify logic, it all works client-side
// More or less stolen from https://github.com/plamere/MySavedTracks

"use strict";
var accessToken = null;
var songObjects = [];
function error(msg) {
    info(msg);
}
function info(msg) {
    $("#info").text(msg);
}
function authorizeUser() {
    var client_id = 'c4e002913da544a597dc7547cf7da24a';
    var redirect_uri = 'https://dev.peterfiorella.com/spotifysaved/';
    var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id +
        '&response_type=token' +
        '&scope=user-library-read' +
        '&redirect_uri=' + encodeURIComponent(redirect_uri);
    document.location = url;
}
function parseArgs() {
    var hash = location.hash.replace(/#/g, '');
    var all = hash.split('&');
    var args = {};
    _.each(all, function(keyvalue) {
        var kv = keyvalue.split('=');
        var key = kv[0];
        var val = kv[1];
        args[key] = val;
    });
    return args;
}
function fetchCurrentUserProfile(callback) {
    var url = 'https://api.spotify.com/v1/me';
    callSpotify(url, null, callback);
}
function fetchSavedTracks(callback) {
    var url = 'https://api.spotify.com/v1/me/tracks';
    callSpotify(url, {}, callback);
}
function callSpotify(url, data, callback) {
    $.ajax(url, {
        dataType: 'json',
        data: data,
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(r) {
            callback(r);
        },
        error: function(r) {
            callback(null);
        }
    });
}
function showTracks(tracks) {
    _.each(tracks.items, function(item) {
        var track = {
            name: item.track.name,
            artist: item.track.artists[0].name,
            album: item.track.album.name
        };
        songObjects.push(track);
    });
    if (tracks.next) {
        callSpotify(tracks.next, {}, function(tracks) {
            showTracks(tracks);
        });
    }else{
        exportJSON(songObjects);
    }
}

function exportJSON(playlists) {
    var jsoncontent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(playlists));
    var dlAnchorElem = document.getElementById('download');
    dlAnchorElem.setAttribute("href", jsoncontent);
    var date = moment().format('YYYY-MM-DD HH:mm');
    var filename = "spotify-saved-" + date + ".json";
    dlAnchorElem.setAttribute("download", filename);
    dlAnchorElem.click();

    $('.loader').hide();
    $('#message').text("Done!");
}

$(document).ready(
    function() {
        var args = parseArgs();
        if ('access_token' in args) {
            accessToken = args['access_token'];
            $("#authorize").hide();
            info('Getting your user profile');
            fetchCurrentUserProfile(function(user) {
                if (user) {
                    $('.loader').show();
                    $('#message').show();
                    $("#who").text(user.id);
                    info('Getting your saved tracks');
                    fetchSavedTracks(function(data) {
                        if (data) {
                            showTracks(data);
                        } else {
                            error("Trouble getting your saved tracks");
                        }
                    });
                } else {
                    error("Trouble getting the user profile");
                }
            });
        } else {
            $("#authorize").show();
            $("#authorize").on('click', function() {
                authorizeUser();
            });
        }
    }
);