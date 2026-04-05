import styled from "styled-components";
import { marginStyle } from "Consts/sizing";

export const Description = styled.p`
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 140%;
  color: #4b5563;
  gap: 6px;
  text-align: left;
`;
export const NavbarButton = styled.div`
  display: flex;
  width: 100%;
  max-width: 360px;
  padding: 12px 16px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  justify-content: center;
  align-items: center;
  background: var(--Monochrome-White, #FFF);

  /* Shadow - nav */
  box-shadow: 0px -2px 4px 0px rgba(0, 0, 0, 0.06), 0px -4px 6px 0px rgba(0, 0, 0, 0.10);
`;

