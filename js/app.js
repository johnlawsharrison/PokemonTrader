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
app.controller('NavCtrl', ['$scope', '$firebaseAuth', function ($scope, $firebaseAuth) {
	var Auth = $firebaseAuth();

	//respond to changes in auth state
	Auth.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			$scope.uid = firebaseUser.uid;
		} else {
			$scope.uid = undefined;
		}
	});

	//log out the signed-in user
	$scope.logout = function () {
		Auth.$signOut();
	};

}]);

//controller for trading list
app.controller('TradeListCtrl', ['$scope', '$firebaseAuth', '$firebaseArray', function ($scope, $firebaseAuth, $firebaseArray) {
	var baseRef = firebase.database().ref();
	var tradeListRef = baseRef.child('tradelist');
	var usersRef = baseRef.child('users');

	$scope.tradelist = $firebaseArray(tradeListRef);

	var Auth = $firebaseAuth();

	//respond to changes in auth state
	//TODO: find a way to factor out all of these state checks
	Auth.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			$scope.uid = firebaseUser.uid;
		} else {
			$scope.uid = undefined;
		}
	});

	//list a new trade post on the board
	$scope.listTrade = function () {
		//write the post data to database
		var offerData = {
			"userid": $scope.uid,
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
app.controller('SignUpCtrl', ['$scope', '$firebaseAuth', function ($scope, $firebaseAuth) {
	var baseRef = firebase.database().ref();
	var usersRef = baseRef.child('users');
	var Auth = $firebaseAuth();

	//respond to changes in auth state
	Auth.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			$scope.uid = firebaseUser.uid;
		} else {
			$scope.uid = undefined;
		}
	});

	//create a new user with firebase
	$scope.signUp = function () {
		Auth.$createUserWithEmailAndPassword($scope.email, $scope.password)
			.then(function(firebaseUser) {
				console.log('user created: ' + firebaseUser.uid);
				var userData = {
					'username': $scope.username
				};
				var newUser = usersRef.child(firebaseUser.uid);
				newUser.set(userData);
			})
			.catch(function(error) {
				console.log(error);
			});
	};

	//sign in as the user
	$scope.signIn = function () {
		console.log(Auth.$signInWithEmailAndPassword($scope.email, $scope.password));
	};

}]);