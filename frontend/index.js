// selectedchat is by default General.
var selectedchat = "general";

/**
 * Event is used to wrap all messages Send and Recieved
 * on the Websocket
 * The type is used as a RPC
 * */
class Event {
  // Each Event needs a Type
  // The payload is not required
  constructor(type, payload) {
    this.type = type;
    this.payload = payload;
  }
}
/**
 * SendMessageEvent is used to send messages to other clients
 * */
class SendMessageEvent {
  constructor(message, from) {
    this.message = message;
    this.from = from;
  }
}
/**
 * NewMessageEvent is messages comming from clients
 * */
class NewMessageEvent {
  constructor(message, from, sent) {
    this.message = message;
    this.from = from;
    this.sent = sent;
  }
}

/**
 * routeEvent is a proxy function that routes
 * events into their correct Handler
 * based on the type field
 * */
function routeEvent(event) {
  if (event.type === undefined) {
    alert("no 'type' field in event");
  }
  switch (event.type) {
    case "new_message":
      // Format payload
      const messageEvent = Object.assign(
        new NewMessageEvent(),
        event.payload
      );
      appendChatMessage(messageEvent);
      break;
    default:
      alert("unsupported message type");
      break;
  }
}
/**
 * appendChatMessage takes in new messages and adds them to the chat
 * */
function appendChatMessage(messageEvent) {
  var date = new Date(messageEvent.sent);
  // format message
  const formattedMsg = `${date.toLocaleString()}: ${
    messageEvent.message
  }`;
  // Append Message
  addElement( messageEvent,formattedMsg, `my-chat-${date.toLocaleString()}`);
}

/**
 * ChangeChatRoomEvent is used to switch chatroom
 * */
class ChangeChatRoomEvent {
  constructor(name) {
    this.name = name;
  }
}

function addElement(messageEvent, content, id) {
  const messageDiv = document.createElement("div");
  messageDiv.classList =
    "flex flex-col space-y-2 text-xs max-w-xs mx-2 order-1 items-end";
  const messageContentSpan = document.createElement("span");
  messageContentSpan.innerHTML = content;
  messageContentSpan.id = id;
  messageContentSpan.classList =
    "px-4 py-2 rounded-lg inline-block bg-blue-600 text-white";
  messageDiv.appendChild(messageContentSpan);
  const wrapper = document.createElement("div") 
  wrapper.id = "my-chat-wrapper"
  wrapper.appendChild(messageDiv);
  // create a new div element
  const newIm = document.createElement("img");
  newIm.classList = "w-6 h-6 rounded-full order-2";
  newIm.src =
    "https://images.unsplash.com/photo-1590031905470-a1a1feacbb0b?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=3&amp;w=144&amp;h=144";
  newIm.alt = "My profile";

  wrapper.classList = "flex items-end justify-end pb-4"
  wrapper.appendChild(newIm);

  const chatMessageDiv = document.getElementById("chat-message")
  
  chatMessageDiv.append(wrapper)
}

/**
 * changeChatRoom will update the value of selectedchat
 * and also notify the server that it changes chatroom
 * */
function changeChatRoom() {
  // Change Header to reflect the Changed chatroom
  var newchat = document.getElementById("chatroom");
  if (newchat != null && newchat.value != selectedchat) {
    selectedchat = newchat.value;
    header = document.getElementById("chat-header").innerHTML =
      "Currently in chat: " + selectedchat;

    let changeEvent = new ChangeChatRoomEvent(selectedchat);
    sendEvent("change_room", changeEvent);
    textarea = document.getElementById("chatmessages");
    textarea.innerHTML = `You changed room into: ${selectedchat}`;
  }
  return false;
}
/**
 * sendMessage will send a new message onto the Chat
 * */
function sendMessage() {
  var newmessage = document.getElementById("message");
  if (newmessage != null) {
    let outgoingEvent = new SendMessageEvent(newmessage.value, "percy");
    sendEvent("send_message", outgoingEvent);
  }
  return false;
}

/**
 * sendEvent
 * eventname - the event name to send on
 * payload - the data payload
 * */
function sendEvent(eventName, payload) {
  // Create a event Object with a event named send_message
  const event = new Event(eventName, payload);
  // Format as JSON and send
  conn.send(JSON.stringify(event));
}
/**
 * login will send a login request to the server and then
 * connect websocket
 * */
function login() {
  let formData = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
  };

  // Send the request
  fetch("login", {
    method: "post",
    body: JSON.stringify(formData),
    mode: "cors",
  })
    .then((response) => {
      if (response.ok) {
        const nameSpan = document.getElementById("client-name");
        nameSpan.innerHTML = formData.username;
        return response.json();
      } else {
        throw "unauthorized";
      }
    })
    .then((data) => {
      // Now we have a OTP, send a Request to Connect to WebSocket
      connectWebsocket(data.otp);
    })
    .catch((e) => {
      alert(e);
    });
  return false;
}
/**
 * ConnectWebsocket will connect to websocket and add listeners
 * */
function connectWebsocket(otp) {
  // Check if the browser supports WebSocket
  if (window["WebSocket"]) {
    console.log("supports websockets");
    // Connect to websocket using OTP as a GET parameter
    conn = new WebSocket(
      "wss://" + document.location.host + "/ws?otp=" + otp
    );

    // Onopen
    conn.onopen = function (evt) {
      document.getElementById("connection-header").innerHTML = "Online";
    };

    conn.onclose = function (evt) {
      // Set disconnected
      document.getElementById("connection-header").innerHTML = "Offline";
    };

    // Add a listener to the onmessage event
    conn.onmessage = function (evt) {
      console.log(evt);
      // parse websocket message as JSON
      const eventData = JSON.parse(evt.data);
      // Assign JSON data to new Event Object
      const event = Object.assign(new Event(), eventData);
      // Let router manage message
      routeEvent(event);
    };
  } else {
    alert("Not supporting websockets");
  }
}
/**
 * Once the website loads
 * */
window.onload = function () {
  // Apply our listener functions to the submit event on both forms
  // we do it this way to avoid redirects
  document.getElementById("chatroom-message").onsubmit = sendMessage;
  document.getElementById("login-form").onsubmit = login;
  document.getElementById("chatroom-selection").onsubmit = changeChatRoom;
};