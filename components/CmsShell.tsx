import Link from "next/link";
import { ReactNode } from "react";

type CmsShellProps = {
  children: ReactNode;
};

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/levels", label: "Levels" },
  { href: "/modules", label: "Modules" },
  { href: "/lessons", label: "Lessons" },
  { href: "/groups", label: "Groups" },
  { href: "/slides", label: "Slides" },
  { href: "/import", label: "Import" },
  { href: "/configs", label: "Configs" }
];

export default function CmsShell({ children }: CmsShellProps) {
  return (
    <div className="shell">
      <aside className="nav">
        <h1>CMS Factory Reset</h1>
        <ul>
          {links.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
