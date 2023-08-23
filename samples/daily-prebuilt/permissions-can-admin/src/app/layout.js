import "./globals.css";

export const metadata = {
  title: "Daily Permissions Demo",
  description: "Using the canAdmin option to share admin privileges.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
