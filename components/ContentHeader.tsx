import SiteHeader from "./SiteHeader";

export default function ContentHeader({ active }: { active: string }) {
  return <SiteHeader active={active} />;
}
