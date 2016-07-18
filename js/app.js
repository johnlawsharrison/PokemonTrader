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