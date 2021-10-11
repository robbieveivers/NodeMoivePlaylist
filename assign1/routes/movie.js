const express = require('express');
const axios = require('axios');
const router = express.Router();

//main function passing in movieID to be used by API
router.get('/:query', (req, res) => {
	//constructing URLs
	const movieTagsURL = findMovieTags(req.params.query);
	const movieURL = getMovie(req.params.query);

	const movieTagsProm = axios.get(`https://${movieTagsURL}`);//get request to retrieve keywords connected to relevant movie
	const movieProm = axios.get(`https://${movieURL}`);//get request to retrieve movie details to display to user

	let responses = [];

	//asynchronous promises
	Promise.all([movieTagsProm, movieProm])
		.then( (response) =>{
			if(response[0].status = 200 && response[1].status == 200){//check requests were successful
				res.writeHead(200,{'content-type': 'text/html'});
				responses = [response[0].data, response[1].data]//pass the JSON only
			}
			else{
				console.log("ERROR invalid response");//otherwise throw error 
			}
			return responses;
		})
		.then( (rsp) => {
			const s = createPage("Movie Info", rsp);//sending JSON responses to relevant function to handle and storing result
			res.write(s);
			res.end();
		})
		.catch((error) => {
			console.error(error);//catch error
		})
});

//const for themovieDB options
const tmdb ={
	api_key: "e5556deb720162fc9091ffdccfd1ac33",
	format: "json",
	nojsoncallback: 1,
	hostname: 'api.themoviedb.org/3',
	port: 443 //https port
}

//function to construct themovieDB urls
function buildTMDBurl(method){
	const str = tmdb.hostname + method +
	'api_key=' + tmdb.api_key;
	return str;
}

//function to construct and return movie search URL
function getMovie(query){
	let method = '/movie/' +query+"?";
	return buildTMDBurl(method);
}

//function to construct and return movie keywords URL
function findMovieTags(query){
	let method = '/movie/'+query+'/keywords?';
	return buildTMDBurl(method);
}

//function to parse JSON response into JS array for further use
function tmdbParser(rsp){
	let s =[];

	for(var i =0;i<rsp.keywords.length;i++){
		let keyword = rsp.keywords[i].name;
		s[i] = keyword
	}

	return s;
}

//function to retrieve initial API response and build page
function createPage(title, rsp){
	let movieTags = rsp[0];
	let movie = rsp[1];

	//constructing comma seperated list of genres
	let genres = "";

	for (let i=0; i<movie.genres.length;i++){
    		genre = movie.genres[i];
    		genres += genre.name;
    		if(i != movie.genres.length -1){
    			genres += ', ';
    		}
    }
    //parsing keywords and constructing page
	const keywords = tmdbParser(movieTags);
	const str = '<!DOCTYLE html>' +
    	'<html><head><link rel="stylesheet" type="text/css" href="../stylesheets/style.css"/>'+
    	'<meta charset="utf-8"><title>'+movie.title+'</title></head>'+
    	'<header><div class="itemBackground"><form action="/"><button class="homeBTN">Home</button></form><h1>' +
    	movie.title +'</h1></div></header><br>'+
    	'<body><div class="itemBackground"><div class="movieLabels"> Overview: </div><br><div class="movieDetails">' + movie.overview + '</div><br><br>' +
    	'<div class="movieLabels">Release Date: </div><br><div class="movieDetails">' + movie.release_date + '</div><br><br>' +
    	'<div class="movieLabels">Genres: </div><br><div class="movieDetails">' + genres +
    	'</div><br><div style="text-align:center;">' +
    	'<br><a class="linkButton" href="/login/search/'+keywords+'/'+movie.title+'">Create playlist</a>&nbsp;' +
    	'<a class="linkButton" href="/flickr/'+keywords+'/'+movie.title+'">View related images</a></div></div></body></html>';
    return str;
}

module.exports = router;