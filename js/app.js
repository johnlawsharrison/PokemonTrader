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
		})
		.state('profileView', {
			url: '/user-profile',
			templateUrl: 'partials/user-profile.html',
			controller: 'UserProfileCtrl'
		});
	$urlRouterProvider.otherwise('/');
}]);

//controller for navbar (logout and search from any part of the app)
app.controller('NavCtrl', ['$scope', '$location', 'userService', function ($scope, $location, userService) {
	$scope.user = userService;

	//log out the signed-in user
	$scope.logout = function () {
		userService.auth.$signOut();
		//redirect to the tradelist page
		$location.path('/tradelist');
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
			"offering": $scope.offerData,
			"seeking": {
				"species": $scope.desiredSpecies,
				"minLevel": $scope.minLevel,
				"notes": $scope.notes
			}
		};
		data.offering.id = $scope.offerData.$id;

		$scope.tradelist.$add(data).then(function() {
			$('.panel-body').removeClass('in');
		});
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
			//angular seems to be caching modal state, so we do a random cache bust
			templateUrl: 'partials/trade-modal.html?bust=' + Math.random().toString(36).slice(2),
			controller: 'ProposeTradeCtrl',
			scope: $scope
		});
	};
}]);

//controller for trade proposal modal
app.controller('ProposeTradeCtrl', ['$scope', '$uibModalInstance', '$firebaseArray', 'tradeService', function ($scope, $uibModalInstance, $firebaseArray, tradeService) {

	//submit the trade proposal for review by other user
	$scope.submitProposal = function () {
		// add the trade proposal to the pending trades list
		var tradeData = {
			"offer": {
				"userid": $scope.user.uid,
				"username": $scope.user.userData.username,
				"pokemon": $scope.proposeData
			},
			"request": {
				"userid": $scope.selectedPost.userid,
				"username": $scope.selectedPost.username,
				"pokemon": $scope.selectedPost.offering
			}
		};
		tradeData.offer.pokemon.id = $scope.proposeData.$id;
		tradeService.pendingTrades.$add(tradeData);
		$uibModalInstance.close();
	};

	//function to call when cancel button pressed
	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

}]);


app.controller('UserProfileCtrl', ['$scope', '$uibModal', '$firebaseArray', 'tradeService', 'userService', function ($scope, $uibModal, $firebaseArray, tradeService, userService) {
	var baseRef = firebase.database().ref();
	var tradeListRef = baseRef.child('tradelist');
	var usersRef = baseRef.child('users');

	$scope.user = userService;
	$scope.tradelist = $firebaseArray(tradeListRef);
	$scope.pendingTrades = tradeService.pendingTrades;
	$scope.notes = "";


	$scope.imageForPokemon = function(name) {
		return _POKEMON[name];
	}

	//allow the current user to remove any posts associated  with their uid
	$scope.removeTrade = function (postId) {
		$scope.tradelist.$remove($scope.tradelist.$getRecord(postId));
	}

	//allow user to cancel any proposals they have made to others
	$scope.cancelProposal = function (proposalId) {
		tradeService.deleteTrade(proposalId);
	};

	//Respond to a proposal
	$scope.tradeResponse = function(trade) {
		//show modal
		$scope.trade = trade;
		var modalInstance = $uibModal.open({
			//angular seems to be caching modal state, so we do a random cache bust
			templateUrl: 'partials/response-modal.html?bust=' + Math.random().toString(36).slice(2),
			controller: 'TradeResponseCtrl', //controller for the modal
			scope: $scope //pass in all our scope variables!
		});
	};	
}]);

//controller for trade response modal
app.controller('TradeResponseCtrl', ['$scope', '$uibModalInstance', '$firebaseArray', 'tradeService', function ($scope, $uibModalInstance, $firebaseArray, tradeService) {

	//accept the proposal and fulfill the trade
	$scope.acceptProposal= function (tradeID) {
		tradeService.fulfillTrade(tradeID);
		$uibModalInstance.close();
	};

	//function to call when decline button pressed
	$scope.declineProposal = function (tradeID) {
		tradeService.deleteTrade(tradeID);
		$uibModalInstance.dismiss('decline');
	};

	//cancel the dialog, do nothing about the trade
	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};
}]);


//controller for sign up/in page
app.controller('SignUpCtrl', ['$scope', '$firebaseArray', '$location', 'userService', function ($scope, $firebaseArray, $location, userService) {
	var baseRef = firebase.database().ref();
	var usersRef = baseRef.child('users');

	$scope.user = userService;

	//create a new user with firebase
	$scope.signUp = function () {
		$scope.error = null;
		userService.auth.$createUserWithEmailAndPassword($scope.email, $scope.password)
			.then(function (firebaseUser) {
				var userData = {
					'username': $scope.username
				};
				var newUser = usersRef.child(firebaseUser.uid);
				newUser.set(userData);
				//give the user some starter pokemon
				//TODO: randomize these
				var starters = [
						{
							"species": pickRandomProperty(_POKEMON),
							"level": 5
						},
						{
							"species": pickRandomProperty(_POKEMON),
							"level": 5
						},
						{
							"species": pickRandomProperty(_POKEMON),
							"level": 5
						}
				]
				var newPokemon = $firebaseArray(usersRef.child(firebaseUser.uid).child('pokemon'));
				for (var i = 0; i < starters.length; i++) {
					newPokemon.$add(starters[i]);
				};
				userService.username = $scope.username;
				//redirect to the tradelist on success
				$location.path('/tradelist');
			})
			.catch(function (error) {
				$scope.error = "There is already an account associated with this email";
			});
	};

	//sign in as the user
	$scope.signIn = function () {
		$scope.error = null;
		userService.auth.$signInWithEmailAndPassword($scope.email, $scope.password)
			.then(function() {
				//redirect to tradelist on success
				$location.path('/tradelist');
			})
			.catch(function(error) {
				$scope.error = "Incorrect email or password";
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

//service for managing trade proposal state
app.factory('tradeService', ['$firebaseArray', function ($firebaseArray) {
	var service = {}
	var baseRef = firebase.database().ref();

	service.pendingTrades = $firebaseArray(baseRef.child('pendingTrades'));

	//Delete the specific trade
	service.deleteTrade = function(tradeID) {
		service.pendingTrades.$remove(service.pendingTrades.$getRecord(tradeID));
	};

	// get a trade by ID
	service.getTrade = function(tradeID) {
		return service.pendingTrades.$getRecord(tradeID);
	};

	//fulfill a trade between two users
	service.fulfillTrade = function (tradeID) {
		// transfer the pokemon, leveling each one up
		var trade = service.getTrade(tradeID);
		var usersRef = baseRef.child('users');

		var requestUserList = $firebaseArray(usersRef.child(trade.request.userid).child('pokemon'));
		var offerUserList = $firebaseArray(usersRef.child(trade.offer.userid).child('pokemon'));

		// level up pokemon and swap em!
		trade.offer.pokemon.level++;
		trade.request.pokemon.level++;
		requestUserList.$add(trade.offer.pokemon).then(function (ref) {
			offerUserList.$add(trade.request.pokemon);
		});
		// remove the trade request
		service.deleteTrade(tradeID);
	};
	return service;
}]);

// filter for displaying score
app.filter('score', function() {
	return function(pokemon) {
		var total = 0;
		for (var i = 0; i < pokemon.length; i++) {
			total += pokemon[i]['level'];
		};
		return total;
	}
})
// helper function for picking random pokemon
// thanks to http://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
}