import {initMastermind} from './mastermind.js';
import {initPong} from './pong.js';



let jsGames = angular.module("jsGames", []);

//TODO: Change all modals to customModals.
jsGames.service('modalsService', function() {
    this.modalsList = {};
    this.modals = {};
    this.addModal = function(name, modal){
        this.modals[name] = modal;
    };
    this.getModalsList = function(){
        return Object.keys(this.modalsList);
    };
    this.destroyModal = function(name){
        if(!(name in this.modalsList)){
            throw "unknown modal";
        }
        delete this.modalsList['name'];
        delete this.modals['name'];
    };
    this.addCustomModal = function(name, onCreation){
        this.modalsList[name] = onCreation;
    };
    this.registerCustomModal = function(name, modal){
        this.modals[name] = modal;
        if(!(name in this.modalsList)){
            throw "Unknown modal";
        }
        this.modalsList[name]();
    };
    this.getCustomModal = function(name){
        return this.modals[name];
    }
    this.showModal = function(name){
        this.modals[name].showModal();
    };
    this.hideModal = function(name){
        this.modals[name].hideModal();
    };
    this.isVisible = function(name){
        if(name in this.modals){ 
            return this.modals[name].isVisible();
        }
        throw "Unknown modal";
    }
});

jsGames.service('userData', function() {
    this.uname = '';

    this.setUname = function(uname){
        this.uname = uname;
    }

    this.getUname = function(){
        return this.uname;
    }
});

jsGames.service('socketService', function() {
    var socket = io();

    this.getSocket = function () {
      return socket;
    }
});

const MAX_UNAME = 12;

const CONNECTED_USERS_TXT = 'משתמשים מחוברים';
const HELLO_TXT = 'שלום ';

export function showPopup(message){
    let notificationModal = document.getElementById("notificationModal");
    let notificationModalMessage = document.getElementById("notificationModalMessage");
    let closeSpan = document.getElementById("notificationModalClose");
    let closeNotificationModal = document.getElementById("closeNotificationModal");
    notificationModal.style.display = "block";
    notificationModalMessage.innerHTML = message;
    let closeLambda = ()=>{notificationModal.style.display = "none";}
    closeSpan.addEventListener("click", closeLambda);
    closeNotificationModal.addEventListener("click", closeLambda);
    notificationModal.addEventListener("click", closeLambda);
}

/*
function chooseGame(uname){
    socket.emit('uname', uname);
    let chooseGameModal = document.getElementById("chooseGameModal");
    chooseGameModal.style.display = "block";
    let masterMindButton = document.getElementById("masterMindGameButton");
    let pongButton = document.getElementById("pongGameButton");
    let guessWordButton = document.getElementById("guessWordGameButton");
    masterMindButton.addEventListener("click", function(){
        chooseGameModal.style.display = "none";
        initMastermind(socket);
    });
    pongButton.addEventListener("click", function(){
        chooseGameModal.style.display = "none";
        initPong(socket);
    });
    guessWordButton.addEventListener("click", function(){
        chooseGameModal.style.display = "none";
        initWordGuess(socket);
    });
}
*/

function loginPage(){
    let loginModal = document.getElementById("loginModal");
    loginModal.style.display = "block";
    let inputName = document.getElementById("inputName");
    inputName.value = "";
    inputName.focus();
    let nameSendButton = document.getElementById("nameSendButton");
    nameSendButton.addEventListener("click", function(){
        let uname = inputName.value;
        if(uname == null || uname == ""){
            alert("שם לא חוקי");
        }else{
            loginModal.style.display = "none";
            initSideBar(uname);
            chooseGame(uname);
        }
    });
    linkInputAndButton(inputName, nameSendButton);
}

function waitingScreen(){

}

function update_users(user_names){
    let users_element = document.getElementById("usersList");
    let user_names_str = '';
    for(let i=0;i<user_names.length;++i){user_names_str = user_names_str + '<br />' + truncateName(user_names[i]);}
    users_element.innerHTML = user_names_str;
}

function initSideBar(uname){
    document.getElementById('username').textContent = HELLO_TXT + truncateName(uname);
    document.getElementById('usersListHeader').textContent = CONNECTED_USERS_TXT;
    socket.on('logged_in_users', update_users);
}

function sendMessage(msg){
    socket.emit('chatMessage', msg);
}

function truncateName(uname){
    if(uname.length<MAX_UNAME){return uname;}
    return uname.slice(0, MAX_UNAME) + "...";
}

function receiveMessage(msg_tuple){
    let uname = truncateName(msg_tuple[0]); let message = msg_tuple[1];
    let chatArea = document.getElementById('chatArea');
    let new_line = "<b>" + uname + "</b>:" + message + "<br />";
    chatArea.innerHTML = chatArea.innerHTML + new_line;
    chatArea.scrollTop = chatArea.scrollHeight;
}

function linkInputAndButton(input, button){
    input.addEventListener("keyup", function(event) {
        if (event.keyCode === 13) {
          event.preventDefault();
          button.click();
        }
      });
}

function initChat(){
    let chatButton = document.getElementById('chatButton');
    let chatTxtBox = document.getElementById('chatBox');
    chatTxtBox.value = "";
    chatButton.onclick = function(){
        if(chatTxtBox.value!=""){
            sendMessage(chatTxtBox.value);
            chatTxtBox.value = "";
        }
    };
    linkInputAndButton(chatTxtBox, chatButton);
    socket.on('chatMessage', receiveMessage);
}


//loginPage();