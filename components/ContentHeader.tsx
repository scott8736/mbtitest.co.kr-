export default function ContentHeader({ active }: { active: string }) {
  const links = [["/","MBTI 검사"],["/tests","심리테스트"],["/types","16가지 유형"],["/compatibility","MBTI 궁합"],["/blog","콘텐츠"]];
  return <header className="site-header content-nav"><a className="logo" href="/"><span className="brain-mark">✦</span><b>MBTI 검사</b></a><nav className="site-nav" aria-label="주요 메뉴">{links.map(([href,label])=><a key={href} className={active===href?"active":""} href={href}>{label}</a>)}</nav></header>;
}
