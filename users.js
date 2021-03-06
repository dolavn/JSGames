let users = [];

function getUser(key, value){
    for(let i=0;i<users.length;++i){
        let user = users[i];
        if(user[key] == value){
            return user;
        }
    }
}

function getUname(socket){
    return getUser('socket', socket)['name'];
}


function broadcast(event, value){
    for(let i=0;i<users.length;++i){
        curr_socket = users[i]['socket'];
        curr_socket.emit(event, value);
    }    
}

function setGameType(socket, gameType){
    for(let i=0;i<users.length;++i){
        if(users[i]['socket'] == socket){
            users[i]['gameType'] = gameType;
            return;
        }
    }
    console.log("User not found");
}

function addUser(user){
    users.push(user);
}

function removeUser(key, value){
    for(let i=0;i<users.length;++i){
        if(value == users[i][key]){
            users.splice(i, 1);
            i--;
        }
    }   
}

function setGameId(socket, gameId){
    for(let i=0;i<users.length;++i){
        let user = users[i];
        if(user['socket'] == socket){
            user['gameId'] = gameId;
            return;
        }
    }
    throw "Wrong socket";
}

function getGameId(socket){
    let user = getUser('socket', socket);
    if(user==null){
        return -1;
    }else{
        return user.gameId;
    }
}

function getNames(){
    names = [];
    for(let i=0;i<users.length;++i){
        names.push(users[i]['name']);
    }
    return names;
}

exports.getUser = getUser;
exports.getUname = getUname;
exports.broadcast = broadcast;
exports.setGameType = setGameType;
exports.setGameId = setGameId;
exports.addUser = addUser;
exports.removeUser = removeUser;
exports.getNames = getNames;
exports.getGameId = getGameId;