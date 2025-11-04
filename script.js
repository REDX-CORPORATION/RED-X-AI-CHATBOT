(() => {
  const welcomeModal = document.getElementById('welcomeModal');
  const welcomeContent = document.getElementById('welcomeContent');
  const startChatBtn = document.getElementById('startChatBtn');
  const chatApp = document.getElementById('chatApp');
  const chatContainer = document.getElementById('chat');
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const exportBtn = document.getElementById('exportBtn');
  const toggleThemeBtn = document.querySelector('.toggle-theme');
  const micBtn = document.querySelector('.mic-btn');
  const micIcon = document.getElementById('micIcon');
  const header = document.querySelector('header');

  let chatHistory = [];
  let voiceRecognitionActive = false;
  let recognition;
  let listeningIndicator;
  let originalPlaceholder = "ENTER MESSAGE...";
  let lastScrollTop = 0;
  let loadingElement = null;

  function detectTheme() {
    if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
      document.body.dataset.theme = 'dark';
    } else {
      document.body.dataset.theme = 'light';
    }
  }
  detectTheme();

  function setup3DHover() {
    welcomeContent.addEventListener('mousemove', (e) => {
      const rect = welcomeContent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateY = (x - centerX) / 25;
      const rotateX = (centerY - y) / 25;
      welcomeContent.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    });
    welcomeContent.addEventListener('mouseleave', () => {
      welcomeContent.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
  }

  startChatBtn.onclick = () => {
    welcomeModal.style.display = 'none';
    chatApp.classList.add('active');
    chatApp.focus();
    messageInput.focus();
    setTimeout(() => {
      addMessage('THIS IS RED-X AI BASIC CHATBOT. HOW CAN I ASSIST YOU TODAY?', 'bot');
      setTimeout(() => {
        addQuickQuestions();
      }, 300);
    }, 500);
  };
  
  function addQuickQuestions() {
    const questions = [
      "Who are you?",
      "Who created this ChatBot?",
      "What is RED-X?",
      "Who are the core members of RED-X?"
    ];
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', 'bot');
    messageEl.innerHTML = `
      <div style="margin-bottom: 12px; font-weight: 600; color: var(--red-light);">Quick questions you might have:</div>
      <div class="chat-quick-questions">
        ${questions.map(q => `
          <button class="chat-quick-btn" data-question="${q}">${q}</button>
        `).join('')}
      </div>
    `;
    chatContainer.appendChild(messageEl);
    setTimeout(() => {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    }, 10);
    setTimeout(() => {
      messageEl.style.opacity = '1';
      messageEl.style.transform = 'translateY(0)';
    }, 10);
    messageEl.querySelectorAll('.chat-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-question');
        messageInput.value = question;
        chatForm.dispatchEvent(new Event('submit'));
      });
    });
  }

  function formatMathContent(text) {
    let formattedText = text
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/^-{3,}/gm, '<hr>')
      .replace(/^\*{3,}/gm, '<hr>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    formattedText = formattedText.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang ? ` data-lang="${lang}"` : '';
      return `<pre${language}><div class="copy-btn">Copy</div>${code}</pre>`;
    });
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    formattedText = formattedText
      .replace(/\\boxed{(.*?)}/g, '<div class="final-answer">$1</div>')
      .replace(/\\\[(.*?)\\\]/g, '<div class="math-formula">\\[$1\\]</div>')
      .replace(/\\\((.*?)\\\)/g, '<span class="math-formula">\\($1\\)</span>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    return formattedText;
  }
  
  function fixLatex(text) {
    return text
      .replace(/\\boxed{\\frac{(\d+)}{(\d+)}} \\quad \\text{or} \\quad \\boxed{(\d+) \\frac{(\d+)}{(\d+)}}/g, 
        '\\boxed{\\frac{$1}{$2}} \\quad \\text{or} \\quad \\boxed{$3\\frac{$4}{$5}}')
      .replace(/x = \s*(\d+)\s*\\text{ or }\s*\\s*-\s*(\d+)/g, 
        'x = $1 \\quad \\text{or} \\quad -$2');
  }

  function addMessage(text, sender = 'bot') {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', sender);
    const fixedText = fixLatex(text);
    messageEl.innerHTML = formatMathContent(fixedText);
    chatContainer.appendChild(messageEl);
    setTimeout(() => {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    }, 10);
    chatHistory.push({ sender, text: fixedText });
    setTimeout(() => {
      messageEl.querySelectorAll('pre').forEach(pre => {
        const copyBtn = pre.querySelector('.copy-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            const code = pre.textContent.replace('Copy', '').trim();
            navigator.clipboard.writeText(code).then(() => {
              const success = document.createElement('div');
              success.classList.add('copy-success');
              success.textContent = 'Copied!';
              pre.appendChild(success);
              setTimeout(() => {
                success.remove();
              }, 1500);
            });
          });
        }
      });
    }, 100);
    if (typeof MathJax !== 'undefined') {
      setTimeout(() => {
        MathJax.typeset([messageEl]);
      }, 100);
    }
  }

  function showLoading() {
    if (loadingElement) {
      loadingElement.remove();
    }
    loadingElement = document.createElement('div');
    loadingElement.classList.add('loading');
    loadingElement.innerHTML = `PROCESSING<span class="loading-dots"><span></span><span></span><span></span></span>`;
    chatContainer.appendChild(loadingElement);
    setTimeout(() => {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    }, 10);
    return loadingElement;
  }

  function removeLoading() {
    if (loadingElement) {
      loadingElement.remove();
      loadingElement = null;
    }
  }

  // ✅ UPDATED API HERE
  async function fetchAIResponse(message) {
    const encodedMsg = encodeURIComponent(message);
    const proxyUrl = `https://corsproxy.io/?https://princeaiapi.vercel.app/prince/api/v1/ask?key=prince&ask=${encodedMsg}`;
    
    showLoading();
    await new Promise(resolve => setTimeout(resolve, 500));
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Failed to get response');
    const data = await res.json();
    return data.response;
  }

  function handleQuickQuestion(question) {
    let answer = "";
    switch(question) {
      case "Who are you?":
        answer = "I'm a Chat bot from Red-X Corporation.";
        break;
      case "Who created this ChatBot?":
        answer = "This chat bot is created by Mohtasim Billah Jitu, Founder of RED-X CORPORATION.";
        break;
      case "What is RED-X?":
        answer = "RED-X is a tech-focused team specializing in automation, AI tools, and gaming solutions.";
        break;
      case "Who are the core members of RED-X?":
        answer = `The core team includes:\n• Mohtasim Billah Jitu – Founder, CEO & Lead Developer\n• Ashik Limon – Chairman\n• Abdullah Bin Jubayer Raihan – Chief Developer(CTO)\n• Abid Hassan – Marketing & Client Relations\n• Samiul Islam & Sazid Islam Akash – Testing & Quality Assurance`;
        break;
      default:
        return false;
    }
    addMessage(question, 'user');
    showLoading();
    setTimeout(() => {
      removeLoading();
      addMessage(answer, 'bot');
    }, 800);
    return true;
  }

  chatForm.onsubmit = async e => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;
    if (handleQuickQuestion(message)) {
      messageInput.value = '';
      return;
    }
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.disabled = true;
    try {
      const response = await fetchAIResponse(message);
      removeLoading();
      addMessage(response, 'bot');
    } catch (err) {
      removeLoading();
      addMessage('ERROR: COMMUNICATION FAILURE WITH RED-X AI CORE. PLEASE RETRY.', 'bot');
      console.error(err);
    } finally {
      messageInput.disabled = false;
      messageInput.focus();
    }
  };

  exportBtn.onclick = () => {
    if (!chatHistory.length) {
      alert('CHAT HISTORY EMPTY. NOTHING TO EXPORT.');
      return;
    }
    let txtContent = 'RED-X AI CHAT HISTORY EXPORT\n';
    txtContent += '='.repeat(40) + '\n\n';
    chatHistory.forEach(entry => {
      const who = entry.sender === 'user' ? 'USER' : 'RED-X AI';
      txtContent += `[${who}]: ${entry.text}\n\n`;
    });
    txtContent += '\n' + '='.repeat(40) + '\n';
    txtContent += `EXPORTED ON: ${new Date().toLocaleString()}\n`;
    txtContent += 'RED-X AI CHAT SYSTEM v1.01';
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'red-x-ai-chat-export.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  toggleThemeBtn.onclick = () => {
    if (document.body.dataset.theme === 'dark') {
      document.body.dataset.theme = 'light';
    } else {
      document.body.dataset.theme = 'dark';
    }
  };

  function createListeningIndicator() {
    listeningIndicator = document.createElement('div');
    listeningIndicator.classList.add('listening-indicator');
    listeningIndicator.innerHTML = 'Listening...';
    document.body.appendChild(listeningIndicator);
  }
  
  function removeListeningIndicator() {
    if (listeningIndicator) {
      listeningIndicator.remove();
      listeningIndicator = null;
    }
  }

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      messageInput.value = speechResult;
      if (event.results[0].isFinal) {
        removeListeningIndicator();
        messageInput.placeholder = originalPlaceholder;
      }
    };
    recognition.onend = () => {
      micBtn.classList.remove('active');
      micIcon.classList.remove('fa-stop');
      micIcon.classList.add('fa-microphone-alt');
      voiceRecognitionActive = false;
      removeListeningIndicator();
      messageInput.placeholder = originalPlaceholder;
    };
    recognition.onerror = () => {
      micBtn.classList.remove('active');
      micIcon.classList.remove('fa-stop');
      micIcon.classList.add('fa-microphone-alt');
      voiceRecognitionActive = false;
      removeListeningIndicator();
      messageInput.placeholder = originalPlaceholder;
    };
  } else {
    micBtn.style.display = 'none';
  }

  function startVoiceRecognition() {
    if (!recognition) return;
    recognition.start();
    micBtn.classList.add('active');
    micIcon.classList.remove('fa-microphone-alt');
    micIcon.classList.add('fa-stop');
    voiceRecognitionActive = true;
    createListeningIndicator();
    messageInput.placeholder = "Recording voice...";
  }
  
  function stopVoiceRecognition() {
    if (!recognition) return;
    recognition.stop();
    micBtn.classList.remove('active');
    micIcon.classList.remove('fa-stop');
    micIcon.classList.add('fa-microphone-alt');
    voiceRecognitionActive = false;
    removeListeningIndicator();
    messageInput.placeholder = originalPlaceholder;
  }
  
  micBtn.addEventListener('click', () => {
    if (!voiceRecognitionActive) {
      startVoiceRecognition();
    } else {
      stopVoiceRecognition();
    }
  });
  
  function handleHeaderScroll() {
    const scrollTop = chatContainer.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > 50) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }
    lastScrollTop = scrollTop;
  }
  
  setup3DHover();
  originalPlaceholder = messageInput.placeholder;
  chatContainer.addEventListener('scroll', handleHeaderScroll);
})();
