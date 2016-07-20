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
app.controller('TradeListCtrl', ['$scope', '$firebaseArray', '$uibModal', 'userService', function ($scope, $firebaseArray, $uibModal, userService) {
	var baseRef = firebase.database().ref();
	var tradeListRef = baseRef.child('tradelist');
	var usersRef = baseRef.child('users');

	$scope.user = userService;
	$scope.tradelist = $firebaseArray(tradeListRef);
	$scope.notes = ""; //so that notes can be optional, but won't fail the database write with undefined

	//list a new trade post on the board
	$scope.listTrade = function () {
		//write the post data to database
		var data = {
			"userid": $scope.user.uid,
			"username": $scope.user.userData.username,
			"timestamp": firebase.database.ServerValue.TIMESTAMP,
			"offering": {
				"id": $scope.offerData.$id,
				"species": $scope.offerData.species,
				"level": $scope.offerData.level
			},
			"seeking": {
				"species": $scope.desiredSpecies,
				"minLevel": $scope.minLevel,
				"notes": $scope.notes
			}
		};
		$scope.tradelist.$add(data);
	};

	//allow the current user to remove any posts associated  with their uid
	$scope.removeTrade = function (postId) {
		$scope.tradelist.$remove($scope.tradelist.$getRecord(postId));
	}

	//propose a trade to the selected offer
	$scope.proposeTrade = function (post) {
		//show modal
		$scope.selectedPost = post;
		var modalInstance = $uibModal.open({
			//angular seems to be caching modals, so we do a random cache bust
			templateUrl: 'partials/trade-modal.html?bust=' + Math.random().toString(36).slice(2),
			controller: 'ProposeTradeCtrl', //controller for the modal
			scope: $scope //pass in all our scope variables!
		});

		//When the modal closes (with a result)
		modalInstance.result.then(function(selectedItem) {
		});
	};
}]);

//controller for trade proposal modal
app.controller('ProposeTradeCtrl', ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {

	//submit the trade proposal for review by other user
	$scope.submitProposal = function () {
	};

	//function to call when cancel button pressed
	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

}]);

//controller for sign up/in page
app.controller('SignUpCtrl', ['$scope', '$firebaseArray', 'userService', function ($scope, $firebaseArray, userService) {
	var baseRef = firebase.database().ref();
	var usersRef = baseRef.child('users');

	$scope.user = userService;

	//create a new user with firebase
	$scope.signUp = function () {
		userService.auth.$createUserWithEmailAndPassword($scope.email, $scope.password)
			.then(function (firebaseUser) {
				var userData = {
					'username': $scope.username
				};
				var newUser = usersRef.child(firebaseUser.uid);
				newUser.set(userData);
				// give the user some starter pokemon
				//TODO: randomize these
				var starters = [
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
				var newPokemon = $firebaseArray(usersRef.child(firebaseUser.uid).child('pokemon'));
				for (var i = 0; i < starters.length; i++) {
					newPokemon.$add(starters[i]);
				};
				userService.username = $scope.username;
				//TODO: show a result panel and redirect to the tradelist
			})
			.catch(function (error) {
				console.log(error);
			});
	};

	//sign in as the user
	$scope.signIn = function () {
		userService.auth.$signInWithEmailAndPassword($scope.email, $scope.password)
			.then(function() {
				//TODO: show signin success and redirect to tradelist
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

	//remove this Pokemon from the user's inventory
	service.removePokemon = function (id) {
	};

	//add pokemon to the user's inventory
	service.addPokemon = function () {

	};

	return service;
}]);