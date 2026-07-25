"use client";

import { useState } from "react";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await copy();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="article-share">
      <span>이 글 공유하기</span>
      <button type="button" onClick={share}>SNS로 공유</button>
      <button type="button" onClick={copy}>{copied ? "복사 완료" : "링크 복사"}</button>
    </div>
  );
}
