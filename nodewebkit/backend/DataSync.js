/**
 * @Title: DataSync.js
 * @Description: Function for data sync
 * @author: yuanzhe
 * @version: 0.0.1
 **/

 var msgTransfer = require("./msgtransfer");
 var commonDAO = require("./DAO/CommonDAO");
 var config = require("./config");
 var hashTable = require("./hashTable").hashTable;
 var ActionHistory = require("./DAO/ActionHistoryDAO");

 var state = {
 	SYNC_IDLE:0,
 	SYNC_REQUEST:1,
 	SYNC_START:2,
 	SYNC_COMPLETE:3
 };

 var isRemoteComplete = false;
 var remoteDeviceId = null;

 var currentState = state.SYNC_IDLE;
 console.log("current state is : " + currentState);

 var syncList = new Array();

//Init method,retrive data from db
function syncInitActions(initCallback){
	console.log("init actions history!");

	commonDAO.findAllActionHistory(initCallback);
}

//Sync send message method
//@param Obj
//     turn to jsonStr
function syncSendMessage(address, msgObj){
	var msgStr = JSON.stringify(msgObj);
	msgTransfer.sendMsg(address,msgStr);
}

//Sync delete action
function syncDeleteAction(other_deleteHistory,deleteCallBack){
	commonDAO.findEachActionHistory("delete",function(my_deleteHistory){
		deleteCallBack(other_deleteHistory,my_deleteHistory);
	});
}

//Sync insert action
function syncInsertAction(other_insertHistory,insertCallBack){
	commonDAO.findEachActionHistory("insert",function(my_insertHistory){
		insertCallBack(other_insertHistory,my_insertHistory);
	});
}

//Sync update action
function syncUpdateAction(other_update,updateCallBack){
	commonDAO.findEachActionHistory("update",function(my_update){
		updateCallBack(other_update,my_update);
	});
}

//build data(htables of update history and operation) for versionm control
//function buildData(updateActions,buidDataCB){
//	buidDataCB(updateActions);
//}

//deal with version control
function versionCtrl(my_versions,other_versions,versionCtrlCB,CBsyncComplete){
	versionCtrlCB(my_versions,other_versions);
}

//deal with the conflicts
function dealConflict(my_version,other_version,dealConflictCB){
	dealConflictCB(my_version,other_version);
}

//to set a update_history with new child or parent
function setUpdate(newUpdateHistory,newUpdateEntry,newOperations,setUpdateCB){
	setUpdateCB(newUpdateHistory,newUpdateEntry,newOperations)
}

//Send sync request when other devices connect the net.
function syncRequest(deviceName,deviceId,deviceAddress){
  // console.log("get address from internet discovery : " + address);
  /*if (deviceId.localeCompare(config.uniqueID) <= 0) {
  	syncError("device id in request is wrong!");
  	return;
  }*/

  switch(currentState){
  	case state.SYNC_IDLE: {
  		console.log("syncRequest==========" + currentState);
  		currentState = state.SYNC_REQUEST;
  		remoteDeviceId = deviceId;
  		var syncDevice = {
  			deviceName: deviceName,
  			deviceId: deviceId,
  			deviceAddress: deviceAddress,
  			status: "sync"
  		};
  		syncList.unshift(syncDevice);
  		var requestMsg = {
  			type: "syncRequest",
  			account: config.ACCOUNT,
  			deviceId: config.uniqueID,
  			deviceAddress: config.SERVERIP
  		};
  		syncSendMessage(deviceAddress,requestMsg);
  	}
  	break;
  	case state.SYNC_REQUEST: {
  		console.log("syncRequest=============" + currentState);
  		var syncDevice = {
  			deviceName: deviceName,
  			deviceId: deviceId,
  			deviceAddress: deviceAddress,
  			status: "wait"
  		};
  		syncList.push(syncDevice);
  	}
  	break;
  	case state.SYNC_START: {
  		console.log("syncRequest============" + currentState);
  		var syncDevice = {
  			deviceName: deviceName,
  			deviceId: deviceId,
  			deviceAddress: deviceAddress,
  			status: "wait"
  		};
  		syncList.push(syncDevice);
  	}
  	break;
  	case state.SYNC_COMPLETE: {
  		console.log("syncRequest==========" + currentState);
  		var syncDevice = {
  			deviceName: deviceName,
  			deviceId: deviceId,
  			deviceAddress: deviceAddress,
  			status: "wait"
  		};
  		syncList.push(syncDevice);
  	}
  	break;
  	default: {
  		console.log("this is in default switch in syncRequest");
		//console.log(data);
	}
}
}

