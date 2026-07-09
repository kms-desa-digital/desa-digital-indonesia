import styled from "styled-components";

interface BackgroundProps {
  $isAdmin?: boolean;
  $isInnovator?: boolean
  $isVillage?: boolean
  $minHeight?: number
}

export const Background = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isAdmin', '$isInnovator', '$isVillage', '$minHeight'].includes(prop)
}) <BackgroundProps>`
  padding: 16px;
  background-image: ${({ $isAdmin, $isInnovator, $isVillage }) =>
    `url(${$isAdmin
      ? "/images/hero-background-admin.svg"
      : $isInnovator
        ? "/images/Background-inovator3.svg"
        : $isVillage
          ? "/images/Background-desahome1.svg"
          : "/images/Background-desadigital.svg"
    })`};
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  min-height: ${({ $minHeight }) => $minHeight || 145}px;
  border-radius: 0px 0px 16px 16px;
  display: flex;
  align-items: center;
  position: relative;
`;

export const Container = styled.div<{ $gapSize?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gapSize }) => $gapSize || 8}px;
`;

export const Title = styled.h2`
  font-size: 12px;
  font-weight: 400;
  color: #374151;
  margin: 0;
`;

export const Description = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #374151;
  margin: 0;
`;
