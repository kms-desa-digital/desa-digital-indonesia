import { Container, Title, Description, Content } from './_cardCategoryStyle'
import { Text } from '@chakra-ui/react'

type CardCategoryProps = {
  icon: string;
  title: string;
  description: string;
  innovationCount?: number;
  onClick: () => void;
}

function CardCategory(props: CardCategoryProps) {
  const { icon, title, description, innovationCount, onClick } = props;

  return (
    <Container onClick={onClick}>
      <img src={icon} alt={title} width={40} />
      <Content>
        <Title>{title}</Title>
        <Description>{description}</Description>
        <Text fontSize="12px" color="var(--Primary, #347357)" fontWeight="600" mt={1}>
          {innovationCount || 0} Inovasi
        </Text>
      </Content>
    </Container>
  );
}

export default CardCategory;