//Confirm request
function syncResponse(syncData, address){

	switch(currentState){
		case state.SYNC_IDLE: {
			console.log("syncResponse=========================================" + currentState);
			currentState = state.SYNC_REQUEST;
			remoteDeviceId = syncData.deviceId;
			var syncDevice = {
				deviceName: syncData.deviceName,
				deviceId: syncData.deviceId,
				deviceAddress: syncData.deviceAddress,
				status: "sync"
			};
			syncList.push(syncDevice);

			var resultValue = "False";
			//Get and transfer actions
			var insertActions = null;
			var deleteActions = null;
			var updateActions = null;
			syncInitActions(function(insertArray, deleteArray, updateArray){
				insertActions = JSON.stringify(insertArray);
				deleteActions = JSON.stringify(deleteArray);
				updateActions = JSON.stringify(updateArray);

				resultValue = "OK";

				var syncDataObj = {
					type: "syncResponse",
					account:config.ACCOUNT,
					deviceId:config.uniqueID,
					deviceAddress:config.SERVERIP,
					isRemoteStart:false,
					result: resultValue,
					insertActions: insertActions,
					deleteActions: deleteActions,
					updateActions: updateActions
				};

				syncSendMessage(address, syncDataObj);
			});
		}
		break;
		case state.SYNC_REQUEST: {
			console.log("syncResponse=========================================" + currentState);
			var syncDevice = {
				deviceName: syncData.deviceName,
				deviceId: syncData.deviceId,
				deviceAddress: syncData.deviceAddress,
				status: "wait"
			};
			syncList.push(syncDevice);
		}
		break;
		case state.SYNC_START: {
			console.log("syncResponse=========================================" + currentState);
			var syncDevice = {
				deviceName: syncData.deviceName,
				deviceId: syncData.deviceId,
				deviceAddress: syncData.deviceAddress,
				status: "wait"
			};
			syncList.push(syncDevice);
		}
		break;
		case state.SYNC_COMPLETE: {
			console.log("syncResponse=========================================" + currentState);
			var syncDevice = {
				deviceName: syncData.deviceName,
				deviceId: syncData.deviceId,
				deviceAddress: syncData.deviceAddress,
				status: "wait"
			};
			syncList.push(syncDevice);
		}
		break;
		default: {
			console.log("this is in default switch in syncRequest");
		//console.log(data);
	}
}
}

/*
//Check Response
function syncCheckResponse(msgObj, address){
	//TODO check response
	if (typeof(msgObj.result) != "undefined" && msgObj.result == "OK") {
		//Get and transfer actions
		var insertActions = null;
		var deleteActions = null;
		var updateActions = null;
		//ActionHistory.test();//generate fake update hsitory for test
		syncInitActions(function(insertArray, deleteArray, updateArray){
			insertActions = insertArray;
			deleteActions = deleteArray;
			updateActions = updateArray;

			var syncDataObj = {
				type: "syncStart",
				account:config.ACCOUNT,
				insertActions: insertActions,
				deleteActions: deleteActions,
				updateActions: updateActions
			};

			syncSendMessage(address, syncDataObj);
		});
	}
}
*/

