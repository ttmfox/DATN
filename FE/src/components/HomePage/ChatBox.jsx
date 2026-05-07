import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaRegCommentDots } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import styles from "./chatbot.module.scss";
import { useAppContext } from "../../context/AppContext";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

const API_URL = "http://localhost:8000/chat";

const ChatBox = () => {
  const { isAuthenticated, fetchCart } = useAppContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const userId = localStorage.getItem("userId") || "guest";

  

const loadMessages = () => {
  const savedMessages = localStorage.getItem(`chatMessages_${userId}`);
  if (savedMessages) {
    try {
      const parsedMessages = JSON.parse(savedMessages);
      setMessages(parsedMessages);
    } catch (error) {
      console.error("Error parsing saved messages:", error);
      setMessages([]);
    }
  } else {
    setMessages([]);
  }
  setIsLoadingMessages(false);
};


useEffect(() => {
  setIsLoadingMessages(true);
  loadMessages();
}, [userId]);

useEffect(() => {
  if (!isLoadingMessages && messages.length > 0 && isOpen) {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }
}, [isLoadingMessages, isOpen]);



  useEffect(() => {
    if (!isAuthenticated && userId === "guest") {
      setMessages([]);
      localStorage.removeItem("chatMessages_guest");
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (messages.length > 0) {
      const limitedMessages = messages.slice(-100);
      localStorage.setItem(`chatMessages_${userId}`, JSON.stringify(limitedMessages));
    }
  }, [messages, userId]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        const welcomeMessage = {
          role: "assistant",
          content: "Xin chào! Tôi là TiraAI, trợ lý ảo của TiraShop. Tôi có thể giúp gì cho bạn hôm nay?",
        };
        setMessages([welcomeMessage]);
        setIsTyping(false);
      }, 1000);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (messages.length > 0 && !isInputFocused) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isTyping, isInputFocused]);

  const handleLinkClick = useCallback((productId) => {
    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để xem chi tiết sản phẩm!");
      navigate("/auth");
      return;
    }
    navigate(`/product/${productId}`);
    setIsOpen(false);
  }, [isAuthenticated, navigate]);

  // Xử lý click nút "Thêm vào giỏ" - THÊM NGAY 1 SẢN PHẨM
  const handleAddToCartClick = useCallback(async (productId) => {
    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      navigate("/auth");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `ADD_TO_CART|${productId}` }],
          userToken: localStorage.getItem("token") || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();

      if (responseText.includes("✅") || responseText.includes("thành công")) {
        toast.success("Đã thêm vào giỏ hàng!");
        fetchCart();
      } else if (responseText.includes("❌") || responseText.includes("hết hàng")) {
        toast.error(responseText.replace(/[✅❌🔐]/g, '').trim());
      } else if (responseText.includes("đăng nhập") || responseText.includes("🔐")) {
        toast.warning("Vui lòng đăng nhập!");
        navigate("/auth");
      } else {
        toast.info(responseText);
      }

    } catch (error) {
      console.error("❌ API Error:", error.message);
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng!");
    }
  }, [isAuthenticated, navigate, fetchCart]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const chatHistory = [...messages, userMessage];

    try {
      console.log("🔵 Sending to:", API_URL);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: chatHistory,
          userToken: localStorage.getItem("token") || null,
        }),
      });

      console.log("🟢 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();

      console.log("✅ Response:", responseText.substring(0, 100));

      if (responseText.includes("thành công")) {
        setIsTyping(false);
        toast.success("Đã thêm vào giỏ hàng!");
        fetchCart();
      } else {
        const botMessage = {
          role: "assistant",
          content: responseText,
        };

        setTimeout(() => {
          setMessages((prev) => [...prev, botMessage]);
          setIsTyping(false);
        }, 300);
      }

    } catch (error) {
      console.error("❌ API Error:", error.message);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Xin lỗi, có lỗi xảy ra khi kết nối với server. Vui lòng thử lại!",
          },
        ]);
        setIsTyping(false);
      }, 500);
    }
  };

  return (
    <div className={styles.chatContainer}>
      {isOpen && (
        <div className={styles.chatBox}>
          <div className={styles.chatHeader}>
            <h3>Trợ Lí TiraAI</h3>
            <button
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
              aria-label="Close chat"
            >
              <FiX />
            </button>
          </div>

          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
            handleLinkClick={handleLinkClick}
            handleAddToCartClick={handleAddToCartClick}
          />

          <ChatInput
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            isTyping={isTyping}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.toggleButton}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <FaRegCommentDots />
      </button>
    </div>
  );
};

export default ChatBox;