'use strict';

var app = angular.module('PokemonTrader', ['ui.bootstrap', 'ui.router']);

//configure routes
app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
	$stateProvider
		.state('tradelist', {
			url: '/',
			templateUrl: 'partials/tradelist.html',
			controller: 'TradeListCtrl'
		})
	$urlRouterProvider.otherwise('/');
}]);

//controller for trading list
app.controller('TradeListCtrl', ['$scope', function ($scope) {
}]);

//service for managing the state of the tradelist
app.factory('tradelistService', function() {
	var service = {}

	if (localStorage['watchlist'] !== undefined) {
		service.watchlist = JSON.parse(localStorage.watchlist);
	} else {
		service.watchlist = [];
	}

	service.addPost = function(movie) {
	};

	service.removePost = function() {
	};

	return service;
});