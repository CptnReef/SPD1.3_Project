// Config variables: change them to point to your own servers
// const SIGNALING_SERVER_URL = 'https://rtc.pass-go.net/signaler';
const SIGNALING_SERVER_URL = 'localhost:8000/signaler';
const TURN_SERVER_URL = 'rtc.pass-go.net:3478';
const TURN_SERVER_USERNAME = 'username';
const TURN_SERVER_CREDENTIAL = 'credential';

const PC_CONFIG = {
    iceServers: [
        {
            urls: 'turn:' + TURN_SERVER_URL + '?transport=tcp',
            username: TURN_SERVER_USERNAME,
            credential: TURN_SERVER_CREDENTIAL
        },
        {
            urls: 'turn:' + TURN_SERVER_URL + '?transport=udp',
            username: TURN_SERVER_USERNAME,
            credential: TURN_SERVER_CREDENTIAL
        }
    ]
};

// Signaling methods
let socket = io(SIGNALING_SERVER_URL,
    {
        autoConnect: false
    });

socket.on('data', (data) => {
    console.log('Data received: ', data);
    handleSignalingData(data);
});

socket.on('ready', (data) => {
    console.log('Ready');
    createPeerConnection();
    sendOffer();
});

let sendData = (data) => {
    socket.emit('data', data);
};

// WebRTC methods
let pc;
let localStream;
// let localStreamNoAudio;
let remoteStreamElement = document.querySelector('#remoteStream');
let localStreamElement = document.querySelector('#localStream');
let getLocalStream = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => {
            console.log('Stream found');
            localStream = stream;

            // Creating a display stream without audio is not necessary
            // because we can mute the local video player instead
            // I'm leaving this here in case it's needed down the line

            // localStreamNoAudio = stream.clone();
            // var audioTrackList = localStreamNoAudio.getAudioTracks();
            // while (audioTrackList.length > 0) {
            //     localStreamNoAudio.removeTrack(audioTrackList[0]);
            //     audioTrackList = localStreamNoAudio.getAudioTracks();
            // }
            // console.log('Remove Audio from user display stream');

            localStreamElement.srcObject = localStream;
            console.log('Set self stream');
            // Connect after making sure that local stream is availble
            socket.connect();
        })
        .catch(error => {
            console.error('Stream not found: ', error);
        });
}


let createPeerConnection = () => {
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        pc.onicecandidate = onIceCandidate;
        pc.onaddstream = onAddStream;
        pc.addStream(localStream);
        console.log('PeerConnection created');
    } catch (error) {
        console.error('PeerConnection failed: ', error);
    }
};

let sendOffer = () => {
    console.log('Send offer');
    pc.createOffer().then(
        setAndSendLocalDescription,
        (error) => { console.error('Send offer failed: ', error); }
    );
};

let sendAnswer = () => {
    console.log('Send answer');
    pc.createAnswer().then(
        setAndSendLocalDescription,
        (error) => { console.error('Send answer failed: ', error); }
    );
};

let setAndSendLocalDescription = (sessionDescription) => {
    pc.setLocalDescription(sessionDescription);
    console.log('Local description set');
    sendData(sessionDescription);
};

let onIceCandidate = (event) => {
    if (event.candidate) {
        console.log('ICE candidate');
        sendData({
            type: 'candidate',
            candidate: event.candidate
        });
    }
};

let onAddStream = (event) => {
    console.log('Add stream');
    remoteStreamElement.srcObject = event.stream;
};

let handleSignalingData = (data) => {
    switch (data.type) {
        case 'offer':
            createPeerConnection();
            pc.setRemoteDescription(new RTCSessionDescription(data));
            sendAnswer();
            break;
        case 'answer':
            pc.setRemoteDescription(new RTCSessionDescription(data));
            break;
        case 'candidate':
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
    }
};

// Start connection
// getLocalStream();


/* ----- Stream Control Button Logic ------ */

// get stream control buttons
const cameraMuteButton = document.getElementById('cameraMute');
const micMuteButton = document.getElementById('micMute');
const findMatchButton = document.getElementById('findMatch')


let count = 1;
findMatchButton.addEventListener('click', function () {
    if (count === 1) {
        getLocalStream();
        count = 0
    }
    else {
        socket.disconnect()
        pc.close()
        count = 1
        console.log("disconnect")
        console.log(pc)
    }

})

cameraMuteButton.addEventListener('click', function () {

    // check if a stream track is active
    if (localStream === undefined) {
        return undefined
    }
    // Get video tracks
    videoTracks = localStream.getVideoTracks()
    // Loop through each track and toggle it
    videoTracks.forEach(track => track.enabled = !track.enabled)

    // change button appearance to reflect on/off status
    toggleButtonActive(this, videoTracks[0].enabled)
})

micMuteButton.addEventListener('click', function () {

    // check if a stream track is active
    if (localStream === undefined) {
        return undefined
    }
    // Get audio tracks
    audioTracks = localStream.getAudioTracks()

    // Loop through each track and toggle it
    audioTracks.forEach(track => track.enabled = !track.enabled)

    // change button appearance to reflect on/off status
    toggleButtonActive(this, audioTracks[0].enabled)
    playToggleAudio(audioTracks[0].enabled)
})

function playToggleAudio(enabled) {
    if (enabled) {
        var audio = new Audio('./static/sounds/mic-unmute-beep.mp3');
        audio.play();
    }
    else {
        var audio = new Audio('./static/sounds/mic-mute-beep.mp3');
        audio.play();
    }
}

function toggleButtonActive(elem, enabled) {
    if (enabled) {
        elem.classList.remove("buttonOff")
        elem.classList.add("buttonOn")
    }
    else {
        elem.classList.remove("buttonOn")
        elem.classList.add("buttonOff")
    }
}