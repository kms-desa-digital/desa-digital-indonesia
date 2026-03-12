import { marginStyle, MarginProps } from "Consts/sizing";
import styled from "styled-components";


export const Background = styled.div`
  background-color: #347357;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
`;

export const Container = styled.div`
  padding: 16px;
  border-radius: 8px;
  background-color: white;
  width: 100%;
  color: #374151;
`;

export const Title = styled.p`
  font-size: 24px;
  font-weight: 700;
  text-align: center;
`;

export const Description = styled.p`
  font-size: 14px;
  color: #6b7280;
  font-weight: 400;
  text-align: center;
`;

export const Label = styled.p<MarginProps>`
  font-size: 14px;
  font-weight: 400;
  color: #4b5563;
  ${props => marginStyle(props)}
`;

export const ActionContainer = styled.div<MarginProps>`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  ${props => marginStyle(props)}
`;

export const Action = styled(Label)`
  color: #347357;
  cursor: pointer;
  text-decoration: underline;
`;
