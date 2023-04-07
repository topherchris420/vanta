import "../styles/globals.css";
import { useEffect } from "react";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const threeScript = document.createElement("script");
    threeScript.setAttribute("id", "threeScript");
    threeScript.setAttribute(
      "src",
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js"
    );
    document.getElementsByTagName("head")[0].appendChild(threeScript);
    return () => {
      if (threeScript) {
        threeScript.remove();
      }
    };
  }, []);
  return <Component {...pageProps} />;
}

export default MyApp;

const botResponses = [
  "Hello there!",
  "How can I assist you today?",
  "Nice to meet you!",
  "I'm sorry, I don't understand.",
  "That's a great question!",
  "I'm still learning, please try again.",
];

const chatlog = document.getElementById("chatlog");
const userinput = document.getElementById("userinput");
const submitbtn = document.getElementById("submitbtn");

function addMessageToChatlog(msg, sender) {
  const newmsg = document.createElement("div");
  newmsg.classList.add("message");
  if (sender === "bot") {
    newmsg.classList.add("botmessage");
  } else {
    newmsg.classList.add("usermessage");
  }
  newmsg.innerHTML = msg;
  chatlog.appendChild(newmsg);
  chatlog.scrollTop = chatlog.scrollHeight;
}

function processUserInput() {
  const usermsg = userinput.value;
  if (usermsg === "") {
    return;
  }
  addMessageToChatlog(usermsg, "user");
  userinput.value = "";
  const botmsg = botResponses[Math.floor(Math.random() * botResponses.length)];
  setTimeout(() => {
    addMessageToChatlog(botmsg, "bot");
  }, 1000);
}

submitbtn.addEventListener("click", processUserInput);
userinput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    processUserInput();
  }
});
