import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import PropTypes from "prop-types";
import styles from "./chatbot.module.scss";

const ChatMessages = memo(
  ({ messages, isTyping, messagesEndRef, handleLinkClick, handleAddToCartClick }) => {
    return (
      <div className={styles.chatMessages}>
        {messages.length === 0 ? (
          <p className={styles.placeholderText}>Bắt đầu một cuộc hội thoại...</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={styles.messageRow}
              style={{
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                className={
                  msg.role === "user" ? styles.userMessage : styles.assistantMessage
                }
              >
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => {
                      if (href && href.startsWith("#product-")) {
                        const productId = href.replace("#product-", "");
                        return (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleLinkClick(productId);
                            }}
                            style={{ 
                              display: 'inline-block',
                              marginTop: '8px',
                              padding: '8px 16px',
                              backgroundColor: '#f0f0f5',
                              color: '#ff6b8b',
                              fontWeight: '600',
                              textDecoration: 'none',
                              borderRadius: '8px',
                              border: '1px solid #ff6b8b',
                              transition: 'all 0.2s',
                              fontSize: '14px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#ff6b8b';
                              e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#f0f0f5';
                              e.target.style.color = '#ff6b8b';
                            }}
                          >
                            {children}
                          </a>
                        );
                      }
                      if (href && href.startsWith("#add-to-cart-")) {
                        const productId = href.replace("#add-to-cart-", "");
                        return (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCartClick(productId);
                            }}
                            style={{ 
                              display: 'inline-block',
                              marginTop: '8px',
                              padding: '8px 16px',
                              backgroundColor: '#ff6b8b',
                              color: 'white',
                              fontWeight: '600',
                              textDecoration: 'none',
                              borderRadius: '8px',
                              transition: 'all 0.2s',
                              fontSize: '14px',
                              boxShadow: '0 2px 8px rgba(255, 107, 139, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#ff4d6d';
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 139, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#ff6b8b';
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(255, 107, 139, 0.3)';
                            }}
                          >
                            {children}
                          </a>
                        );
                      }
                      return <a href={href}>{children}</a>;
                    },
                    p: ({ children }) => {
                      // Force each paragraph to be on its own line
                      return <div style={{ 
                        display: 'block',
                        marginBottom: '4px',
                        lineHeight: '1.6'
                      }}>{children}</div>;
                    },
                    img: ({ src, alt }) => (
                      <img 
                        src={src} 
                        alt={alt} 
                        loading="lazy"
                        style={{
                          marginTop: '8px',
                          marginBottom: '12px'
                        }}
                      />
                    ),
                    strong: ({ children }) => (
                      <strong style={{ 
                        fontWeight: '600',
                        color: 'inherit'
                      }}>
                        {children}
                      </strong>
                    )
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className={styles.messageRow} style={{ justifyContent: "flex-start" }}>
            <div className={styles.assistantMessage}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.messages === nextProps.messages &&
      prevProps.isTyping === nextProps.isTyping &&
      prevProps.handleLinkClick === nextProps.handleLinkClick &&
      prevProps.handleAddToCartClick === nextProps.handleAddToCartClick
    );
  }
);

ChatMessages.displayName = "ChatMessages";

ChatMessages.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      products: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
          name: PropTypes.string.isRequired,
          image: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
  isTyping: PropTypes.bool.isRequired,
  messagesEndRef: PropTypes.shape({
    current: PropTypes.instanceOf(Element),
  }),
  handleLinkClick: PropTypes.func.isRequired,
  handleAddToCartClick: PropTypes.func.isRequired,
};

export default ChatMessages;