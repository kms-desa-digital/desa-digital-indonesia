import { marginStyle } from "Consts/sizing";
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
  text-align: left;
`;

export const Description = styled.p`
  font-size: 14px;
  color: #6b7280;
  font-weight: 400;
  text-align: left;
  line-height: 140%;
  font-size: 14px;
`;

export const Label = styled.p`
  font-size: 14px;
  font-weight: 400;
  color: #4b5563;
  ${marginStyle}
`;

export const ActionContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  ${marginStyle}
`;

export const Action = styled(Label)`
  color: #347357;
  cursor: pointer;
`;