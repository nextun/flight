'use strict';

var myApp = angular.module('flightApp.CommonServices', []);

myApp.service('CommonService', [ '$http', '$location', '$locale', 'tmhDynamicLocale', '$translate', function($http, $location, $locale, tmhDynamicLocale, $translate) {

    // checkSearchFlights
    this.checkSearchFlights = function(search, cb) {
        $http.get('/api/flights')
        .success(function(tFlights) {
            var res= {
                outFlights : [],
                backFlights: []
            };
            var d1 = new Date(search.depart);
            var d2;
            for (var i=0; i<tFlights.length; i++) {
                d2 = new Date(tFlights[i].depart);
                if (tFlights[i].from == search.from &&
                    tFlights[i].to == search.to &&
                    d1.getFullYear() === d2.getFullYear() &&
                    d1.getMonth() === d2.getMonth() &&
                    d1.getDate() === d2.getDate()) {
                    // SET SEAT LEFT
                    tFlights[i]['left'] = tFlights[i].seats.length - tFlights[i].books.length;
                    tFlights[i]['status'] = (tFlights[i].seats.length - tFlights[i].books.length - search.passengers) >= 0 ? '' : 'disabled' ;
                    res.outFlights.push(tFlights[i]);
                }
            }
            if (search.type == 'return') {
                d1 = new Date(search.return);
                for (var i=0; i<tFlights.length; i++) {
                    d2 = new Date(tFlights[i].depart);
                    if (tFlights[i].from == search.to &&
                        tFlights[i].to == search.from &&
                        d1.getFullYear() === d2.getFullYear() &&
                        d1.getMonth() === d2.getMonth() &&
                        d1.getDate() === d2.getDate()) {
                        // SET SEAT LEFT
                        tFlights[i]['left'] = tFlights[i].seats.length - tFlights[i].books.length;
                        tFlights[i]['status'] = (tFlights[i].seats.length - tFlights[i].books.length - search.passengers) >= 0 ? '' : 'disabled' ;
                        res.backFlights.push(tFlights[i]);
                    }
                }
                cb(res);
            } else {
                cb(res);
            }
        })
        .error(function(data) {
            console.log('Error: ' + data);
            alert('Error: ' + data);
            cb(data);
        });
    };
    
    // bookTickets
    this.bookTickets = function(ticket, cb) {
        // FLIGHT OUT
        var arrOut = ticket.out;  
        var arrBack = ticket.back;
        delete arrOut.left;
        delete arrOut.status;
        for (var i = 0; i<ticket.passengers.length; i++) {
            arrOut.books.push({
                "seat":ticket.passengers[i].outSeat,
                "name":ticket.passengers[i].name,
                "email":ticket.passengers[i].email
            });
            for (var x = 0; x<ticket.out.seats.length; x++) {
                if (arrOut.seats[x].name == ticket.passengers[i].outSeat
                    && ticket.out.seats[x].status === false) {
                    arrOut.seats[x].status = true;
                }
            }
        }
        $http.delete('/api/flights/'+arrOut._id)
        .success(function(data) {
            $http.post('/api/flights', arrOut)
            .success(function(data) {
                if (arrBack) {
                    // FLIGHT BACK
                    delete arrBack.left;
                    delete arrBack.status;
                    for (var i = 0; i<ticket.passengers.length; i++) {
                        arrBack.books.push({
                            "seat":ticket.passengers[i].backSeat,
                            "name":ticket.passengers[i].name,
                            "email":ticket.passengers[i].email
                        });
                        for (var x = 0; x<ticket.back.seats.length; x++) {
                            if (arrBack.seats[x].name == ticket.passengers[i].backSeat
                                && ticket.back.seats[x].status === false) {
                                arrBack.seats[x].status = true;
                            }
                        }
                    }
                    $http.delete('/api/flights/'+arrBack._id)
                    .success(function(data) {
                        $http.post('/api/flights', arrBack)
                        .success(function(data) {
                            cb(null);
                        })
                        .error(function(data) {
                            console.log('Error: ' + data);
                            cb('Error: ' + data);
                        });
                    })
                    .error(function(data) {
                        console.log('Error: ' + data);
                        cb('Error: ' + data);
                    });    
                } else {
                    cb(null);
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
                cb('Error: ' + data);
            });
        })
        .error(function(data) {
            console.log('Error: ' + data);
            cb('Error: ' + data);
        });
    };
    

    // SHOW/HIDE LOADING IMAGE OR DIV
    this.loadingDiv = function(id, callback) {
        f_ChangeLoadingDiv(id);
        console.log('Got loadingDiv: ', id);
        callback();
    };
    
    function f_ChangeLoadingDiv(id) {
        document.getElementById("overlay").style.display=id;
    }
        
    /***
    * FUNCTION FOR REPORT VIEW DROPDOWN LIST
    * */
    function f_ArrayDuplicateCleanUp(arr, prop) {
        var a = {};
        for ( var i=0; i < arr.length; i++ )
            a[arr[i][prop]] = arr[i];
        arr = new Array();
        for ( var key in a )
            arr.push(a[key]);
        return arr;
    }
    function f_ArraySort (arr, type, order){
        if (type == 'num') {
            return (order == 'desc') ? 
                arr.sort(function(a,b){ return b.id-a.id; }) : 
                arr.sort(function(a,b){ return a.id-b.id; }) ;
        }
        if (type == 'txt') {
            return (order == 'desc') ?  
                arr.sort(function(a,b){ if (a.value.toLowerCase()<b.value.toLowerCase()) return 1; }) :
                arr.sort(function(a,b){ if (a.value.toLowerCase()>b.value.toLowerCase()) return 1; }) ;
        }
    }
    function f_RoundResult(input) {
        return Math.round((typeof input == "undefined") ? 0 : input);
    }

} ]);

