const socket = io(); // Initialize socket.io
const chatForm  = document.getElementById('chat-form'); // Get the chat form element
const chatMessages = document.querySelector('.chat-messages'); // Get the chat messages container


const{username,room} = Qs.parse(window.location.search,{ignoreQueryPrefix:true});

console.log(username,room);

//join room

socket.emit('joinRoom',{username,room});

// Listen for messages from the server
socket.on('message', (message) => {
  console.log(message); // Log the message to the console
  outputMessage(message); // Output the message to the chat
  chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom of the chat
});

// Listen for form submission
chatForm.addEventListener('submit',(e)=>{
  e.preventDefault(); // Prevent the form from submitting the default way
  const msg = e.target.elements.msg.value; // Get the message text
  socket.emit('chatMessage', msg); // Send the message to the server
  e.target.elements.msg.value = ''; // Clear the input field
  e.target.elements.msg.focus(); // Refocus on the input field
});

// Output message to DOM
function outputMessage(message){
  const div = document.createElement('div'); // Create a new div element
  div.classList.add('message'); // Add the 'message' class to the div
  div.innerHTML=`<p class="meta">${message.username} <span>${message.time}</span></p>
  <p class="text">
    ${message.text}
  </p>`; // Set the inner HTML of the div
  chatMessages.appendChild(div); // Append the div to the chat messages container
}