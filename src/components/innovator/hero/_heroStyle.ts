import styled from 'styled-components'
import { marginStyle } from "Consts/sizing";

export const Background = styled.div`
  background-image: url('/images/header-innovator-txt.svg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position:left top;
  display: flex;
  align-items: flex-start;
  width: 100%;
  height: 145px;
  position: relative;
`

export const HeroTitle = styled.h1`
  position: absolute;
  left: 20px;
  top: 34px;
  margin: 0;
  color: #f9fafb;
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 0.2px;

  @media (max-width: 768px) {
    font-size: 40px;
    top: 36px;
  }

  @media (max-width: 420px) {
    font-size: 36px;
    top: 38px;
  }
`;

export const Icon = styled.img`
  cursor: pointer;
  justify-content: center;
  border-radius: 0px;
  ${marginStyle}
`;