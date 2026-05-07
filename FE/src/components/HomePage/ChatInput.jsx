// import { useRef } from "react";
import PropTypes from "prop-types"; // Import PropTypes
import styles from "./chatbot.module.scss";
import { IoMdSend } from "react-icons/io";

const ChatInput = ({ input, setInput, sendMessage, isTyping, inputRef, onFocus, onBlur }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.inputContainer}>
      <input
        type="text"
        placeholder="Bạn thắc mắc điều gì..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className={styles.inputField}
        ref={inputRef}
        disabled={isTyping}
      />
      <button
        onClick={sendMessage}
        className={styles.sendButton}
        disabled={!input.trim() || isTyping}
        aria-label="Send message"
      >
        <IoMdSend />
      </button>
    </div>
  );
};

// Define PropTypes for the component
ChatInput.propTypes = {
  input: PropTypes.string.isRequired,
  setInput: PropTypes.func.isRequired,
  sendMessage: PropTypes.func.isRequired,
  isTyping: PropTypes.bool.isRequired,
  inputRef: PropTypes.shape({
    current: PropTypes.instanceOf(Element),
  }),
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

export default ChatInput;