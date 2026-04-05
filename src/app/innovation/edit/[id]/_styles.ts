import styled from "styled-components";

export const NavbarButton = styled.div`
  display: flex;
  width: 100%;
  gap: 8px;
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