//Start sync data
function syncStart(syncData, address){
	if (remoteDeviceId != syncData.deviceId) {
		console.log("Sync Start Error: retrive data from different device!");
		return;
	}
	isRemoteStart = syncData.isRemoteStart;
	if (!isRemoteStart) {
		var resultValue = "False";
		//Get and transfer actions
		var insertActions = null;
		var deleteActions = null;
		var updateActions = null;
		syncInitActions(function(insertArray, deleteArray, updateArray){
			insertActions = JSON.stringify(insertArray);
			deleteActions = JSON.stringify(deleteArray);
			updateActions = JSON.stringify(updateArray);

			resultValue = "OK";

			var syncDataObj = {
				type: "syncResponse",
				account:config.ACCOUNT,
				deviceId:config.uniqueID,
				deviceAddress:config.SERVERIP,
				isRemoteStart:true,
				result: resultValue,
				insertActions: insertActions,
				deleteActions: deleteActions,
				updateActions: updateActions
			};

			syncSendMessage(address, syncDataObj);
		});
	}

	//Change state, start to sync
	currentState = state.SYNC_START;

	console.log("insert actions: ");
	console.log(insertActions);
	var insertActions = JSON.parse(syncData.insertActions);

	console.log("delete actions: ");
	console.log(deleteActions);
	var deleteActions = JSON.parse(syncData.deleteActions);

	console.log("update actions: ");
	console.log(updateActions);
	var updateActions = JSON.parse(syncData.updateActions);

	////Sync data, delete > insert > update
	syncDeleteAction(deleteActions,function(deleteActions,my_deleteHistory){
		var hMyDelete = new hashTable();
		hMyDelete.initHash("file_uri",my_deleteHistory);

		console.log("==========start sync delete!!!==========");
		//these are new delete actions
		var oNewDelete = hMyDelete.getDiff("file_uri",deleteActions);

		console.log("==========new delete history==========");
		console.log(oNewDelete);

		//create delete hository
		var new_delete = oNewDelete;
		ActionHistory.createAll("delete",new_delete,function(){console.log("==========delete insert done!!!==========")});

		////Retrive actions after delete, start to sync insert actions 
		syncInsertAction(insertActions,function(insertActions,my_insertHistory){
			var hMyInsert = new hashTable();
			hMyInsert.initHash("file_uri",my_insertHistory);

			//remove some repeat insert items in insertActions
			insertActions = hMyInsert.getDiff("file_uri",insertActions);

			console.log("==========start sync insert!!!==========");
			//these are new insert actions
			var oNewInsert = hMyDelete.getDiff("file_uri",insertActions);

			console.log("==========new insert history==========");
			console.log(oNewInsert);

			ActionHistory.createAll("insert",oNewInsert,function(){console.log("==========insert done!!!==========")});

			////Retrive actions after insert, start to sync update actisons 
			syncUpdateAction(updateActions,function(updateActions,my_updateActions){
				console.log("==========start sync update!!!==========");
				console.log(my_updateActions);


				var _myVersions = buidData(my_updateActions);
				var _otherVersion = buidData(updateActions);


					//do version control stuff
					//versionCtrl(_myVersions,_otherVersion,versionCtrlCB,syncComplete);

				});
		});
});
}

//build my data for version ctrl
function buidData(oUpdateActions){

	//build my versions table and operation hashtable
	var hOperations = new hashTable();
	hOperations.initHash("operation",oUpdateActions);
	var oOperations = hOperations.getAll();
	var oVersionsTable = new object();
	var oVersionsOrigin = new Array();

  //build an object for each origin_version(each file)
  if(oUpdateActions != ""){
  	for(var k in oUpdateActions){
  		if(oVersionsTable.hasOwnProperty(oUpdateActions[k].origin_version)){
  			oVersionsTable[oUpdateActions[k].origin_version].push(oUpdateActions[k]);
  		}else{
  			var oTempEntry = new Array();
  			oTempEntry.push(List[k]);
  			oVersionsTable[oUpdateActions[k].origin_version] = oTempEntry;
  		}
  	}
  }

  //build hashtable for each origin_version(each file)
  for(var k in oVersionsTable[k]){
  	var hVersion= new hashTable();
  	hVersion.initHash("version",oVersionsTable[k]);
  	oVersionsOrigin.push(hVersion);
  }

  var oData = {
  	versions: oVersionsOrigin,
  	operations: oOperations,
  };

  return oData;
}


