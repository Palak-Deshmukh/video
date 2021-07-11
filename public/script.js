const socket = io("/"); //import socket.io

//create all required variables
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;
const peers={};
let videoId;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});


//we take input of user name
const user = prompt("Enter your name");

// we create peer object
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
  // secure:true,
});


let myVideoStream;

//we get access of mediaDevices of users
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
//on call event a peer answer the stream created by another peer and we create a new video tag in which we append our stream so that both users able to see each other
    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      video.setAttribute('id',`${videoId}`);
      peers[videoId]=call;
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
      // when we close the meet then video is removed
      call.on('close',()=>{
        video.remove();
      })
      
    });

    // when a new User is connected then user-connected event is called in which connectToNewUser function is called
    socket.on("user-connected", (userId) => {
      setTimeout(function(){
        connectToNewUser(userId,stream);
    },5000)
      // connectToNewUser(userId, stream);
    });
  });

  // when user disconnected then we remove the video tag of that user using his id
  socket.on("user-disconnected",userId=>{
      if(peers[userId]) peers[userId].close();
      var element = document.getElementById(`${videoId}`);
      element.parentNode.removeChild(element);
      console.log(userId);
  });

  // in this function we make a new call and add a video tag and append our stream in it
const connectToNewUser = (userId, stream) => {
  var call = peer.call(userId, stream);
  const video = document.createElement("video");
  video.setAttribute('id',`${videoId}`);

  
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove()
  });
  peers[userId] = call
};

//when peer is connected then socket emit the join-room event with unique id generated by peer

peer.on("open", (id) => {
  videoId=id;
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  window.stream=stream;
 
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

//when we click mute button we disable the getAudioTracks
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

//when we click stopVideo button we disable the getVideoTracks
stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

// invite button will prompt an url so that new user can connect
inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

//here we define createMessage event
socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});
