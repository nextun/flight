/**
 * AngularJS Model Sections
 */

var models = {
    data : [],
    isDataLoaded : false,

    doSync : function(dataset_id, cb) {
        $fh.sync.doSync(dataset_id, function() {
            // if no error return false
            cb(false);
        }, function(error) {
            console.log('failed to run sync loop. Error : ' + error);
            // if error return true
            cb(true);
        });
    },

    doCreate : function(dataset_id, data, cb) {
        var datasetid = dataset_id;
        var _data = JSON.parse(angular.toJson(data));
        $fh.sync.doCreate(datasetid, _data, function(res) {
            // The update record which will be sent to the cloud
            console.log("create", res);
            //return success result
            cb(null, res);
        }, function(code, msg) {
            // Error code. One of 'unknown_dataset' or 'unknown_id'
            console.error(code);
            // Optional free text message with additional information
            console.error(msg);
            // return error message
            cb(code + "-" + msg, null);
        });
    },

    doRead : function(dataset_id, guid, cb) {
        $fh.sync.doRead(dataset_id, guid, function(data) {
            data.guid = guid;
            return cb(null, data);
        }, function(code, msg) {
            // Error code. Currently only 'unknown_dataset' is possible
            if (code === "unknown_uid") {
                return cb(null, {
                    guid : code
                });
            } else {
                console.error(code);
                // Optional free text message with additional information
                console.error(msg);
                // return error message
                return cb(code + "-" + msg, null);
            }
        });
    },
    
    doUpdate : function(dataset_id, uid, data, cb) {
        // remove angular tags
        data = JSON.parse(angular.toJson(data));

        $fh.sync.doRead(dataset_id, uid, function(read1) {
            var _fields1 = read1.data;
            for(var _key in _fields1){
                if(data.hasOwnProperty(_key)){
                    _fields1[_key] = data[_key];
                }
            }
            // now add new fields except for uid and guid
            for(var _key in data){
                if(_key !== "uid" && _key !== "guid") {
                    if (!_fields1.hasOwnProperty(_key)) {
                        _fields1[_key] = data[_key];
                    }
                }
            }
            $fh.sync.doUpdate(dataset_id, uid, _fields1, function(res1) {
                $fh.sync.doSync(dataset_id,function(okay){
                    return cb(null, res1);
                }, function(error){
                    return cb(error, null);
                });
            }, function(code, msg) {
                return cb(code + "-" + msg, null);
            });
        }, function(code, msg) {
            if (code === "unknown_uid") {
                $fh.sync.doList(dataset_id, function (list2) {
                    for (var key in list2) {
                        if (list2.hasOwnProperty(key)) {
                            if (uid === list2[key].hash) {
                                var _fields2 = list2[key].data;
                                var uid2 = key;
                                for (var _key in _fields2) {
                                    if (data.hasOwnProperty(_key)) {
                                        _fields2[_key] = data[_key];
                                    }
                                }
                                $fh.sync.doUpdate(dataset_id, uid2, _fields2, function (res2) {
                                    $fh.sync.doSync(dataset_id,function(okay){
                                        return cb(null, res2);
                                    }, function(error){
                                        return cb(error, null);
                                    });
                                }, function (code, msg) {
                                    return cb(code + "-" + msg, null);
                                });
                            }
                        }
                    }
                }, function (code, msg) {
                    // Error code. Currently only 'unknown_dataset' is possible
                    console.error(code);
                    // Optional free text message with additional information
                    console.error(msg);
                });
            } else {
                // return error message
                return cb(code + "-" + msg, null);
            }
        });
    },

    doDelete : function(dataset_id, guid, cb){
        $fh.sync.doDelete(dataset_id, guid, function(data){
            return cb(null, true);
        }, function(code, msg){
            if(code === "unknown_dataset" || code === "unknown_id"){
                return cb(null, true);
            }else{
                console.error(code);
                // Optional free text message with additional information
                console.error(msg);
                // return error message
                return cb(code + "-" + msg, null);
            }
        })
    },
    
    doList : function(dataset_id, cb) {
        var _data = [];
        $fh.sync.doList(dataset_id, function(res) {
            // The data returned by the sync service.
            // Always a full data set (even in the case of deltas).
            console.log("models -> doList '"+dataset_id+"' Success:", res);
            for ( var key in res) {
                if (res.hasOwnProperty(key)) {
                    var uid = key;
                    var data = res[key].data;
                    var hash = res[key].hash;
                    var item = {};
                    item = res[key].data;
                    item.uid = uid;
                    item.guid = uid;
                    _data.push(item);
                }
            }
            console.log("models -> doList '"+dataset_id+"' Success:", _data);
            return cb(null, _data);
        }, function(code, msg) {
            // Error code. Currently only 'unknown_dataset' is possible
            console.error(code);
            // Optional free text message with additional information
            console.error("models -> doList '"+dataset_id+"' Fail:", msg);
            // return error message
            return cb(code + "-" + msg, null);
        });
    },

    doLoginValidation : function(username, password, cb) {
        var _username = username;
        var _password = password;
        $fh.act({
            act : 'login',
            req : {
                username : _username,
                password : _password
            }
        }, function(res) {
            cb(res);
        }, function(code, errorprops, params) {
            console.log("error " + code + JSON.stringify(errorprops));
            cb(false);
        });
    },

    //doDBList GET DATA SET FROM MONGO THROUGH CLOUD DIRECTLY 
    doDBList : function(_dataset, filters, cb){
        $fh.cloud({
            "path" : "/mongodb",
            "method" : "POST",
            "contentType" : "application/json",
            "data" : {
                "type" : _dataset,
                "filters" : filters
            },
            "timeout" : 25000
        }, function(res) {
            // Cloud call was successful. Alert the response
            //alert('Got response from cloud:' + JSON.stringify(res));
            if(res.list.length>0) {
                cb(null, res.list[0].fields);
            } else {
                cb(null, []);
            }
        }, function(msg, err) {
            // An error occured during the cloud call. Alert some debugging information
            alert('Cloud call failed with error message:' + msg + '. Error properties:' + JSON.stringify(err));
            cb("error " + msg + '. Error properties:' + JSON.stringify(err), null);
        });
    },
    
    /*
    doListNoSync : function(_dataset, cb){
        $fh.act({
                act : 'doListAll',
                req: {
                    datasetid: _dataset
                }
            },
            function(res){
                cb(null, res);
            }, function(code, errorprops, params){
                cb("error " + code + JSON.stringify(errorprops), null);
            });
    },
    */

    doAct : function(_act, _req, cb) {
        $fh.act({
            act : _act,
            req : _req
        }, function(res) {
            cb(null, res);
        }, function(code, errorprops, params) {
            console.log("error " + code + JSON.stringify(errorprops));
            cb(true, JSON.stringify(errorprops));
        });
    }



};