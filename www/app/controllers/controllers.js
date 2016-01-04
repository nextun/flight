var app = angular.module('flightAppController', [ 'ngRoute', 'ngAnimate', 'ngTouch', 'ui.sortable', 'highcharts-ng', 'flightApp.CommonServices', 'tmh.dynamicLocale', 'ui.bootstrap', 'ui.bootstrap.datetimepicker' ]);

app.controller('flightController', [ '$scope', '$window', '$http', 'CommonService',  function($scope, $window, $http, CommonService) {

    // DEFAULT VIEW SHOW
    $scope.viewControl = {
        showSearch: true,
        showInfo : true,
        showContinueButton : false,
        showResult : false,
        showSeats : false,
        showBooking : false
    };

    // DATE TIME PICKER SETTINGS
    var d = new Date();
    $scope.dateToday = d;
    $scope.isOpen = {
        depart:false,
        return:false
    };
    $scope.openCalendar = function(e, open) {
        e.preventDefault();
        e.stopPropagation();
        $scope.isOpen[open] = true;
    }
    $scope.dateOptions = {
        showWeeks: false,
        startingDay: 1
    };

    // DEFAULT SEARCH VALUE
    $scope.search = {
        type: 'single',
        from: 'DUB',
        to: 'LGW',
        passengers: 1
    };
    $scope.outFlights = null;
    $scope.backFlights = null;
    $scope.ticket = {};

    // Initial Data
    $scope.initialData = function() {
        for (var i=0; i<InputFlight.length; i++) {
            (function(i){
                $http.post('/api/flights', InputFlight[i])
                .success(function(data) {
                    console.log('InputFlight on: ' + InputFlight[i].depart);
                })
                .error(function(data) {
                });
            })(i);
        }
    };

    // EVENT ACTION FUNCTIONS
    $scope.clickSearch = function() {
        CommonService.loadingDiv('block', function(){});
        //console.log("This is clickSearch:\n", JSON.stringify($scope.search));
        // SET VIEW CONTROL
        $scope.viewControl.showSearch = true;
        $scope.viewControl.showInfo = false;
        // INITIAL TICKETS SET TO NULL
        $scope.ticket = {};
        $scope.viewControl.showContinueButton = false;
        $scope.viewControl.showResult = true;
        $scope.viewControl.showSeats = false;
        $scope.viewControl.showBooking = false;
        CommonService.checkSearchFlights($scope.search, function(searchRes){
            $scope.outFlights = searchRes.outFlights;
            CommonService.loadingDiv('none', function(){});
            if ($scope.search.type == 'return') {
                $scope.backFlights = searchRes.backFlights;
            } else {
                $scope.backFlights = null;
            }
        });
    };

    $scope.selectFlight = function(type, index, flight) {
        if (type == 'out' && flight.status !== 'disabled') {
            for (var i=0; i<$scope.outFlights.length; i++) {
                if ($scope.outFlights[i].status == 'active') {
                    $scope.outFlights[i].status = '';
                }
            }
            $scope.outFlights[index].status = 'active';
            $scope.ticket['out'] = $scope.outFlights[index];
        }
        if (type == 'back' && flight.status !== 'disabled') {
            for (var i=0; i<$scope.backFlights.length; i++) {
                if ($scope.backFlights[i].status == 'active') {
                    $scope.backFlights[i].status = '';
                }
            }
            $scope.backFlights[index].status = 'active';
            $scope.ticket['back'] = $scope.backFlights[index];
        }
        // CHECK AND SET CONTINUE BUTTON 
        $scope.viewControl.showContinueButton = false;
        if ($scope.search.type == 'single') {
            if ($scope.ticket['out']) {
                $scope.viewControl.showContinueButton = true;
            }
        } else if ($scope.search.type == 'return') {
            if ($scope.ticket['out'] && $scope.ticket['back']) {
                $scope.viewControl.showContinueButton = true;
            }
        }
    };

    $scope.confirmSearch = function() {
        var totalprice = 0;
        for (var i=0; i<$scope.outFlights.length; i++) {
            if ($scope.outFlights[i].status == 'active') {
                $scope.ticket['out'] = $scope.outFlights[i];
                totalprice += $scope.outFlights[i].price;
                break;
            }
        }
        if ($scope.search.type == 'return') {
            for (var i=0; i<$scope.backFlights.length; i++) {
                if ($scope.backFlights[i].status == 'active') {
                    $scope.ticket['back'] = $scope.backFlights[i];
                    totalprice += $scope.backFlights[i].price;
                    break;
                }
            }
        }
        var oPassengers = [];
        for (var i=0; i<$scope.search.passengers; i++) {
            oPassengers.push({name:"", email:"", outSeat:"", backSeat:""});
        }
        $scope.ticket['passengers'] = oPassengers;
        $scope.ticket['seatprice'] = 0;
        $scope.ticket['totalprice'] = totalprice*$scope.search.passengers;

        // SET VIEW CONTROL
        $scope.viewControl.showSearch = false;
        $scope.viewControl.showInfo = false;
        $scope.viewControl.showContinueButton = false;
        $scope.viewControl.showResult = false;
        $scope.viewControl.showSeats = true;
    };

    $scope.seatOn = {
        index : null,
        type : null
    };
    $scope.showSeat = function(i, t) {
        $scope.seatOn = {
            index : i,
            type : t
        };
    };
    $scope.removeSeat = function(i, t) {
        if (t == 'out') {
            $scope.ticket.passengers[i].outSeat = '';
        }
        if (t == 'back') {
            $scope.ticket.passengers[i].backSeat = '';
        }
        $scope.calcSeat();
    };
    $scope.selectSeat = function(s) {
        var i = $scope.seatOn.index;
        var t = $scope.seatOn.type;
        if (t == 'out') {
            $scope.ticket.passengers[i].outSeat = s;
        }
        if (t == 'back') {
            $scope.ticket.passengers[i].backSeat = s;
        }
        $scope.calcSeat();
    };
    $scope.calcSeat = function() {
        var seatCount = 0;
        var oP = $scope.ticket.passengers;
        for (var i=0; i<oP.length; i++) {
            if (oP[i].outSeat != '') {
                seatCount++;
            }
            if (oP[i].backSeat != '') {
                seatCount++;
            }
        }
        $scope.ticket.seatprice = (seatCount*5);
    };
    $scope.cancelTicket = function() {
        $window.location.reload();
    };

    $scope.confirmTicket = function() {
        CommonService.loadingDiv('block', function(){});
        // SET VIEW CONTROL
        $scope.viewControl.showSearch = false;
        $scope.viewControl.showInfo = false;
        $scope.viewControl.showContinueButton = false;
        $scope.viewControl.showResult = false;
        $scope.viewControl.showSeats = false;
        $scope.viewControl.showBooking = true;

        CommonService.bookTickets($scope.ticket, function(err){
            CommonService.loadingDiv('none', function(){});
            $scope.msgClass = err;
            if (err === null) {
                $scope.msg = "You have booked ticket and saved in our system database";
            } else {
                $scope.msg = err;
            }
        });

    };
    
} ]);

