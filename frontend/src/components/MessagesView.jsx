import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Send, User as UserIcon, Search, MessageSquare, Paperclip, X, Box, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { format } from 'date-fns';

const MessagesView = () => {
  const { user } = useContext(AuthContext);
  const { socket, fetchUnreadCount } = useContext(SocketContext);
  
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSatisfied, setFeedbackSatisfied] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  
  const fileInputRef = useRef(null);
  
  const messagesEndRef = useRef(null);

  // Fetch Inbox
  useEffect(() => {
    fetchInbox();
  }, [user]);

  // Handle Socket Events
  useEffect(() => {
    if (socket) {
      const messageHandler = (msg) => {
        // If the message belongs to the active conversation, append it
        if (activePartner && (msg.sender._id === activePartner._id || msg.sender === activePartner._id)) {
          setMessages((prev) => [...prev, msg]);
        }
        // Refresh inbox to update latest message & unread counts
        fetchInbox();
      };

      socket.on('message received', messageHandler);

      return () => {
        socket.off('message received', messageHandler);
      };
    }
  }, [socket, activePartner]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/messages/inbox`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching inbox:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (partner) => {
    setActivePartner(partner);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/messages/${partner._id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        // Refresh inbox to clear unread counts
        fetchInbox();
        // Also refresh global socket unread count
        if (fetchUnreadCount) fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("File is too large. Maximum size is 50MB.");
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else if (file.type.startsWith('video/')) {
        setFilePreview('video_preview');
      } else if (file.name.match(/\.(glb|gltf)$/i) || file.type.includes('model')) {
        setFilePreview('3d_preview');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activePartner) return;

    setIsSending(true);
    
    try {
      const formData = new FormData();
      formData.append('receiverId', activePartner._id);
      if (newMessage.trim()) formData.append('content', newMessage);
      if (selectedFile) formData.append('attachment', selectedFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        removeFile();
        fetchInbox(); // Update latest message in inbox
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackSatisfied === null) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/client/engineers/${activePartner._id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          isSatisfied: feedbackSatisfied,
          comment: feedbackComment
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setShowFeedbackModal(false);
          setFeedbackSuccess(false);
          setFeedbackSatisfied(null);
          setFeedbackComment('');
        }, 2000);
      } else {
        alert(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback error:', error);
      alert('An error occurred');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading messages...</div>;

  const filteredConversations = conversations.filter(convo => 
    convo.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex overflow-hidden">
      
      {/* Sidebar - Inbox List */}
      <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-800/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((convo) => (
              <button
                key={convo.partner._id}
                onClick={() => loadConversation(convo.partner)}
                className={`w-full p-4 flex items-start gap-3 border-b border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors text-left ${activePartner?._id === convo.partner._id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold">
                  {convo.partner?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {convo.partner.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                      {format(new Date(convo.latestMessage.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${convo.unreadCount > 0 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {convo.latestMessage.attachmentType === 'image' ? '🖼️ Image attached' : 
                     convo.latestMessage.attachmentType === 'video' ? '🎥 Video attached' : 
                     convo.latestMessage.attachmentType === '3d' ? '📦 3D Model attached' : 
                     convo.latestMessage.content}
                  </p>
                </div>
                {convo.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {convo.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {activePartner ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  {activePartner?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{activePartner.name}</h3>
                  <p className="text-xs text-slate-500 capitalize">{activePartner.role}</p>
                </div>
              </div>
              
              {user.role === 'client' && activePartner.role === 'engineer' && (
                <button 
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Star size={14} className="fill-current" /> Rate Engineer
                </button>
              )}
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => {
                const isMe = msg.sender._id === user._id || msg.sender === user._id;
                return (
                  <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm'}`}>
                      {msg.designId && (
                        <div className={`text-xs font-semibold mb-2 pb-2 border-b ${isMe ? 'border-indigo-500/50' : 'border-slate-200 dark:border-slate-700'}`}>
                          Regarding Design: {msg.designId.title || 'Attached Design'}
                        </div>
                      )}
                      
                      {msg.attachmentUrl && msg.attachmentType === 'image' && (
                        <img 
                          src={`${msg.attachmentUrl}`} 
                          alt="attachment" 
                          className="max-w-full rounded-xl mb-2 object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => window.open(`${msg.attachmentUrl}`, '_blank')}
                        />
                      )}
                      
                      {msg.attachmentUrl && msg.attachmentType === 'video' && (
                        <video 
                          src={`${msg.attachmentUrl}`} 
                          controls
                          className="max-w-full rounded-xl mb-2 max-h-64" 
                        />
                      )}

                      {msg.attachmentUrl && msg.attachmentType === '3d' && (
                        <div className="bg-slate-200/50 dark:bg-slate-700/50 p-3 rounded-xl mb-2 flex items-center justify-between border border-slate-300 dark:border-slate-600 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <Box size={20} className="text-indigo-500" />
                            <span className="text-sm font-medium">3D Model</span>
                          </div>
                          <button 
                            onClick={() => window.open(`${msg.attachmentUrl}`, '_blank')}
                            className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      )}

                      {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                      <div className={`text-[10px] mt-2 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {format(new Date(msg.createdAt), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              {filePreview && (
                <div className="mb-3 flex items-start gap-2 relative inline-block">
                  <div className="relative">
                    {selectedFile?.type.startsWith('image/') ? (
                      <img src={filePreview} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                    ) : filePreview === 'video_preview' ? (
                      <div className="h-20 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-300 dark:border-slate-600">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">VIDEO</span>
                      </div>
                    ) : (
                      <div className="h-20 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex flex-col items-center justify-center border border-slate-300 dark:border-slate-600 gap-1">
                        <Box size={24} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">3D MODEL</span>
                      </div>
                    )}
                    <button 
                      onClick={removeFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*,video/*,.glb,.gltf" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                  title="Attach Image or Video"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                />
                <button
                  type="submit"
                  disabled={isSending || (!newMessage.trim() && !selectedFile)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                >
                  {isSending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Rate {activePartner?.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you satisfied with the service provided by this engineer?</p>

            {feedbackSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={32} className="fill-current" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Feedback Submitted!</h3>
                <p className="text-slate-500">Thank you for your rating.</p>
              </div>
            ) : (
              <>
                <div className="flex gap-4 mb-6">
                  <button 
                    onClick={() => setFeedbackSatisfied(true)}
                    className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${feedbackSatisfied === true ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-200'}`}
                  >
                    <ThumbsUp size={24} />
                    <span className="font-bold text-sm">Satisfied</span>
                  </button>
                  <button 
                    onClick={() => setFeedbackSatisfied(false)}
                    className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${feedbackSatisfied === false ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-200'}`}
                  >
                    <ThumbsDown size={24} />
                    <span className="font-bold text-sm">Not Satisfied</span>
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">Additional Comments (Optional)</label>
                  <textarea 
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    rows="3"
                    placeholder="Tell us about your experience..."
                  ></textarea>
                </div>

                <button 
                  onClick={handleSubmitFeedback}
                  disabled={feedbackSatisfied === null || isSubmittingFeedback}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesView;
