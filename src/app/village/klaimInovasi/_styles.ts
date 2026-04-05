import styled from "styled-components";
import { marginStyle } from "Consts/sizing";

export const Container = styled.div`
  padding: 72px 16px 0px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 90vh;
  height:100%;
`;

export const Container2 = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  max-width: 205px ;
  width: 100%;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
`;

export const Label = styled.p`
    color: #1F2937;
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    line-height: 140%;
`;

export const Text1 = styled.p`
    color: #1F2937;
    font-size: 14px;
    font-weight: 500;
`;

export const Icon = styled.img`
  cursor: pointer;
  position: flex;
  justify-content: space-between;
  border-radius: 0px;
  ${marginStyle}
`;

export const Text2 = styled.p`
    color: #9CA3AF;
    font-size: 10px;
    font-weight: 400;
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

export const JenisKlaim = styled.div`
    display: flex;
    font-size: 14px;
    align-items: center;
    font-weight: 500;
    color: #1F2937;
`;
