import NextLink from "next/link";
import Image from "next/image";

export default function BrandLink({ width }: { width: number }) {
  return (
    <NextLink href="/" aria-label="AMP home" style={{ display: "flex", flexShrink: 0, lineHeight: 0 }}>
      <Image src="/amp-logo-hires.png" alt="" width={368} height={101} priority style={{ width, height: "auto" }} />
    </NextLink>
  );
}
