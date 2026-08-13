import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export async function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 }, contentType },
    { id: "512", size: { width: 512, height: 512 }, contentType },
  ];
}

export default function Icon({ id }: { id: string }) {
  const px = id === "192" ? 192 : 512;

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
          borderRadius: px * 0.22,
        }}
      >
        <div
          style={{
            width: px * 0.6,
            height: px * 0.6,
            borderRadius: "50%",
            border: `${px * 0.07}px solid #e24b4a`,
            display: "flex",
          }}
        />
      </div>
    ),
    { width: px, height: px }
  );
}
