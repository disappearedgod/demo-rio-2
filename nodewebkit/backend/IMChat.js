var net = require('net');
var hashtable = require('hashtable');


function initIMServer(){
	var server =  net.createServer(function(c) {
		console.log('Remote ' + c.remoteAddress + ' : ' + c.remotePort + ' connected!');
		var remoteAD = c.remoteAddress;
		var remotePT = c.remotePort;

	c.on('data', function(msgStr) {
		console.log('data from :' + remoteAD+ ': ' + remotePT+ ' ' + msgStr);
		var msgObj = JSON.parse(msgStr);
		console.log('MSG type:' + msgObj[0].type);
		switch(msgObj[0].type){
			case 'Chat': {
				console.log(msgObj[0].message);
				//console.log("=========================================");
				//output message and save to database
				//return success
				var tp = encapsuMSG("1","Reply","A","B");
				c.write(tp);
			}
			break;
			case 'Reply': {
				//console.log("=========================================");
				//sender received message, sesson end
			}
			break;
			default: {
				console.log("this is in default switch on data");
				//console.log(data);
			}
		}
	});

	c.on('close',function(){
			console.log('Remote ' + remoteAD +  ' : ' + remotePT + ' disconnected!');
		});
//	c.write('Hello!\r\n');

	c.on('error',function(){
			console.log('Unexpected Error!');
	});
//	c.pipe(c);
	});



	server.listen(8892, function(){
		console.log('IMServer Binded! '+ 8892);
	});
}

function sendIMMsg(IP,PORT,MSG){
	var count = 0;
	var id =0;

	if ( !net.isIP(IP)) {
		console.log('Input IP Format Error!');
		return;
	};

	var  client = new net.Socket();
	client.connect(PORT,IP,function(){
		client.write(MSG,function(){
		});
	});

	id =  setInterval(function(C,MSG){
	if (count <5) 
	{
		C.write(MSG);
		count++;
	}else
	{
		clearInterval(id);
	};
	
	},1000,client,MSG);

	client.on('data',function(RPLY){
		console.log("remote data arrived! "+client.remoteAddress+" : "+ client.remotePort);
		var  msg = JSON.parse(RPLY);
		switch(msg[0].type)
		{
			case 'Reply': 
			{
				if (msg[0].message == 1)
				{
					console.log('msg rply received: '+ msg[0].message);
					clearInterval(id);
					client.end();
				};
			}
			break;
		}
	});
	//client.end();

	client.on('error',function(err){
		console.log("Error: "+err.code+" on "+err.syscall+" !  IP : " + IP);
		client.end();
	});
}

function encapsuMSG(MSG,TYPE,FROM,TO)
{
	var MESSAGE = [];
	var tmp = {};
	switch(TYPE)
	{
		case'Chat':{
			tmp["from"] = FROM;
			tmp["to"] = TO;
			tmp["message"] = MSG;
			tmp['type'] = TYPE;
			MESSAGE.push(tmp);
			var send = JSON.stringify(MESSAGE);
			return send;
		}
		break;
		case'Reply':{
			tmp["from"] = FROM;
			tmp["to"] = TO;
			tmp["message"] = MSG;
			tmp["type"] = TYPE;
			MESSAGE.push(tmp);
			var rply = JSON.stringify(MESSAGE);
			return rply;
		}
		default:{

		}
	}
}

function createAccountTable()
{
	var accounttable = new hashtable();
	return accounttable;
}

function insertAccount(TABLE,ACCOUNT,IP)
{
	if ( !net.isIP(IP)) {
		console.log('Input IP Format Error!');
		return;
	};
	TABLE.put(ACCOUNT,IP);
	return TABLE;
}

function getIP(TABLE,ACCOUNT)
{
	var ip = TABLE.get(ACCOUNT);
	if (typeof ip == "undefined" ) 
	{
		console.log('Get Account IP Error')
		return;
	};
	return ip;
}

function clearTable(TABLE)
{
	return TABLE.clear();
}

function removeAccount(TABLE,ACCOUNT)
{
	return TABLE.remove(ACCOUNT);
}

exports.initIMServer = initIMServer;
exports.sendIMMsg = sendIMMsg;
exports.encapsuMSG = encapsuMSG;
exports.createAccountTable = createAccountTable;
exports.insertAccount = insertAccount;
exports.getIP = getIP;
exports.clearTable = clearTable;
exports.removeAccount = removeAccount;