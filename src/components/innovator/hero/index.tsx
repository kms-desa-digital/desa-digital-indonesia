import { useTranslations } from "next-intl";
import { Background, HeroTitle } from "./_heroStyle";

function Hero() {
  const t = useTranslations("Common.navbar");

  return (
    <Background>
      <HeroTitle>{t("innovator")}</HeroTitle>
    </Background>
  );
}

export default Hero;
