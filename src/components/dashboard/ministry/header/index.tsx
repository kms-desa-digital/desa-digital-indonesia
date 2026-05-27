import { Background, Container, Title, Description } from "./_headerStyle";

type HeaderProps = {
  description: string | undefined;
  text: string | undefined;
  isInnovator?: boolean;
  isMinistry?: boolean;
};

const Header: React.FC<HeaderProps> = ({ description, text, isInnovator = false, isMinistry = false }) => {
  return (
    <Background $isInnovator={isInnovator} $isMinistry={isMinistry}>
      <Container>
        <Title color="#1A202C">Selamat Datang</Title>
        <Description color="#1A202C">Kementerian</Description>
      </Container>
    </Background>
  );
};

export default Header;