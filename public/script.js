document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');

  function sendMessage(message) {
    const inputField = document.querySelector('input[type="text"]');
    inputField.value = '';
    chatContainer.innerHTML += `<div class="message user">${message}</div>`;
    chatContainer.scrollTop = chatContainer.scrollHeight;
    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse = 'Hello! How can I assist you today?';
      chatContainer.innerHTML += `<div class="message ai">${aiResponse}</div>`;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 1000);
  }

  document.querySelector('button').addEventListener('click', () => {
    const message = inputField.value.trim();
    if (message) sendMessage(message);
  });
});