import Image from "next/image";
import "./header.css";

export default function Header() {
  return (
    <div className="description">
      <div>
        <a href="https://daily.co" target="_blank" rel="noopener noreferrer">
          Built by
          <Image
            src="/daily-logo.svg"
            alt="Daily Logo"
            width={100}
            height={24}
            priority
          />
        </a>
      </div>
      <div>
        <a
          href="https://github.com" // todo: update with repo link
          target="_blank"
          rel="noopener noreferrer">
          <Image
            src="/github.svg"
            alt="Github project"
            className=""
            width={100}
            height={24}
            priority
          />
        </a>
      </div>
    </div>
  );
}
