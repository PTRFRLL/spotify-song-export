/* 
* I lied about the Github part (for now)
* Here's all the Spotify logic, it all works client-side
* More or less stolen from https://github.com/plamere/MySavedTracks
*/

(function(){
    var savedSongs = {
        accessToken: null,
        //array of song objects
        songObjects: [],
        init: function(){
            this.cacheDom();
            this.bindEvents();
            this.pageLoad();
        },
        cacheDom: function(){
            this.$auth = $('#authorize');
            this.$message = $('#message');
            this.$loader = $('.loader');
            this.$start = $('#start');
        },
        bindEvents: function(){
            this.$auth.on('click', this.authorizeUser.bind(this));
            this.$start.on('click', this.export.bind(this));
        },
        parseArgs: function(){
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
        },
        authorizeUser: function(){
            //spotify api client ID
            var client_id = 'c4e002913da544a597dc7547cf7da24a';
            //spotify api redirect url
            var redirect_uri = 'https://dev.peterfiorella.com/spotifysaved/';
            var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id +
            '&response_type=token' +
            '&scope=user-library-read' +
            '&redirect_uri=' + encodeURIComponent(redirect_uri);
            document.location = url;
        },
        fetchCurrentUserProfile: function(callback){
            var url = 'https://api.spotify.com/v1/me';
            this.callSpotify(url, null, callback);
        },
        fetchSavedTracks: function(callback){
            var url = 'https://api.spotify.com/v1/me/tracks';
            this.callSpotify(url, {}, callback);
        },
        callSpotify: function(url, data, callback){
            $.ajax(url, {
                dataType: 'json',
                data: data,
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken
                },
                success: function(r) {
                    callback(r);
                },
                error: function(r) {
                    callback(null);
                }
            });
        },
        message: function(msg){
        	savedSongs.$message.text(msg);
        },
        showTracks: function(tracks){
        	if(!tracks){
        		this.message('Spotify API error, reload page and try again');
        		savedSongs.$loader.hide();
        		return;
        	}
            _.each(tracks.items, function(item) {
                var track = {
                    name: item.track.name,
                    artist: item.track.artists[0].name,
                    album: item.track.album.name,
                    uri: item.track.uri
                };
                savedSongs.songObjects.push(track);
            });
            if (tracks.next) {
                savedSongs.callSpotify(tracks.next, {}, function(tracks) {
                savedSongs.showTracks(tracks);
                });
            }else{
                savedSongs.exportJSON(savedSongs.songObjects);
            }
        },
        export: function(){
        	savedSongs.$loader.show();
        	this.$start.hide();
        	savedSongs.fetchSavedTracks(function(data) {
                if (data) {
                	savedSongs.message('Exporting ' + data.total + ' tracks...');
                    savedSongs.showTracks(data);
                } else {
                    error("Trouble getting your saved tracks");
                }
            });
        },
        exportJSON: function(saved){
            var jsoncontent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saved));
            var dlAnchorElem = document.getElementById('download');
            dlAnchorElem.setAttribute("href", jsoncontent);
            var date = moment().format('YYYY-MM-DD HHmm');
            var filename = "spotify-saved-" + date + ".json";
            dlAnchorElem.setAttribute("download", filename);
            dlAnchorElem.click();
            this.$loader.hide();
            this.$message.text("Done!");
        },
        pageLoad: function(){
            var args = this.parseArgs();
            if ('access_token' in args) {
                this.accessToken = args['access_token'];
                $("#authorize").hide();
                savedSongs.fetchCurrentUserProfile(function(user) {
                    if (user) {
                        savedSongs.$message.show();
                        savedSongs.message('Found saved tracks for ' + user.id + '. Click below to export.');
                        savedSongs.$start.show();
                    } else {
                        error("Trouble getting the user profile");
                    }
                });
            } else {
                this.$auth.show();
            }
        },
    }; //end of savedSongs object
    savedSongs.init();
})()