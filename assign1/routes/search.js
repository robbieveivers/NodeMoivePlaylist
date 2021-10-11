const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', (req, res, next) => {
	//creating both URLS for get requests
	let searchURL = "https://" + createTmdbSearch(req.body.searchField);
	let configURL = createConfig();

	const searchMovieProm = axios.get(searchURL);//get request to receive relevant movies
	const getConfigProm = axios.get(configURL);//get request to help build images for relevant movies

	let responses = [];

	//asynchronous promises
	Promise.all([searchMovieProm, getConfigProm])
		.then( (response) =>{
			if(response[0].status = 200 && response[1].status == 200){//check the request was successful
				res.writeHead(200,{'content-type': 'text/html'});
				responses = [response[0].data, response[1].data] //pass the JSON only
			}
			else{
				console.log("ERROR invalid response");//if the request was not successful
			}
			return responses;
		})
		.then( (rsp) => {
			const s = createPage("Movie Results", rsp);//sending JSON responses to relevant function to handle and storing result
			res.write(s);
			res.end();
		})
		.catch( (error) => {
			console.error(error); //catching any errors
		})
});

//const for themovieDB options
const tmdb ={
	api_key: "e5556deb720162fc9091ffdccfd1ac33",
	format: "json",
	nojsoncallback: 1
}

//function to construct and return movie search URL
function createTmdbSearch(query){
	const searchOptions = {
		hostname: 'api.themoviedb.org/3',
		port: 443, //https port
		method: '/search/movie?'
	}
	//const tagsearch options

	const str = searchOptions.hostname + searchOptions.method +
	'api_key=' + tmdb.api_key +
	'&query=' + query +
	'&nojsoncallback' + tmdb.nojsoncallback;

	return str;
}

//function to construct and return config URL
function createConfig(){
	let s ="";

	var options = {
		uri: 'https://api.themoviedb.org/3/configuration?api_key=',
		qs:{
			api_key : 'e5556deb720162fc9091ffdccfd1ac33'
		}
	};

	s+=options.uri + options.qs.api_key;

	return s;
}

//function to parse both JSON responses into list of movies 
function tmdbParser(rsp){

	let s = "";

	//seperating responses
	let searchResult = rsp[0];
	let confResult = rsp[1];

	//loop through results and construct list of movies accordingly
	for(var i =0;i<searchResult.results.length;i++){

  		let title = searchResult.results[i].title;
  		let movieImg = searchResult.results[i].poster_path;
		let rating = searchResult.results[i].vote_average;
		let relDate = searchResult.results[i].release_date;
		let mId = searchResult.results[i].id;


		s += '<div id="movieInfo"><a href="/movie/'+mId+'"/><img src="'+ 
		confResult.images.base_url + confResult.images.poster_sizes[2] + movieImg + 
		'" alt="' + title +'">' +'<h2>'+title+
		'</h2><h3>Rating: '+rating+'</h3>'+'<h4>Released: '+relDate+
		'</h4></div>';
	}
	
	return s;
}

//function to retrieve initial API response and build page
function createPage(title, rsp){
	const movies = tmdbParser(rsp); //rsp passed to function to parse
	const str = '<!DOCTYLE html>' +
    	'<html><head><link rel="stylesheet" type="text/css" href="stylesheets/style.css"/>' +
    	'<meta charset="utf-8"><title>Search results</title></head>'+
    	'<header><div class="itemBackground"><form action="/"><button class="homeBTN">Home</button></form><h1>'+ title +'</h1></div></header>'+
    	'<br><body><div class="itemBackground"><div id="movieSearch">'+movies+
    	'</div></div></body></html>';

    return str; //build and return string to be printed by res.write()
}

module.exports = router;