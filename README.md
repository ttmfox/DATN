
Trong frontend ở VSCode:

Để chạy FE,Admin: npm run dev

Để chạy pythonAI: 
+ Import các cấu hình cần thiết: 
1. Tạo môi trg: python -m venv venv
2. Active nó lên: .\venv\Scripts\Activate
3. Import cần thiết: pip install openai requests fastapi uvicorn python-dotenv 

==> CHẠY: uvicorn basic_rag:app --host 0.0.0.0 --port 8000 --reload 
(nếu môi trg venv đc kích hoạt rồi thì k cần active nữa)

* Nếu báo lỗi post thì vào SQL clear nó đi : TRUNCATE TABLE post RESTART IDENTITY;
Tk admin: shopadmin | 1
Tk user: 

Ngân hàng	NCB
Số thẻ	9704198526191432198
Tên chủ thẻ	NGUYEN VAN A
Ngày phát hành	07/15
Mật khẩu OTP	123456

==ngrok==

ngrok config add-authtoken 2jpCd4K5b3sMJxLV30FJ3rCIBWN_2dofEsCGP7z98zXRUSgnm
ngrok http --domain=nondispersive-annamaria-baetylic.ngrok-free.dev 8080

