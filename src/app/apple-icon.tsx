import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0d11",
        }}
      >
        <div
          style={{
            width: size.width * 0.6,
            height: size.height * 0.6,
            borderRadius: "50%",
            border: `${size.width * 0.07}px solid #e24b4a`,
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