//callback when deal with the conflict situation 
function versionCtrlCB(oMyVersions,oOtherVersions){                                                                                                                                                                                                                                                                                                                                                                                                           
	console.log("==========start dealing with version control==========");
	console.log(oMyVersions)

	var sMyHead = oMyVersions.versions.head;
	var sMyTail = oMyVersions.versions.tail;
	var hMyVersion = oMyVersions.versions;
	var hMyOperations = oMyVersions.operations;
	var oMyVersionId = oMyVersions.versions.getAll();
	
	var sOtherHead = oOtherVersions.versions.head;
	var sOtherTail = oOtherVersions.versions.tail;
	var hOtherVersion = oOtherVersions.versions;
	var hOtherOperations = oOtherVersions.operations;
	var oOtherVersionId = oOtherVersions.versions.getAll();

	var oNewUpdateHistory = new Array();
	var oNewUpdateEntry = new Array();
	var oNewOperations = new Array();

  //the final version is not same and is not any prev version of another versions
  //considered as a conlict occur
  if(!hMyVersion.isExist(sOtherTail) && !hOtherVersion.isExist(sMyTail) && sOtherTail != "" && sMyTail != ""){
  	console.log("+++++++++++++++++++++++++++++++++++++++++++++++++ # MAY conflict");
  	dealConflict(sMyTail,sOtherTail,dealConflictCB);

  }else{
    // #1: sOtherTail is a prev version of oMyVersions
    console.log("+++++++++++++++++++++++++++++++++++++++++++++++++ # NO conflict");
    //console.log(sOtherTail)


    if(sOtherTail == ""){
    	console.log("+++++++++++++++++++++++++++++++++++++++++++++++++ nothing new")
    	return;
    }else if(sMyTail == ""){
    	console.log("+++++++++++++++++++++++++++++++++++++++++++++++++ local clean, first time sync")
    	oNewUpdateHistory = "";
    	oNewUpdateEntry = hOtherVersion.getAll();
    	oNewOperations = hOtherOperations.getAll();
    	//console.log(oNewUpdateEntry)
    	//console.log(oNewOperations)
    }else{
    	console.log("+++++++++++++++++++++++++++++++++++++++++++++++++ normal sync")
    	//these are new version's version_id, from other_versions
    	var oNewVersion = hMyVersion.getDiff("version_id",oOtherVersionId);
    	//console.log("*****************************************newVersionnnnnnnnnnnnnnnnnnnnnnnnnn")
    	//console.log(oMyVersions)
    	//check each versoin's parents/children if exist in oMyVersions
    	for(var k in oNewVersion){
    		var oTempParents = oNewVersion[k].parents;
    		var oTempChildren = oNewVersion[k].children;

    		for(var i in oTempParents){
        	//if this version has a parent exists in oMyVersions
        	if(hMyVersion.isExist(oTempParents[i])){
        		var oParent = hMyVersion.getValue(oTempParents[i])[0];
        		if(oParent.children == ""){
        			var children = new Array();
        			children.push(oNewVersion[k].version_id);
        			oParent.children = children;
        		}else{
        			oParent.children.push(oNewVersion[k].version_id);
        		}
        		var newEntry = {
        			"version_id": oParent.version_id,
        			"parents": oParent.parents,
        			"children": oParent.children,
        			"origin_version": oParent.origin_version
        		}
        		oNewUpdateHistory.push(oParent);
        	}
        }
        for(var j in oTempChildren){
        	//if this version has a child exists in oMyVersions
        	if(hMyVersion.isExist(oTempChildren[j])){
        		var oChild = hMyVersion.getValue(oTempChildren[j])[0];
        		oChild.parents.push(oNewVersion[k].version_id);
        		var newEntry = {
        			"version_id": oChild.version_id,
        			"parents": oChild.parents,
        			"children": oChild.children,
        			"origin_version": oChild.origin_version
        		}
        		oNewUpdateHistory.push(oChild);
        	}
        }
        oNewOperations.push(hOtherOperations.getValue(oNewVersion[k].version_id));
        oNewUpdateEntry.push(oNewVersion[k]);
      }
    }

    //then we need modify related data and renew then in db 
    //console.log(oNewUpdateHistory)
    //console.log(oNewUpdateEntry)
    //console.log(oNewOperations)
    var _newUpdateHistory = oNewUpdateHistory;
    var _newUpdateEntry = oNewUpdateEntry;
    var _newOperations = oNewOperations;
    setUpdate(_newUpdateHistory,_newUpdateEntry,_newOperations,setUpdateCB);
  }
}


