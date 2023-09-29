import './globals.css';

export const metadata = {
  title: 'Daily Permissions Demo',
  description: 'Display participant participation live in a call.',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
