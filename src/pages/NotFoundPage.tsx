import { Compass } from "lucide-react";
import { Link } from "react-router";
import { PageTransition } from "../components/PageTransition";

export default function NotFoundPage() {
  return (
    <PageTransition className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="glass-panel max-w-xl rounded-[2rem] p-10 text-center">
        <Compass className="mx-auto mb-5 size-12 text-neon-cyan" />
        <h1 className="text-3xl font-black">这条雷达航线不存在</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">页面可能已移动，或者链接输入有误。</p>
        <Link to="/" className="neon-button mt-7 inline-flex px-6 py-3 text-sm font-bold">
          返回首页
        </Link>
      </div>
    </PageTransition>
  );
}