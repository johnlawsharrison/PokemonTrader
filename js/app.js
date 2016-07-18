'use strict';

var app = angular.module('PokemonTrader', ['ui.bootstrap', 'ui.router', 'firebase']);

//configure routes
app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
	$stateProvider
		.state('tradelist', {
			url: '/',
			templateUrl: 'partials/tradelist.html',
			controller: 'TradeListCtrl'
		})
		.state('signup', {
			url: '/signup',
			templateUrl: 'partials/sign-up.html',
			controller: 'SignUpCtrl'
		});
	$urlRouterProvider.otherwise('/');
}]);

//controller for navbar (logout and search from any part of the app)
app.controller('NavCtrl', ['$scope', 'userService', function ($scope, userService) {
	$scope.user = userService;

	//log out the signed-in user
	$scope.logout = function () {
		userService.auth.$signOut();
	};

}]);

//controller for trading list
app.controller('TradeListCtrl', ['$scope', '$firebaseArray', 'userService', function ($scope, $firebaseArray, userService) {
	var baseRef = firebase.database().ref();
	var tradeListRef = baseRef.child('tradelist');
	var usersRef = baseRef.child('users');

	$scope.user = userService;
	$scope.tradelist = $firebaseArray(tradeListRef);

	//list a new trade post on the board
	$scope.listTrade = function () {
		//write the post data to database
		var offerData = {
			"userid": $scope.user.uid,
			"username": $scope.user.userData.username,
			"timestamp": firebase.database.ServerValue.TIMESTAMP,
			"offering": {
				"species": $scope.offerSpecies,
				"level": $scope.offerLevel
			},
			"seeking": {
				"species": $scope.desiredSpecies,
				"minLevel": $scope.minLevel,
				"notes": $scope.notes
			}
		};
		$scope.tradelist.$add(offerData);
	};
}]);

//controller for sign up/in page
app.controller('SignUpCtrl', ['$scope', 'userService', function ($scope, userService) {
	var baseRef = firebase.database().ref();
	var usersRef = baseRef.child('users');

	$scope.user = userService;

	//create a new user with firebase
	$scope.signUp = function () {
		userService.auth.$createUserWithEmailAndPassword($scope.email, $scope.password)
			.then(function (firebaseUser) {
				console.log('user created: ' + firebaseUser.uid);
				var userData = {
					'username': $scope.username,
					//TODO: make a bunch of test users with different pokemon
					'pokemon': [
						{
							"species": "Pikachu",
							"level": 30
						},
						{
							"species": "Charizard",
							"level": 50
						},
						{
							"species": "Bulbasaur",
							"level": 10
						}
					]
				};
				var newUser = usersRef.child(firebaseUser.uid);
				console.log(newUser);
				newUser.set(userData);
				userService.username = $scope.username;
			})
			.catch(function (error) {
				console.log(error);
			});
	};

	//sign in as the user
	$scope.signIn = function () {
		userService.auth.$signInWithEmailAndPassword($scope.email, $scope.password)
			.then(function() {
			})
			.catch(function(error) {
				console.log(error);
			});
	};
}]);

//wrapper service for firebase user auth and maintaining other state for logged-in user
app.factory('userService', ['$firebaseAuth', '$firebaseObject', '$firebaseArray', function ($firebaseAuth, $firebaseObject, $firebaseArray) {
	var service = {
		'auth': $firebaseAuth()
	};
	var baseRef = firebase.database().ref();
	var usersRef = baseRef.child('users');

	//respond to changes in auth state
	service.auth.$onAuthStateChanged(function (firebaseUser) {
		if (firebaseUser) {
			service.uid = firebaseUser.uid;
			// fetch this user's data
			service.userData = $firebaseObject(usersRef.child(firebaseUser.uid));
			service.pokemon = $firebaseArray(usersRef.child(firebaseUser.uid).child('pokemon'));
		} else {
			// remove everything except auth directive link
			service.userData = undefined;
			service.pokemon = undefined;
			service.uid = undefined;
		}
	});

	return service;
}]);