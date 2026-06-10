import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory, loading])

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    if (chatHistory.length === 0 && inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatHistory.length])

  // LOAD semua percakapan dari localStorage
  useEffect(() => {
    const savedConversations = localStorage.getItem('nusantara_conversations')
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed)
          // Load percakapan terakhir
          const lastConv = parsed[parsed.length - 1]
          setCurrentConversationId(lastConv.id)
          setChatHistory(lastConv.messages)
        }
      } catch (e) {
        console.error('Gagal load conversations:', e)
      }
    } else {
      // Buat percakapan baru jika belum ada
      createNewConversation()
    }
  }, [])

  // SAVE semua percakapan ke localStorage setiap kali berubah
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('nusantara_conversations', JSON.stringify(conversations))
    }
  }, [conversations])

  // Update messages di conversations saat chatHistory berubah
  useEffect(() => {
    if (currentConversationId && chatHistory.length > 0) {
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, messages: chatHistory, updatedAt: Date.now() }
          : conv
      ))
    }
  }, [chatHistory, currentConversationId])

  const createNewConversation = () => {
    const newId = Date.now().toString()
    const newConversation = {
      id: newId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    setConversations(prev => [...prev, newConversation])
    setCurrentConversationId(newId)
    setChatHistory([])
    setMessage('')
  }

  const loadConversation = (conv) => {
    setCurrentConversationId(conv.id)
    setChatHistory(conv.messages)
    setSidebarOpen(false)
  }

  const deleteConversation = (id, e) => {
    e.stopPropagation()
    const newConversations = conversations.filter(conv => conv.id !== id)
    setConversations(newConversations)
    
    if (currentConversationId === id) {
      if (newConversations.length > 0) {
        loadConversation(newConversations[newConversations.length - 1])
      } else {
        createNewConversation()
      }
    }
    
    if (newConversations.length === 0) {
      localStorage.removeItem('nusantara_conversations')
    }
  }

  const updateConversationTitle = (id, firstMessage) => {
    const title = firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage
    setConversations(prev => prev.map(conv =>
      conv.id === id ? { ...conv, title: title } : conv
    ))
  }

  const sendMessage = async () => {
    if (!message.trim()) return

    // Jika ini pesan pertama di percakapan, update title
    if (chatHistory.length === 0) {
      updateConversationTitle(currentConversationId, message)
    }

    const userMessage = { role: 'user', content: message, timestamp: Date.now() }
    setChatHistory(prev => [...prev, userMessage])
    const currentMessage = message
    setMessage('')
    setLoading(true)

    try {
      const response = await axios.post('https://nusantara-assistant-production.up.railway.app/', {
        message: currentMessage
      })
      
      if (response.data && response.data.reply) {
        const aiMessage = { role: 'ai', content: response.data.reply, timestamp: Date.now() }
        setChatHistory(prev => [...prev, aiMessage])
      } else {
        throw new Error('Response tidak valid')
      }
      
    } catch (error) {
      console.error('Error detail:', error)
      
      let errorText = 'Maaf, terjadi kesalahan. '
      
      if (error.code === 'ERR_NETWORK') {
        errorText = '❌ Tidak dapat terhubung ke server.\n\nPastikan backend berjalan di:\nhttp://localhost:8000'
      } else if (error.response) {
        errorText = `❌ Server error (${error.response.status})\n\n${JSON.stringify(error.response.data)}`
      } else {
        errorText = `❌ Error: ${error.message || 'Silakan coba lagi.'}`
      }
      
      const errorMessage = { role: 'ai', content: errorText, timestamp: Date.now() }
      setChatHistory(prev => [...prev, errorMessage])
      
    } finally {
      setLoading(false)
    }
  }

  const clearAllHistory = () => {
    setConversations([])
    setChatHistory([])
    setCurrentConversationId(null)
    localStorage.removeItem('nusantara_conversations')
    createNewConversation()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const exampleQuestions = [
    "Buatkan saya rencana perjalanan ke Bali",
    "Jelaskan konsep komputasi awan",
    "Apa resep masakan nasi goreng?",
    "Bantu saya menulis email profesional"
  ]

  // Format tanggal untuk display
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: darkMode ? '#1e1e2f' : '#ffffff',
      transition: 'background 0.3s ease',
    },
    header: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: darkMode ? '#1e1e2f' : '#ffffff',
      borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e5e5e5'}`,
      zIndex: 50,
      padding: '0 20px',
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '12px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    menuButton: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      transition: 'all 0.2s',
      color: darkMode ? '#e5e5e5' : '#1e1e2f',
    },
    title: {
      fontSize: '18px',
      fontWeight: 500,
      color: darkMode ? '#e5e5e5' : '#1e1e2f',
    },
    themeButton: {
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      transition: 'all 0.2s',
    },
    sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: '300px',
      background: darkMode ? '#1e1e2f' : '#ffffff',
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
      transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease',
      zIndex: 40,
      padding: '70px 16px 20px',
      overflowY: 'auto',
    },
    main: {
      paddingTop: '60px',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mainContent: {
      maxWidth: '900px',
      width: '100%',
      margin: '0 auto',
      padding: '0 20px',
    },
    welcomeScreen: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    },
    welcomeTitle: {
      fontSize: '42px',
      fontWeight: 500,
      color: darkMode ? '#e5e5e5' : '#1e1e2f',
      marginBottom: '32px',
      letterSpacing: '-0.5px',
    },
    inputContainer: {
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
    },
    inputWrapper: {
      position: 'relative',
      width: '100%',
    },
    textarea: {
      width: '100%',
      padding: '16px 50px 16px 20px',
      border: `1px solid ${darkMode ? '#3d3d5c' : '#e0e0e0'}`,
      borderRadius: '28px',
      fontSize: '16px',
      resize: 'none',
      outline: 'none',
      background: darkMode ? '#2d2d44' : '#f8f9fa',
      color: darkMode ? '#e5e5e5' : '#1e1e2f',
      fontFamily: 'inherit',
      transition: 'all 0.2s',
    },
    sendButton: {
      position: 'absolute',
      right: '12px',
      bottom: '12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '20px',
      padding: '4px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: darkMode ? '#a0a0c0' : '#a0a0a0',
      transition: 'all 0.2s',
    },
    plusButtonWrapper: {
      marginTop: '24px',
      display: 'flex',
      justifyContent: 'center',
    },
    plusButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 20px',
      background: darkMode ? '#2d2d44' : '#f0f0f0',
      border: 'none',
      borderRadius: '30px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: darkMode ? '#e5e5e5' : '#1e1e2f',
    },
    flashBadge: {
      marginTop: '16px',
      display: 'inline-block',
      padding: '4px 12px',
      background: darkMode ? '#2d2d44' : '#f0f0f0',
      borderRadius: '20px',
      fontSize: '12px',
      color: darkMode ? '#a0a0c0' : '#666',
    },
    exampleSection: {
      marginTop: '48px',
      width: '100%',
      maxWidth: '800px',
    },
    exampleTitle: {
      fontSize: '13px',
      color: darkMode ? '#888' : '#999',
      marginBottom: '16px',
      letterSpacing: '0.5px',
    },
    exampleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px',
    },
    exampleChip: {
      padding: '10px 16px',
      background: darkMode ? '#2d2d44' : '#f8f9fa',
      border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e5e5'}`,
      borderRadius: '24px',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: darkMode ? '#e5e5e5' : '#333',
      textAlign: 'left',
    },
    chatMessage: {
      display: 'flex',
      gap: '12px',
      marginBottom: '20px',
      animation: 'fadeIn 0.3s ease',
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      fontSize: '14px',
    },
    bubble: {
      maxWidth: '80%',
      padding: '12px 18px',
      borderRadius: '20px',
      fontSize: '14px',
      lineHeight: '1.6',
      transition: 'transform 0.2s, box-shadow 0.2s',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    },
    bottomInputContainer: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: darkMode ? '#1e1e2f' : '#ffffff',
      padding: '20px',
      borderTop: `1px solid ${darkMode ? '#2d2d44' : '#e5e5e5'}`,
    },
    bottomInputWrapper: {
      maxWidth: '800px',
      margin: '0 auto',
      position: 'relative',
    },
    bottomTextarea: {
      width: '100%',
      padding: '12px 50px 12px 20px',
      border: `1px solid ${darkMode ? '#3d3d5c' : '#e0e0e0'}`,
      borderRadius: '28px',
      fontSize: '14px',
      resize: 'none',
      outline: 'none',
      background: darkMode ? '#2d2d44' : '#f8f9fa',
      color: darkMode ? '#e5e5e5' : '#1e1e2f',
      fontFamily: 'inherit',
    },
    loadingDot: {
      width: '6px',
      height: '6px',
      background: darkMode ? '#888' : '#aaa',
      borderRadius: '50%',
      display: 'inline-block',
      margin: '0 2px',
      animation: 'pulse 1.4s infinite ease-in-out both',
    },
    footer: {
      textAlign: 'center',
      fontSize: '11px',
      color: darkMode ? '#666' : '#aaa',
      marginTop: '12px',
    },
    conversationItem: {
      padding: '10px 12px',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '4px',
      background: darkMode ? '#2d2d44' : '#f0f0f0',
    },
    conversationTitle: {
      fontSize: '14px',
      fontWeight: 500,
      marginBottom: '4px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    conversationDate: {
      fontSize: '11px',
      color: darkMode ? '#888' : '#999',
    },
    deleteButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '4px 8px',
      borderRadius: '6px',
      transition: 'all 0.2s',
    },
  }

  // Welcome Screen
  if (chatHistory.length === 0) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={styles.menuButton}
              onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              ☰
            </button>
            <span style={styles.title}>Nusantara Assistant</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={styles.themeButton}
              onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <div style={styles.sidebar}>
          <button
            onClick={createNewConversation}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              marginBottom: '16px',
            }}
          >
            + New Chat
          </button>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: darkMode ? '#aaa' : '#666', marginBottom: '12px' }}>
              RECENT CHATS
            </div>
            <div>
              {[...conversations].reverse().map(conv => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  style={{
                    ...styles.conversationItem,
                    background: currentConversationId === conv.id 
                      ? (darkMode ? '#3d3d5c' : '#e0e0e0')
                      : (darkMode ? '#2d2d44' : '#f5f5f5'),
                  }}
                  onMouseEnter={(e) => {
                    if (currentConversationId !== conv.id) {
                      e.currentTarget.style.background = darkMode ? '#3d3d5c' : '#e8e8e8'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentConversationId !== conv.id) {
                      e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f5f5f5'
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.conversationTitle}>
                        {conv.title === 'New Chat' && conv.messages.length > 0 
                          ? (conv.messages[0]?.content?.substring(0, 30) + '...')
                          : conv.title}
                      </div>
                      <div style={styles.conversationDate}>
                        {formatDate(conv.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      style={styles.deleteButton}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={clearAllHistory}
            style={{
              width: '100%',
              padding: '10px',
              background: darkMode ? '#3d3d5c' : '#e0e0e0',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: '13px',
              marginTop: '16px',
              color: darkMode ? '#e5e5e5' : '#333',
            }}
          >
            🗑️ Delete All History
          </button>
        </div>

        <main style={styles.main}>
          <div style={styles.mainContent}>
            <div style={styles.welcomeScreen}>
              <h1 style={styles.welcomeTitle}>Where should we start?</h1>
              
              <div style={styles.inputContainer}>
                <div style={styles.inputWrapper}>
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Nusantara Assistant"
                    rows="1"
                    style={styles.textarea}
                    onInput={(e) => {
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !message.trim()}
                    style={{
                      ...styles.sendButton,
                      opacity: loading || !message.trim() ? 0.5 : 1,
                    }}
                  >
                    ✨
                  </button>
                </div>
                
                <div style={styles.plusButtonWrapper}>
                  <button
                    onClick={() => document.querySelector('textarea')?.focus()}
                    style={styles.plusButton}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <span style={{ fontSize: '18px' }}>+</span> Ask Nusantara Assistant
                  </button>
                </div>
                
                <div style={styles.flashBadge}>
                  ⚡ Flash
                </div>
              </div>

              <div style={styles.exampleSection}>
                <div style={styles.exampleTitle}>Examples</div>
                <div style={styles.exampleGrid}>
                  {exampleQuestions.map((q, i) => (
                    <button
                      key={i}
                      style={styles.exampleChip}
                      onClick={() => {
                        setMessage(q)
                        setTimeout(() => sendMessage(), 100)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = darkMode ? '#3d3d5c' : '#e8e8e8'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f8f9fa'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          textarea {
            font-family: inherit;
          }
          button {
            cursor: pointer;
          }
        `}</style>
      </div>
    )
  }

  // Chat View
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.menuButton}
            onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            ☰
          </button>
          <span style={styles.title}>Nusantara Assistant</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={styles.themeButton}
            onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div style={styles.sidebar}>
        <button
          onClick={createNewConversation}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            marginBottom: '16px',
          }}
        >
          + New Chat
        </button>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: darkMode ? '#aaa' : '#666', marginBottom: '12px' }}>
            RECENT CHATS
          </div>
          <div>
            {[...conversations].reverse().map(conv => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv)}
                style={{
                  ...styles.conversationItem,
                  background: currentConversationId === conv.id 
                    ? (darkMode ? '#3d3d5c' : '#e0e0e0')
                    : (darkMode ? '#2d2d44' : '#f5f5f5'),
                }}
                onMouseEnter={(e) => {
                  if (currentConversationId !== conv.id) {
                    e.currentTarget.style.background = darkMode ? '#3d3d5c' : '#e8e8e8'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentConversationId !== conv.id) {
                    e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f5f5f5'
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.conversationTitle}>
                      {conv.title === 'New Chat' && conv.messages.length > 0 
                        ? (conv.messages[0]?.content?.substring(0, 30) + '...')
                        : conv.title}
                    </div>
                    <div style={styles.conversationDate}>
                      {formatDate(conv.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    style={styles.deleteButton}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={clearAllHistory}
          style={{
            width: '100%',
            padding: '10px',
            background: darkMode ? '#3d3d5c' : '#e0e0e0',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '13px',
            marginTop: '16px',
            color: darkMode ? '#e5e5e5' : '#333',
          }}
        >
          🗑️ Delete All History
        </button>
      </div>

      <main style={{ paddingTop: '70px', paddingBottom: '100px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...styles.chatMessage,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.role === 'ai' && (
                <div style={{ ...styles.avatar, background: darkMode ? '#2d2d44' : '#e8e8e8' }}>
                  🤖
                </div>
              )}
              <div
                style={{
                  ...styles.bubble,
                  background: msg.role === 'user'
                    ? '#1e1e2f'
                    : darkMode ? '#2d2d44' : '#f0f0f0',
                  color: msg.role === 'user' ? '#ffffff' : darkMode ? '#e5e5e5' : '#1e1e2f',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
                  borderBottomLeftRadius: msg.role === 'user' ? '20px' : '4px',
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i !== msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
              {msg.role === 'user' && (
                <div style={{ ...styles.avatar, background: '#1e1e2f', color: 'white' }}>
                  👤
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.chatMessage, justifyContent: 'flex-start' }}>
              <div style={{ ...styles.avatar, background: darkMode ? '#2d2d44' : '#e8e8e8' }}>🤖</div>
              <div style={{ ...styles.bubble, background: darkMode ? '#2d2d44' : '#f0f0f0' }}>
                <span style={styles.loadingDot}></span>
                <span style={{ ...styles.loadingDot, animationDelay: '0.2s' }}></span>
                <span style={{ ...styles.loadingDot, animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <div style={styles.bottomInputContainer}>
        <div style={styles.bottomInputWrapper}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Nusantara Assistant"
            rows="1"
            style={styles.bottomTextarea}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            style={{
              ...styles.sendButton,
              right: '12px',
              bottom: '10px',
            }}
          >
            ✨
          </button>
        </div>
        <div style={styles.footer}>
          AI dapat membuat kesalahan. Periksa informasi penting.
        </div>
      </div>
    </div>
  )
}

export default App