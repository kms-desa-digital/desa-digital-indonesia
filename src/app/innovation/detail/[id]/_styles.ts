import styled from "styled-components";
import { marginStyle } from "Consts/sizing";

export const ContentContainer = styled.div`
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`;

export const Img = styled.img`
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
`;
export const Title = styled.p`
  font-size: 18px;
  font-weight: 700;
`;

export const Label = styled.p`
  font-style: normal;
  align-items: flex-start;
  padding: 4px 8px;
  background: #e5e7eb;
  border-radius: 20px;
  font-weight: 400;
  font-size: 10px;
  color: #000000;
  text-align: justify;
  width: fit-content;
  cursor: pointer;
  ${marginStyle}
`;
export const Description = styled.p`
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 140%;
  color: #4b5563;
  gap: 6px;
  text-align: left;
`;

export const Description2 = styled.p`
  font-style: normal;
  font-weight: 400;
  font-size: 10px;
  line-height: 140%;
  color: #4b5563;
  gap: 6px;
  text-align: left;
`;

export const ActionContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 8px 2px;
  border: 1px solid #e5e7eb;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  align-self: stretch;
`;

export const Icon = styled.img`
  width: 14px;
  ${marginStyle}
`;

export const Text1 = styled.p`
  position: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 12px;
  line-height: 140%;
  ${marginStyle}
`;

export const Text4 = styled.p`
  position: flex;
  justify-content: space-between;
  font-weight: 500;
  font-size: 12px;
  line-height: 140%;
  ${marginStyle}
`;

export const Text2 = styled.p`
  position: flex;
  justify-content: space-between;
  margin-right: 100px;
  font-weight: 400;
  font-size: 10px;
  margin-top: 0px;
  ${marginStyle}
`;

export const Text3 = styled.p`
  position: flex;
  justify-content: space-between;
  margin-right: 100px;
  font-weight: 400;
  font-size: 14px;
  margin-top: 0px;
  ${marginStyle}
`;

export const Logo = styled.img`
  height: 36px;
  width: 36px;
  margin-right: 8px;
  margin-left: 8px;
  border-radius: 50%;
  object-fit: cover;
`;

export const ChipContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

export const BenefitContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
`;

export const SubText = styled.p`
  position: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  color: #1F2937;
`;