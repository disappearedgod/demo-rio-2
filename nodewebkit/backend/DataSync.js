/**
 * @Title: DataSync.js
 * @Description: Function for data sync
 * @author: yuanzhe
 * @version: 0.0.1
 **/

 var msgTransfer = require("./msgtransfer");
 var commonDAO = require("./DAO/CommonDAO");
 var config = require("./config");
 var hashTable = require("./hashTable");
 var llist = require("./linkedlist")

var ActionHistory = require("./DAO/ActionHistoryDAO");//

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
function syncUpdateAction(other_updateHistory,other_updateOperations,updateCallBack){
	commonDAO.findAboutUpdate(function(my_updateHistory,my_updateOperations){
		updateCallBack(other_updateHistory,my_updateHistory,other_updateOperations,my_updateOperations);
	});
	//commonDAO.findEachActionHistory("update",function(my_updateHistory,my_updateOperations){
	//	updateCallBack(other_updateHistory,my_updateHistory,other_updateOperations,my_updateOperations);
	//});
}

//deal with version control
function versionCtrl(my_linklist,my_updateOperations,other_linklist,other_updateOperations,versionCtrlCB,CBsyncComplete){
	versionCtrlCB(my_linklist,my_updateOperations,other_linklist,other_updateOperations);
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
  		syncSendMessage(deviceAddress[0],requestMsg);
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

	//ActionHistory.test();

	var insertActions = JSON.parse(syncData.insertActions);
	var deleteActions = JSON.parse(syncData.deleteActions);
	var updateActions = JSON.parse(syncData.updateActions);
	var updateOperations; //= JSON.parse(syncData.updateOperations);

	console.log("insert actions: ");
	console.log(insertActions);
	console.log("delete actions: ");
	console.log(deleteActions);
	console.log("update actions: ");
	console.log(updateActions);
	console.log("update operations: ");
	// /console.log(updateOperations);	

	//var deletetList = new Array();
	//var insertList = new Array();
	var updateList = new Array();
	var conflictList = new Array();

	////Sync data, delete > insert > update
	syncDeleteAction(deleteActions,function(deleteActions,my_deleteHistory){
		var myDelete = new hashTable.HashTable();
		myDelete.createHash(my_deleteHistory);

		console.log("==========start sync delete!!!==========");
		//these are new delete actions
		var newDelete = myDelete.getDiff(deleteActions,myDelete);
		console.log("==========new delete history==========");
		console.log(newDelete);
		//create delete hository
		ActionHistory.createAll("delete",newDelete,function(){console.log("==========delete insert done!!!==========")});

		////Retrive actions after delete, start to sync insert actions 
		syncInsertAction(insertActions,function(insertActions,my_insertHistory){
			var myInsert = new hashTable.HashTable();
			myInsert.createHash(my_insertHistory);

			//remove some repeat insert items in insertActions
			insertActions = myInsert.getDiff(insertActions,myDelete);

			console.log("==========start sync insert!!!==========");
			//these are new insert actions
			var newInsert = myInsert.getDiff(insertActions,myInsert);

			console.log("==========new insert history==========");
			console.log(newInsert);
			//create insert hository
			ActionHistory.createAll("insert",newInsert,function(){console.log("==========insert done!!!==========")});

			////Retrive actions after insert, start to sync update actions 
			syncUpdateAction(updateActions,updateOperations,function(updateActions,my_updateHistory,my_updateOperations){
				console.log("==========start sync update!!!==========");
				console.log("----------my update actions----------");
				console.log(my_updateHistory);
			    //var myUpdate = new hashTable.HashTable();
			    //myUpdate.createHash(my_updateHistory);

                //build link list from my database
                console.log("----------building my_linklist----------");
                var my_linklist = new llist.linklist();
                for(var k in my_updateHistory){
                	my_linklist.init(my_updateHistory[0].base_id);
                	my_linklist.createFromArray(my_updateHistory);
                	console.log("<show me the linklist>");
                	my_linklist.print();
                }

                //build link list from other devices's data
                console.log("----------building other_linklist----------");
                var other_linklist = new llist.linklist();
                for(var k in updateActions){
                	other_linklist.init(updateActions[0].base_id);
                	other_linklist.createFromArray(updateActions);
                	console.log("<show me the linklist>");
                	other_linklist.print();
                }

                //do version control stuff
                //is it OK to put syncComplete here?
                console.log("----------start dealing with version control----------");
                versionCtrl(my_linklist,my_updateOperations,other_linklist,other_updateOperations,versionCtrlCB,syncComplete);

        });
});
});
}

//deal with the conflict situation 
function versionCtrlCB(my_linklist,my_updateOperations,other_linklist,other_updateOperations,isConflictCB){                                                                                                                                                                                                                                                                                                                                                                                                           
	var my_operations = my_updateOperations;
	var other_operations = other_updateOperations;

	var my_startNode = my_linklist.tail;
	var other_startNode = other_linklist.tail;

	var newUpdate = new Array();

	if(my_startNode.reversion_id !== other_startNode.reversion_id){
		if(!isPrevVersion() && !isPrevVersion()){

		}

		var my_operation = getOperations(my_startNode.reversion_id,my_operations);
		var other_operation = getOperations(other_startNode.reversion_id,other_operations);
		if(isConflict(my_operation,other_operation)){
			isConflictCB(my_startNode,other_startNode);
		}else{
			//continue;
		}
	}

}

//callback when conflict occurs
function isConflictCB(my_version,other_version){
	//to be continue ...

}

//compare the data to decide if the version is same or not
function gitCompareFile(){
	//to be continue ...
}

/*
//check is exist or not
function isExist(List,item){
	var flag = false;
	if(List === null)
		return false;
	List.forEach(function(listItem){
		if(item.dataURI === listItem.dataURI){
			flag = true;
		}
	});
	return flag;
}
*/

//check if my_version is a prev version in other_linklist
function isPrevVersion(Node,linklist){
	var start = linklist.tail;
	while(start.next !== null){
		if(start.reversion_id === Node.reversion_id){
			return start;
		}else{
			start = start.parent;
		}
	}
}

//check if keys are conflict
function isConflict(my_operation,other_operation){
	if(my_operation === null || other_operation){
		console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
		console.log("Error: operations of this version in update_operations list is EMPTY");
		console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
		return undefined;
	}
	my_operation.forEach(function(myItem){
		other_operation.forEach(function(otherItem){
			if(myItem.key === otherItem)
				return true;
		});
	});
	return false;
}

//get operations with specific reversion_id
function getOperations(reversion_id,operations){
	var allOperations = new Array();
	for(var k in operations){
		if(operations[k].reversion_id === reversion_id)
			allOperations.push(operations[k]);
	}
	return allOperations;
}

/*
//check if the two versions are the same
function isSame(node_1,node_2){
	if(node_1.data.dataURI !== node_2.data.dataURI){
        console.log("++++++++++++++++++++++++++++");
		console.log("Error! : NOT the same data! ");
        console.log("++++++++++++++++++++++++++++");
		return;
	}

	if(node_1.data.reversion_id === node_2.data.reversion_id){
		return true;
	}else{
		if(node_1.data.key === node_2.data.key && node_1.data.value === node_2.data.value)
			return true;
		else
			return false;
	}
	//to be continue ...
	//need to compare with data
}
*/

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
//exports.createHash = createHash;
//exports.getDiff = getDiff;
exports.syncStart = syncStart;
exports.syncRequest = syncRequest;
exports.syncResponse = syncResponse;
//exports.syncCheckResponse = syncCheckResponse;
