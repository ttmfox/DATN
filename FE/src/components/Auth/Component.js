import styled from "styled-components";

export const Container = styled.div`
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  width: 1000px;
  max-width: 100%;
  min-height: 750px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid #b0bec5;
  margin-top: 120px;
  font-family: "Be Vietnam Pro", sans-serif;
`;

export const SignUpContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  display: flex;
  justify-content: center;  // ✅ căn giữa theo chiều ngang
  align-items: center;      // ✅ căn giữa theo chiều dọc
  transition: all 0.6s ease-in-out;
  opacity: 0;
  z-index: 1;

  ${({ signinIn }) =>
    !signinIn &&
    `
    transform: translateX(100%);
    opacity: 1;
    z-index: 5;
  `}
`;

export const SignInContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.6s ease-in-out;
  z-index: ${({ signinIn }) => (signinIn ? 5 : 2)};
  opacity: ${({ signinIn }) => (signinIn ? 1 : 0)};
  
  ${({ signinIn }) =>
    !signinIn &&
    `
    transform: translateX(100%);
  `}
`;


export const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 0px;
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  text-align: center;

  > * {
    margin: 10px 0;
    width: 100%;
    box-sizing: border-box;
  }
`;


export const Title = styled.h1`
  font-weight: 700;
  margin: 0;
  padding: 30px;
  font-size: 32px;
  color: #000;
  font-family: "Poppins", sans-serif;
`;

export const Input = styled.input`
  background-color: rgba(255, 255, 255, 0.95);
  border: 2px solid #b0bec5;
  padding: 14px 20px;
  width: 100%;
  border-radius: 5px;
  font-size: 16px;
  color: #212121;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #78909c;
  }

  &::placeholder {
    color: #78909c;
  }
`;

export const Select = styled.select`
  background-color: rgba(255, 255, 255, 0.95);
  border: 2px solid #b0bec5;
  padding: 14px 20px;
  width: 100%;
  border-radius: 5px;
  font-size: 16px;
  color: #212121;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #78909c;
  }

  &::placeholder {
    color: #78909c;
  }
`;

export const Row = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
  margin: 10px 0;
  box-sizing: border-box;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

export const HalfInput = styled(Input)`
  flex: 1;
  margin: 0;
  box-sizing: border-box;
`;

export const Button = styled.button`
  border-radius: 20px;
  border: 2px solid #b0bec5;
  background-color: #424242;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  padding: 15px 45px;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  cursor: pointer;
  margin: 30px auto 10px;
  width: fit-content; /* ✅ Nút chỉ dài theo nội dung */
  min-width: 150px;
  align-self: center;

  &:hover {
    background-color: #616161;
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus {
    outline: none;
  }
`;



export const GhostButton = styled(Button)`
  background-color: transparent;
  color: #b0bec5;

  &:hover {
    background-color: #b0bec5;
    color: #212121;
  }
`;

export const Anchor = styled.a`
  color: #000;
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;
  transition: color 0.3s ease;

  &:hover {
    color: #333333;
  }
`;

export const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: transform 0.6s ease-in-out;
  z-index: 100;

  ${({ signinIn }) =>
    !signinIn &&
    `
    transform: translateX(-100%);
  `}
`;

export const Overlay = styled.div`
  background: linear-gradient(
    to right,
    rgba(64, 64, 64, 0.8),
    rgba(0, 0, 0, 0.7)
  );
  color: #ffffff;
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;

  ${({ signinIn }) =>
    !signinIn &&
    `
    transform: translateX(50%);
  `}
`;

export const OverlayPanel = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  top: 0;
  height: 100%;
  width: 50%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
`;

export const LeftOverlayPanel = styled(OverlayPanel)`
  transform: translateX(-20%);
  ${({ signinIn }) =>
    !signinIn &&
    `
    transform: translateX(0);
  `}
`;

export const RightOverlayPanel = styled(OverlayPanel)`
  right: 0;
  transform: translateX(0);
  ${({ signinIn }) =>
    !signinIn &&
    `
    transform: translateX(20%);
  `}
`;

export const Paragraph = styled.p`
  font-size: 16px;
  font-weight: 300;
  line-height: 24px;
  letter-spacing: 0.5px;
  margin: 20px 0 30px;
  color: #ffffff;
  font-family: "Poppins", sans-serif;
`;

export const ErrorMessage = styled.p`
  color: #ef5350;
  font-size: 14px;
  margin: 10px 0;
`;

export const SocialDivider = styled.div`
  font-size: 14px;
  color: #78909c;
  margin: 20px 0;
  position: relative;
  width: 100%;
  text-align: center;

  &:before,
  &:after {
    content: "";
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: #78909c;
  }

  &:before {
    left: 0;
  }

  &:after {
    right: 0;
  }
`;

export const SocialButton = styled.button`
  border-radius: 20px;
  border: 2px solid #b0bec5;
  background-color: #212121;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 45px;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  cursor: pointer;
  margin: 10px 0;
  width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #424242;
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus {
    outline: none;
  }
`;
