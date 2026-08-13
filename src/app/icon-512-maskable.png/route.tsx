import { ImageResponse } from "next/og";

export const dynamic = "force-static";

const SIZE = 512;

export function GET() {
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
            width: SIZE * 0.42,
            height: SIZE * 0.42,
            borderRadius: "50%",
            border: `${SIZE * 0.05}px solid #e24b4a`,
            display: "flex",
          }}
        />
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