//callback when conflict occurs
function dealConflictCB(hMyVersion,hOtherVersion){
	//to be continue ...
	var readline = require('readline');
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

}

//add new update information into db
function setUpdateCB(oNewUpdateHistory,oNewUpdateEntry,oNewOperations){
	console.log("==========dealing with new update==========");
	console.log(oNewUpdateHistory);
	console.log(oNewUpdateEntry)
	console.log(oNewOperations);	
	commonDAO.modifyOrInsertUpdateItems(oNewUpdateHistory,oNewUpdateEntry,oNewOperations);

}

//compare the data to decide if the version is same or not
function isFileSame(){
	//to be continue ...
}

//check if the two versions are the same
//function isSame(my_version,my_versions,other_version,other_versions){
//	if(my_version === other_version)
//		return true;
//	return false;
//}

//check if keys are conflict
//function isConflict(my_operation,other_operation){
//	if(my_operation == null || other_operation == null){
//		console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
//		console.log("Error: operations of this version in update_operations list is EMPTY");
//		console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
//		return undefined;
//	}
//	my_operation.forEach(function(myItem){
//		other_operation.forEach(function(otherItem){
//			if(myItem.key === otherItem.key)
//				return true;
//		});
//	});
//	return false;
//}

//get operations with specific version_id
function getOperations(sVersionId,oOperations){
	var oAllOperations = new Array();
	for(var k in oOperations){
		if(oOperations[k].version_id === sVersionId)
			oAllOperations.push(oOperations[k]);
	}
	return oAllOperations;
}

//Sync complete
function syncComplete(isLocal,isComplete,deviceId,deviceAddress){
	if (deviceId != remoteDeviceId) {
		console.log("Sync Complete Error: retrive data from different device!");
		return;
	}
	if (isLocal && isComplete) {
		currentState = state.SYNC_COMPLETE;
	}else {
		isRemoteComplete = isComplete;
	}

	if (syncList.length < 1) {
		console.log("Sync List Error: List length < 1!");
		return;
	}

	if (isRemoteComplete && currentState == state.SYNC_COMPLETE) {
		console.log("Data Sync is Done!");
		currentState = state.SYNC_IDLE;
		isRemoteComplete = false;
		if (syncList[0].deviceId = deviceId) {
			syncList.shift();
		}else{
			console.log("Sync list may be wrong!")
			for (var i = 0; i < syncList.length; i++) {
				if (syncList[i].deviceId == deviceId) {
					syncList.splice(i,1);
					break;	
				}
			}
		}

		if (syncList.length < 1) {
			currentState = state.SYNC_IDLE;
		}else{
			currentState = state.SYNC_REQUEST;
			syncRequest(syncList[0].deviceName,syncList[0].deviceId,syncList[0],deviceAddress);
		}
	}
	else if(currentState == state.SYNC_COMPLETE){
		var syncDataObj = {
			type: "syncComplete",
			account: config.ACCOUNT,
			deviceId: config.uniqueID,
			isComplete: true,
		};

		syncSendMessage(deviceAddress, syncDataObj);
	}
}

//Sync error
function syncError(err){
	console.log("Sync Error: " + err);
}

//Export method
exports.syncStart = syncStart;
exports.syncRequest = syncRequest;
exports.syncResponse = syncResponse;
//exports.syncCheckResponse = syncCheckResponse;
