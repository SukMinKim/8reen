import React, { useRef, useState, useEffect } from "react";
import jsQR from "jsqr";
import { useSession } from "next-auth/react";
import axios from "axios";

function ScanQrCode() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const { data: session } = useSession();
  const [error, setError] = useState("");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: cameraFacing } })
      .then(stream => {
        videoRef.current.srcObject = stream;
      })
      .catch(err => {
        setError("카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.");
        console.error(err);
      });

    const context = canvasRef.current.getContext("2d");
    const scanQRCode = () => {
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        canvasRef.current.height = videoRef.current.videoHeight;
        canvasRef.current.width = videoRef.current.videoWidth;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          console.log("Found QR code", code.data);
          // QR 코드 데이터 처리 로직
          handleQRData(code.data);
        }
      }
      requestAnimationFrame(scanQRCode);
    };

    scanQRCode();
  }, [cameraFacing]);

  // QR 코드 데이터를 서버에 전송하는 함수
  const handleQRData = async qrData => {
    try {
      const response = await axios.post("/api/rent/action", {
        userId: session.user.id, // 사용자 세션에서 ID 추출
        qrCode: qrData,
      });

      if (response.data.success) {
        alert(`작업 성공: ${response.data.message}`);
        // 추가적인 상태 업데이트나 페이지 전환 로직이 여기에 올 수 있습니다.
      } else {
        alert(`작업 실패: ${response.data.message}`);
      }
    } catch (error) {
      console.error("서버 요청 실패:", error);
      alert("서버 요청 중 문제가 발생했습니다.");
    }
  };

  // 카메라 전환 함수
  const toggleCamera = () => {
    setCameraFacing(prevFacing => (prevFacing === "environment" ? "user" : "environment"));
  };

  return (
    <>
      <div>
        {error && <p>{error}</p>}
        <video ref={videoRef} style={{ display: "none" }}></video>
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        <div>
          <button onClick={toggleCamera}>카메라 전환</button>
        </div>
      </div>
    </>
  );
}

export default ScanQrCode;
