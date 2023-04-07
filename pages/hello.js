// Define some responses
const responses = {
  greeting: "Hello! How are you doing today?",
  good: "That's great to hear!",
  bad: "I'm sorry to hear that. Is there anything I can do to help?",
  bye: "Goodbye!"
};

// Get the chatbox elements
const chatbox = document.getElementById("chatbox");
const output = document.getElementById("output");
const input = document.getElementById("input");

// Start the chat
output.innerHTML = responses.greeting;

// Handle input
input.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) { // Enter key pressed
    const message = input.value;
    input.value = "";

    // Check for keywords
    if (message.toLowerCase().includes("good")) {
      output.innerHTML += "<br>" + responses.good;
    } else if (message.toLowerCase().includes("bad")) {
      output.innerHTML += "<br>" + responses.bad;
    } else if (message.toLowerCase().includes("bye")) {
      output.innerHTML += "<br>" + responses.bye;
    } else {
      output.innerHTML += "<br>" + "I'm sorry, I didn't understand that.";
    }
  }
});
