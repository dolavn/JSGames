import {initMastermind} from './mastermind.js';

const gameScreen = document.getElementById('gameScreen');

const canvasHeight = 800;
const canvasWidth = 1200;
var socket = io();

const MAX_UNAME = 12;

const CHOOSE_NAME_TXT = 'הזן את שמך';
const CONNECTED_USERS_TXT = 'משתמשים מחוברים';
const WAITING_FOR_PLAYER_TXT = 'ממתין לשחקן נוסף';
const SERVER_FULL_TXT = 'השרת מלא';
const HELLO_TXT = 'שלום ';


let canvas, ctx;

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

function chooseGame(uname){
    socket.emit('uname', uname);
    let chooseGameModal = document.getElementById("chooseGameModal");
    chooseGameModal.style.display = "block";
    let masterMindButton = document.getElementById("masterMindGameButton");
    let pongButton = document.getElementById("pongGameButton");
    masterMindButton.addEventListener("click", function(){
        chooseGameModal.style.display = "none";
        initMastermind(socket);
    });
    pongButton.addEventListener("click", function(){
        chooseGameModal.style.display = "none";
    });
}

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
    initChat();
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


loginPage();