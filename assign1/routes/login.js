var express = require('express');
var request = require('request'); // "Request" library
const axios = require('axios');
var querystring = require('querystring');
const router = express.Router();


//setting required variables for spotify auth
var client_id = '6f33f48eeb814cfb92c231f77087b060'; // Your client id
var client_secret = 'b6bc03fe00834cc5afe05f2fc3a02c41'; // Your secret
var redirect_uri = 'http://localhost:3000/login/callback'; // Your redirect uri
var stateKey = 'spotify_auth_state';

//function to create random string for different state each time
var generateRandomString = function(length){
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

//creating variables to store variables passed from previous pages
var keywords = "";
var movieName = "";


router.get('/search/:query/:title', function(req, res) {
	//setting state and cookie
	var state = generateRandomString(16);
    res.cookie(stateKey, state);

    //storing variables in usable formats
    keywords = (req.params.query).split(",");
    movieName = req.params.title;


    // app request authorisation, will first redirect to spotify to allow user to authenticate, 
    // then into our router.get(/callback) function to check we are properly authenticated 
    var scope = 'playlist-modify-public'; //required scope for our apps function
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

//function to 
router.get('/callback', function(req, res) {

	//fill variables with req variables, or null if they are not found
	var code = req.query.code || null;
	var state = req.query.state || null;

	if (state === null) {//if something goes wrong and our state isnt filled, redirect to index page
		res.redirect('/#' +
			querystring.stringify({
				error: 'state_mismatch'
			}));
	} else {//otherwise we may request our authorization token
		res.clearCookie(stateKey);
		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
        		redirect_uri: redirect_uri,
        		grant_type: 'authorization_code'
      		},
      		headers: {
      			'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      		},
      		json: true
      	};

      	//use authorization token to exchange for access
      	request.post(authOptions, function(error, response, body) {
      		if (!error && response.statusCode === 200) {//if successful

      			//store access token
      			var access_token = body.access_token;

      			//setup options to retrieve user info
      			var userINFoptions = {
      				url: 'https://api.spotify.com/v1/me',
      				headers: { 'Authorization': 'Bearer ' + access_token },
      				json: true
      			};

      			// use the access token retrieve authenticated user information, and pass to function to create playlist,
      			// and find all relevant songs matching keywords, then finally add tracks to the playlist
	        	axios.get(userINFoptions.url, {headers: { 'Authorization': 'Bearer ' + access_token }})
	        		.then( async (body) => {
	        			var tracksTBA = await searchTracks(keywords, access_token) //retreive array of spotify tracks to add
	        				.then( (response) => {
	        					return response;
	        				})
	        			var playlistID = await createPlaylist(body.data.id, access_token) //create playlist for tracks to be added
	        				.then( (response) => {
	        					return response.data.id;
	        				})
	        			
	        			addTracks(playlistID, tracksTBA, access_token); //finally, add retrieved tracks to created playlist
	        		})
	        		.catch((error) => {
	        			console.log(error);
	        		})

	        	// construct page to alert user that they have successfully created the playlist
	        	res.send('<html><head><link rel="stylesheet" type="text/css" href="../stylesheets/style.css"/>' +
    			'<title>playlist</title></head>'+
    			'<header><div class="itemBackground"><h1>Playlist created successfully</h1>'+
    			'<br><br>' +
    			'</div></header><body><br>'+
    			'<a href="/" id="successBtn"><div class="itemBackground">Back to home</div></a></body></html>');


	        } else {//otherwise invalid token, redirect back to index page
	        	res.redirect('/#' +
	        		querystring.stringify({
	        			error: 'invalid_token'
	        		}));
	        }
	    });
	  }
});


//function to asynchronously create playlist for tracks to be added
function createPlaylist(id, access_token) {

	var createPlaylistOptions = {
		url: `https://api.spotify.com/v1/users/${id}/playlists`,
		cont_type: 'application/json'
	}

	const makePlaylistProm = async() => {
		return new Promise((resolve, reject) => {
			axios({
				method: 'post',
				url: createPlaylistOptions.url,
				headers: {
					'Authorization': 'Bearer ' + access_token,
					'Content-Type' : createPlaylistOptions.cont_type,
				},

				data: {
					'name' : movieName + " Playlist",
					'description': "Playlist created based on keywords from the movie: " + movieName,
				}
			})
			.then(response => {
				return resolve(response);
			})
			.catch(error => {
				console.log(error);
			})
		})
	}

	return makePlaylistProm();
}


//function to loop through keywords and query spotify API for matching tracks
function searchTracks(keywords, access_token){

	songURIS = [];

	var createSSearchOptions = {
		url: 'https://api.spotify.com/v1/search'
	}

	//promise function to retrieve track based on keyword[index]
	const getSongs = (index) => {
		return new Promise((resolve, reject) => {
			axios({
				method: 'get',
				url: createSSearchOptions.url,
				headers: {
					'Authorization': 'Bearer ' + access_token,
				},
				params: {
					'q': keywords[index],
					'type': "track",
					'limit': 1,
				}
			})
			.then(response => {
				return resolve(response);
			})
			.catch(error => {
				console.log(error);
			})
		})
	}

	//function to loop through keywords and call getSongs function to retrieve track
	const collectSongs = async() => {
		for(let i=0;i<keywords.length;i++){
			await getSongs(i).then((rsp) => {
				try{
					songURIS.push(rsp.data.tracks.items[0].uri);//then add to array to be returned
				}
				catch(error){
					//some tags seem to be incompatable :( skip these
				}
			})
		}
		return await songURIS;
	}

	return collectSongs(); //actual call
}

//function to use axios post to add retrieved tracks to created playlist
function addTracks(playlistID, tracks, access_token){
	var createAddOptions = {
		url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks`,
		cont_type: 'application/json'
	}
	axios({
		method: 'post',
		url: createAddOptions.url,
		headers: {
			'Authorization': 'Bearer ' + access_token,
			'Content-Type': createAddOptions.cont_type,
		},
		params: {
			'uris': tracks.join(",") //formatting tracks array for API use
		}
	})
	.then((response) => {
		//playlist successfully created!
	})
	.catch((error) => {
		console.log(error);
	})
}

module.exports = router;