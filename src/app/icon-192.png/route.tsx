import { ImageResponse } from "next/og";

export const dynamic = "force-static";

const SIZE = 192;

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
          borderRadius: SIZE * 0.22,
        }}
      >
        <div
          style={{
            width: SIZE * 0.6,
            height: SIZE * 0.6,
            borderRadius: "50%",
            border: `${SIZE * 0.07}px solid #e24b4a`,
            display: "flex",
          }}
        />
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
